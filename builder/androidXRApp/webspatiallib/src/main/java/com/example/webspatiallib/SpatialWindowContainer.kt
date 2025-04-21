package com.example.webspatiallib

import kotlinx.coroutines.flow.MutableSharedFlow
import java.lang.ref.WeakReference

data class WindowContainerData(
    val windowStyle: String,
    val windowContainerID: String
)

data class Size(val width: Int, val height: Int)

class SpatialWindowContainer(
    name: String,
    var wgd: WindowContainerData
) : SpatialObject() {

    companion object {
        val activePlainWindowContainerIds: MutableSet<String> = mutableSetOf()

        val firstActivePlainWindowContainerId: String?
            get() = activePlainWindowContainerIds.firstOrNull()

        fun getSpatialWindowContainer(name: String): SpatialWindowContainer? {
            return SpatialObject.get(name) as? SpatialWindowContainer
        }

        fun getOrCreateSpatialWindowContainer(name: String, data: WindowContainerData): SpatialWindowContainer {
            return getSpatialWindowContainer(name) ?: SpatialWindowContainer(name, data)
        }
    }

    private val childResources: MutableMap<String, SpatialObject> = mutableMapOf()

    fun addChildResource(spatialObject: SpatialObject) {
        childResources[spatialObject.id] = spatialObject
    }

    private fun onSpatialObjectDestroyed(obj: Any, data: Any) {
        val spatialObject = obj as? SpatialObject ?: return
        childResources.remove(spatialObject.id)
    }

    val childContainers: MutableMap<String, SpatialWindowContainer> = mutableMapOf()
    private val childEntities: MutableMap<String, SpatialEntity> = mutableMapOf()

    fun getEntities(): Map<String, SpatialEntity> = childEntities

    fun addEntity(spatialEntity: SpatialEntity) {
        childEntities[spatialEntity.id] = spatialEntity
    }

    fun removeEntity(spatialEntity: SpatialEntity) {
        childEntities.remove(spatialEntity.id)
    }

    init {
        if (wgd.windowStyle == "Plain") {
            activePlainWindowContainerIds.add(wgd.windowContainerID)
        }
        SpatialObject.objects[name] = this
        SpatialObject.weakRefObjects[name] = WeakReference(this)
    }

    override fun onDestroy() {
        childEntities.values.forEach { it.destroy() }
        childEntities.clear()

        childResources.values.forEach { it.destroy() }
        childResources.clear()

        childContainers.values.forEach {
            if (it != this) it.destroy()
        }
        childContainers.clear()

        if (wgd.windowStyle == "Plain") {
            activePlainWindowContainerIds.remove(wgd.windowContainerID)
        }
    }
}