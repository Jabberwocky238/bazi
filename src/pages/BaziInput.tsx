import { Link, useNavigate } from 'react-router-dom'
import { useBazi } from '@/lib'
import { BaziForm } from '@@/BaziForm'
import { GenericLayout } from '@@/GenericLayout'

export default function BaziInput() {
  const navigate = useNavigate()
  const pillars = useBazi((s) => s.pillars)

  const hasValidBazi = pillars && pillars.length === 4 && pillars.every(p => p.gan && p.zhi)

  return (
    <GenericLayout errorBoundaryName="BaziInput" title="八字排盘" link={<Link to="/">← 首页</Link>}>
      <div className="max-w-md mx-auto py-6">
        <BaziForm
          showViewButton={hasValidBazi}
          onViewDetail={() => navigate('/bazi-show')}
        />
      </div>
    </GenericLayout>
  )
}
