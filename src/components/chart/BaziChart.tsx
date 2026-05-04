import type { Pillar } from '@/lib'
import { cellBase } from '@@/css'
import { Row } from './Row'
import { ShishenCell } from './ShishenCell'
import { GanZhiCell } from './GanZhiCell'
import { CangGanCell } from './CangGanCell'
import { ShenshaCell } from './ShenshaCell'
import { SkillLink } from '@@/SkillLink'

export function BaziChart({ pillars }: { pillars: Pillar[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden">
      <table className="w-full text-center table-fixed">
        <thead>
          <tr className="bg-slate-50/70 dark:bg-slate-950/40">
            <th className="w-12 md:w-20"></th>
            {pillars.map((p) => (
              <th
                key={p.label}
                className="py-2 md:py-3 text-[11px] md:text-xs font-medium tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="十神">
            {pillars.map((p) => (
              <ShishenCell key={p.label} shishen={p.shishen} wuxing={p.shishenWuxing} />
            ))}
          </Row>
          <Row label="干支">
            {pillars.map((p) => (
              <GanZhiCell
                key={p.label}
                gan={p.gan}
                zhi={p.zhi}
                ganWuxing={p.ganWuxing}
                zhiWuxing={p.zhiWuxing}
              />
            ))}
          </Row>
          <Row label="藏干">
            {pillars.map((p) => (
              <CangGanCell
                key={p.label}
                gans={p.hideGans}
                shishens={p.hideShishen}
                shishenWuxings={p.hideShishenWuxings}
              />
            ))}
          </Row>
          <Row label="纳音">
            {pillars.map((p) => <td key={p.label} className={cellBase}>{p.nayin}</td>)}
          </Row>
          <Row label="自坐">
            {pillars.map((p) => (
              <td key={p.label} className={cellBase}>
                {p.zizuo ? (
                  <SkillLink category="zizuo" name={p.zizuo}>{p.zizuo}</SkillLink>
                ) : (
                  <span className="text-slate-300 dark:text-slate-700">—</span>
                )}
              </td>
            ))}
          </Row>
          <Row label="神煞" last>
            {pillars.map((p) => <ShenshaCell key={p.label} items={p.shensha} />)}
          </Row>
        </tbody>
      </table>
    </div>
  )
}
