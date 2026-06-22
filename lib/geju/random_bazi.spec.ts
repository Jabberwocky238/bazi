/**
 * 随机八字命中分布 —— `bun test src/lib/geju/random_geju.spec.ts`
 *
 * 生成 N 个合法随机四柱 (阳干配阳支、阴干配阴支)，跑 detectGeju，
 * 统计：
 *  - 每个格局的命中次数 + 命中率 + 在所属类别里的占比（从多到少）
 *  - 每个类别的命中次数 + 占总命中比
 */

import type { BaziInput, Gan, Zhi, Pillar } from '@jabberwocky238/bazi-engine'

const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'] as Gan[]
const YIN_GAN = ['乙', '丁', '己', '辛', '癸'] as Gan[]
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'] as Zhi[]
const YIN_ZHI = ['丑', '卯', '巳', '未', '酉', '亥'] as Zhi[]

function randomPillar(): Pillar {
  const yang = Math.random() < 0.5
  const gans = yang ? YANG_GAN : YIN_GAN
  const zhis = yang ? YANG_ZHI : YIN_ZHI
  return {
    gan: gans[Math.floor(Math.random() * gans.length)],
    zhi: zhis[Math.floor(Math.random() * zhis.length)]
  }
}

export function randomBaziInput(): BaziInput {
  return {
    year: randomPillar(),
    month: randomPillar(),
    day: randomPillar(),
    hour: randomPillar(),
    sex: Math.random() < 0.5 ? 0 : 1
  }
}

console.log('Generating random Bazis and detecting Geju hits...')
console.log(randomBaziInput())