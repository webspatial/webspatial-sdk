import ReactDOM from 'react-dom/client'
import { PopoverContent, PopoverRoot, PopoverTrigger } from './popover'
import { DialogProvider } from './Dialog'

function Card() {
  const onClick = (evt: React.MouseEvent<HTMLDivElement>) => {
    evt.stopPropagation()
  }
  return (
    <div enable-xr className="m-[24px]">
      <div> nested div </div>

      <PopoverRoot>
        <PopoverTrigger>
          <button> open modal dialog </button>
        </PopoverTrigger>

        <PopoverContent>
          <div onClick={onClick}> dialog div </div>
        </PopoverContent>
      </PopoverRoot>

      <div className="mt-[0px]">other block content</div>
    </div>
  )
}

function App() {
  return (
    <DialogProvider>
      <Card />
      <Card />
      <Card />
      <Card />
    </DialogProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
