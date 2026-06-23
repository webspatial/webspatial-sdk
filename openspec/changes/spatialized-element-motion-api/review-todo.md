# AnimationObject design review TODO

> Target: `AnimationObject : SpatialObject` + `createAnimation` locked timeline + native-only + element animating mask

## Core

- [ ] `SpatializedElement.createAnimation(config)`
- [ ] `AnimationObject extends SpatialObject`
- [ ] Remove `SpatializedMotionController` and dual backends
- [ ] `SpatialAnimationStateChanged` subscription and playState sync

## Native

- [ ] `AnimationObject : SpatialObject` registry
- [ ] `CreateSpatializedElementAnimation` / `ControlSpatializedElementAnimation` JSB
- [ ] Element animating mask; ignore conflicting transform JSB while playing
- [ ] Remove `AnimateSpatializedElementMotion`

## React

- [ ] `AnimationProxy` pre-bind queue
- [ ] config change → destroy + recreate
- [ ] fail-fast without native
- [ ] Remove Portal suppression primary path

## Protocol

- [ ] timeline submitted only at create
- [ ] uuid native-generated only
- [ ] destroy via generic `DestroyCommand`
