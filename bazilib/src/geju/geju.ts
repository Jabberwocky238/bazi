import type { RuleId } from './rules'
import { GejuC } from './types'

const 建禄格 = GejuC.from<RuleId>({
  name: '建禄格',
  category: '正格',
  rules: ['月令为禄', '月令不被冲', '有出口', '身不过旺'],
})

const 阳刃格 = GejuC.from<RuleId>({
  name: '阳刃格',
  category: '正格',
  rules: ['月令为刃', '有官杀制刃', '刃格不破'],
})

const 正官格 = GejuC.from<RuleId>({
  name: '正官格',
  category: '正格',
  rules: ['月令正官', '让位阳刃', '身可任', '不混杀', '无伤克官'],
})

const 七杀格 = GejuC.from<RuleId>({
  name: '七杀格',
  category: '正格',
  rules: ['月令七杀', '让位阳刃', '身可任', '无正官透', '有制或化'],
})

const 食神格 = GejuC.from<RuleId>({
  name: '食神格',
  category: '正格',
  rules: ['月令食神', '让位阳刃', '身可任', '无枭夺食'],
})

const 伤官格 = GejuC.from<RuleId>({
  name: '伤官格',
  category: '正格',
  rules: ['月令伤官', '让位阳刃', '身可任', '无正官透', '不混食神'],
})

const 正财格 = GejuC.from<RuleId>({
  name: '正财格',
  category: '正格',
  rules: ['月令正财', '让位阳刃', '身可任', '无比劫夺财'],
})

const 偏财格 = GejuC.from<RuleId>({
  name: '偏财格',
  category: '正格',
  rules: ['月令偏财', '让位阳刃', '偏财身弱宽松', '无比劫夺偏财'],
})

const 正印格 = GejuC.from<RuleId>({
  name: '正印格',
  category: '正格',
  rules: ['月令正印', '让位阳刃', '身印不失衡', '无财破印'],
})

const 偏印格 = GejuC.from<RuleId>({
  name: '偏印格',
  category: '正格',
  rules: ['月令偏印', '让位阳刃', '身非极旺', '偏印不过重', '无枭夺食'],
})

const 魁罡格 = GejuC.from<RuleId>({
  name: '魁罡格',
  category: '正格',
  rules: ['魁罡日', '身旺', '魁罡无忌透', '魁罡日支不冲'],
})

export const GEJU = {
  建禄格,
  阳刃格,
  正官格,
  七杀格,
  食神格,
  伤官格,
  正财格,
  偏财格,
  正印格,
  偏印格,
  魁罡格,
} as const satisfies Record<string, GejuC<RuleId>>

export type GejuName = keyof typeof GEJU
