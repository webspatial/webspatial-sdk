package com.example.webspatiallib

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient



class NativeWebView {
    val webView:WebView;
    @SuppressLint("[ByDesign3.3]AvoidContentOrFileExecuteJS",
        "[ByDesign5.1]UsingAddJavaScriptInterface"
    )
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
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun getNativeVersion(): String {
               return "0.0.1";
            }

            @JavascriptInterface
            fun nativeMessage(message: String) {
            }
        }, "WebSpatailEnabled")
        webView.setWebViewClient(WebViewClient()) // Allow navigation to navigate within webview (instead of open chrome)
    }

    fun navigateToURL(url: String) {
        webView.post {
            webView.loadUrl(url)
        }
    }
}