import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import WebSpatial, { WebPanel } from './webSpatial'
import ReactDomServer from 'react-dom/server';

export function SpatialDebug() {
    return (
        <div>
            debug
        </div>
    )
}
function getInheritedStyle(from: HTMLElement) {
    //https://stackoverflow.com/questions/5612302/which-css-properties-are-inherited
    var inheritStyleProps = [
        [["azimuth"], ["azimuth"]],
        [["border-collapse"], ["borderCollapse"]],
        [["border-spacing"], ["borderSpacing"]],
        [["caption-side"], ["captionSide"]],
        [["color"], ["color"]],
        [["cursor"], ["cursor"]],
        [["direction"], ["direction"]],
        [["elevation"], ["elevation"]],
        [["empty-cells"], ["emptyCells"]],
        [["font-family"], ["fontFamily"]],
        [["font-size"], ["fontSize"]],
        [["font-style"], ["fontStyle"]],
        [["font-variant"], ["fontVariant"]],
        [["font-weight"], ["fontWeight"]],
        [["font"], ["font"]],
        [["letter-spacing"], ["letterSpacing"]],
        [["line-height"], ["lineHeight"]],
        [["list-style-image"], ["listStyleImage"]],
        [["list-style-position"], ["listStylePosition"]],
        [["list-style-type"], ["listStyleType"]],
        [["list-style"], ["listStyle"]],
        [["orphans"], ["orphans"]],
        [["pitch-range"], ["pitchRange"]],
        [["pitch"], ["pitch"]],
        [["quotes"], ["quotes"]],
        [["richness"], ["richness"]],
        [["speak-header"], ["speakHeader"]],
        [["speak-numeral"], ["speakNumeral"]],
        [["speak-punctuation"], ["speakPunctuation"]],
        [["speak"], ["speak"]],
        [["speech-rate"], ["speechRate"]],
        [["stress"], ["stress"]],
        [["text-align"], ["textAlign"]],
        [["text-indent"], ["textIndent"]],
        [["text-transform"], ["textTransform"]],
        [["visibility"], ["visibility"]],
        [["voice-family"], ["voiceFamily"]],
        [["volume"], ["volume"]],
        [["white-space"], ["whiteSpace"]],
        [["widows"], ["widows"]],
        [["word-spacing"], ["wordSpacing"]],
    ]
    var styleString = "width:100%;height:100%;"
    var styleObject = getComputedStyle(from)
    for (var cssName of (inheritStyleProps as any)) {
        if ((styleObject as any)[cssName[1]]) {
            //(to.style as any)[cssName] = (s as any)[cssName]
            styleString += cssName[0] + ": " + ((styleObject as any)[cssName[1]]) + ";"
        }

    }
    return styleString
}


export function SpatialDiv(props: { className: string, children: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    if (props.spatialOffset!.x === undefined) {
        props.spatialOffset!.x = 0
    }
    if (props.spatialOffset!.y === undefined) {
        props.spatialOffset!.y = 0
    }
    if (props.spatialOffset!.z === undefined) {
        props.spatialOffset!.z = 0
    }
    var panel = new WebPanel()

    const myStyleDiv = useRef(null);
    const myDiv = useRef(null);
    let resizeDiv = async () => {
        let rect = (myDiv.current! as HTMLElement).getBoundingClientRect();
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
        await WebSpatial.updatePanelPose(WebSpatial.getCurrentWindowGroup(), panel, { x: targetPosX + props.spatialOffset!.x!, y: targetPosY + props.spatialOffset!.y!, z: props.spatialOffset!.z! }, rect.width, rect.height)
    }
    let setContent = async (str: string) => {
        //var start = Date.now()
        panel = await WebSpatial.createWebPanel(WebSpatial.getCurrentWindowGroup(), "/index.html?pageName=reactDemo/basic.tsx", str)
        await WebSpatial.updatePanelContent(WebSpatial.getCurrentWindowGroup(), panel, str)
        await resizeDiv()
        //var latency = (Date.now() - start) / 1000
        // WebSpatial.log(latency)
    }

    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }
        (myDiv.current! as HTMLElement).style.visibility = "visible"
        let innerStr = "<div style=\"" + getInheritedStyle(myStyleDiv.current!) + "\">" + ReactDomServer.renderToString(props.children) + "</div>"
        innerStr = encodeURIComponent(innerStr.replace("remote-click", "onclick"))
        setContent(innerStr);
        (myDiv.current! as HTMLElement).style.visibility = "hidden"

        addEventListener("resize", resizeDiv);
        new ResizeObserver(resizeDiv).observe((myDiv.current! as HTMLElement));
        return () => {
            removeEventListener("resize", resizeDiv)
        }
    }, [])
    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }
        resizeDiv()
        return () => {
        }
    }, [props.children])

    return (
        <div ref={myDiv} className={props.className}>
            {props.children}
            <div ref={myStyleDiv}></div>
        </div>
    )
}


export function SpatialModel(props: { webViewID: string, className: string, children?: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    if (props.spatialOffset!.x === undefined) {
        props.spatialOffset!.x = 0
    }
    if (props.spatialOffset!.y === undefined) {
        props.spatialOffset!.y = 0
    }
    if (props.spatialOffset!.z === undefined) {
        props.spatialOffset!.z = 0
    }

    const myDiv = useRef(null);
    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }

        var resizeDiv = async () => {
            var element = (myDiv.current! as HTMLElement)
            var rect = element.getBoundingClientRect();
            var curPosX = (rect.left + ((rect.right - rect.left) / 2))
            var curPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
            await WebSpatial.updateDOMModelPosition(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), props.webViewID, { x: curPosX, y: curPosY, z: props.spatialOffset!.z! })
        }
        var setContent = async () => {
            await WebSpatial.createDOMModel(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), props.webViewID, "http://testIP:5173/src/assets/FlightHelmet.usdz")
            await resizeDiv()
        }
        setContent()

        addEventListener("resize", resizeDiv);

        return () => {
            removeEventListener("resize", resizeDiv)
        }
    }, [])

    return (
        <div ref={myDiv} className={props.className}>
            {((window as any).WebSpatailEnabled) ? <div /> : props.children}
        </div>
    )
}
