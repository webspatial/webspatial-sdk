package com.example.webspatiallib

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.serialization.*
import kotlinx.serialization.json.*

class CommandInfo {
    var command = "notFound"
    var windowContainerID = "notFound"
    var entityID = "notFound"
    var resourceID = "notFound"
    var requestID = -1
}


class NativeWebView {
    val webView:WebView;
    @SuppressLint("[ByDesign3.3]AvoidContentOrFileExecuteJS",
        "[ByDesign5.1]UsingAddJavaScriptInterface"
    )

    // TODO move this out of this file
    fun getCommandInfo(json: JsonObject): CommandInfo? {
        val rID = json.get("requestID")
        if (rID != null) {
            val ret = CommandInfo()
            ret.requestID = rID.jsonPrimitive.int
            // Log.i("test", "TREV got rid")
            val data = json.get("data")
            if (data != null) {
                //   Log.i("test", "TREV got data")
                val windowContainerID = data.jsonObject.get("windowContainerID")
                if (windowContainerID != null) {
                    ret.windowContainerID = windowContainerID.jsonPrimitive.content
                }

                val entityID = data.jsonObject.get("entityID")
                if (entityID != null) {
                    ret.entityID = entityID.jsonPrimitive.content
                }

                val resourceID = data.jsonObject.get("resourceID")
                if (resourceID != null) {
                    ret.resourceID = resourceID.jsonPrimitive.content
                    if (ret.resourceID == "current") {
                     //   ret.resourceID = id
                    }
                }

                val command = json.jsonObject.get("command")
                if (command != null) {
                    ret.command = command.jsonPrimitive.content
                }
            } else {
                //     Log.i("test", "TREV no reqID")
            }

            return ret
        }
        return null
    }

 // TODO move this out of this file
    fun completeEvent(requestID: Int, data: String = "{}") {
        val mainHandler = Handler(Looper.getMainLooper())
        mainHandler.post {
            try {
                webView.evaluateJavascript("window.__SpatialWebEvent({success: true, requestID:" + requestID + ", data: " + data + "})") { result ->
                }
            } catch (e: Exception) {
                Log.e("WebViewResult", "TREV Exception during JavaScript evaluation: ${e.message}")
            }
        }
    }


    @SuppressLint("[ByDesign5.1]UsingAddJavaScriptInterface",
        "[ByDesign3.3]AvoidContentOrFileExecuteJS"
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
                 // TODO move this out of this file
                val mainHandler = Handler(Looper.getMainLooper())
                mainHandler.post {

                        try {
                            // Parse json
                            val currentTimeMillisA = System.nanoTime()
                            val json = Json.parseToJsonElement(message)
                            //handleJson(json)
                            val ci = getCommandInfo(json.jsonObject)
                            if(ci != null){
                                completeEvent(ci.requestID)
                            }

                            val currentTimeMillisB = System.nanoTime()
                        } catch (e: Exception) {
                            Log.e("WebViewResult", "TREV Exception during JavaScript evaluation: ${e.message}")
                        }

                }

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