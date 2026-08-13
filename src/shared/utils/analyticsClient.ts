const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export interface RemoteVisitRecord {
  id?: string
  session_id: string
  tool_id: string
  ts: number
  duration: number
  device_type?: string
  browser?: string
  created_at?: string
}

export const isRemoteConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  if (!isRemoteConfigured()) {
    throw new Error('Supabase 未配置')
  }
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
  })
}

export async function insertVisit(record: RemoteVisitRecord): Promise<void> {
  if (!isRemoteConfigured()) return
  try {
    await request('/visits', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(record),
    })
  } catch (e) {
    console.warn('[analytics] 远程写入失败:', e)
  }
}

export async function updateVisitDuration(
  sessionId: string,
  toolId: string,
  ts: number,
  duration: number,
): Promise<void> {
  if (!isRemoteConfigured()) return
  try {
    await request(
      `/visits?session_id=eq.${encodeURIComponent(sessionId)}&tool_id=eq.${encodeURIComponent(toolId)}&ts=eq.${ts}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ duration }),
      },
    )
  } catch (e) {
    console.warn('[analytics] 远程更新失败:', e)
  }
}

export async function fetchAllVisits(): Promise<RemoteVisitRecord[]> {
  if (!isRemoteConfigured()) return []
  try {
    const res = await request(
      '/visits?select=id,session_id,tool_id,ts,duration,created_at&order=ts.desc&limit=10000',
    )
    if (!res.ok) return []
    return (await res.json()) as RemoteVisitRecord[]
  } catch (e) {
    console.warn('[analytics] 远程读取失败:', e)
    return []
  }
}
