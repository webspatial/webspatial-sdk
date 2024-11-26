export const NestedComponent = () => {
  const styleOuter = {
    '--xr-back': 121,
    width: '200px',
    height: '78px',

    backgroundColor: 'red',
  }

  const styleInner = {
    '--xr-back': 36,
    backgroundColor: 'blue',
  }

  return (
    <div
      enable-xr
      style={styleOuter}
      debugname="OuterDiv"
      debugShowStandardInstance={false}
    >
      OuterDiv
      <div
        enable-xr
        style={styleInner}
        debugname="InnerDiv"
        debugShowStandardInstance={false}
      >
        Inner Div!!
      </div>
    </div>
  )
}
