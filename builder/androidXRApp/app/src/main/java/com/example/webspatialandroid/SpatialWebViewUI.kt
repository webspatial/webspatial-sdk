package com.example.webspatialandroid

import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.Box
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import com.example.webspatiallib.SpatialWindowComponent

val transparentColor = Color.Transparent
val glassColor = Color.Gray.copy(0.5f)
val standardColor = Color.White

@Composable
fun SpatialWebViewUI(swc: SpatialWindowComponent, modifier: Modifier = Modifier) {
    val id = remember { ++SpatialWindowComponent.mountIdCounter }
    val bgColor = remember { mutableStateOf(standardColor) }
    Box(modifier = modifier) {
        // Since the androidView doesn't seem to get destroyed right away we need to remove the webview from its parent before adding it in its new UI
        // Without this we can get a crash when switching from home to full space modes
        if (swc.mountedId == 0 || swc.mountedId == id) {
            swc.mountedId = id
            AndroidView(
                modifier = Modifier
                    .background(bgColor.value)
                    .align(Alignment.TopStart),
                factory = { ctx ->
                    swc.nativeWebView.webView.apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    }
                }, update = { webView ->
                    if (swc.backgroundStyle == "none") {
                        swc.nativeWebView.webView.setBackgroundColor(standardColor.toArgb())
                        bgColor.value = standardColor
                    } else if (swc.backgroundStyle == "translucent") {
                        swc.nativeWebView.webView.setBackgroundColor(transparentColor.toArgb())
                        bgColor.value = transparentColor
                    } else if (swc.backgroundStyle == "glassEffect") {
                        swc.nativeWebView.webView.setBackgroundColor(transparentColor.toArgb())
                        bgColor.value = glassColor
                    }
                },
                onRelease = { view ->
                    swc.mountedId = 0
                }
            )
        }
    }
}