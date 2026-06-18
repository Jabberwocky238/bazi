import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useBazi, useBaziInput } from '@@/stores'
import { BaziForm } from '@@/BaziForm'
import { CommonButton } from '@@/CommonButton'
import { GenericLayout } from '@@/GenericLayout'
import { useSavedEntries, DEFAULT_STORAGE_KEY, MAIN_PRESETS } from '@@/stores/savedEntries'

export default function BaziInput() {
  const pillars = useBazi((s) => s.pillars)
  const state = useBaziInput()
  const { init } = useSavedEntries()

  useEffect(() => {
    init(DEFAULT_STORAGE_KEY, MAIN_PRESETS)
  }, [init])

  const hasValidBazi = pillars && pillars.length === 4 && pillars.every(p => p.gan && p.zhi)

  return (
    <GenericLayout errorBoundaryName="BaziInput" title="八字排盘" link={<Link to="/">← 首页</Link>}>
      <div className="max-w-md mx-auto py-6 space-y-4">
        <BaziForm
          state={state}
          onChange={(next) => useBaziInput.setState(next)}
          onClickExec={() => {
            useBaziInput.getState().syncToUrl()
          }}
        />

        {hasValidBazi && (
          <Link to="/bazi-show" className="contents">
            <CommonButton variant="primary" width="w-full">查看详情</CommonButton>
          </Link>
        )}
      </div>
    </GenericLayout>
  )
}
