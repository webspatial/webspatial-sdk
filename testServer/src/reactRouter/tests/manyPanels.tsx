import anime from "animejs"
import { useEffect, useRef, useState } from "react"
import { SpatialDiv } from "@xrsdk/runtime"


var redCol = "#cc111144"
var greenCol = "#11cc1144"
var blueCol = "#1111cc44"

function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function ManyPanelTest() {
    let [count, setCount] = useState(2)
    const [x, setX] = useState(0)
    const animationRef = useRef(null as anime.AnimeInstance | null);

    useEffect(() => {
        document.onclick = () => {
            setCount((c) => c + 1)
        }
        let c = 0
        let target = { x: 0 }
        animationRef.current = anime({
            targets: [target],
            x: 100,
            duration: 1000,
            delay: 0,
            loop: true,
            direction: "alternate",
            easing: "easeInOutSine",
            update: () => {
                c++
                if (c % 3 == 0) {
                    setX(target.x)
                }

            }
        });
    }, []);

    return <>
        <div className="grid grid-cols-10 gap-4">
            {[...Array(count)].map((v, i) =>
                <SpatialDiv key={i} spatialStyle={{ position: { z: (x * (cyrb128("2" + i)[0] / 4294967296)) + ((cyrb128("2" + i)[0] / 4294967296) * 100) }, cornerRadius: 70 }} style={{ backgroundColor: redCol, height: "200px" }}>

                    <img
                        src={"http://picsum.photos/200/30" + (i % 6)}
                        alt="Shoes"
                        className="rounded-xl" style={{ width: "100%" }} />
                </SpatialDiv>
            )}
        </div>
    </>
}