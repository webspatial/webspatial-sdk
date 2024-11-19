import React, { useRef, useCallback, useEffect, useState } from 'react'
import { SpatialDiv, SpatialDivProps } from '@xrsdk/react';
import animejs from 'animejs';
import { Easing } from './types';

export interface AnimatedSpatialDivProps extends SpatialDivProps {
    duration?: number;
    direction?: 'normal' | 'reverse' | 'alternate';
    loop?: number | boolean;
    easing?: Easing;

    // CSS
    // opacity?: number; 

    spaceTranslateX?: number;
    spaceTranslateY?: number;
    spaceTranslateZ?: number;

    spaceRotationX?: number;
    spaceRotationY?: number;
    spaceRotationZ?: number;

}

export function AnimatedSpatialDiv(props: AnimatedSpatialDivProps) {
    const { duration = 1000, direction = 'alternate', loop = true, easing = 'linear',
        spatialStyle: spatialStyleOriginal,
        ...otherDivProps } = props;

    const positionOriginal = spatialStyleOriginal?.position || { x: 0, y: 0, z: 0 }
    const spatialX = positionOriginal?.x || 0;
    const spatialY = positionOriginal?.y || 0;
    const spatialZ = positionOriginal?.z || 0;

    const rotationOriginal = spatialStyleOriginal?.rotation || { x: 0, y: 0, z: 0 }
    const rotationX = rotationOriginal?.x || 0;
    const rotationY = rotationOriginal?.y || 0;
    const rotationZ = rotationOriginal?.z || 0;

    const {
        spaceTranslateX = spatialX, spaceTranslateY = spatialY, spaceTranslateZ = spatialZ,
        spaceRotationX = rotationX, spaceRotationY = rotationY, spaceRotationZ = rotationZ,
        ...spatialDivProps
    } = otherDivProps;


    const [spatialPosition, setSpatialPosition] = useState({ x: spatialX, y: spatialY, z: spatialZ });
    const [spatialRotation, setSpatialRotation] = useState({ x: rotationX, y: rotationY, z: rotationZ, w: 1 });

    const animeTranslateTarget = useRef<{ x: number, y: number, z: number }>({ ...spatialPosition });
    const animeRotationTarget = useRef<{ x: number, y: number, z: number }>({ ...spatialRotation });

    const cleanupAnimeStack = () => {
        animejs.remove(animeTranslateTarget.current);
        animejs.remove(animeRotationTarget.current);
    };

    const cycleAnime = (props: AnimatedSpatialDivProps) => {
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
                    setSpatialPosition({ ...animeTranslateTarget.current })
                },

            })
        }

        if ('spaceRotationX' in props || 'spaceRotationY' in props || 'spaceRotationZ' in props) {
            animejs({
                targets: animeRotationTarget.current,
                x: spaceRotationX,
                y: spaceRotationY,
                z: spaceRotationZ,
                duration,
                easing,
                direction,
                loop,

                update: function () {
                    setSpatialRotation({ ...animeRotationTarget.current, w: 1 })
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


    const spatialStyle = { ...spatialStyleOriginal, position: spatialPosition, rotation: spatialRotation };

    return (
        <SpatialDiv {...spatialDivProps} spatialStyle={spatialStyle} >
            {props.children}
        </SpatialDiv>
    )
}
