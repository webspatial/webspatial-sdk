import anime from "animejs";
import { useEffect, useRef, useState } from "react"
import { SpatialDiv } from "web-spatial"

export function PopupTest() {
    const [popupEnabled, setPopupEnabled] = useState(true)
    const [x, setX] = useState(0)
    const animationRef = useRef(null as anime.AnimeInstance | null);
    useEffect(() => {
        let target = { x: 0 }
        animationRef.current = anime({
            targets: [target],
            x: 100,
            duration: 300,
            delay: 200,
            loop: false,
            direction: "alternate",
            easing: "easeInOutSine",
            update: () => {
                setX(target.x)
            }
        });
    }, []);

    return <>
        {popupEnabled ?
            <div style={{ backgroundColor: "#110000aa", width: "100%", height: "100%", position: "absolute", top: "0px", padding: "0px", zIndex: "100", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <SpatialDiv spatialStyle={{ position: { z: x }, glassEffect: true, cornerRadius: 70 }} style={{ backgroundColor: "#FFFF0000", width: "50%", height: "50%", margin: "auto", overflow: "scroll" }}>
                    <div className="card shadow-xl" style={{ width: "100%", height: "100%" }}>
                        <figure className="px-10 pt-10">
                            <img
                                src="/src/assets/react.svg"
                                alt="Shoes"
                                className="rounded-xl" width={100} />
                        </figure>
                        <div className="card-body items-center text-center">
                            <h2 className="card-title">PopUp!</h2>
                            <p>This is a popup message</p>
                            <div className="card-actions">
                                <button className="btn btn-primary" onClick={() => {
                                    setPopupEnabled(false)
                                }}>Close</button>
                            </div>
                        </div>
                    </div>
                </SpatialDiv>
            </div>
            : <div></div>}

        <div style={{ backgroundColor: "#FF000000", width: "100%", height: "500px", padding: "0px" }}>
            Hello world

            <button className="btn btn-primary" onClick={() => {
                animationRef.current?.restart()
                setX(0)
                setPopupEnabled(true)


            }}>Trigger popup</button>
        </div>
    </>
}