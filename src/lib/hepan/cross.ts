/**
 * 合盘 - 跨盘 干支互动 (合 / 冲 / 刑 / 害 / 破 / 克) — 手写 pair 检测.
 *
 *  注意: engine.analyzeGanZhi(self, extras) 只在 self 内部找合冲刑害, extras 仅作
 *   "破合 / 冲开 / 化解" 的 mod, **不输出 self↔extras 的 finding**. 因此合盘需要自写.
 *
 *  本文件穷举所有 (aPillar, bPillar) 对, 按表查 11 类关系, 直接构造 AnyFinding.
 *  同时识别跨盘 三合 / 三会 (≥ 1 字来自 self, ≥ 1 字来自 other).
 */
import type { Gan, Zhi } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'

export type FindingKind =
  | '天干五合' | '天干相冲' | '天干相克'
  | '地支六合' | '地支三合' | '地支三会' | '地支暗合'
  | '地支相冲' | '地支相刑' | '地支相害' | '地支相破'

export interface AnyFinding {
  kind: FindingKind
  name: string
  positions: string
  state: string
  note: string
  quality: 'good' | 'bad' | 'neutral'
}

export interface CrossFindings {
  he: AnyFinding[]
  chong: AnyFinding[]
  xinghaipo: AnyFinding[]
  ke: AnyFinding[]
  total: number
}

export type PillarPos = '年' | '月' | '日' | '时'
export interface ByPillarCross {
  年: CrossFindings
  月: CrossFindings
  日: CrossFindings
  时: CrossFindings
}

const POS_LIST: PillarPos[] = ['年', '月', '日', '时']

function emptyCross(): CrossFindings {
  return { he: [], chong: [], xinghaipo: [], ke: [], total: 0 }
}

// ————————————————————————————————————————————————————————
// 关系表
// ————————————————————————————————————————————————————————

const WUHE: [Gan, Gan, string][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
]
const GAN_CHONG: [Gan, Gan][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
]
// 阳克阳 / 阴克阴 (异性互动多走五合, 不在此)
const GAN_KE: [Gan, Gan][] = [
  ['甲', '戊'], ['乙', '己'], ['丙', '庚'], ['丁', '辛'],
  ['戊', '壬'], ['己', '癸'], ['庚', '甲'], ['辛', '乙'],
  ['壬', '丙'], ['癸', '丁'],
]

const LIUHE: [Zhi, Zhi, string][] = [
  ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'],
  ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', '日月'],
]

const ZHI_CHONG: [Zhi, Zhi][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const ZHI_HAI: [Zhi, Zhi][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

const ZHI_PO: [Zhi, Zhi][] = [
  ['子', '酉'], ['卯', '午'], ['丑', '辰'], ['未', '戌'], ['寅', '亥'], ['巳', '申'],
]

// 暗合 (地支藏干互合)
const ZHI_AN_HE: [Zhi, Zhi][] = [
  ['寅', '丑'], ['午', '亥'], ['卯', '申'], ['子', '辰'], ['酉', '寅'], ['戌', '卯'],
]

// 地支相刑: 寅巳申 三刑两两对 + 丑戌未 三刑两两对 + 子卯刑 + 自刑(辰午酉亥)
const ZHI_XING: [Zhi, Zhi][] = [
  ['寅', '巳'], ['巳', '申'], ['寅', '申'],
  ['丑', '戌'], ['戌', '未'], ['丑', '未'],
  ['子', '卯'],
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'],
]

const SAN_HE: [Zhi, Zhi, Zhi, string][] = [
  ['亥', '卯', '未', '木'], ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'], ['申', '子', '辰', '水'],
]

const SAN_HUI: [Zhi, Zhi, Zhi, string][] = [
  ['寅', '卯', '辰', '木'], ['巳', '午', '未', '火'],
  ['申', '酉', '戌', '金'], ['亥', '子', '丑', '水'],
]

// ————————————————————————————————————————————————————————
// pair 检测
// ————————————————————————————————————————————————————————

function inPair<T>(t: [T, T], a: T, b: T): boolean {
  return (t[0] === a && t[1] === b) || (t[0] === b && t[1] === a)
}

interface PairCtx {
  aPos: PillarPos; bPos: PillarPos
  aName: string; bName: string
  aGan: Gan; bGan: Gan
  aZhi: Zhi; bZhi: Zhi
}

function detectPairFindings(ctx: PairCtx): AnyFinding[] {
  const out: AnyFinding[] = []
  const pos = `${ctx.aName}-${ctx.aPos}柱 ↔ ${ctx.bName}-${ctx.bPos}柱`

  // —— 天干 ——
  let aGanWuhe = false
  for (const [g1, g2, hua] of WUHE) {
    if (inPair([g1, g2], ctx.aGan, ctx.bGan)) {
      aGanWuhe = true
      out.push({
        kind: '天干五合',
        name: `${ctx.aGan}${ctx.bGan} 五合 (化${hua})`,
        positions: pos, state: `合化${hua}`,
        note: '天干五合, 牵绊感深, 化神是否成立看月令', quality: 'neutral',
      })
    }
  }
  let aGanChong = false
  for (const [g1, g2] of GAN_CHONG) {
    if (inPair([g1, g2], ctx.aGan, ctx.bGan)) {
      aGanChong = true
      out.push({
        kind: '天干相冲',
        name: `${ctx.aGan}${ctx.bGan} 相冲`,
        positions: pos, state: '相冲',
        note: '天干相冲, 直接对抗', quality: 'bad',
      })
    }
  }
  if (!aGanWuhe && !aGanChong) {
    for (const [g1, g2] of GAN_KE) {
      if (g1 === ctx.aGan && g2 === ctx.bGan || g1 === ctx.bGan && g2 === ctx.aGan) {
        out.push({
          kind: '天干相克',
          name: `${ctx.aGan}${ctx.bGan} 相克`,
          positions: pos, state: '相克',
          note: '天干相克, 单向压制', quality: 'bad',
        })
        break
      }
    }
  }

  // —— 地支 ——
  for (const [z1, z2, hua] of LIUHE) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支六合',
        name: `${ctx.aZhi}${ctx.bZhi} 六合 (化${hua})`,
        positions: pos, state: `合化${hua}`,
        note: '地支六合, 互相牵绊', quality: 'good',
      })
    }
  }
  for (const [z1, z2] of ZHI_CHONG) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支相冲',
        name: `${ctx.aZhi}${ctx.bZhi} 相冲`,
        positions: pos, state: '相冲',
        note: '地支六冲, 摩擦明显', quality: 'bad',
      })
    }
  }
  for (const [z1, z2] of ZHI_XING) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支相刑',
        name: `${ctx.aZhi}${ctx.bZhi} ${ctx.aZhi === ctx.bZhi ? '自刑' : '相刑'}`,
        positions: pos, state: ctx.aZhi === ctx.bZhi ? '自刑' : '相刑',
        note: '地支相刑, 暗中刑伤', quality: 'bad',
      })
    }
  }
  for (const [z1, z2] of ZHI_HAI) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支相害',
        name: `${ctx.aZhi}${ctx.bZhi} 相害`,
        positions: pos, state: '相害',
        note: '地支六害, 暗耗 / 是非', quality: 'bad',
      })
    }
  }
  for (const [z1, z2] of ZHI_PO) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支相破',
        name: `${ctx.aZhi}${ctx.bZhi} 相破`,
        positions: pos, state: '相破',
        note: '地支六破, 关系破缺', quality: 'bad',
      })
    }
  }
  for (const [z1, z2] of ZHI_AN_HE) {
    if (inPair([z1, z2], ctx.aZhi, ctx.bZhi)) {
      out.push({
        kind: '地支暗合',
        name: `${ctx.aZhi}${ctx.bZhi} 暗合`,
        positions: pos, state: '暗合',
        note: '地支藏干互合, 暗中牵动', quality: 'neutral',
      })
    }
  }

  return out
}

// 三合 / 三会 — 跨盘需要 self ≥ 1 字 + other ≥ 1 字
function detectTripleFindings(
  self: Pillar[], selfName: string,
  other: Pillar[], otherName: string,
): AnyFinding[] {
  const out: AnyFinding[] = []
  const allZhis = [
    ...self.map((p, i) => ({ zhi: p.zhi as Zhi, label: `${selfName}-${POS_LIST[i]}柱` })),
    ...other.map((p, i) => ({ zhi: p.zhi as Zhi, label: `${otherName}-${POS_LIST[i]}柱` })),
  ]
  const checkTriple = (
    table: [Zhi, Zhi, Zhi, string][],
    kind: '地支三合' | '地支三会',
  ) => {
    for (const [a, b, c, hua] of table) {
      const sA = allZhis.filter((s) => s.zhi === a)
      const sB = allZhis.filter((s) => s.zhi === b)
      const sC = allZhis.filter((s) => s.zhi === c)
      if (sA.length === 0 || sB.length === 0 || sC.length === 0) continue
      const x = sA[0], y = sB[0], z = sC[0]
      const labels = [x.label, y.label, z.label]
      const hasSelf = labels.some((l) => l.startsWith(`${selfName}-`))
      const hasOther = labels.some((l) => l.startsWith(`${otherName}-`))
      if (!hasSelf || !hasOther) continue
      out.push({
        kind, name: `${a}${b}${c} ${kind === '地支三合' ? '三合' : '三会'}${hua}`,
        positions: labels.join(' ↔ '),
        state: kind === '地支三合' ? `三合${hua}局` : `三会${hua}方`,
        note: kind === '地支三合' ? '跨盘三合局, 同声相应' : '跨盘三会方, 一气联结',
        quality: 'good',
      })
    }
  }
  checkTriple(SAN_HE, '地支三合')
  checkTriple(SAN_HUI, '地支三会')
  return out
}

// ————————————————————————————————————————————————————————
// 入口
// ————————————————————————————————————————————————————————

function classify(f: AnyFinding): 'he' | 'chong' | 'xinghaipo' | 'ke' {
  switch (f.kind) {
    case '天干五合':
    case '地支六合':
    case '地支三合':
    case '地支三会':
      return 'he'
    case '天干相冲':
    case '地支相冲':
      return 'chong'
    case '地支相刑':
    case '地支相害':
    case '地支相破':
    case '地支暗合':
      return 'xinghaipo'
    case '天干相克':
      return 'ke'
  }
}

/**
 * 单向跨盘 (self ← other 影响). 4×4 pair + 跨盘 三合/三会.
 * @param selfName  self 端的称呼 (默认 "本人"); 用于 positions 标签.
 */
export function analyzeHepanCross(
  self: Pillar[], other: Pillar[], otherName: string,
  selfName: string = '本人',
): { all: CrossFindings; byPillar: ByPillarCross } | null {
  if (self.length !== 4 || other.length !== 4) return null
  const all: CrossFindings = emptyCross()
  const byPillar: ByPillarCross = {
    年: emptyCross(), 月: emptyCross(), 日: emptyCross(), 时: emptyCross(),
  }

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const findings = detectPairFindings({
        aPos: POS_LIST[i], bPos: POS_LIST[j],
        aName: selfName, bName: otherName,
        aGan: self[i].gan as Gan, bGan: other[j].gan as Gan,
        aZhi: self[i].zhi as Zhi, bZhi: other[j].zhi as Zhi,
      })
      for (const f of findings) {
        const group = classify(f)
        all[group].push(f)
        byPillar[POS_LIST[i]][group].push(f)
      }
    }
  }

  for (const f of detectTripleFindings(self, selfName, other, otherName)) {
    all.he.push(f)
    const selfSegs = f.positions.split(/ ↔ /).filter((s) => s.startsWith(`${selfName}-`))
    for (const seg of selfSegs) {
      const m = seg.match(new RegExp(`${selfName}-(.)柱`))
      if (m && (POS_LIST as string[]).includes(m[1])) {
        byPillar[m[1] as PillarPos].he.push(f)
      }
    }
  }

  all.total = all.he.length + all.chong.length + all.xinghaipo.length + all.ke.length
  for (const pos of POS_LIST) {
    const c = byPillar[pos]
    c.total = c.he.length + c.chong.length + c.xinghaipo.length + c.ke.length
  }
  return { all, byPillar }
}

export interface BidirectionalCross {
  aFromB: { all: CrossFindings; byPillar: ByPillarCross }
  bFromA: { all: CrossFindings; byPillar: ByPillarCross }
}

export function analyzeHepanCrossBoth(
  a: Pillar[], aName: string,
  b: Pillar[], bName: string,
): BidirectionalCross | null {
  const aFromB = analyzeHepanCross(a, b, bName, aName)
  const bFromA = analyzeHepanCross(b, a, aName, bName)
  if (!aFromB || !bFromA) return null
  return { aFromB, bFromA }
}
