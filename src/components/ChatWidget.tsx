import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBaziInput, useBazi, useBaziStore, useChat } from '@@/stores'
import { useLayout } from '@@/layout'

// ————————————————————————————————————————————————————————
// 八字助手聊天前端 —— 右下角浮动按钮 + 聊天面板。
// 所有通信逻辑 (fetch /api/chat 流式 SSE + 会话状态) 均封装在此组件内。
// ————————————————————————————————————————————————————————

/** 一次工具调用的可观测记录 (展示给用户)。pending 期间 result 缺省, 展示"调用中"。 */
interface ToolCallRecord {
  name: string
  args: unknown
  result?: string
}

const BASE_URL = 'https://bazi.app238.com'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** 该 assistant 消息触发的工具调用记录, 按执行顺序展示在气泡内。 */
  tools?: ToolCallRecord[]
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '你好，我是八字命理助手，有什么可以帮你的？',
}

export function ChatWidget() {
  const { chatOpen: open, setChatOpen } = useChat()
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { mobileOpen } = useLayout()
  const setOpen = setChatOpen

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
    const tools: ToolCallRecord[] = []
    const append = (delta: string) => {
      acc += delta
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: acc, tools: tools.length ? tools : undefined }
        return copy
      })
    }
    // 工具调用: start 时插入一条 pending 记录, end 时按 name 匹配补 result
    const startTool = (name: string, args: unknown) => {
      tools.push({ name, args })
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { ...copy[copy.length - 1], tools: [...tools] }
        return copy
      })
    }
    const endTool = (name: string, result: string) => {
      // 倒序找最近一条同名 pending, 补上 result (替换为完整卡片)
      for (let i = tools.length - 1; i >= 0; i--) {
        if (tools[i].name === name && tools[i].result === undefined) {
          tools[i] = { ...tools[i], result }
          break
        }
      }
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { ...copy[copy.length - 1], tools: [...tools] }
        return copy
      })
    }

    try {
      // 经请求头携带命盘上下文 (store 在后端不可见):
      //   X-BAZI-BASICS —— 八字 + 性别 + 可选真太阳时 (其余派生项砍掉, 后端自算)
      //   X-BAZI-UI     —— 当前选中的大运/流年/流月点击
      const input = useBaziInput.getState()
      const bazi = useBazi.getState()
      const store = useBaziStore.getState()
      // 八字四柱: 优先取排盘结果 pillars (各柱 gan+zhi), 退回 bazi 直输字符串
      const pillarsArr = bazi.pillars.map((p) =>
        `${p.pillar.gan.str}${p.pillar.zhi.str}`.trim(),
      )
      const baziArr = pillarsArr.some(Boolean) ? pillarsArr : input.bazi

      const basics = {
        bazi: baziArr,
        sex: input.sex,
        trueSolarStr: bazi.trueSolarStr || undefined,
      }
      const pickGz = (label: '大运' | '流年' | '流月') =>
        store.extraPillars
          .filter((p) => p.label === label)
          .map((p) => ({ gz: p.gz, desc: p.desc }))
      const ui = {
        dayun: pickGz('大运'),
        liunian: pickGz('流年'),
        liuyue: pickGz('流月'),
      }

      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // 头值只允许 Latin-1, 中文需 encodeURIComponent 编码; 后端 decode 后再 JSON.parse
          'X-BAZI-BASICS': encodeURIComponent(JSON.stringify(basics)),
          'X-BAZI-UI': encodeURIComponent(JSON.stringify(ui)),
        },
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
            const frame = JSON.parse(payload) as {
              content?: string
              error?: string
              toolStart?: { name: string; args: unknown }
              toolEnd?: { name: string; result: string }
            }
            if (frame.error) {
              append(`⚠️ ${frame.error}`)
            } else if (frame.content) {
              append(frame.content)
            } else if (frame.toolStart) {
              startTool(frame.toolStart.name, frame.toolStart.args)
            } else if (frame.toolEnd) {
              endTool(frame.toolEnd.name, frame.toolEnd.result)
            }
          } catch { /* 忽略半截帧 */ }
        }
      }
      if (acc === '') append('⚠️ 空响应')
    } catch (e) {
      // 不静默兜底: 打印完整错误到 console, 便于排查
      console.error('[ChatWidget] /api/chat 请求失败:', e)
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = {
          role: 'assistant',
          content:
            acc ||
            `⚠️ 请求异常: ${e instanceof Error ? e.message : String(e)}\n(详见控制台)`,
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
      {/* 聊天面板 —— 由 AppBar 右侧按钮开关 (useChat store); 抽屉展开时隐藏 */}
      {open && !mobileOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[90vh] md:h-[75vh] md:max-h-[720px] w-[calc(100vw-2.5rem)] max-w-[42rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
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
        {/* 用户消息纯文本; 助手消息走 markdown (remark-gfm) 渲染 + 工具调用卡片 */}
        {isUser ? (
          message!.content
        ) : (
          <>
            {message!.tools && message!.tools.length > 0 && (
              <div className="mb-1.5 space-y-1">
                {message!.tools.map((t, i) => (
                  <ToolCard key={i} rec={t} />
                ))}
              </div>
            )}
            {message!.content && (
              <Markdown remarkPlugins={[remarkGfm]}>{message!.content}</Markdown>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 工具调用卡片。
 * - pending (无 result): 特殊"调用中"样式, 转圈 spinner, 不可展开。
 * - 完成: 折叠展示 name / args / result, 点击展开详情。
 */
function ToolCard({ rec }: { rec: ToolCallRecord }) {
  const [open, setOpen] = useState(false)
  const pending = rec.result === undefined

  let resultPreview = rec.result ?? ''
  try {
    const parsed = JSON.parse(rec.result ?? '')
    resultPreview = typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
  } catch { /* 保留原文 */ }

  const argsText = Object.keys((rec.args as Record<string, unknown>) ?? {}).length
    ? JSON.stringify(rec.args)
    : ''

  // —— 调用中: 特殊 bubble ——
  if (pending) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50/70 px-2 py-1 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <span className="font-mono">{rec.name}</span>
        {argsText && <span className="truncate text-amber-500/70 dark:text-amber-400/60">{argsText}</span>}
        <span className="ml-auto shrink-0">调用中…</span>
      </div>
    )
  }

  // —— 完成: 常规卡片 ——
  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 text-xs dark:border-slate-700 dark:bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-slate-500 dark:text-slate-400"
      >
        <span className="font-mono text-amber-700 dark:text-amber-400">🔧 {rec.name}</span>
        <span className="truncate text-slate-400 dark:text-slate-500">{argsText}</span>
        <span className="ml-auto shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-slate-200 px-2 py-1.5 font-mono text-[11px] dark:border-slate-700">
          <div>
            <span className="text-slate-400">args:</span>{' '}
            <span className="text-slate-600 dark:text-slate-300">{JSON.stringify(rec.args)}</span>
          </div>
          <div>
            <span className="text-slate-400">result:</span>{' '}
            <span className="break-all text-slate-600 dark:text-slate-300">{resultPreview}</span>
          </div>
        </div>
      )}
      {!open && resultPreview && (
        <div className="truncate border-t border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-400 dark:border-slate-700">
          → {resultPreview}
        </div>
      )}
    </div>
  )
}
