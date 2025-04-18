package com.example.webspatiallib

import android.content.Context

class SpatialWindowComponent(context: Context) : SpatialComponent() {
    val nativeWebView = NativeWebView(context)

    fun loadURL(url: String){
        nativeWebView.navigateToURL(url)
    }
}