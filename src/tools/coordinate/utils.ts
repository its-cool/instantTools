// 坐标系转换算法（基于 proj4 + gcoord）
// 地理坐标系：WGS84 / CGCS2000 / 北京54 / 西安80 / GCJ02(高德) / BD09(百度)
// 投影坐标系：EPSG:3857(Web墨卡托) / 高斯-克吕格(3度/6度带) / 城市独立坐标系
// 转换枢纽：WGS84 经纬度
//   - proj4 处理国际/标准坐标系：WGS84 / CGCS2000 / 北京54 / 西安80 / EPSG:3857 / GK
//   - gcoord 处理国内加密坐标系：GCJ02 / BD09（EPSG:3857 两库均可，统一用 gcoord 链路）
//   - 自定义坐标系：用户输入七参数(ΔX,ΔY,ΔZ,εX,εY,εZ,m)，经布尔莎模型转换
//   - 跨库互转：源 -> WGS84 -> 目标

import proj4 from 'proj4'
import gcoord from 'gcoord'

/* ============ 类型定义 ============ */

export type CoordType = 'geo' | 'proj'

/** 内置标准坐标系标识 */
export type BuiltinSystem =
  | 'WGS84' | 'CGCS2000' | 'BJ54' | 'XA80'
  | 'GCJ02' | 'BD09'
  | 'EPSG3857' | 'GCJ02MERCATOR' | 'BD09MC'
  | 'CGCS2000_GK3' | 'CGCS2000_GK6'
  | 'BJ54_GK3' | 'BJ54_GK6'
  | 'XA80_GK3' | 'XA80_GK6'

/** 自定义坐标系标识（前缀区分） */
export type CustomSystem = `CUSTOM:${string}`

/** 所有坐标系标识 */
export type CoordSystem = BuiltinSystem | CustomSystem

export interface CoordSystemMeta {
  value: CoordSystem
  code: string
  label: string
  desc: string
  unit: 'degree' | 'metre'
  area: string
  type: CoordType
  engine: 'proj4' | 'gcoord' | 'custom'
  /** 坐标系分组 */
  group: 'global' | 'china-geo' | 'china-encrypt' | 'projection' | 'legacy' | 'custom'
}

/** 七参数（布尔莎模型）：用于不同大地坐标系间的转换 */
export interface SevenParam {
  dX: number  // X平移(m)
  dY: number  // Y平移(m)
  dZ: number  // Z平移(m)
  rX: number  // X旋转(arc-seconds)
  rY: number  // Y旋转(arc-seconds)
  rZ: number  // Z旋转(arc-seconds)
  m: number   // 尺度变化(ppm)
}

/** 自定义坐标系定义 */
export interface CustomCrsDef {
  id: string
  name: string
  /** 基准椭球体：WGS84 / GRS80 / Krasovsky / IAG75 */
  ellipsoid: 'WGS84' | 'GRS80' | 'Krasovsky' | 'IAG75'
  /** 坐标系类型 */
  type: CoordType
  /** 投影参数（仅 proj 类型） */
  projection?: {
    /** 投影类型：高斯-克吕格 或 墨卡托 */
    kind: 'tmerc' | 'merc'
    /** 中央子午线(度)，tmerc 专用 */
    centralMeridian?: number
    /** 东偏(m) */
    falseEasting: number
    /** 北偏(m) */
    falseNorthing: number
    /** 比例因子 */
    scaleFactor: number
  }
  /** 到 WGS84 的七参数（可选，不填则视为与基准椭球体一致） */
  toWgs84Params?: SevenParam
  /** 适用区域 */
  area: string
}

/* ============ 椭球体参数 ============ */

const ELLIPSOID_PARAMS = {
  WGS84: { a: 6378137.0, f: 1 / 298.257223563 },
  GRS80: { a: 6378137.0, f: 1 / 298.257222101 },
  Krasovsky: { a: 6378245.0, f: 1 / 298.3 },        // 北京54
  IAG75: { a: 6378140.0, f: 1 / 298.257 },      // 西安80
}

/* ============ 内置坐标系元数据 ============ */

export const COORD_SYSTEMS: CoordSystemMeta[] = [
  // --- 全球地理坐标系 ---
  { value: 'WGS84', code: 'EPSG:4326', label: 'WGS 84', desc: '世界大地坐标系 1984', unit: 'degree', area: '全球', type: 'geo', engine: 'proj4', group: 'global' },
  // --- 中国地理坐标系 ---
  { value: 'CGCS2000', code: 'EPSG:4490', label: 'CGCS2000', desc: '2000国家大地坐标系', unit: 'degree', area: '中国', type: 'geo', engine: 'proj4', group: 'china-geo' },
  { value: 'BJ54', code: 'EPSG:4214', label: '北京54', desc: '北京54坐标系（克拉索夫斯基椭球）', unit: 'degree', area: '中国', type: 'geo', engine: 'proj4', group: 'legacy' },
  { value: 'XA80', code: 'EPSG:4212', label: '西安80', desc: '西安80坐标系（IAG75椭球）', unit: 'degree', area: '中国', type: 'geo', engine: 'proj4', group: 'legacy' },
  // --- 国内加密坐标系 ---
  { value: 'GCJ02', code: 'GCJ-02', label: 'GCJ-02', desc: '火星坐标系（高德/腾讯/谷歌中国）', unit: 'degree', area: '中国', type: 'geo', engine: 'gcoord', group: 'china-encrypt' },
  { value: 'BD09', code: 'BD-09', label: 'BD-09', desc: '百度经纬度坐标系', unit: 'degree', area: '中国', type: 'geo', engine: 'gcoord', group: 'china-encrypt' },
  // --- 投影坐标系 ---
  { value: 'EPSG3857', code: 'EPSG:3857', label: 'Web墨卡托', desc: 'WGS 84 / 伪墨卡托投影', unit: 'metre', area: '全球', type: 'proj', engine: 'proj4', group: 'projection' },
  { value: 'GCJ02MERCATOR', code: 'GCJ-02-M', label: 'GCJ-02 Web墨卡托', desc: '高德投影坐标系（基于GCJ-02的Web墨卡托）', unit: 'metre', area: '中国', type: 'proj', engine: 'gcoord', group: 'projection' },
  { value: 'BD09MC', code: 'BD-09-MC', label: 'BD-09 墨卡托', desc: '百度墨卡托投影坐标（BD09MC）', unit: 'metre', area: '中国', type: 'proj', engine: 'gcoord', group: 'projection' },
  // --- CGCS2000 高斯-克吕格 ---
  { value: 'CGCS2000_GK3', code: 'CGCS2000/GK3', label: 'CGCS2000 / 3°带', desc: 'CGCS2000 高斯-克吕格3度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
  { value: 'CGCS2000_GK6', code: 'CGCS2000/GK6', label: 'CGCS2000 / 6°带', desc: 'CGCS2000 高斯-克吕格6度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
  // --- 北京54 高斯-克吕格 ---
  { value: 'BJ54_GK3', code: 'BJ54/GK3', label: '北京54 / 3°带', desc: '北京54 高斯-克吕格3度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
  { value: 'BJ54_GK6', code: 'BJ54/GK6', label: '北京54 / 6°带', desc: '北京54 高斯-克吕格6度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
  // --- 西安80 高斯-克吕格 ---
  { value: 'XA80_GK3', code: 'XA80/GK3', label: '西安80 / 3°带', desc: '西安80 高斯-克吕格3度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
  { value: 'XA80_GK6', code: 'XA80/GK6', label: '西安80 / 6°带', desc: '西安80 高斯-克吕格6度带投影', unit: 'metre', area: '中国', type: 'proj', engine: 'proj4', group: 'projection' },
]

/** 自定义坐标系元数据列表（运行时动态注册） */
const customSystems: CoordSystemMeta[] = []
/** 自定义坐标系定义映射 */
const customDefs = new Map<string, CustomCrsDef>()

/** 坐标系元数据查找 */
export function getSystemMeta(sys: CoordSystem): CoordSystemMeta {
  return getAllSystems().find((s) => s.value === sys)!
}

/** 获取所有坐标系（内置 + 自定义） */
export function getAllSystems(): CoordSystemMeta[] {
  return [...COORD_SYSTEMS, ...customSystems]
}

/* ============ proj4 投影定义注册 ============ */

const PROJ4_DEFS: Record<string, string> = {
  WGS84: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
  CGCS2000: '+proj=longlat +ellps=GRS80 +no_defs +type=crs',
  BJ54: '+proj=longlat +ellps=krass +no_defs +type=crs',
  XA80: '+proj=longlat +a=6378140 +rf=298.257 +no_defs +type=crs',
  EPSG3857:
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
}

// 注册静态投影
for (const [name, def] of Object.entries(PROJ4_DEFS)) {
  proj4.defs(name, def)
}

/** 构造高斯-克吕格投影字符串（泛化，支持不同椭球体） */
function buildGaussKrugerDef(centralMeridian: number, ellipsoid: 'GRS80' | 'krass' | 'IAG75' = 'GRS80'): string {
  const ellpsPart =
    ellipsoid === 'GRS80' ? '+ellps=GRS80' :
      ellipsoid === 'krass' ? '+ellps=krass' :
        '+a=6378140 +rf=298.257'
  return (
    `+proj=tmerc +lat_0=0 +lon_0=${centralMeridian} +k=1 ` +
    `+x_0=500000 +y_0=0 ${ellpsPart} +units=m +no_defs +type=crs`
  )
}

/** 高斯-克吕格带号与中央子午线计算 */
function calcCentralMeridian(lng: number, zoneWidth: 3 | 6): number {
  if (zoneWidth === 3) return Math.round(lng / 3) * 3
  return Math.floor(lng / 6) * 6 + 3
}

function calcZoneNumber(lng: number, zoneWidth: 3 | 6): number {
  const L0 = calcCentralMeridian(lng, zoneWidth)
  return zoneWidth === 3 ? Math.round(L0 / 3) : Math.floor((L0 - 3) / 6) + 1
}

function centralMeridianFromZone(zoneNum: number, zoneWidth: 3 | 6): number {
  return zoneWidth === 3 ? zoneNum * 3 : (zoneNum - 1) * 6 + 3
}

/** 高斯-克吕格系统标识解析 */
interface GKInfo { geoBase: 'CGCS2000' | 'BJ54' | 'XA80'; zoneWidth: 3 | 6 }

function parseGK(s: string): GKInfo | null {
  if (s === 'CGCS2000_GK3') return { geoBase: 'CGCS2000', zoneWidth: 3 }
  if (s === 'CGCS2000_GK6') return { geoBase: 'CGCS2000', zoneWidth: 6 }
  if (s === 'BJ54_GK3') return { geoBase: 'BJ54', zoneWidth: 3 }
  if (s === 'BJ54_GK6') return { geoBase: 'BJ54', zoneWidth: 6 }
  if (s === 'XA80_GK3') return { geoBase: 'XA80', zoneWidth: 3 }
  if (s === 'XA80_GK6') return { geoBase: 'XA80', zoneWidth: 6 }
  return null
}

/** 根据地理基准获取 proj4 椭球体标识 */
function ellipsoidForGeo(geo: 'CGCS2000' | 'BJ54' | 'XA80'): 'GRS80' | 'krass' | 'IAG75' {
  if (geo === 'CGCS2000') return 'GRS80'
  if (geo === 'BJ54') return 'krass'
  return 'IAG75'
}

/* ============ gcoord CRS 映射 ============ */
function toGcoordCRS(sys: 'GCJ02' | 'BD09' | 'BD09MC') {
  return sys === 'GCJ02' ? gcoord.GCJ02 : sys === 'BD09' ? gcoord.BD09 : gcoord.BD09MC
}

/* ============ 七参数布尔莎模型 ============ */
// 将七参数转换为 proj4 的 +towgs84 参数
function sevenParamToProj4(p: SevenParam): string {
  return `+towgs84=${p.dX},${p.dY},${p.dZ},${p.rX},${p.rY},${p.rZ},${p.m}`
}

/** 为自定义坐标系构建 proj4 定义并注册 */
function registerCustomProj(def: CustomCrsDef): string {
  const projName = `CUSTOM_${def.id}`
  const ellps = ELLIPSOID_PARAMS[def.ellipsoid]
  const towgs = def.toWgs84Params ? ` ${sevenParamToProj4(def.toWgs84Params)}` : ''

  if (def.type === 'geo') {
    // 地理坐标系
    const projDef = `+proj=longlat +a=${ellps.a} +rf=${1 / ellps.f}${towgs} +no_defs +type=crs`
    proj4.defs(projName, projDef)
  } else if (def.projection) {
    // 投影坐标系
    const proj = def.projection
    if (proj.kind === 'tmerc') {
      const cm = proj.centralMeridian ?? 0
      const projDef = `+proj=tmerc +lat_0=0 +lon_0=${cm} +k=${proj.scaleFactor} +x_0=${proj.falseEasting} +y_0=${proj.falseNorthing} +a=${ellps.a} +rf=${1 / ellps.f}${towgs} +units=m +no_defs +type=crs`
      proj4.defs(projName, projDef)
    } else {
      const projDef = `+proj=merc +lat_ts=0 +lon_0=0 +x_0=${proj.falseEasting} +y_0=${proj.falseNorthing} +k=${proj.scaleFactor} +a=${ellps.a} +rf=${1 / ellps.f}${towgs} +units=m +no_defs +type=crs`
      proj4.defs(projName, projDef)
    }
  }
  return projName
}

/* ============ 自定义坐标系管理 ============ */

/** 注册自定义坐标系 */
export function addCustomSystem(def: CustomCrsDef): void {
  // 如果已存在同名，先移除
  removeCustomSystem(def.id)

  const projName = registerCustomProj(def)
  const crsId: CustomSystem = `CUSTOM:${def.id}`

  const meta: CoordSystemMeta = {
    value: crsId,
    code: def.type === 'geo' ? `CUSTOM-${def.id}` : `CUSTOM-${def.id}-PROJ`,
    label: def.name,
    desc: `${def.ellipsoid}椭球${def.projection ? ` / ${def.projection.kind === 'tmerc' ? '高斯-克吕格' : '墨卡托'}` : ''}${def.toWgs84Params ? ' / 含七参数' : ''}`,
    unit: def.type === 'geo' ? 'degree' : 'metre',
    area: def.area || '自定义',
    type: def.type,
    engine: 'custom',
    group: 'custom',
  }

  customSystems.push(meta)
  customDefs.set(def.id, { ...def, id: projName })
}

/** 移除自定义坐标系 */
export function removeCustomSystem(id: string): void {
  const idx = customSystems.findIndex((s) => s.value === `CUSTOM:${id}`)
  if (idx >= 0) customSystems.splice(idx, 1)
  customDefs.delete(id)
}

/** 获取所有自定义坐标系定义 */
export function getCustomSystems(): CustomCrsDef[] {
  return Array.from(customDefs.values()).map(({ id, ...rest }) => ({ id, ...rest }))
}

/** 判断是否为自定义坐标系 */
function isCustomSystem(s: CoordSystem): s is CustomSystem {
  return s.startsWith('CUSTOM:')
}

/** 获取自定义坐标系的 proj4 名称 */
function getCustomProjName(id: string): string {
  return `CUSTOM_${id}`
}

/* ============ 各坐标系 -> WGS84 经纬度 ============ */

function toWgs84(x: number, y: number, from: CoordSystem): [number, number] {
  if (from === 'WGS84') return [x, y]

  // CGCS2000（地理坐标系，与 WGS84 差异极小，视为等同）
  if (from === 'CGCS2000') return [x, y]

  // 北京54（含七参数偏差，proj4 通过 towgs84 处理）
  if (from === 'BJ54') return proj4('BJ54', 'WGS84', [x, y]) as [number, number]

  // 西安80
  if (from === 'XA80') return proj4('XA80', 'WGS84', [x, y]) as [number, number]

  // gcoord 直接支持的：GCJ02 / BD09 / BD09MC
  if (from === 'GCJ02' || from === 'BD09' || from === 'BD09MC') {
    const fromCRS = toGcoordCRS(from)
    const [lng, lat] = gcoord.transform([x, y], fromCRS, gcoord.WGS84)
    return [lng, lat]
  }

  // EPSG:3857（proj4 处理墨卡托反算 → WGS84）
  if (from === 'EPSG3857') {
    return proj4('EPSG3857', 'WGS84', [x, y]) as [number, number]
  }

  // 高德墨卡托：墨卡托反算 → GCJ02 经纬度 → gcoord 转 WGS84
  if (from === 'GCJ02MERCATOR') {
    const [gcjLng, gcjLat] = proj4('EPSG3857', 'WGS84', [x, y]) as [number, number]
    const [lng, lat] = gcoord.transform([gcjLng, gcjLat], gcoord.GCJ02, gcoord.WGS84)
    return [lng, lat]
  }

  // 高斯-克吕格投影（CGCS2000 / 北京54 / 西安80）
  const gk = parseGK(from)
  if (gk) {
    const { geoBase, zoneWidth } = gk
    const ellipsoid = ellipsoidForGeo(geoBase)
    // 提取带号
    const zoneNum = Math.floor(x / 1000000)
    const xRel = x - zoneNum * 1000000 // 移除带号前缀，保留 500000 东偏
    const cm = centralMeridianFromZone(zoneNum, zoneWidth)
    const def = buildGaussKrugerDef(cm, ellipsoid)
    // 先反算到对应地理坐标系，再转到 WGS84
    const [lng, lat] = proj4(def, geoBase, [xRel, y]) as [number, number]
    if (geoBase === 'CGCS2000') return [lng, lat] // CGCS2000 ≈ WGS84
    return proj4(geoBase, 'WGS84', [lng, lat]) as [number, number]
  }

  // 自定义坐标系
  if (isCustomSystem(from)) {
    const id = from.slice('CUSTOM:'.length)
    const projName = getCustomProjName(id)
    const def = customDefs.get(id)
    if (!def) return [x, y]

    if (def.type === 'geo') {
      // 地理坐标系直接转 WGS84
      return proj4(projName, 'WGS84', [x, y]) as [number, number]
    } else {
      // 投影坐标系：先反算到地理，再转 WGS84
      const [lng, lat] = proj4(projName, 'WGS84', [x, y]) as [number, number]
      return [lng, lat]
    }
  }

  return [x, y]
}

/* ============ WGS84 经纬度 -> 各坐标系 ============ */

function fromWgs84(lng: number, lat: number, to: CoordSystem): [number, number] {
  if (to === 'WGS84') return [lng, lat]

  // CGCS2000
  if (to === 'CGCS2000') return [lng, lat]

  // 北京54
  if (to === 'BJ54') return proj4('WGS84', 'BJ54', [lng, lat]) as [number, number]

  // 西安80
  if (to === 'XA80') return proj4('WGS84', 'XA80', [lng, lat]) as [number, number]

  // gcoord 直接支持的：GCJ02 / BD09 / BD09MC
  if (to === 'GCJ02' || to === 'BD09' || to === 'BD09MC') {
    const toCRS = toGcoordCRS(to)
    const [x, y] = gcoord.transform([lng, lat], gcoord.WGS84, toCRS)
    return [x, y]
  }

  // EPSG:3857
  if (to === 'EPSG3857') {
    return proj4('WGS84', 'EPSG3857', [lng, lat]) as [number, number]
  }

  // 高德墨卡托
  if (to === 'GCJ02MERCATOR') {
    const [gcjLng, gcjLat] = gcoord.transform([lng, lat], gcoord.WGS84, gcoord.GCJ02)
    return proj4('WGS84', 'EPSG3857', [gcjLng, gcjLat]) as [number, number]
  }

  // 高斯-克吕格投影
  const gk = parseGK(to)
  if (gk) {
    const { geoBase, zoneWidth } = gk
    const ellipsoid = ellipsoidForGeo(geoBase)
    const zoneNum = calcZoneNumber(lng, zoneWidth)
    const cm = calcCentralMeridian(lng, zoneWidth)
    const def = buildGaussKrugerDef(cm, ellipsoid)

    // WGS84 → 对应地理基准 → 高斯-克吕格投影
    let geoLng = lng
    let geoLat = lat
    if (geoBase !== 'CGCS2000') {
      ;[geoLng, geoLat] = proj4('WGS84', geoBase, [lng, lat]) as [number, number]
    }
    const [xRel, yOut] = proj4(geoBase, def, [geoLng, geoLat]) as [number, number]
    // 加带号前缀
    const easting = zoneNum * 1000000 + xRel
    return [easting, yOut]
  }

  // 自定义坐标系
  if (isCustomSystem(to)) {
    const id = to.slice('CUSTOM:'.length)
    const projName = getCustomProjName(id)
    const def = customDefs.get(id)
    if (!def) return [lng, lat]

    if (def.type === 'geo') {
      return proj4('WGS84', projName, [lng, lat]) as [number, number]
    } else {
      return proj4('WGS84', projName, [lng, lat]) as [number, number]
    }
  }

  return [lng, lat]
}

/* ============ 通用转换入口 ============ */

/** 任意坐标系 -> 任意坐标系（经 WGS84 桥接） */
export function convert(
  x: number,
  y: number,
  from: CoordSystem,
  to: CoordSystem,
): [number, number] {
  if (from === to) return [x, y]
  const [wgsLng, wgsLat] = toWgs84(x, y, from)
  return fromWgs84(wgsLng, wgsLat, to)
}

/** 解析单行坐标 */
export function parseLine(line: string): [number, number] | null {
  const parts = line.trim().split(/[,，\s]+/).filter(Boolean)
  if (parts.length < 2) return null
  const x = Number(parts[0])
  const y = Number(parts[1])
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return [x, y]
}

/** 格式化：地理坐标保留6位，投影坐标保留2位（米级） */
export function formatCoord(value: number, type?: CoordType, format: 'decimal' | 'dms' = 'decimal'): string {
  if (type === 'proj') return value.toFixed(2)
  if (format === 'dms') return decimalToDMS(value)
  return value.toFixed(6)
}

/** 十进制度转度分秒字符串 */
export function decimalToDMS(decimal: number): string {
  const sign = decimal < 0 ? '-' : ''
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesFloat = (abs - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = ((minutesFloat - minutes) * 60).toFixed(2)
  return `${sign}${degrees}°${minutes}'${seconds}"`
}

/** 度分秒字符串转十进制度 */
export function dmsToDecimal(dms: string): number | null {
  const match = dms.trim().match(/^(-?)(\d+)[°º]\s*(\d+)[′']\s*(\d+(?:\.\d+)?)[″"]?$/)
  if (!match) {
    const num = Number(dms)
    return Number.isFinite(num) ? num : null
  }
  const sign = match[1] === '-' ? -1 : 1
  const degrees = Number(match[2])
  const minutes = Number(match[3])
  const seconds = Number(match[4])
  return sign * (degrees + minutes / 60 + seconds / 3600)
}

/** 按坐标系格式化坐标对 */
export function formatCoordPair(coord: [number, number], system: CoordSystem, format: 'decimal' | 'dms' = 'decimal'): string {
  const meta = getSystemMeta(system)
  return `${formatCoord(coord[0], meta.type, format)}, ${formatCoord(coord[1], meta.type, format)}`
}
