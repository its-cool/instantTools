type Point = { x: number; y: number }

function getMaxRadius({ x, y }: Point): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
}

export function withThemeTransition(
  callback: () => void,
  origin?: Point,
  nextDark?: boolean,
): void {
  const x = origin?.x ?? window.innerWidth
  const y = origin?.y ?? 0

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (prefersReducedMotion) {
    callback()
    return
  }

  const radius = getMaxRadius({ x, y })
  // 白→黑(nextDark=true)为扩张，黑→白(nextDark=false)为收缩
  const expand = nextDark !== false
  const root = document.documentElement

  // 优先使用原生 View Transition API（动画方向由 CSS 类控制）
  if (document.startViewTransition) {
    root.classList.add('theme-transition')
    root.classList.add(
      expand ? 'theme-transition--expand' : 'theme-transition--shrink',
    )
    root.style.setProperty('--reveal-x', `${x}px`)
    root.style.setProperty('--reveal-y', `${y}px`)
    root.style.setProperty('--reveal-radius', `${radius}px`)
    const transition = document.startViewTransition(callback)
    const cleanup = () => {
      root.classList.remove('theme-transition')
      root.classList.remove('theme-transition--expand')
      root.classList.remove('theme-transition--shrink')
      root.style.removeProperty('--reveal-x')
      root.style.removeProperty('--reveal-y')
      root.style.removeProperty('--reveal-radius')
    }
    transition.ready.catch(cleanup)
    void transition.finished.finally(cleanup)
    return
  }

  // CSS Fallback: 使用 keyframes 类触发动画（兼容夸克等浏览器）
  const createOverlay = (bg: string, dir: 'expand' | 'shrink') => {
    const el = document.createElement('div')
    el.className = `theme-reveal-overlay theme-reveal-overlay--${dir}`
    el.style.background = bg
    el.style.setProperty('--reveal-x', `${x}px`)
    el.style.setProperty('--reveal-y', `${y}px`)
    el.style.setProperty('--reveal-radius', `${radius}px`)
    return el
  }

  let overlay: HTMLDivElement
  let done = false
  let callbackDone = false
  const safeCallback = () => {
    if (callbackDone) return
    callbackDone = true
    callback()
  }
  const finish = () => {
    if (done) return
    done = true
    overlay.remove()
  }

  if (expand) {
    // 白→黑：窥探新主题背景色，创建扩张 overlay，动画结束后切换主题
    root.classList.toggle('dark')
    const newBg = getComputedStyle(document.body).backgroundColor
    root.classList.toggle('dark')
    overlay = createOverlay(newBg, 'expand')
    document.body.appendChild(overlay)
    overlay.addEventListener('animationend', () => {
      safeCallback()
      finish()
    })
    window.setTimeout(() => {
      safeCallback()
      finish()
    }, 600)
  } else {
    // 黑→白：立即切换主题，创建旧主题色收缩 overlay，动画结束后移除
    const oldBg = getComputedStyle(document.body).backgroundColor
    safeCallback()
    overlay = createOverlay(oldBg, 'shrink')
    document.body.appendChild(overlay)
    overlay.addEventListener('animationend', finish)
    window.setTimeout(finish, 600)
  }
}
