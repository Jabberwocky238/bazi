import { describeEntry, type SavedEntry } from '@@/stores/savedEntries'

// ————————————————————————————————————————————————————————
// 已保存命例列表 —— 纯正文, 由 useDialog().open() 托管外壳。
// ————————————————————————————————————————————————————————

interface LoadModalProps {
  onClose: () => void
  entries: SavedEntry[]
  onLoad: (entry: SavedEntry) => void
  onDelete: (name: string, ev: React.MouseEvent) => void
}

export function LoadModal({ onClose, entries, onLoad, onDelete }: LoadModalProps) {
  const onPick = (e: SavedEntry) => {
    onLoad(e)
    onClose()
  }

  return entries.length === 0 ? (
    <div className="py-6 text-sm text-slate-500 text-center">暂无保存记录</div>
  ) : (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
      {entries.map((e) => {
        const { tag, detail } = describeEntry(e)
        return (
          <div key={e.name} className="flex items-stretch bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => onPick(e)}
              className="flex-1 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {e.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-400 dark:bg-slate-800 dark:text-slate-500">{tag}</span>
                {detail} · {e.sex === 1 ? '男' : '女'}
              </div>
            </button>
            <button
              type="button"
              onClick={(ev) => onDelete(e.name, ev)}
              aria-label={'删除' + e.name}
              className="px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
