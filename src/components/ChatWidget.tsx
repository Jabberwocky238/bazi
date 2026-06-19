import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ————————————————————————————————————————————————————————
// 八字助手聊天前端 —— 右下角浮动按钮 + 聊天面板。
// 所有通信逻辑 (fetch /api/chat 流式 SSE + 会话状态) 均封装在此组件内。
// ————————————————————————————————————————————————————————

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '你好，我是八字命理助手，有什么可以帮你的？',
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

    // 先占位一条空 assistant 消息, 流式增量追加
    setMessages((m) => [...m, { role: 'assistant', content: '' }])
    let acc = ''
    const append = (delta: string) => {
      acc += delta
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: acc }
        return copy
      })
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      // 非流式错误 (如未配置 key): JSON 响应
      if (!res.ok || !res.body) {
        let msg = `⚠️ 请求失败 (${res.status})`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) msg = `⚠️ ${data.error}`
        } catch { /* ignore */ }
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: msg }
          return copy
        })
        return
      }

      // 消费 SSE 流: data: {"content":"..."}\n\n, 末尾 data: [DONE]
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const frame = JSON.parse(payload) as { content?: string; error?: string }
            if (frame.error) {
              append(`⚠️ ${frame.error}`)
            } else if (frame.content) {
              append(frame.content)
            }
          } catch { /* 忽略半截帧 */ }
        }
      }
      if (acc === '') append('⚠️ 空响应')
    } catch {
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: acc || '⚠️ 网络错误，请稍后重试。',
        }
        return copy
      })
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
              <div className="text-[11px] tracking-[0.25em] uppercase text-slate-400">Assistant</div>
              <h2 className="text-sm font-medium tracking-[0.1em] text-slate-700 dark:text-slate-200">八字助手</h2>
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
            {messages.map((m, i) => {
              // 流式占位的空 assistant 消息不直接渲染, 由下方 pending 动画代替
              const isPlaceholder =
                m.role === 'assistant' && m.content === '' && i === messages.length - 1
              if (isPlaceholder) return null
              return <Bubble key={i} message={m} />
            })}
            {loading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'assistant' &&
              messages[messages.length - 1].content === '' && <Bubble pending />}
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
            : 'prose-chat max-w-[85%] break-words rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }
      >
        {/* 用户消息纯文本; 助手消息走 markdown (remark-gfm) 渲染 */}
        {isUser ? (
          message!.content
        ) : (
          <Markdown remarkPlugins={[remarkGfm]}>{message!.content}</Markdown>
        )}
      </div>
    </div>
  )
}
