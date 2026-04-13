package com.example.webspatialandroid

import com.example.webspatiallib.CommandInfo
import com.example.webspatiallib.CommandManagerInterface
import com.example.webspatiallib.NativeWebView
import com.example.webspatiallib.SpatialObject
import com.example.webspatiallib.SpatialWindowComponent
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.floatOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

inline fun <reified T> JsonElement.find(vararg keys: String): T? {
    val element = keys.fold(this) { acc, key ->
        (acc as? JsonObject)?.get(key) ?: return null
    }

    if (T::class == JsonElement::class) {
        return element as T?
    }

    val primitive = element.jsonPrimitive ?: return null

    return when (T::class) {
        String::class -> primitive.content as T
        Int::class -> primitive.intOrNull as T?
        Long::class -> primitive.longOrNull as T?
        Double::class -> primitive.doubleOrNull as T?
        Float::class -> primitive.floatOrNull as T?
        Boolean::class -> primitive.booleanOrNull as T?
        else -> null
    }
}

class CommandManager : CommandManagerInterface {
    // Process a command from the webview
    // Runs on the main thread
    override fun processCommand(senderWebview: NativeWebView, ci: CommandInfo) {
        when (ci.command) {
            "updateResource" -> {
                val style = ci.json.find<JsonElement>("data", "update", "style")
                if (style != null) {
                    val swc = SpatialObject.get(ci.resourceID) as SpatialWindowComponent?
                    if (swc != null) {
                        val backgroundMaterial = style.find<String>("backgroundMaterial")
                        if (backgroundMaterial != null) {
                            swc.backgroundStyle = backgroundMaterial
                        }
                    }
                }
                senderWebview.completeEvent(ci.requestID)
            }

            else -> {
                console.warn("Got unexpected command")
                senderWebview.completeEvent(ci.requestID)
            }
        }
    }
}