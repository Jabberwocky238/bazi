/**
 * 随机八字命中分布 —— `bun test src/lib/geju/random_geju.spec.ts`
 *
 * 生成 N 个合法随机四柱 (阳干配阳支、阴干配阴支)，跑 detectGeju，
 * 统计：
 *  - 每个格局的命中次数 + 命中率 + 在所属类别里的占比（从多到少）
 *  - 每个类别的命中次数 + 占总命中比
 */
type Bazi = [string, string, string, string]

const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'] as const
const YIN_GAN = ['乙', '丁', '己', '辛', '癸'] as const
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'] as const
const YIN_ZHI = ['丑', '卯', '巳', '未', '酉', '亥'] as const

function randomPillar(): string {
  const yang = Math.random() < 0.5
  const gans = yang ? YANG_GAN : YIN_GAN
  const zhis = yang ? YANG_ZHI : YIN_ZHI
  return gans[Math.floor(Math.random() * gans.length)] + zhis[Math.floor(Math.random() * zhis.length)]
}

function randomBazi(): Bazi {
  return [randomPillar(), randomPillar(), randomPillar(), randomPillar()]
}

console.log('Generating random Bazis and detecting Geju hits...')
console.log(randomBazi())