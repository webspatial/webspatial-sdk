package com.example.webspatiallib

import android.content.Context
import android.util.MutableFloat
import android.util.MutableInt
import androidx.compose.runtime.getValue
import java.lang.ref.WeakReference
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

class SpatialWindowComponent(context: Context) : SpatialComponent() {
    companion object {
        var mountIdCounter = 1
    }

    val nativeWebView = NativeWebView(context)

    var mountedId by mutableIntStateOf(0)
    var backgroundStyle by mutableStateOf("none")

    init {
        nativeWebView.windowComponent = WeakReference(this)
    }

    fun loadURL(url: String) {
        nativeWebView.navigateToURL(url)
    }
}