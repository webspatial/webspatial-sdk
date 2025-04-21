package com.example.webspatiallib

enum class CoordinateSpaceMode {
    APP, DOM, ROOT;
}

// Entity
class SpatialEntity : SpatialObject() {
    var coordinateSpace: CoordinateSpaceMode = CoordinateSpaceMode.APP
    private val childEntities = mutableMapOf<String, SpatialEntity>()
    var parentEnt: SpatialEntity? = null
    var parentWindowContainerObj: SpatialWindowContainer? = null
    val components: MutableList<SpatialComponent> = mutableListOf()
    fun getEntities(): Map<String, SpatialEntity> = childEntities

    fun setParentWindowContainer(wg: SpatialWindowContainer?) {
        parentWindowContainerObj?.removeEntity(this)
        parentWindowContainerObj = wg
        wg?.addEntity(this)

        parentEnt?.childEntities?.remove(id)
        parentEnt = null
    }

    fun addChild(child: SpatialEntity) {
        child.setParent(parentEnt = this)
    }

    fun setParent(parentEnt: SpatialEntity?) {
        parentWindowContainerObj?.removeEntity(this)
        parentWindowContainerObj = null

        this.parentEnt?.childEntities?.remove(id)

        parentEnt?.let {
            this.parentEnt = it
            it.childEntities[id] = this
        }
    }

    fun addComponent(component: SpatialComponent) {
        components.add(component)
        component.entity = this
        component.onAddToEntity()
    }

    fun removeComponent(component: SpatialComponent) {
        components.remove(component)
        component.entity = null
    }

    inline fun <reified T : SpatialComponent> getComponent(type: T): T? {
        return components.find { it is T } as? T
    }

    inline fun <reified T : SpatialComponent> hasComponent(type: T): Boolean {
        return getComponent(type) != null
    }

    override fun onDestroy() {
        parentWindowContainerObj?.removeEntity(this)
        components.forEach { it.destroy() }
        components.clear()

        setParent(null)
        childEntities.keys.forEach { childEntities[it]?.setParent(null) }
        childEntities.clear()
    }
}
