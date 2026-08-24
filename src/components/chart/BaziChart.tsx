import type { DetailedPillar, PillarShishenView, ShishenC } from '@LIB'
import { cellBase } from '@@/css'
import { Row } from './Row'
import { ShishenCell } from './ShishenCell'
import { GanZhiCell } from './GanZhiCell'
import { CangGanCell } from './CangGanCell'
import { ShenshaCell } from './ShenshaCell'
import { SkillLink } from '@@/SkillLink'
import { shishenWuxing } from '@LIB'

export function BaziChart({
  pillars,
  shishen,
}: {
  pillars: DetailedPillar[]
  shishen: PillarShishenView[]
}) {
  const dayGan = pillars[2]?.pillar.gan ?? null
  /** 十神 → 五行 (依日主); 无日主或无十神时回空串, 交给 WUXING_TEXT 兜底。 */
  const ssWx = (ss: ShishenC | null | undefined): string =>
    ss && dayGan ? (shishenWuxing(dayGan, ss)?.str ?? '') : ''
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden">
      <table className="w-full text-center table-fixed">
        <thead>
          <tr className="bg-slate-50/70 dark:bg-slate-950/40">
            <th className="w-12 md:w-20"></th>
            {pillars.map((p) => (
              <th
                key={p.pillar.pillarType}
                className="py-2 md:py-3 text-[11px] md:text-xs font-medium tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
              >
                {p.pillar.pillarType}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="十神">
            {pillars.map((p, i) => {
              const ss = shishen[i]?.gan
              return (
                <ShishenCell
                  key={p.pillar.pillarType}
                  shishen={p.isRizhu ? '日主' : (ss?.str ?? '')}
                  wuxing={ssWx(ss)}
                />
              )
            })}
          </Row>
          <Row label="干支">
            {pillars.map((p) => (
              <GanZhiCell
                key={p.pillar.pillarType}
                gan={p.pillar.gan.str}
                zhi={p.pillar.zhi.str}
                ganWuxing={p.pillar.gan.wuxing.str}
                zhiWuxing={p.pillar.zhi.wuxing.str}
              />
            ))}
          </Row>
          <Row label="藏干">
            {pillars.map((p, i) => {
              const zhiShishen = shishen[i]?.zhi ?? []
              return (
                <CangGanCell
                  key={p.pillar.pillarType}
                  gans={p.pillar.zhi.canggan().map((g) => g.str)}
                  shishens={zhiShishen.map((ss) => ss.str)}
                  shishenWuxings={zhiShishen.map((ss) => ssWx(ss))}
                />
              )
            })}
          </Row>
          <Row label="纳音">
            {pillars.map((p) => <td key={p.pillar.pillarType} className={cellBase}>{p.pillar.nayinName()}</td>)}
          </Row>
          <Row label="自坐">
            {pillars.map((p) => (
              <td key={p.pillar.pillarType} className={cellBase}>
                {p.changsheng ? (
                  <SkillLink category="zizuo" name={p.changsheng}>{p.changsheng}</SkillLink>
                ) : (
                  <span className="text-slate-300 dark:text-slate-700">—</span>
                )}
              </td>
            ))}
          </Row>
          <Row label="神煞" last>
            {pillars.map((p) => <ShenshaCell key={p.pillar.pillarType} items={p.shensha} />)}
          </Row>
        </tbody>
      </table>
    </div>
  )
}
