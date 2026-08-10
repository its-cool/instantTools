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
