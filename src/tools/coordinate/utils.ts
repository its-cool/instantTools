// 坐标系转换算法（基于 proj4 + gcoord）
// 地理坐标系：WGS84 / CGCS2000 / GCJ02(高德) / BD09(百度)
// 投影坐标系：EPSG:3857(Web墨卡托) / CGCS2000 高斯-克吕格(3度/6度带)
// 转换枢纽：WGS84 经纬度
//   - proj4 处理国际/标准坐标系：WGS84 / CGCS2000 / EPSG:3857 / CGCS2000 GK
//   - gcoord 处理国内加密坐标系：GCJ02 / BD09（EPSG:3857 两库均可，统一用 gcoord 链路）
//   - 跨库互转：源 -> WGS84 -> 目标

import proj4 from 'proj4'
import gcoord from 'gcoord'

export type GeoSystem = 'WGS84' | 'CGCS2000' | 'GCJ02' | 'BD09'
export type ProjSystem = 'EPSG3857' | 'GCJ02MERCATOR' | 'BD09MC' | 'CGCS2000_GK3' | 'CGCS2000_GK6'
export type CoordSystem = GeoSystem | ProjSystem

export type CoordType = 'geo' | 'proj'

export interface CoordSystemMeta {
  value: CoordSystem
  /** 编码，如 EPSG:4326 */
  code: string
  /** 显示名称 */
  label: string
  /** 详细描述 */
  desc: string
  /** 单位：degree / metre */
  unit: 'degree' | 'metre'
  /** 适用区域 */
  area: string
  /** 坐标系类型 */
  type: CoordType
  /** 实现库：proj4 / gcoord */
  engine: 'proj4' | 'gcoord'
}

export const COORD_SYSTEMS: CoordSystemMeta[] = [
  // 地理坐标系
  { value: 'WGS84', code: 'EPSG:4326', label: 'WGS 84', desc: 'World Geodetic System 1984', unit: 'degree', area: 'World', type: 'geo', engine: 'proj4' },
  { value: 'CGCS2000', code: 'EPSG:4490', label: 'CGCS2000', desc: 'China Geodetic Coordinate System 2000', unit: 'degree', area: 'China', type: 'geo', engine: 'proj4' },
  { value: 'GCJ02', code: 'GCJ-02', label: 'GCJ-02', desc: '火星坐标系（高德/腾讯/谷歌中国）', unit: 'degree', area: 'China', type: 'geo', engine: 'gcoord' },
  { value: 'BD09', code: 'BD-09', label: 'BD-09', desc: '百度经纬度坐标系', unit: 'degree', area: 'China', type: 'geo', engine: 'gcoord' },
  // 投影坐标系
  { value: 'EPSG3857', code: 'EPSG:3857', label: 'Web Mercator', desc: 'WGS 84 / Pseudo-Mercator', unit: 'metre', area: 'World', type: 'proj', engine: 'proj4' },
  { value: 'GCJ02MERCATOR', code: 'GCJ-02-M', label: 'GCJ-02 Web Mercator', desc: '高德投影坐标系（基于GCJ-02的Web墨卡托）', unit: 'metre', area: 'China', type: 'proj', engine: 'gcoord' },
  { value: 'BD09MC', code: 'BD-09-MC', label: 'BD-09 Mercator', desc: '百度墨卡托投影坐标（BD09MC）', unit: 'metre', area: 'China', type: 'proj', engine: 'gcoord' },
  { value: 'CGCS2000_GK3', code: 'CGCS2000/GK3', label: 'CGCS2000 / 3-degree Gauss-Kruger', desc: 'CGCS2000 高斯-克吕格3度带投影', unit: 'metre', area: 'China', type: 'proj', engine: 'proj4' },
  { value: 'CGCS2000_GK6', code: 'CGCS2000/GK6', label: 'CGCS2000 / 6-degree Gauss-Kruger', desc: 'CGCS2000 高斯-克吕格6度带投影', unit: 'metre', area: 'China', type: 'proj', engine: 'proj4' },
]

/** 坐标系元数据查找 */
export function getSystemMeta(sys: CoordSystem): CoordSystemMeta {
  return COORD_SYSTEMS.find((s) => s.value === sys)!
}

/* ============ proj4 投影定义 ============ */

const PROJ4_DEFS: Record<string, string> = {
  WGS84: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
  CGCS2000: '+proj=longlat +ellps=GRS80 +no_defs +type=crs',
  EPSG3857:
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
}

// 注册静态投影
for (const [name, def] of Object.entries(PROJ4_DEFS)) {
  proj4.defs(name, def)
}

/** 构造 CGCS2000 高斯-克吕格投影字符串（不带带号前缀，仅 500000 东偏） */
function buildGaussKrugerDef(centralMeridian: number): string {
  return (
    `+proj=tmerc +lat_0=0 +lon_0=${centralMeridian} +k=1 ` +
    `+x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs`
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

/** 判断是否为高斯-克吕格投影 */
function isGaussKruger(s: CoordSystem): s is 'CGCS2000_GK3' | 'CGCS2000_GK6' {
  return s === 'CGCS2000_GK3' || s === 'CGCS2000_GK6'
}

/* ============ gcoord CRS 映射 ============ */
// gcoord 默认导出对象上的属性，运行时为字符串值（如 gcoord.GCJ02 === 'GCJ02'）
function toGcoordCRS(sys: 'GCJ02' | 'BD09' | 'BD09MC') {
  return sys === 'GCJ02' ? gcoord.GCJ02 : sys === 'BD09' ? gcoord.BD09 : gcoord.BD09MC
}

/* ============ 各坐标系 -> WGS84 经纬度 ============ */

function toWgs84(x: number, y: number, from: CoordSystem): [number, number] {
  if (from === 'WGS84') return [x, y]

  // CGCS2000（地理坐标系，与 WGS84 视为等同）
  if (from === 'CGCS2000') return [x, y]

  // gcoord 直接支持的：GCJ02 / BD09 / BD09MC
  if (from === 'GCJ02' || from === 'BD09' || from === 'BD09MC') {
    const fromCRS = toGcoordCRS(from)
    const [lng, lat] = gcoord.transform([x, y], fromCRS, gcoord.WGS84)
    return [lng, lat]
  }

  // EPSG:3857（proj4 处理墨卡托反算 → WGS84）
  if (from === 'EPSG3857') {
    const [lng, lat] = proj4('EPSG3857', 'WGS84', [x, y])
    return [lng, lat]
  }

  // 高德墨卡托：墨卡托反算 → GCJ02 经纬度 → gcoord 转 WGS84
  if (from === 'GCJ02MERCATOR') {
    const [gcjLng, gcjLat] = proj4('EPSG3857', 'WGS84', [x, y])
    const [lng, lat] = gcoord.transform([gcjLng, gcjLat], gcoord.GCJ02, gcoord.WGS84)
    return [lng, lat]
  }

  // 高斯-克吕格投影
  if (isGaussKruger(from)) {
    const zoneWidth: 3 | 6 = from === 'CGCS2000_GK3' ? 3 : 6
    // 提取带号
    const zoneNum = Math.floor(x / 1000000)
    const xRel = x - zoneNum * 1000000 // 移除带号前缀，保留 500000 东偏
    const cm = centralMeridianFromZone(zoneNum, zoneWidth)
    const def = buildGaussKrugerDef(cm)
    const [lng, lat] = proj4(def, 'CGCS2000', [xRel, y])
    return [lng, lat]
  }

  return [x, y]
}

/* ============ WGS84 经纬度 -> 各坐标系 ============ */

function fromWgs84(lng: number, lat: number, to: CoordSystem): [number, number] {
  if (to === 'WGS84') return [lng, lat]

  // CGCS2000（地理坐标系）
  if (to === 'CGCS2000') return [lng, lat]

  // gcoord 直接支持的：GCJ02 / BD09 / BD09MC
  if (to === 'GCJ02' || to === 'BD09' || to === 'BD09MC') {
    const toCRS = toGcoordCRS(to)
    const [x, y] = gcoord.transform([lng, lat], gcoord.WGS84, toCRS)
    return [x, y]
  }

  // EPSG:3857（proj4 处理墨卡托正算）
  if (to === 'EPSG3857') {
    return proj4('WGS84', 'EPSG3857', [lng, lat])
  }

  // 高德墨卡托：WGS84 → GCJ02 经纬度 → 墨卡托正算
  if (to === 'GCJ02MERCATOR') {
    const [gcjLng, gcjLat] = gcoord.transform([lng, lat], gcoord.WGS84, gcoord.GCJ02)
    return proj4('WGS84', 'EPSG3857', [gcjLng, gcjLat])
  }

  // 高斯-克吕格投影
  if (isGaussKruger(to)) {
    const zoneWidth: 3 | 6 = to === 'CGCS2000_GK3' ? 3 : 6
    const zoneNum = calcZoneNumber(lng, zoneWidth)
    const cm = calcCentralMeridian(lng, zoneWidth)
    const def = buildGaussKrugerDef(cm)
    const [xRel, yOut] = proj4('CGCS2000', def, [lng, lat])
    // 加带号前缀
    const easting = zoneNum * 1000000 + xRel
    return [easting, yOut]
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

/** 一次转换为所有坐标系 */
export function convertToAll(
  x: number,
  y: number,
  from: CoordSystem,
): Record<CoordSystem, [number, number]> {
  const result = {} as Record<CoordSystem, [number, number]>
  for (const sys of COORD_SYSTEMS) {
    result[sys.value] = convert(x, y, from, sys.value)
  }
  return result
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

/** 判断是否是投影坐标（数值较大） */
export function looksLikeProjected(x: number, y: number): boolean {
  return Math.abs(x) > 180 || Math.abs(y) > 90
}

/** 格式化：地理坐标保留6位，投影坐标保留2位（米级） */
export function formatCoord(value: number, type?: CoordType): string {
  if (type === 'proj') return value.toFixed(2)
  return value.toFixed(6)
}

/** 按坐标系格式化坐标对 */
export function formatCoordPair(coord: [number, number], system: CoordSystem): string {
  const sysMeta = COORD_SYSTEMS.find((s) => s.value === system)
  return sysMeta
    ? `${formatCoord(coord[0], sysMeta.type)}, ${formatCoord(coord[1], sysMeta.type)}`
    : `${coord[0]}, ${coord[1]}`
}
