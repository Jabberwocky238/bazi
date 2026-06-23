import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useBaziInput } from '@@/stores'
import { BaziForm } from '@@/BaziForm'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { useSavedEntries, DEFAULT_STORAGE_KEY, MAIN_PRESETS } from '@@/stores/savedEntries'

export default function BaziInput() {
  const navigate = useNavigate()
  const state = useBaziInput()
  const { init } = useSavedEntries()

  useEffect(() => {
    void init(DEFAULT_STORAGE_KEY, MAIN_PRESETS)
  }, [init])

  return (
    <ErrorBoundary name="BaziInput">
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
    </ErrorBoundary>
  )
}
