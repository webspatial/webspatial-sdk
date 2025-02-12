package com.example.webspatialandroid

import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.webspatiallib.NativeWebView
import androidx.compose.foundation.layout.Box
import android.view.ViewGroup

@Composable
fun SpatialWebViewUI(swv: NativeWebView, modifier: Modifier = Modifier) {
    Box(modifier = modifier) {
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