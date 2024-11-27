export const NestedComponent = () => {
  const styleOuter = {
    '--xr-back': 121,
    width: '200px',
    height: '78px',

    backgroundColor: 'red',
  }

  const styleInner = {
    backgroundColor: 'blue',
  }

  return (
    <div
      enable-xr
      style={styleOuter}
      debugName="OuterDiv"
      debugShowStandardInstance={false}
    >
      OuterDiv
      <div
        enable-xr
        style={styleInner}
        debugName="InnerDiv"
        debugShowStandardInstance={false}
      >
        Inner Div!!
      </div>
    </div>
  )
}
