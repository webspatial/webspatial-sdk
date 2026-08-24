import { CSSProperties, useMemo, useState } from 'react'

const checkboxOptions = ['Apple', 'Banana', 'Cherry'] as const
const radioOptions = ['Red', 'Green', 'Blue'] as const

export default function EmptyPage() {
  const [buttonState, setButtonState] = useState('idle')
  const [sliderValue, setSliderValue] = useState(0.35)
  const [scrollRatio, setScrollRatio] = useState(0)
  const [spatialDivMounted, setSpatialDivMounted] = useState(false)
  const [radioValue, setRadioValue] =
    useState<(typeof radioOptions)[number]>('Red')
  const [checkedValues, setCheckedValues] = useState<string[]>(['Apple'])

  const checkedSummary = useMemo(
    () => (checkedValues.length > 0 ? checkedValues.join(', ') : 'none'),
    [checkedValues],
  )
  const spatialDivStyle: CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '180px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    background: 'rgba(30, 41, 59, 0.92)',
    color: '#dbeafe',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.45)',
    '--xr-back': 40,
  }

  return (
    <div className="relative min-h-screen bg-[#111827] px-6 py-10 text-gray-200">
      {spatialDivMounted ? (
        <div enable-xr style={spatialDivStyle}>
          <div className="text-sm font-semibold text-white">
            Top-right SpatialDiv
          </div>
          <div className="mt-2 text-xs text-blue-100">
            Mounted for runtime visibility testing.
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-700 bg-[#1f2937] p-6">
        <h1 className="mb-2 text-2xl font-semibold text-white">Empty Page</h1>
        <p className="mb-8 text-sm text-gray-400">
          This page uses standard web controls for host-view testing, and can
          optionally mount a single SpatialDiv in the top-right corner.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-gray-700 bg-[#111827] p-4">
            <h2 className="mb-3 text-lg font-medium text-white">Button</h2>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              onClick={() => setButtonState('clicked')}
            >
              Click me
            </button>
            <p className="mt-3 text-sm text-gray-300">State: {buttonState}</p>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#111827] p-4">
            <h2 className="mb-3 text-lg font-medium text-white">
              SpatialDiv Toggle
            </h2>
            <button
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              onClick={() => setSpatialDivMounted(value => !value)}
            >
              {spatialDivMounted ? 'Unmount SpatialDiv' : 'Mount SpatialDiv'}
            </button>
            <p className="mt-3 text-sm text-gray-300">
              SpatialDiv mounted: {spatialDivMounted ? 'true' : 'false'}
            </p>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#111827] p-4">
            <h2 className="mb-3 text-lg font-medium text-white">
              Range Slider
            </h2>
            <input
              className="w-full"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sliderValue}
              onChange={event => setSliderValue(Number(event.target.value))}
            />
            <p className="mt-3 text-sm text-gray-300">
              Value: {sliderValue.toFixed(2)}
            </p>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#111827] p-4">
            <h2 className="mb-3 text-lg font-medium text-white">Scroll Area</h2>
            <div
              className="h-40 overflow-y-auto rounded border border-gray-600 bg-[#0f172a] p-3"
              onScroll={event => {
                const target = event.currentTarget
                const maxScroll = target.scrollHeight - target.clientHeight
                setScrollRatio(maxScroll > 0 ? target.scrollTop / maxScroll : 0)
              }}
            >
              {Array.from({ length: 16 }, (_, index) => (
                <p key={index} className="mb-2 text-sm text-gray-300">
                  Scroll row {index + 1}
                </p>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-300">
              Scroll ratio: {scrollRatio.toFixed(2)}
            </p>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#111827] p-4">
            <h2 className="mb-3 text-lg font-medium text-white">
              Radio And Checkbox
            </h2>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-200">
                Radio choice
              </p>
              <div className="space-y-2">
                {radioOptions.map(option => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="empty-page-radio"
                      value={option}
                      checked={radioValue === option}
                      onChange={() => setRadioValue(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Selected: {radioValue}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-200">
                Checkbox choice
              </p>
              <div className="space-y-2">
                {checkboxOptions.map(option => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={checkedValues.includes(option)}
                      onChange={event => {
                        setCheckedValues(current =>
                          event.target.checked
                            ? [...current, option]
                            : current.filter(item => item !== option),
                        )
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Checked: {checkedSummary}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
