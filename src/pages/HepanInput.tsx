import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { computeFromState } from '@@/stores/compute'
import type { Pillar } from '@/lib'
import { emptyPillars } from '@/lib'
import { BaziChart } from '@@/chart/BaziChart'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { GenericLayout } from '@@/GenericLayout'
import { defaultA, defaultB, type HepanState } from '@@/HepanInput'
import { BaziForm } from '@@/BaziForm'
import { applySavedEntry, type SavedEntry } from '@@/stores/savedEntries'
import { CommonButton } from '@@/CommonButton'
import { useDialog } from '@@/Dialog'
import { LoadDialog } from '@@/LoadDialog'
import {
  useSavedEntries,
  DEFAULT_STORAGE_KEY,
  MAIN_PRESETS,
} from '@@/stores/savedEntries'

interface HepanInputPageState {
  a: HepanState
  b: HepanState
}

function loadHepanInputPageState(): HepanInputPageState | null {
  try {
    const raw = localStorage.getItem('hepan.input.v1')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<HepanInputPageState> | null
    if (!parsed || (!parsed.a && !parsed.b)) return null
    const norm = (s: Partial<HepanState> | undefined, fallback: HepanState): HepanState => ({
      ...fallback,
      ...(s ?? {}),
      bazi: Array.isArray(s?.bazi) ? (s!.bazi as [string, string, string, string]) : fallback.bazi,
    })
    return { a: norm(parsed.a, defaultA), b: norm(parsed.b, defaultB) }
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
  const { open } = useDialog()
  const { init, entries, delete: deleteEntry } = useSavedEntries()

  useEffect(() => {
    init(DEFAULT_STORAGE_KEY, MAIN_PRESETS)
  }, [init])

  const handleChange = (newState: Partial<HepanInputPageState>) => {
    const next = { ...state, ...newState }
    setState(next)
    saveHepanInputPageState(next)
  }

  const aResult = computeFromState(state.a)?.bazi || {
    solarStr: '', trueSolarStr: '', lunarStr: '',
    pillars: emptyPillars(), hourKnown: false
  }
  const bResult = computeFromState(state.b)?.bazi || {
    solarStr: '', trueSolarStr: '', lunarStr: '',
    pillars: emptyPillars(), hourKnown: false
  }

  const hasValidBazi = (pillars: Pillar[]) => pillars && pillars.length === 4 && pillars.every(p => p.gan && p.zhi)

  const activeState = activeTab === 'a' ? state.a : state.b
  const setActiveState = (newState: HepanState) => {
    handleChange({ [activeTab]: newState })
  }
  const activeResult = activeTab === 'a' ? aResult : bResult

  const tabAName = state.a.name || '左侧人物'
  const tabBName = state.b.name || '右侧人物'

  const handleLoad = () => {
    open((onClose) => (
      <LoadDialog
        open={true}
        onClose={onClose}
        entries={entries}
        onLoad={(entry) => {
          const next = applySavedEntry(activeState, entry) as HepanState
          next.name = entry.name
          setActiveState(next)
          onClose()
        }}
        onDelete={(name, ev) => {
          ev.stopPropagation()
          deleteEntry(name)
        }}
      />
    ))
  }

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
          {/* BaziForm 输入 */}
          <BaziForm
            state={activeState}
            onChange={(next) => setActiveState(next as HepanState)}
            hideButtons
          />

          {/* 操作按钮 */}
          <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CommonButton
                onClick={handleLoad}
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
                  as="span"
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
    </GenericLayout>
  )
}
