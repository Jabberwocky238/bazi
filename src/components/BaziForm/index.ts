/**
 * BaziForm 模块 — 八字输入面板 (4-tab UI + 保存/加载) 的唯一公开出口.
 *
 *  组件:
 *    - BaziForm     主盘连接器 (useBaziInput ↔ BaziFormView).
 *    - BaziFormView 通用 view, 受控 (state + onChange), 内嵌 saveLoad.
 *
 *  类型:
 *    - BaziFormViewProps
 *    - SavedEntry
 *
 *  辅助 (合盘等场景按需使用):
 *    - applySavedEntry, MAIN_PRESETS, DEFAULT_STORAGE_KEY
 *
 *  其他文件不允许直接 import './BaziForm/BaziFormView' 或 './BaziForm/SaveLoadControls' —
 *  统一从 '@@/BaziForm' 取.
 */
export { BaziForm } from './BaziForm'
export { BaziFormView } from './BaziFormView'
export type { BaziFormViewProps } from './BaziFormView'
export {
  SaveLoadControls,
  applySavedEntry,
  MAIN_PRESETS,
  DEFAULT_STORAGE_KEY,
} from './SaveLoadControls'
export type { SavedEntry, SaveLoadControlsProps } from './SaveLoadControls'
