import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { computeFromState } from '@@/stores/compute'
import type { Pillar } from '@/lib'
import { EMPTY_PILLAR } from '@/lib'
import { BaziChart } from '@@/chart/BaziChart'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { GenericLayout } from '@@/GenericLayout'
import { defaultA, defaultB, type HepanState } from '@@/HepanInput'
import { BaziFormView } from '@@/BaziForm/BaziFormView'
import { applySavedEntry, type SavedEntry } from '@@/BaziForm/SaveLoadControls'
import { CommonButton } from '@@/CommonButton'

const DEFAULT_STORAGE_KEY = 'bazi.saved.v1'

function loadAllSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(DEFAULT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedEntry[]) : []
  } catch {
    return []
  }
}

interface HepanInputPageState {
  a: HepanState
  b: HepanState
}

function loadHepanInputPageState(): HepanInputPageState | null {
  try {
    const raw = localStorage.getItem('hepan.input.v1')
    if (!raw) return null
    return JSON.parse(raw) as HepanInputPageState
  } catch {
    return null
  }
}

function saveHepanInputPageState(state: HepanInputPageState): void {
  try {
    localStorage.setItem('hepan.input.v1', JSON.stringify(state))
  } catch {}
}

export default function HepanInput() {
  const navigate = useNavigate()
  const [state, setState] = useState<HepanInputPageState>(() => {
    return loadHepanInputPageState() || { a: defaultA, b: defaultB }
  })
  const [activeTab, setActiveTab] = useState<'a' | 'b'>('a')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([])

  useEffect(() => {
    if (dialogOpen) {
      setSavedEntries(loadAllSaved())
    }
  }, [dialogOpen])

  const handleChange = (newState: Partial<HepanInputPageState>) => {
    const next = { ...state, ...newState }
    setState(next)
    saveHepanInputPageState(next)
  }

  const aResult = computeFromState(state.a)?.bazi || {
    solarStr: '', trueSolarStr: '', lunarStr: '',
    pillars: [EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR], hourKnown: false
  }
  const bResult = computeFromState(state.b)?.bazi || {
    solarStr: '', trueSolarStr: '', lunarStr: '',
    pillars: [EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR], hourKnown: false
  }

  const hasValidBazi = (pillars: Pillar[]) => pillars && pillars.length === 4 && pillars.every(p => p.gan && p.zhi)

  const activeState = activeTab === 'a' ? state.a : state.b
  const setActiveState = (newState: HepanState) => {
    handleChange({ [activeTab]: newState })
  }
  const activeResult = activeTab === 'a' ? aResult : bResult

  const tabAName = state.a.name || '左侧人物'
  const tabBName = state.b.name || '右侧人物'

  const handleLoadEntry = (entry: SavedEntry) => {
    const next = applySavedEntry(activeState, entry)
    if (entry.name) {
      next.name = entry.name
    }
    setActiveState(next)
    setDialogOpen(false)
  }

  const loadDialog = dialogOpen ? createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 px-3 py-8 backdrop-blur-sm md:items-center md:p-6">
      <div className="flex max-h-[85vh] w-[min(520px,92vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="text-sm font-medium tracking-[0.2em] text-slate-600 dark:text-slate-300">已保存命例</div>
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className="shrink-0 text-xs text-slate-500 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-400"
          >
            关闭 ×
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 scrollbar-thin">
          {savedEntries.length === 0 ? (
            <div className="py-6 text-sm text-slate-500 text-center">暂无保存记录</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {savedEntries.map((e) => (
                <div key={e.name} className="flex items-stretch bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => handleLoadEntry(e)} className="flex-1 min-w-0 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      八字 {e.bazi.filter((g: string) => g.length === 2).join(' ')} · {e.sex === 1 ? '男' : '女'}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <GenericLayout errorBoundaryName="HepanInput" title="八字合盘" link={<Link to="/">← 首页</Link>}>
      <div className="space-y-6">
        {/* Tab 切换 */}
        <div className="grid grid-cols-2 gap-1.5 border-b border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-950/40 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('a')}
            className={`rounded-2xl px-3 py-2.5 text-left transition ${activeTab === 'a' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-500/25 dark:bg-slate-900 dark:text-amber-400' : 'text-slate-500 hover:bg-white/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-amber-400'}`}
          >
            <div className="text-sm font-semibold tracking-wide">{tabAName}</div>
            <div className="mt-0.5 text-[10px] opacity-70">{hasValidBazi(aResult.pillars) ? '已输入' : '未输入'}</div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('b')}
            className={`rounded-2xl px-3 py-2.5 text-left transition ${activeTab === 'b' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-500/25 dark:bg-slate-900 dark:text-amber-400' : 'text-slate-500 hover:bg-white/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-amber-400'}`}
          >
            <div className="text-sm font-semibold tracking-wide">{tabBName}</div>
            <div className="mt-0.5 text-[10px] opacity-70">{hasValidBazi(bResult.pillars) ? '已输入' : '未输入'}</div>
          </button>
        </div>

        {/* 输入面板 */}
        <div className="space-y-4">
          {/* BaziFormView 输入 */}
          <BaziFormView
            state={activeState}
            onChange={setActiveState}
            isMainBaziInput
            hideButtons
          />

          {/* 操作按钮 */}
          <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CommonButton
                onClick={() => setDialogOpen(true)}
                width="w-1/2 md:w-[50%]"
              >
                加载
              </CommonButton>
              <Link
                to="/hepan-show"
                state={state}
                className="contents"
              >
                <CommonButton
                  variant="primary"
                  width="w-1/2 md:w-[50%]"
                  as="a"
                >
                  开始合盘
                </CommonButton>
              </Link>
            </div>
          </div>

          {/* 预览 */}
          <div className="min-w-0 flex flex-col gap-2 md:gap-3">
            <ErrorBoundary name={`HepanChart-${activeTab}`}>
              <BaziChart pillars={activeResult.pillars} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
      {loadDialog}
    </GenericLayout>
  )
}
