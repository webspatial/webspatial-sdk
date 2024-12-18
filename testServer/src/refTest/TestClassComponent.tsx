import { useState, useRef, useEffect } from 'react'

export function TestClassComponent() {
  const [selectedOption, setSelectedOption] = useState('text-green-500')
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value)
  }

  const selectedOptionMap = {
    'text-yellow-500': 'text-yellow-500 translate-x-8',
    'text-green-500': 'text-green-500 translate-x-1 rotate-12',
  }

  const ref = useRef<HTMLDivElement>(null)

  const className = 'w-6/12 bg-red-200/30 h-10'
  useEffect(() => {
    if (ref.current) {
      ref.current.className =
        className + ' ' + selectedOptionMap[selectedOption]
    }
  }, [selectedOption])

  const style: React.CSSProperties = {
    '--xr-background-material': 'none',
    '--xr-back': '100px',
  }

  return (
    <div className="bg-slate-500 m-6	w-8/12">
      <div enable-xr ref={ref} style={style} className={className}>
        This is Spatial Div For ref.current.class Test
      </div>

      <div className="m-6 w-3/12">
        Please select a className:
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text text-yellow-500">Yellow Color</span>
            <input
              type="radio"
              name="radio-10"
              value="text-yellow-500"
              className="radio checked:bg-yellow-500"
              checked={selectedOption === 'text-yellow-500'}
              onChange={handleOptionChange}
            />
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text text-green-500">Green Color</span>
            <input
              type="radio"
              name="radio-10"
              value="text-green-500"
              className="radio checked:bg-green-500"
              checked={selectedOption === 'text-green-500'}
              onChange={handleOptionChange}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
