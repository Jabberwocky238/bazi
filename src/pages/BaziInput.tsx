import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useBaziInput } from '@@/stores'
import { BaziForm } from '@@/BaziForm'
import { GenericLayout } from '@@/GenericLayout'
import { useSavedEntries, DEFAULT_STORAGE_KEY, MAIN_PRESETS } from '@@/stores/savedEntries'

export default function BaziInput() {
  const navigate = useNavigate()
  const state = useBaziInput()
  const { init } = useSavedEntries()

  useEffect(() => {
    init(DEFAULT_STORAGE_KEY, MAIN_PRESETS)
  }, [init])

  return (
    <GenericLayout errorBoundaryName="BaziInput" title="八字排盘" link={<Link to="/">← 首页</Link>}>
      <div className="py-6 space-y-4">
        <BaziForm
          state={state}
          onChange={(next) => useBaziInput.setState(next)}
          onClickExec={() => {
            useBaziInput.getState().syncToUrl()
            navigate('/bazi-show')
          }}
        />
      </div>
    </GenericLayout>
  )
}
