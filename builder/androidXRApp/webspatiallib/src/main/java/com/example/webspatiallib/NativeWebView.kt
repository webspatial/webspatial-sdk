package com.example.webspatiallib

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.webkit.WebView

class NativeWebView {
    val webView:WebView;
    @SuppressLint("[ByDesign3.3]AvoidContentOrFileExecuteJS")
    constructor(context: Context){
        webView = WebView(context)
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.settings.javaScriptEnabled = true
        webView.settings.loadWithOverviewMode = true
        webView.settings.useWideViewPort = true
        webView.settings.builtInZoomControls = true
        webView.settings.displayZoomControls = false
        webView.settings.setSupportZoom(true)
        webView.settings.setSupportMultipleWindows(true)
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        webView.settings.defaultTextEncodingName = "utf-8"
    }

    fun navigateToURL(url: String) {
        webView.post {
            webView.loadUrl(url)
        }
    }
}