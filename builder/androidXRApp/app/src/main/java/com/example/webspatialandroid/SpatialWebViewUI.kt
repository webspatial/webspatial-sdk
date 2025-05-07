package com.example.webspatialandroid

import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.webspatiallib.NativeWebView
import androidx.compose.foundation.layout.Box
import android.view.ViewGroup
import androidx.compose.material3.Text
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb

val transparentColor = Color.Transparent
val standardColor = Color.White
@Composable
fun SpatialWebViewUI(swv: NativeWebView, modifier: Modifier = Modifier) {
    Box(modifier = modifier) {
        // Since the androidView doesn't seem to get destroyed right away we need to remove the webview from its parent before adding it in its new UI
        // Without this we can get a crash when switching from home to full space modes
        (swv.webView.parent as? ViewGroup)?.removeView(swv.webView)
        AndroidView(
            modifier = Modifier
                // .clip(RoundedCornerShape(swv.cornerRadius.dp))
                //   .background(viewBGColor.value)
                .align(Alignment.TopStart),
            factory = { ctx ->
                swv.webView.apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setBackgroundColor(standardColor.toArgb());
                }
            }, update = { webView ->
//            webView.apply {
//                if (swv.glassEffect || swv.transparentEffect) {
//                    setBackgroundColor(transparentColor.toArgb())
//                    if (swv.glassEffect) {
//                        viewBGColor.value = glass
//                    } else {
//                        viewBGColor.value = transparentColor
//                    }
//                } else {
//                    setBackgroundColor(Color.White.toArgb())
//                }
//            }
            }
        )
    }
}