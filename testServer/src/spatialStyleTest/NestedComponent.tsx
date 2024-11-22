export const NestedComponent = () => {
  const styleOuter = {
    '--xr-back': 121,
    height: '78px',

    backgroundColor: 'red',
  }

  const styleInner = {
    '--xr-back': 36,
    backgroundColor: 'blue',
    // transformOrigin: 'left top',
    // transform: 'rotate3d(0, 0, 1, 30deg) scaleX(3) ',
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
        {' '}
        Inner Div!!
      </div>
    </div>
  )
}
