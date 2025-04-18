package com.example.webspatiallib

import android.util.Log

class Console {
    fun log(message:String){
        Log.d("WebSpatialLogs", message)
    }

    fun warn(message:String){
        Log.d("WebSpatialLogs", "Warn: $message")
    }

    fun error(message:String){
        Log.d("WebSpatialLogs", "Error: $message")
    }
}
var console = Console()