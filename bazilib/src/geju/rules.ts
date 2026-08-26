import {
  ShishenC,
  ShishenCC,
  WuXingC,
  pairwiseZhi,
  shishenZhi,
  type Shishen,
  type ShishenCat,
} from '@jabberwocky238/bazi-engine'
import { RuleC, type Ctx } from './types'

/** 魁罡日 —— 四个特定日柱干支。 */
const KUIGANG = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

const SS = ShishenC.map

const ss = (c: Ctx) => c.calc.shishen()

/** 月令本气即该十神，或月令中气/余气藏该十神且透干。 */
const 月令定格 = (十神: Shishen): RuleC =>
  RuleC.from({
    静态: true,
    test: (c) => {
      const hide = shishenZhi(c.calc.dayGan, c.calc.pillars()[1].pillar.zhi).map((s) => s.str)
      if (hide[0] === 十神) return true
      return hide.includes(十神) && ss(c).tou(ShishenC.from(十神))[0]
    },
    why: `月令非${十神}`,
  })

/** 该十神透干。 */
const 透 = (十神: Shishen): RuleC =>
  RuleC.from({ test: (c) => ss(c).tou(ShishenC.from(十神))[0], why: `${十神}透干` })

/** 两十神紧贴 (相邻柱天干)。 */
const 紧贴 = (a: Shishen, b: Shishen): RuleC =>
  RuleC.from({
    test: (c) => ss(c).adjacentTou(ShishenC.from(a), ShishenC.from(b)),
    why: `${a}与${b}紧贴`,
  })

/** 该类别有力 (透或藏)。 */
const 有 = (类别: ShishenCat): RuleC =>
  RuleC.from({ test: (c) => ss(c).strongCat(ShishenCC.from(类别)), why: `无${类别}` })

/** 该十神藏于地支。 */
const 藏 = (十神: Shishen): RuleC =>
  RuleC.from({ test: (c) => ss(c).zang(ShishenC.from(十神))[0], why: `${十神}不藏` })

/** 该类别透干。 */
const 透类 = (类别: ShishenCat): RuleC =>
  RuleC.from({
    test: (c) => ss(c).tou().some((s) => s.cat.str === 类别),
    why: `${类别}不透`,
  })

/** 该类别藏于地支。 */
const 藏类 = (类别: ShishenCat): RuleC =>
  RuleC.from({
    test: (c) => ss(c).zang().some((x) => x.cat.str === 类别),
    why: `${类别}不藏`,
  })

/** 该类别透干且通根 (透 + 同类藏于地支) —— 建禄格的「出口」。 */
const 透而通根 = (类别: ShishenCat): RuleC =>
  透类(类别).and(藏类(类别), `${类别}透而不通根`)

/** 类别计数 (透 + 藏)。 */
const 计数 = (类别: ShishenCat) => (c: Ctx) => ss(c).countCat(ShishenCC.from(类别))

/** 忌神紧贴克目标 → 须有救神。三者俱全才破，否则本条通过。 */
const 忌贴无救 = (忌: Shishen, 目标: Shishen, 救: RuleC, why: string): RuleC =>
  透(忌).and(紧贴(忌, 目标), `${忌}透且紧贴${目标}`).implies(救, why)

const 身可任 = RuleC.from({
  静态: true,
  test: (c) => c.strength.level !== '身极弱' && c.strength.level !== '近从弱',
  why: '日主极弱，不能任官杀',
})

const 身极旺 = RuleC.from({
  静态: true,
  test: (c) => c.strength.level === '身极旺',
  why: '身非极旺',
})

/** 正官格: 不混七杀。 */
const 不混杀 = 透('七杀').not('七杀透干，官杀混杂')

const 让位阳刃 = RuleC.from({
  静态: true,
  test: (c) => c.calc.pillars()[1].pillar.zhi !== c.calc.bazi.renWei(),
  why: '月支为刃位，让位阳刃格',
})

/** 伤官透且紧贴正官 → 须有印救。不同时成立则本条自动通过。 */
const 无伤克官 = 忌贴无救('伤官', '正官', 有('印'), '伤官紧贴克官且无印救')

/** 偏印(枭)透且紧贴食神 → 须有财救。 */
const 无枭夺食 = 忌贴无救('偏印', '食神', 透类('财'), '枭神紧贴夺食且无财救')

/** 伤官格: 伤官见官为祸，正官一律不得透。 */
const 无正官透 = 透('正官').not('正官透干，伤官见官')

/** 伤官格: 不混食神。 */
const 不混食神 = 透('食神').not('食神透干，食伤混杂')

/** 正财格: 比劫紧贴夺财 → 须官杀制。比肩/劫财任一紧贴皆算。 */
const 无比劫夺财 = 忌贴无救('劫财', '正财', 透类('官杀'), '劫财紧贴夺财且无官杀制').and(
  忌贴无救('比肩', '正财', 透类('官杀'), '比肩紧贴夺财且无官杀制'),
  '比劫紧贴夺财且无官杀制',
)

/** 偏财格: 比劫紧贴夺财 → 食伤化 或 官杀制 皆可解。 */
const 无比劫夺偏财 = 忌贴无救(
  '劫财',
  '偏财',
  透类('食伤').or(透类('官杀'), '无食伤化亦无官杀制'),
  '劫财紧贴夺偏财且无食伤化无官杀制',
).and(
  忌贴无救(
    '比肩',
    '偏财',
    透类('食伤').or(透类('官杀'), '无食伤化亦无官杀制'),
    '比肩紧贴夺偏财且无食伤化无官杀制',
  ),
  '比劫紧贴夺偏财且无食伤化无官杀制',
)

/** 正印格: 身极旺 → 须有财透或食伤透泄, 否则闷气机。 */
const 身印不失衡 = 身极旺.implies(
  透类('财').or(透类('食伤'), '无财亦无食伤透'),
  '身极旺而无财无食伤，闷气机',
)

/** 财紧贴破正印 → 须比劫救。正财/偏财任一皆算。 */
const 无财破印 = 忌贴无救('正财', '正印', 透类('比劫'), '正财紧贴破印且无比劫救').and(
  忌贴无救('偏财', '正印', 透类('比劫'), '偏财紧贴破印且无比劫救'),
  '财紧贴破印且无比劫救',
)

/** 偏印格: 偏印总量 (透+藏) 不过 2。 */
const 偏印不过重 = RuleC.from({
  test: (c) => ss(c).count(SS.偏印) <= 2,
  why: '偏印过重 (透藏合计 > 2)',
})

/** 偏印格: 日主非身极旺。 */
const 身非极旺 = 身极旺.not('身极旺')

/** 七杀格: 必有制 (食神透或藏) 或化 (印透或藏)。 */
const 有制或化 = 有('食伤').or(有('印'), '无食神制亦无印化')

/**
 * 偏财格: 身弱要求较正财宽松 —— 仅当「身极弱/近从弱」且比劫计数 + 印计数 = 0 时才否决。
 */
const 偏财身弱宽松 = 身可任.or(
  RuleC.from({
    test: (c) => 计数('比劫')(c) + 计数('印')(c) > 0,
    why: '身极弱且比劫与印计数俱为 0',
  }),
  '身极弱且无比劫无印',
)

// ——— 建禄格 ———

/** 月支为日主禄位 (十二长生「临官」)。 */
const 月令为禄 = RuleC.from({
  静态: true,
  test: (c) => c.calc.bazi.isLu(c.calc.pillars()[1].pillar.zhi),
  why: '月支非日主禄位',
})

/** 月令不被四柱其余地支六冲。 */
const 月令不被冲 = RuleC.from({
  test: (c) => {
    const 月 = c.calc.pillars()[1].pillar.zhi
    return !c.calc
      .pillars()
      .some((p, i) => i !== 1 && pairwiseZhi(p.pillar.zhi.str, 月.str)?.kind === '相冲')
  },
  why: '月令被六冲',
})

/** 有出口: 官杀 / 财 / 食伤 三者之一透干且通根。 */
const 有出口 = 透而通根('官杀')
  .or(透而通根('财'), '官杀与财皆未透而通根')
  .or(透而通根('食伤'), '官杀/财/食伤皆未透而通根')

/** 身不过旺: 比劫计数 + 印计数 < 6。 */
const 身不过旺 = RuleC.from({
  test: (c) => 计数('比劫')(c) + 计数('印')(c) < 6,
  why: '比劫加印计数 ≥ 6，身过旺',
})

// ——— 阳刃格 ———

/** 月支为日主刃位 (十二长生「帝旺」)。 */
const 月令为刃 = RuleC.from({
  静态: true,
  test: (c) => c.calc.bazi.isRen(c.calc.pillars()[1].pillar.zhi),
  why: '月支非日主刃位',
})

/** 必有官杀制刃 (官杀透干)。 */
const 有官杀制刃 = 透类('官杀')

/** 不得破格: 正官透 + 七杀不透 + 伤官透 + 无印透 → 破。 */
const 刃格不破 = 透('正官')
  .and(透('七杀').not('七杀透干'), '正官透而七杀不透')
  .and(透('伤官'), '正官透、七杀不透、伤官透')
  .implies(透类('印'), '官透无杀而伤官夺，且无印救')

// ——— 魁罡格 ———

/** 日柱为魁罡日: 庚辰 / 庚戌 / 壬辰 / 戊戌。 */
const 魁罡日 = RuleC.from({
  静态: true,
  test: (c) => {
    const d = c.calc.pillars()[2].pillar
    return KUIGANG.has(`${d.gan.str}${d.zhi.str}`)
  },
  why: '日柱非魁罡日 (庚辰/庚戌/壬辰/戊戌)',
})

/** 身旺 (量化总分 ≥ 30)。 */
const 身旺 = RuleC.from({
  静态: true,
  test: (c) => c.strength.shenWang,
  why: '身不旺',
})

/** 无忌神五行透干: 庚辰/庚戌/壬辰 忌火透, 戊戌 忌水透。 */
const 魁罡无忌透 = RuleC.from({
  test: (c) => {
    const d = c.calc.pillars()[2].pillar
    const 忌 = `${d.gan.str}${d.zhi.str}` === '戊戌' ? WuXingC.map.水 : WuXingC.map.火
    return !c.calc.touWx(忌)[0]
  },
  why: '忌神五行透干 (庚辰/庚戌/壬辰忌火, 戊戌忌水)',
})

/** 日支不被辰戌冲: 日支为辰则余柱不见戌, 为戌则不见辰。 */
const 魁罡日支不冲 = RuleC.from({
  test: (c) => {
    const 日支 = c.calc.pillars()[2].pillar.zhi.str
    const 冲 = 日支 === '辰' ? '戌' : 日支 === '戌' ? '辰' : null
    if (!冲) return true
    return !c.calc.pillars().some((p, i) => i !== 2 && p.pillar.zhi.str === 冲)
  },
  why: '日支被辰戌相冲',
})

const 月令正官 = 月令定格('正官')
const 月令七杀 = 月令定格('七杀')
const 月令食神 = 月令定格('食神')
const 月令伤官 = 月令定格('伤官')
const 月令正财 = 月令定格('正财')
const 月令偏财 = 月令定格('偏财')
const 月令正印 = 月令定格('正印')
const 月令偏印 = 月令定格('偏印')

export const RULES = {
  身可任,
  身极旺,
  不混杀,
  让位阳刃,
  无伤克官,
  无枭夺食,
  无正官透,
  不混食神,
  无比劫夺财,
  无比劫夺偏财,
  身印不失衡,
  无财破印,
  偏印不过重,
  身非极旺,
  有制或化,
  偏财身弱宽松,
  月令为禄,
  月令不被冲,
  有出口,
  身不过旺,
  月令为刃,
  有官杀制刃,
  刃格不破,
  魁罡日,
  身旺,
  魁罡无忌透,
  魁罡日支不冲,
  月令正官,
  月令七杀,
  月令食神,
  月令伤官,
  月令正财,
  月令偏财,
  月令正印,
  月令偏印,
} as const satisfies Record<string, RuleC>

export type RuleId = keyof typeof RULES
