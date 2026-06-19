import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

// ————————————————————————————————————————————————————————
// 聊天 echo 模拟器前端 —— 右下角浮动按钮 + 聊天面板。
// 所有通信逻辑 (fetch /api/chat + 会话状态) 均封装在此组件内。
// ————————————————————————————————————————————————————————

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '你好，这是一个 echo 模拟器 —— 你发什么，我就回什么。',
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 新消息时滚到底
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      const reply = data.reply ?? (data.error ? `⚠️ ${data.error}` : '⚠️ 无响应')
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ 网络错误，请稍后重试。' }])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 发送, Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return createPortal(
    <>
      {/* 浮动按钮 */}
      <button
        type="button"
        aria-label={open ? '关闭聊天' : '打开聊天'}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700 active:scale-95"
      >
        {open ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {/* 聊天面板 */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[60vh] max-h-[520px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* header */}
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-slate-400">Echo</div>
              <h2 className="text-sm font-medium tracking-[0.1em] text-slate-700 dark:text-slate-200">聊天模拟器</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭"
              className="text-xs text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
            >
              收起 ▾
            </button>
          </header>

          {/* 消息列表 */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            {loading && <Bubble pending />}
          </div>

          {/* 输入区 */}
          <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="输入消息，Enter 发送…"
                className="max-h-28 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading}
                className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}

/** 单条消息气泡。 */
function Bubble({ message, pending }: { message?: ChatMessage; pending?: boolean }) {
  if (pending) {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800">
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </span>
        </div>
      </div>
    )
  }

  const isUser = message!.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-amber-600 px-3 py-2 text-sm text-white'
            : 'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }
      >
        {message!.content}
      </div>
    </div>
  )
}
