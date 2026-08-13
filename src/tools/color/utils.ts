import { colord, extend } from 'colord'
import harmoniesPlugin from 'colord/plugins/harmonies'
import namesPlugin from 'colord/plugins/names'
import cmykPlugin from 'colord/plugins/cmyk'
import a11yPlugin from 'colord/plugins/a11y'

extend([harmoniesPlugin, namesPlugin, cmykPlugin, a11yPlugin])

export { colord }

export type PaletteScheme =
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'

export const SCHEME_LABELS: Record<PaletteScheme, string> = {
  analogous: '类似色',
  complementary: '互补色',
  triadic: '三角配色',
  tetradic: '四角配色',
  'split-complementary': '分裂互补',
}

export function generatePalette(baseColor: string, scheme: PaletteScheme): string[] {
  const base = colord(baseColor)
  if (!base.isValid()) return []

  const colors = base.harmonies(scheme)
  return colors.map((c) => c.toHex())
}

export function randomColor(): string {
  return colord({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }).toHex()
}

export function formatColorFormats(color: string) {
  const c = colord(color)
  if (!c.isValid()) {
    return null
  }
  return {
    hex: c.toHex(),
    rgb: c.toRgbString(),
    hsl: c.toHslString(),
    cmyk: c.toCmykString(),
  }
}

export function getContrastRatio(fg: string, bg: string): number {
  return colord(fg).contrast(bg)
}

export function getWcagLevel(ratio: number): { aa: boolean; aaa: boolean } {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
  }
}

/* ==================== Web 主题配色 ==================== */

export interface ThemeColorItem {
  name: string
  hex: string
}

export interface ThemeScheme {
  id: string
  label: string
  description: string
  groups: { label: string; colors: ThemeColorItem[] }[]
}

type Hsl = { h: number; s: number; l: number }

function toHsl(hex: string): Hsl {
  const { h, s, l } = colord(hex).toHsl()
  return { h, s, l }
}

function fromHsl(h: number, s: number, l: number): string {
  return colord({ h, s, l }).toHex()
}

function mix(hex: string, target: Hsl, amount: number): string {
  const base = toHsl(hex)
  return fromHsl(
    base.h + (target.h - base.h) * amount,
    base.s + (target.s - base.s) * amount,
    base.l + (target.l - base.l) * amount,
  )
}

function lighten(hex: string, amount: number): string {
  const base = toHsl(hex)
  return fromHsl(base.h, base.s, Math.min(100, base.l + amount))
}

function darken(hex: string, amount: number): string {
  const base = toHsl(hex)
  return fromHsl(base.h, base.s, Math.max(0, base.l - amount))
}

function adjustHue(hex: string, deg: number): string {
  const base = toHsl(hex)
  return fromHsl((base.h + deg) % 360, base.s, base.l)
}

function pickContrastText(bg: string): string {
  return colord(bg).brightness() > 0.55 ? '#1d1e1f' : '#ffffff'
}

/** Element Plus 风格：primary + light-3/5/7/9 + dark-2 + 功能色 */
function generateElementPlusTheme(base: string): ThemeScheme {
  const white: Hsl = { h: 0, s: 0, l: 100 }
  const black: Hsl = { h: 210, s: 14, l: 13 }
  const primaryLight = (amount: number) => mix(base, white, amount)

  return {
    id: 'element-plus',
    label: 'Element Plus 风格',
    description: 'primary + light 系列 + dark 变体 + 功能色',
    groups: [
      {
        label: '主色',
        colors: [
          { name: '--el-color-primary', hex: base },
          { name: '--el-color-primary-light-3', hex: primaryLight(0.3) },
          { name: '--el-color-primary-light-5', hex: primaryLight(0.5) },
          { name: '--el-color-primary-light-7', hex: primaryLight(0.7) },
          { name: '--el-color-primary-light-9', hex: primaryLight(0.9) },
          { name: '--el-color-primary-dark-2', hex: mix(base, black, 0.2) },
        ],
      },
      {
        label: '功能色',
        colors: [
          { name: '--el-color-success', hex: '#67c23a' },
          { name: '--el-color-warning', hex: '#e6a23c' },
          { name: '--el-color-danger', hex: '#f56c6c' },
          { name: '--el-color-info', hex: '#909399' },
        ],
      },
      {
        label: '中性色',
        colors: [
          { name: '--el-text-color-primary', hex: '#303133' },
          { name: '--el-text-color-regular', hex: '#606266' },
          { name: '--el-text-color-secondary', hex: '#909399' },
          { name: '--el-text-color-placeholder', hex: '#a8abb2' },
          { name: '--el-border-color', hex: '#dcdfe6' },
          { name: '--el-fill-color-blank', hex: '#ffffff' },
        ],
      },
    ],
  }
}

/** Tailwind 风格：50-900 色阶 */
function generateTailwindTheme(base: string): ThemeScheme {
  const hsl = toHsl(base)
  const steps = [
    { name: '50', l: 97 },
    { name: '100', l: 93 },
    { name: '200', l: 86 },
    { name: '300', l: 75 },
    { name: '400', l: 64 },
    { name: '500', l: Math.min(55, hsl.l) },
    { name: '600', l: 46 },
    { name: '700', l: 37 },
    { name: '800', l: 28 },
    { name: '900', l: 20 },
  ]

  return {
    id: 'tailwind',
    label: 'Tailwind 风格',
    description: '50 → 900 完整色阶',
    groups: [
      {
        label: '色阶',
        colors: steps.map((s) => ({
          name: `-${s.name}`,
          hex: fromHsl(hsl.h, hsl.s, s.l),
        })),
      },
    ],
  }
}

/** Material Design 风格：50/100/200/.../900 + accent */
function generateMaterialTheme(base: string): ThemeScheme {
  const hsl = toHsl(base)
  const steps = [
    { name: '50', l: 96 },
    { name: '100', l: 90 },
    { name: '200', l: 80 },
    { name: '300', l: 68 },
    { name: '400', l: 58 },
    { name: '500', l: Math.min(50, hsl.l) },
    { name: '600', l: 42 },
    { name: '700', l: 34 },
    { name: '800', l: 26 },
    { name: '900', l: 18 },
  ]

  const accent1 = adjustHue(base, 30)
  const accent2 = adjustHue(base, -30)
  const accentHsl = toHsl(accent1)

  return {
    id: 'material',
    label: 'Material Design 风格',
    description: '50-900 主色阶 + A100/A200/A400/A700 强调色',
    groups: [
      {
        label: '主色阶',
        colors: steps.map((s) => ({
          name: s.name,
          hex: fromHsl(hsl.h, hsl.s, s.l),
        })),
      },
      {
        label: '强调色 (Accent)',
        colors: [
          { name: 'A100', hex: fromHsl(accentHsl.h, Math.max(70, accentHsl.s), 80) },
          { name: 'A200', hex: fromHsl(accentHsl.h, Math.max(70, accentHsl.s), 65) },
          { name: 'A400', hex: fromHsl(accentHsl.h, Math.max(75, accentHsl.s), 50) },
          { name: 'A700', hex: fromHsl(accentHsl.h, Math.max(75, accentHsl.s), 40) },
        ],
      },
      {
        label: '辅助色',
        colors: [
          { name: 'secondary', hex: accent2 },
          { name: 'background', hex: '#fafafa' },
          { name: 'surface', hex: '#ffffff' },
          { name: 'error', hex: '#b00020' },
          { name: 'on-primary', hex: pickContrastText(base) },
          { name: 'on-secondary', hex: pickContrastText(accent2) },
        ],
      },
    ],
  }
}

/** Ant Design 风格：primary + 功能色 + 灰阶 */
function generateAntDesignTheme(base: string): ThemeScheme {
  const white: Hsl = { h: 0, s: 0, l: 100 }
  return {
    id: 'ant-design',
    label: 'Ant Design 风格',
    description: 'primary + 功能色 + 灰阶文本',
    groups: [
      {
        label: '主色',
        colors: [
          { name: '@primary-color', hex: base },
          { name: 'primary-1', hex: mix(base, white, 0.92) },
          { name: 'primary-2', hex: mix(base, white, 0.85) },
          { name: 'primary-3', hex: mix(base, white, 0.7) },
          { name: 'primary-4', hex: mix(base, white, 0.5) },
          { name: 'primary-5', hex: mix(base, white, 0.3) },
          { name: 'primary-6', hex: base },
          { name: 'primary-7', hex: darken(base, 8) },
          { name: 'primary-8', hex: darken(base, 16) },
          { name: 'primary-9', hex: darken(base, 24) },
          { name: 'primary-10', hex: darken(base, 32) },
        ],
      },
      {
        label: '功能色',
        colors: [
          { name: '@success-color', hex: '#52c41a' },
          { name: '@warning-color', hex: '#faad14' },
          { name: '@error-color', hex: '#f5222d' },
          { name: '@info-color', hex: '#1890ff' },
        ],
      },
      {
        label: '中性色',
        colors: [
          { name: '@heading-color', hex: 'rgba(0,0,0,0.85)' },
          { name: '@text-color', hex: 'rgba(0,0,0,0.65)' },
          { name: '@text-color-secondary', hex: 'rgba(0,0,0,0.45)' },
          { name: '@disabled-color', hex: 'rgba(0,0,0,0.25)' },
          { name: '@border-color-base', hex: '#d9d9d9' },
          { name: '@component-background', hex: '#fff' },
          { name: '@body-background', hex: '#f0f2f5' },
        ],
      },
    ],
  }
}

/** Bootstrap 风格：primary/secondary/success/danger/warning/info/light/dark */
function generateBootstrapTheme(base: string): ThemeScheme {
  const secondary = mix(base, { h: 0, s: 0, l: 50 }, 0.7)
  return {
    id: 'bootstrap',
    label: 'Bootstrap 风格',
    description: '8 种语义色 + 浅/深变体',
    groups: [
      {
        label: '语义色',
        colors: [
          { name: '$primary', hex: base },
          { name: '$secondary', hex: secondary },
          { name: '$success', hex: '#28a745' },
          { name: '$danger', hex: '#dc3545' },
          { name: '$warning', hex: '#ffc107' },
          { name: '$info', hex: '#17a2b8' },
          { name: '$light', hex: '#f8f9fa' },
          { name: '$dark', hex: '#343a40' },
        ],
      },
      {
        label: '主色变体',
        colors: [
          { name: 'primary-light', hex: lighten(base, 15) },
          { name: 'primary-dark', hex: darken(base, 12) },
          { name: 'primary-rgb', hex: colord(base).toRgbString() },
        ],
      },
      {
        label: '文本/链接',
        colors: [
          { name: '$body-color', hex: '#212529' },
          { name: '$body-bg', hex: '#fff' },
          { name: '$link-color', hex: base },
          { name: '$link-hover-color', hex: darken(base, 10) },
        ],
      },
    ],
  }
}

export function generateTheme(baseColor: string, style: string): ThemeScheme | null {
  const base = colord(baseColor)
  if (!base.isValid()) return null

  const generators: Record<string, (b: string) => ThemeScheme> = {
    'element-plus': generateElementPlusTheme,
    tailwind: generateTailwindTheme,
    material: generateMaterialTheme,
    'ant-design': generateAntDesignTheme,
    bootstrap: generateBootstrapTheme,
  }

  const gen = generators[style]
  return gen ? gen(baseColor) : null
}

export function generateAllThemes(baseColor: string): ThemeScheme[] {
  const styles = ['element-plus', 'tailwind', 'material', 'ant-design', 'bootstrap']
  return styles
    .map((s) => generateTheme(baseColor, s))
    .filter((t): t is ThemeScheme => t !== null)
}

export const THEME_STYLE_LABELS: Record<string, string> = {
  'element-plus': 'Element Plus',
  tailwind: 'Tailwind CSS',
  material: 'Material Design',
  'ant-design': 'Ant Design',
  bootstrap: 'Bootstrap',
}

export function themeToCssVars(theme: ThemeScheme): string {
  const lines: string[] = [':root {']
  for (const group of theme.groups) {
    lines.push(`  /* ${group.label} */`)
    for (const c of group.colors) {
      lines.push(`  ${c.name}: ${c.hex};`)
    }
  }
  lines.push('}')
  return lines.join('\n')
}
