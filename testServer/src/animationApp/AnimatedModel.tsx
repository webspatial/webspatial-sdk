import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Model, type ModelProps } from 'web-spatial';
import animejs from 'animejs';
import { Easing } from './types';

export interface AnimatedModelProps extends ModelProps {
    duration?: number;
    direction?: 'normal' | 'reverse' | 'alternate';
    loop?: number | boolean;
    easing?: Easing;

    opacityFromTo?: [number, number]; 

    spaceTranslateX?: number;
    spaceTranslateY?: number;
    spaceTranslateZ?: number;
}

export function AnimatedModel(props: AnimatedModelProps) {
    const { duration = 1000, direction = 'alternate', loop = true, easing = 'linear',
        spaceTranslateX = 0, spaceTranslateY = 0, spaceTranslateZ = 0, 
        // spaceRotationX = 0,  spaceRotationY = 0, spaceRotationZ = 0,
        spatialOffset: positionOriginal =  { x: 0, y: 0, z: 0 }, 
        opacityFromTo = [1, 1],
        ...modelProps } = props;

    const spatialX = positionOriginal?.x || 0;
    const spatialY = positionOriginal?.y || 0;
    const spatialZ = positionOriginal?.z || 0;

    const [spatialOffset, setSpatialOffset] = useState({ x: spatialX, y: spatialY, z: spatialZ });
    const [modelOpacity, setModelOpacity] = useState(opacityFromTo[0]);

    const animeTranslateTarget = useRef<{ x: number, y: number, z: number }>({ ...spatialOffset });
    const animeOpacityTarget = useRef<{opacity: number}>({opacity: opacityFromTo[0]});
    
    const cleanupAnimeStack = () => {
        animejs.remove(animeTranslateTarget.current);
        animejs.remove(animeOpacityTarget.current);
    };

    const cycleAnime = (props: AnimatedModelProps) => {
        // 🚽 Clean anime refs
        cleanupAnimeStack();

        // add anime for spaceTranslateZ
        if ('spaceTranslateX' in props || 'spaceTranslateY' in props || 'spaceTranslateZ' in props) {
            animejs({
                targets: animeTranslateTarget.current,
                x: spaceTranslateX,
                y: spaceTranslateY,
                z: spaceTranslateZ,
                duration,
                easing,
                direction,
                loop,

                update: function () {
                    setSpatialOffset({ ...animeTranslateTarget.current })
                },

            })
        }

        if ('opacityFromTo' in props) {
            animejs({
                targets: animeOpacityTarget.current,
                opacity: opacityFromTo[1],
                duration,
                easing,
                direction,
                loop,

                update: function () {
                    setModelOpacity(animeOpacityTarget.current.opacity)
                },

            })
        }
    };


    const createAnime = useCallback(() => {
        cycleAnime(props);
    }, [props]);


    useEffect(() => {
        createAnime();

        return () => cleanupAnimeStack()
    }, [createAnime]);



    return (
        <Model {...modelProps} spatialOffset={spatialOffset} opacity={modelOpacity} >
            {props.children}
        </Model>
    )
}
