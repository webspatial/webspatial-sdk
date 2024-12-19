import { useState, useRef, useEffect, useCallback } from 'react'

export function TestNestedClassComponent() {
  const [selectedOption, setSelectedOption] = useState('text-yellow-500')
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value)
  }

  const selectedOptionMap = {
    'text-yellow-500': 'text-yellow-500 translate-x-8',
    'text-green-500': 'text-green-500 translate-x-1 rotate-12',
  }

  const ref = useRef<HTMLDivElement>(null)
  const onRefOuter = useCallback((node: HTMLDivElement) => {
    if (node) {
      ;(window as any).ref = node

      ref.current = node
    }
  }, [])

  const className = 'w-10/12 bg-red-200/30 h-10'
  // const testClass = 'text-lg'
  const testClass = 'translate-y-8'
  useEffect(() => {
    if (refInner.current) {
      refInner.current.className =
        className + ' ' + selectedOptionMap[selectedOption]
    }
  }, [selectedOption])

  const onAddClass = () => {
    if (ref.current) {
      refInner.current.classList.add(testClass)
    }
  }

  const onRemoveClass = () => {
    if (ref.current) {
      refInner.current.classList.remove(testClass)
    }
  }

  const onReplaceClass = () => {
    if (ref.current) {
      refInner.current.classList.replace(testClass, 'translate-x-8')
    }
  }

  const onToggleClass = () => {
    if (ref.current) {
      refInner.current.classList.toggle(testClass)
    }
  }

  const style: React.CSSProperties = {
    '--xr-background-material': 'none',
    '--xr-back': '100px',
  }

  const refInner = useRef<HTMLDivElement>(null)

  const onRefInner = useCallback((node: HTMLDivElement) => {
    if (node) {
      ;(window as any).refInner = node

      refInner.current = node
    }
  }, [])

  return (
    <div className="bg-slate-500 m-6	w-8/12">
      <div enable-xr ref={onRefOuter} style={style} className={className}>
        This is outer Spatial Div For ref.current.class Test
        <div enable-xr ref={onRefInner} style={style} className={className}>
          This is inner Spatial Div For ref.current.class Test
        </div>
      </div>

      <div className="m-6 w-6/12">
        Please select a className:
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text text-yellow-500">Yellow Color</span>
            <input
              type="radio"
              name="nested-class-radio"
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
              name="nested-class-radio"
              value="text-green-500"
              className="radio checked:bg-green-500"
              checked={selectedOption === 'text-green-500'}
              onChange={handleOptionChange}
            />
          </label>
        </div>
        <span>Test classList:</span>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={onAddClass}>
            add class
          </button>
          <button className="btn btn-primary" onClick={onRemoveClass}>
            remove class
          </button>
          <button className="btn btn-primary" onClick={onReplaceClass}>
            replace class
          </button>
          <button className="btn btn-primary" onClick={onToggleClass}>
            toggle class
          </button>
        </div>
      </div>
    </div>
  )
}
