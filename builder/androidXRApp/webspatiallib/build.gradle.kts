import groovy.json.JsonSlurper
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    kotlin("plugin.serialization") version "2.0.21"
}

android {
    namespace = "com.example.webspatiallib"
    compileSdk = 35
    buildFeatures {
        // enable BuildConfig
        buildConfig = true
    }

    defaultConfig {
        minSdk = 34

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")

        // 1. read visionOS/package.json
        val pkgFile = file("$rootDir/../visionOS/package.json")
        val version = try {
            // 2. parse version by JsonSlurper
            val json = JsonSlurper().parseText(pkgFile.readText()) as Map<*, *>
            json["version"] as? String ?: "unknown"
        } catch (e: Exception) {
            logger.warn("read package.json failed：${e.message}")
            "unknown"
        }

        // 3. set BuildConfig
        buildConfigField(
            "String",
            "NATIVE_VERSION",
            "\"$version\""
        )
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.compose)
}