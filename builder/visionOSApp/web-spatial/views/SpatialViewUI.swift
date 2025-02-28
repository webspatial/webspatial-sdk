//
//  SpatialViewUI.swift
//  web-spatial
//
//  Created by ByteDance on 11/6/24.
//
import RealityKit
import SwiftUI

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

struct SpatialViewUI: View {
    @Environment(SpatialEntity.self) var ent: SpatialEntity
    @State var isRoot = false

    // Entity which will contain all the content of this realityView and scale to fit frame
    @State var world = Entity()
    @State var portal = Entity()
    @State var light = PointLight()
    @State var portalModel = ModelComponent(
        mesh: .generatePlane(width: 1.0, height: 1.0, cornerRadius: 0.0),
        materials: [PortalMaterial()]
    )
    @State var worldComponent = WorldComponent()

    private func toJson(val: SIMD3<Float>) -> String {
        return "{x: " + String(val.x) + ",y: " + String(val.y) + ",z: " + String(val.z) + "}"
    }

    var dragGesture: some Gesture {
        DragGesture(minimumDistance: 0).handActivationBehavior(.automatic)
            .targetedToAnyEntity()
            .onChanged { value in
                let startPos = value.convert(value.startLocation3D, from: .local, to: .scene)
                let translate = value.convert(value.location3D, from: .local, to: .scene)
                let spatialEntity = value.entity.components[SpatialBridgeComponent.self]!.spatialEntity
                let ic = spatialEntity.getComponent(SpatialInputComponent.self)!

                if !ic.isDragging {
                    ic.isDragging = true
                    ic.trackedPosition = startPos
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate

                    ic.wv!.fireComponentEvent(componentId: ic.id, data: "{eventType: 'dragstart', translate: " + toJson(val: delta) + "}")
                } else {
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate
                    ic.wv!.fireComponentEvent(componentId: ic.id, data: "{eventType: 'drag', translate: " + toJson(val: delta) + "}")
                }
            }
            .onEnded { value in
                let spatialEntity = value.entity.components[SpatialBridgeComponent.self]!.spatialEntity
                let ic = spatialEntity.getComponent(SpatialInputComponent.self)!
                ic.wv!.fireComponentEvent(componentId: ic.id, data: "{eventType: 'dragend'}")
                ic.isDragging = false
            }
    }

    var body: some View {
        if let viewComponent = ent.getComponent(SpatialViewComponent.self) {
            GeometryReader3D { proxy in
                // Get dimensions of the frame
                let proxySize3d = proxy.frame(in: .local)

                RealityView { _, _ in
                } update: { content, attachments in
                    // Scale content so it will be a 1x1x1 space and not exceed the frame
                    let viewSpaceDimensions = content.convert(proxySize3d, from: .local, to: content)
                    let newScale = min(viewSpaceDimensions.extents.x, viewSpaceDimensions.extents.y)

                    world.transform.scale.x = newScale
                    world.transform.scale.y = newScale
                    world.transform.scale.z = newScale
                    portal.transform.scale.x = newScale
                    portal.transform.scale.y = newScale
                    portal.transform.scale.z = newScale

                    if !isRoot {
                        // Pull out content so volume sits in front of the page
                        world.transform.translation.z = world.transform.scale.z / 2
                    }

                    for (_, entity) in ent.getEntities() {
                        world.addChild(entity.modelEntity)
                    }

                    // Add attachments for window entities
                    let entities = ent.getEntities().filter { _, entity in
                        entity.coordinateSpace == .APP && entity.hasComponent(SpatialWindowComponent.self)
                    }
                    for key in Array(entities.keys) {
                        let e = entities[key]!
                        let windowComponent = e.getComponent(SpatialWindowComponent.self)
                        if windowComponent != nil && e.coordinateSpace == .APP {
                            if let windowAttachment = attachments.entity(for: key) {
                                if e.modelEntity.children.count == 0 {
                                    e.modelEntity.addChild(windowAttachment, preservingWorldTransform: false)

                                    // Scale the window to fit the resolution to unit ratio as defined by setResolution API
                                    let b = windowAttachment.attachment.bounds
                                    let wv = e.getComponent(SpatialWindowComponent.self)!
                                    let scaleFact = (Float(wv.resolutionX) / 1360.0) / (b.max.x - b.min.x)
                                    windowAttachment.scale.x = scaleFact
                                    windowAttachment.scale.y = scaleFact
                                    windowAttachment.scale.z = scaleFact
                                }
                            }
                        }
                    }
                    if viewComponent.isPortal {
                        // Setup portal
                        portal.components.set(portalModel)
                        portal.transform.translation.z = 0.0001 // avoid z fighting
                        if !portal.components.has(PortalComponent.self) {
                            portal.components.set(PortalComponent(target: world))
                        }

                        // Setup default light
                        light.light.intensity = 5000
                        light.position.z = 2
                        light.position.y = 1
                        light.position.x = 0.5
                        world.addChild(light)

                        // Position volume behind portal instead of in front
                        world.transform.translation.z *= -1

                        // Add portal to scene
                        world.components.set(worldComponent)
                        content.add(portal)
                    } else {
                        // Remove portal elements/components
                        content.remove(portal)
                        world.components.remove(WorldComponent.self)
                        world.removeChild(light)
                    }

                    content.add(world)
                }
                attachments: {
                    // Create an attachment for each window component
                    let entities = ent.getEntities().filter { _, entity in
                        entity.coordinateSpace == .APP && entity.hasComponent(SpatialWindowComponent.self)
                    }
                    ForEach(Array(entities.keys), id: \.self) { key in
                        let entity = entities[key]!
                        let wv = entity.getComponent(SpatialWindowComponent.self)!
                        Attachment(id: key) {
                            SpatialWebViewUI().environment(entity).frame(width: wv.resolutionX, height: wv.resolutionY)
                        }
                    }
                }.gesture(dragGesture).if(!isRoot) { view in
                    view.clipped()
                }
            }
        }
    }
}
