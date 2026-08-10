export function formatJson(input: string, indent = 2): { output: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { output: JSON.stringify(parsed, null, indent) }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'JSON 解析失败',
    }
  }
}

export function minifyJson(input: string): { output: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { output: JSON.stringify(parsed) }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'JSON 解析失败',
    }
  }
}

export function formatXml(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  let formatted = ''
  let indent = 0
  const tab = '  '

  trimmed
    .replace(/>\s*</g, '><')
    .replace(/(<[^/!][^>]*>)/g, '\n$1\n')
    .replace(/(<\/[^>]+>)/g, '\n$1\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.match(/^<\//)) {
        indent = Math.max(0, indent - 1)
      }
      formatted += tab.repeat(indent) + line + '\n'
      if (line.match(/^<[^!?/][^>]*[^/]>$/)) {
        indent += 1
      }
    })

  return formatted.trim()
}

export function minifyXml(input: string): string {
  return input.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}
