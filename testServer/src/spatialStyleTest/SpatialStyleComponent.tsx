// @ts-nocheck
export const SpatialStyleComponent = () => {
  const divCls = 'text-amber-600	'
  const spaceCls = divCls + 'bg-zinc-400'

  const style = {
    color: 'red',
  }
  const styleSpatial = {
    color: 'red',
    back: 50,
  }

  return (
    <>
      <div className="flex flex-row pt-5 gap-2">
        <div
          className={divCls}
          style={{
            color: 'red',
          }}
        >
          {' '}
          this is inline style div{' '}
        </div>
        <div
          style={{
            color: 'red',
            back: 50,
          }}
          className={spaceCls}
        >
          {' '}
          [Inline style can work!] this is spatial inline style div{' '}
        </div>
      </div>

      <div className="flex flex-row pt-5 gap-2">
        <div className={divCls} style={style}>
          {' '}
          this is partial inline div{' '}
        </div>
        <div className={spaceCls} style={{ ...style, back: 50 }}>
          {' '}
          [Not working!] this is spatial div{' '}
        </div>
      </div>

      <div className="flex flex-row pt-5 gap-2">
        <div className={divCls} style={style}>
          {' '}
          this is var style div{' '}
        </div>
        <div className={spaceCls} style={styleSpatial}>
          {' '}
          [Not working!] this is var style spatial div{' '}
        </div>
      </div>

      <div className="flex flex-row pt-5 gap-2">
        <p
          className={divCls}
          style={{
            color: 'red',
          }}
        >
          {' '}
          this is inline style p{' '}
        </p>
        <p
          style={{
            color: 'red',
            back: 50,
          }}
          className={spaceCls}
        >
          {' '}
          [Inline style can work!] this is spatial inline style p{' '}
        </p>
      </div>
    </>
  )
}
