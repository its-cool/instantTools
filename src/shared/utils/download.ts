import { saveAs } from 'file-saver'

export function downloadText(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  saveAs(blob, filename)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  saveAs(dataUrl, filename)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function readFromClipboard(): Promise<string> {
  return navigator.clipboard.readText()
}
