import { useCallback, useEffect, useRef, useState } from 'react'

// ————————————————————————————————————————————————————————
// useDrawerSwipe —— 移动端抽屉的左右滑动手势 (挂在 window 上)。
//
// 行为:
//   关闭态: 从屏幕左边缘 (≤ EDGE px) 起始向右拖, 跟手拉出面板;
//   打开态: 在面板上向左拖 (或右滑过头再回拉) 跟手移动, 松手按位移/速度定开关。
//
// 监听挂在 window (而非 React onTouch*), 原因有二:
//   1. 关闭态抽屉容器 pointer-events-none, React 事件收不到边缘触摸;
//   2. touchmove 需 passive:false 才能 preventDefault 阻止页面滚动/橡皮筋。
//
// 返回:
//   dragX   —— 拖动期间面板的实时位移 (px), null 表示非拖动 (交回 CSS 过渡)。
//   dragging —— 是否正在拖动 (true 时禁用面板 transition, 让位移实时跟手)。
// ————————————————————————————————————————————————————————

/** 视作"从边缘起拖"的左边缘命中宽度。 */
const EDGE = 24
/** 判定切换的速度阈值 (px/ms)。 */
const VELOCITY = 0.4
/** 视为有意图的最小起拖距离, 低于此忽略 (防误触)。 */
const MIN_START = 8

export interface DrawerSwipeHandlers {
  /** 抽屉当前是否展开。 */
  open: boolean
  /** 打开抽屉。 */
  openDrawer: () => void
  /** 关闭抽屉。 */
  closeDrawer: () => void
  /** 是否启用 (仅移动端生效; 桌面端禁用以免干扰)。 */
  enabled?: boolean
}

export function useDrawerSwipe({
  open,
  openDrawer,
  closeDrawer,
  enabled = true,
}: DrawerSwipeHandlers) {
  // 拖动期间的实时位移; null ⇒ 非拖动, 由 CSS transition 接管。
  const [dragX, setDragX] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  // 起拖快照 (ref, 避免重渲染)
  const startX = useRef(0)
  const startY = useRef(0)
  const prevX = useRef(0)
  const prevT = useRef(0)
  const lastV = useRef(0) // 末段瞬时速度 px/ms
  const edgeStart = useRef(false)
  const active = useRef(false)

  // 用 ref 持有最新 open, 避免 effect 频繁重绑监听
  const openRef = useRef(open)
  openRef.current = open
  const panelWidth = typeof window !== 'undefined' ? window.innerWidth : 320

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 1) return
    const t = e.touches[0]
    const x = t.clientX
    const o = openRef.current
    const fromEdge = x <= EDGE
    // 关闭态: 仅左边缘起拖才可能打开。
    // 打开态: 面板已铺满, 任意位置起拖都可关闭。
    if (!o && !fromEdge) return

    startX.current = x
    startY.current = t.clientY
    prevX.current = x
    prevT.current = performance.now()
    lastV.current = 0
    edgeStart.current = fromEdge
    active.current = false // 待移动距离确认水平主导后再激活
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current && !edgeStart.current && !openRef.current) return
    const t = e.touches[0]
    const x = t.clientX
    const y = t.clientY
    const dx = x - startX.current
    const dy = y - startY.current
    const o = openRef.current

    // 尚未激活: 判断是否水平主导拖动
    if (!active.current) {
      if (Math.abs(dx) < MIN_START && Math.abs(dy) < MIN_START) return
      const horizontal = Math.abs(dx) > Math.abs(dy)
      if (!horizontal) return
      // 关闭态从边缘起只能向右拉; 向左则放弃
      if (!o && edgeStart.current && dx < 0) return
      active.current = true
      setDragging(true)
    }

    e.preventDefault() // 激活后阻止滚动

    const now = performance.now()
    const dt = now - prevT.current
    if (dt > 0 && dt < 100) lastV.current = (x - prevX.current) / dt
    prevX.current = x
    prevT.current = now

    // 面板位移, 钳制在 [-panelWidth, 0]
    let offset: number
    if (o) {
      // 打开态: 面板本在 0, 向左拖 dx<0 关闭
      offset = Math.max(-panelWidth, Math.min(0, dx))
    } else {
      // 关闭态: 面板本在 -panelWidth, 向右拖 dx>0 打开
      offset = Math.max(-panelWidth, Math.min(0, dx - panelWidth))
    }
    setDragX(offset)
  }, [panelWidth])

  const onTouchEnd = useCallback(() => {
    if (!active.current) {
      active.current = false
      edgeStart.current = false
      return
    }
    const o = openRef.current
    const dx = prevX.current - startX.current
    const velocity = Math.abs(lastV.current)

    const pastHalf = Math.abs(dx) > panelWidth / 2
    const fast = velocity > VELOCITY

    let willOpen: boolean
    if (o) {
      willOpen = !(pastHalf || fast) || dx >= 0
    } else {
      willOpen = (pastHalf || fast) && dx > 0
    }

    setDragX(null)
    setDragging(false)
    active.current = false
    edgeStart.current = false

    if (willOpen && !o) openDrawer()
    else if (!willOpen && o) closeDrawer()
  }, [panelWidth, openDrawer, closeDrawer])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, onTouchStart, onTouchMove, onTouchEnd])

  // open 切回关闭态时清掉残留位移
  useEffect(() => {
    if (!open && dragX !== null) setDragX(null)
  }, [open, dragX])

  return { dragX, dragging, panelWidth }
}
