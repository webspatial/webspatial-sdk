package com.example.webspatiallib

open class SpatialComponent : SpatialObject() {
    var entity: SpatialEntity? = null

    open fun onAddToEntity() {}

    override fun onDestroy() {
        entity = null
    }
}
