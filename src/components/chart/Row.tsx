import type { ReactNode } from 'react'
import { thBase } from '@@/css'

export function Row({
  label,
  children,
  last,
}: {
  label: string
  children: ReactNode
  last?: boolean
}) {
  return (
    <tr>
      <th className={last ? thBase.replace('border-b ', '') : thBase}>{label}</th>
      {children}
    </tr>
  )
}
