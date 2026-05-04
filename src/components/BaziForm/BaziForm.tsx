import { useBaziInput } from '@@/stores'
import { BaziFormView } from './BaziFormView'
import { MAIN_PRESETS } from './SaveLoadControls'

/**
 * 主盘 BaziForm — useBaziInput store ↔ BaziFormView 的薄连接器.
 * 单一通道: state ← store, onChange → store.setState (zustand 浅合并).
 */
export function BaziForm() {
  const mode = useBaziInput((s) => s.mode)
  const year = useBaziInput((s) => s.year)
  const month = useBaziInput((s) => s.month)
  const day = useBaziInput((s) => s.day)
  const hour = useBaziInput((s) => s.hour)
  const minute = useBaziInput((s) => s.minute)
  const longitude = useBaziInput((s) => s.longitude)
  const bazi = useBaziInput((s) => s.bazi)
  const sex = useBaziInput((s) => s.sex)
  const syncToUrl = useBaziInput((s) => s.syncToUrl)

  return (
    <BaziFormView
      state={{ mode, year, month, day, hour, minute, longitude, bazi, sex }}
      onChange={(next) => useBaziInput.setState(next)}
      onSubmitted={syncToUrl}
      saveLoad={{ presets: MAIN_PRESETS }}
    />
  )
}
