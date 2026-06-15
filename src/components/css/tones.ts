/**
 * 全工程统一色调 tokens — 主盘 / 合盘 共用.
 *
 *  KIND_TONE       干支 finding (合冲刑害破克 / 暗合 / 争妒合 / 盖头 / 截脚 / 覆载 / 墓库)
 *  XIYONG_TONE     用神 / 喜神 / 忌神 / 调候 四类 chip
 *  GANZHI_TONE     干支作用 (盖头 / 截脚 / 覆载 同气 / 得载 / 得覆 / 中性)
 *  ADJ_TONE        ElementsPanel 影响明细 (合化 / 冲 / 克 / 刑害 / 破 / 化解)
 *  STRENGTH_LEVEL_COLOR 身强弱级别 → 文字色
 *
 *  后续若想换色, 只改这里, 不再到处搜.
 */
import type { FindingKind } from '@jabberwocky238/bazi-engine'

export const KIND_TONE: Record<FindingKind, string> = {
  天干五合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支六合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支三合: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  地支三会: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  地支暗合: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  天干相冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支相冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支相刑: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  天干相克: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相害: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相破: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  争合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  妒合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  盖头: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  截脚: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  覆载: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  墓库: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400',
}

export const XIYONG_TONE: Record<'用神' | '喜神' | '忌神' | '调候', string> = {
  用神: 'border-amber-500/50 bg-amber-500/10',
  喜神: 'border-emerald-500/40 bg-emerald-500/10',
  忌神: 'border-rose-500/40 bg-rose-500/10',
  调候: 'border-sky-500/40 bg-sky-500/10',
}

import type { GanZhiType } from '@/lib'

export const GANZHI_TONE: Record<GanZhiType, string> = {
  盖头: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  截脚: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  '覆载(同气)': 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  '覆载(得载)': 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  '覆载(得覆)': 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  中性: 'border-slate-300 dark:border-slate-700 text-slate-500',
}

export const ADJ_TONE: Record<'合化' | '冲' | '克' | '刑害' | '破' | '化解', string> = {
  合化: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  克: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  刑害: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  破: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  化解: 'border-slate-300 bg-slate-100/40 text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400 line-through',
}

export const STRENGTH_LEVEL_COLOR: Record<string, string> = {
  身极旺: 'text-rose-700 dark:text-rose-400',
  身旺:   'text-rose-600 dark:text-rose-400',
  身中强: 'text-amber-600 dark:text-amber-400',
  '身中(偏强)': 'text-emerald-600 dark:text-emerald-400',
  '身中(偏弱)': 'text-emerald-600 dark:text-emerald-400',
  身略弱: 'text-sky-600 dark:text-sky-400',
  身弱:   'text-indigo-600 dark:text-indigo-400',
  身极弱: 'text-indigo-700 dark:text-indigo-400',
  近从弱: 'text-purple-700 dark:text-purple-400',
}
