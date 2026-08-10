import localforage from 'localforage'

localforage.config({
  name: 'instant-tools',
  storeName: 'app-data',
})

export async function getItem<T>(key: string): Promise<T | null> {
  return (await localforage.getItem<T>(key)) ?? null
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await localforage.setItem(key, value)
}

export async function removeItem(key: string): Promise<void> {
  await localforage.removeItem(key)
}

export { localforage }
