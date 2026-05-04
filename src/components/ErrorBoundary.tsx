import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** 标签名，出错时显示，便于定位哪个面板炸了 */
  name?: string
}

interface State {
  error: Error | null
  stack: string
}

/**
 * 包裹每个面板 —— 某个面板渲染 throw 时只显示本框红框并继续渲染其他兄弟组件，
 * 不让整棵树被 React 卸载。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: '' }

  static getDerivedStateFromError(error: Error): State {
    return { error, stack: error.stack ?? '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const tag = this.props.name ?? 'ErrorBoundary'
    console.error(`[${tag}]`, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-400">
          <div className="font-medium">
            ⚠ 组件 {this.props.name ?? ''} 渲染失败
          </div>
          <div className="mt-1 opacity-80 break-all">
            {this.state.error.message || String(this.state.error)}
          </div>
          {this.state.stack && (
            <details className="mt-1 opacity-70">
              <summary className="cursor-pointer">stack</summary>
              <pre className="whitespace-pre-wrap text-[10px] mt-1">{this.state.stack}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
