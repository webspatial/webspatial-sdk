# What is WebSpatial?

## Introduction

WebSpatial is a way to build XR experiences using standard web technologies (React, JS, CSS, HTML, etc.). 

The goal is to enable existing websites to work beautifully on XR devices without needing to rebuild the experience using a native SDK. Instead, websites can make their experience feel native with a few lines of javascript or adding spatial styles to their existing react components take advantage of 3D space.

Your website is already a WebSpatial app, but you can take it to the next level by adding spatial styles to your components.

## Parts of a WebsSpatial App

WebSpatial consists of two main parts:
1. A viewer app that runs on an XR device or simulator which enables the SDK. This can be packaged and published to the app store.
2. Website that you host on a web server or embed in your viewer app that is extended with the SDK


## Core problems we're trying to solve
Existing options to build XR apps with web technology have a few limitations today.
1. Porting a website to Native SDKs is a large investment to target XR platforms that are still in the early stages of adoption
2. Most web browsers are flat by default making their experience much more limited compared to native applications
3. WebXR does not support multiple 3D websites running at the same time
4. WebXR currently requires apps to render all their content with webGL/webGPU so webpages are not able to leverage their eixsting HTML UI
5. XR Platforms APIs are evolving quickly and the web needs a way to experiment with new APIs without potentially breaking already published apps

## Similar libraries we'd love to work with
 - WebXR
 - React Native
 - ElectronJS
 - AFrame
 - BabylonJS
 - ThreeJS
