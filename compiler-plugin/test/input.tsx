// export const SimpleInputComponent2 = (props) => {
//     var a: string = "";
//     console.log(a)
//     return <div className={props.className} style={{back:23}} > this is a simple component </div>
// }

export function SimpleInputComponent() {
  const spatialStyle = {
    position: { x: 0, y: 0, z: 10.000001 },
    transparentEffect: true,
    glassEffect: false,
    // materialThickness: "none"
  };

  const divCls = "text-amber-600	";
  const spaceCls = divCls + "bg-zinc-400";

  const style = {
    back: 10,
  };

  const oldStyle = {
    color: 'red'
  }

  return (
    <div className="w-screen h-screen flex flex-row base-200">
      <div className="flex flex-row pt-5 gap-2">
        <div style={style} className={spaceCls}>
          this is spatial div 1
        </div>
        <div
          style={{
            back: 10,
          }}
          className={spaceCls}
        >
          this is spatial div 2
        </div>

        <div
          style={{...oldStyle,
            back: 10,
          }}
          className={spaceCls}
        >
          this is spatial div 3
        </div>
      </div>
    </div>
  );
}
