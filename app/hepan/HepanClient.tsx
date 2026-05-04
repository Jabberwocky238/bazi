'use client'

import dynamic from 'next/dynamic'

const HepanApp = dynamic(() => import('@/hepan/HepanApp'), { ssr: false })

export default function HepanClient() {
  return <HepanApp />
}
