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
): void {
  const x = origin?.x ?? window.innerWidth
  const y = origin?.y ?? 0

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (!document.startViewTransition || prefersReducedMotion) {
    callback()
    return
  }

  const root = document.documentElement
  root.classList.add('theme-transition')

  const radius = getMaxRadius({ x, y })
  const transition = document.startViewTransition(callback)

  const cleanup = () => {
    root.classList.remove('theme-transition')
  }

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    .catch(cleanup)

  void transition.finished.finally(cleanup)
}
