package com.example.webspatiallib

import android.content.Context
import java.lang.ref.WeakReference

class SpatialWindowComponent(context: Context) : SpatialComponent() {
    val nativeWebView = NativeWebView(context)

    var backgroundStyle = "none"

    init {
        nativeWebView.windowComponent = WeakReference(this)
    }

    fun loadURL(url: String) {
        nativeWebView.navigateToURL(url)
    }
}