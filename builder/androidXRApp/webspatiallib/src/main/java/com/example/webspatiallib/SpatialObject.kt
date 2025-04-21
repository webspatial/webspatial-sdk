package com.example.webspatiallib

import java.lang.ref.WeakReference
import java.util.UUID

open class SpatialObject {

    companion object {
        val objects = mutableMapOf<String, SpatialObject>()
        val weakRefObjects = mutableMapOf<String, WeakReference<SpatialObject>>()
        fun get(id: String): SpatialObject? = objects[id]
        fun getRefObject(id: String): SpatialObject? = weakRefObjects[id]?.get()
        fun getWeakRef(id: String): SpatialObject? = weakRefObjects[id]?.get()
    }

    val id: String
    var name: String = ""

    private var _isDestroyed: Boolean = false
    val isDestroyed: Boolean
        get() = _isDestroyed

    constructor() {
        this.id = UUID.randomUUID().toString()
        objects[id] = this
        weakRefObjects[id] = WeakReference(this)
    }

    open fun destroy() {
        if (_isDestroyed) {
            console.warn("SpatialObject already destroyed $this")
            return
        }
        onDestroy()
        _isDestroyed = true
        objects.remove(id)
    }

    open fun onDestroy() {}

    override fun equals(other: Any?): Boolean {
        return other is SpatialObject && this.id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    protected fun finalize() {
        weakRefObjects.remove(id)
    }
}