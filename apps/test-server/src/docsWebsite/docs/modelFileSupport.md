# Model File Support

## **What is supported**

* USDZ  
* GLTF/GLB  
* Primitives  
  * Box  
  * Sphere

Due to USDZ only being supported on target platforms (AVP) it will be the only file type supported on AVP headset for now. However, on desktop glb/gltf is displayed using [model-viewer](https://modelviewer.dev/) so to support most platforms, it is recommended to supply both USDZ and GLB models.

## **I have a file in format X, how can I use it with WebSpatial?**

[Blender](https://www.blender.org/download/) supports importing many different file types (GLTF, USD, OBJ, etc.) and can run on many different platforms (Mac, Windows)

1. Open blender and load default scene  
2. Delete box, camera and lights from basic scene  
3. Drag in your model file to blender  
4. Click viewport shading to make sure the material looks correct  
5. File \-\> Export \-\> USD\*  
6. When naming your file replace extension with usdz and click save  
7. Try loading with WebSpatial

## **Where can I get free assets**

* https://kenney.nl/assets/category:3D  
* https://developer.apple.com/augmented-reality/quick-look/

