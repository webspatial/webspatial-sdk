package com.example.webspatialandroid

import android.annotation.SuppressLint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CornerSize
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewLightDark
import androidx.compose.ui.unit.dp
import androidx.xr.compose.platform.LocalHasXrSpatialFeature
import androidx.xr.compose.platform.LocalSession
import androidx.xr.compose.platform.LocalSpatialCapabilities
import androidx.xr.compose.spatial.EdgeOffset
import androidx.xr.compose.spatial.Orbiter
import androidx.xr.compose.spatial.OrbiterEdge
import androidx.xr.compose.spatial.Subspace
import androidx.xr.compose.subspace.SpatialPanel
import androidx.xr.compose.subspace.Volume
import androidx.xr.compose.subspace.layout.SpatialRoundedCornerShape
import androidx.xr.compose.subspace.layout.SubspaceModifier
import androidx.xr.compose.subspace.layout.depth
import androidx.xr.compose.subspace.layout.height
import androidx.xr.compose.subspace.layout.movable
import androidx.xr.compose.subspace.layout.resizable
import androidx.xr.compose.subspace.layout.width
import com.example.webspatialandroid.ui.theme.WebSpatialAndroidTheme
import com.example.webspatiallib.Console
import com.example.webspatiallib.CoordinateSpaceMode
import com.example.webspatiallib.SpatialEntity
import com.example.webspatiallib.SpatialWindowComponent
import com.example.webspatiallib.SpatialWindowContainer
import com.example.webspatiallib.WindowContainerData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.guava.await
import kotlinx.coroutines.launch

val debugSpaceToggle = false
var startURL = "http://localhost:5173/src/docsWebsite?examplePath=createSession"
var console = Console()
var windowContainers = mutableStateListOf<SpatialWindowContainer>()

class MainActivity : ComponentActivity() {

    @SuppressLint("RestrictedApi")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        console.log("WebSpatial App Started -------- rootURL: " + startURL)

        // Initialize default window container with webpage
        val rootContainer = SpatialWindowContainer.getOrCreateSpatialWindowContainer("Root", WindowContainerData("Plain", "Root"))
        val rootEntity = SpatialEntity()
        rootEntity.coordinateSpace = CoordinateSpaceMode.ROOT
        rootEntity.setParentWindowContainer(rootContainer)
        val windowComponent = SpatialWindowComponent(this)
        windowComponent.loadURL(startURL)
        rootEntity.addComponent(windowComponent)
        windowContainers.add(rootContainer)


        enableEdgeToEdge()
        setContent {
            val session = LocalSession.current
            if (LocalSpatialCapabilities.current.isSpatialUiEnabled) {
                Subspace {
                    MySpatialContent(onRequestHomeSpaceMode = { session?.requestHomeSpaceMode() })
                }
            } else {
                My2DContent(onRequestFullSpaceMode = { session?.requestFullSpaceMode() })
            }
        }
    }
}

@SuppressLint("RestrictedApi")
@Composable
fun MySpatialContent(onRequestHomeSpaceMode: () -> Unit) {
    val session = checkNotNull(LocalSession.current)
    val scope = rememberCoroutineScope()

    // For every window container, displays its contents
    windowContainers.forEach { c ->
        SpatialPanel(SubspaceModifier.width(1280.dp).height(800.dp).resizable().movable()) {
            val root = c.getEntities().entries.firstOrNull { it.value.coordinateSpace == CoordinateSpaceMode.ROOT }
            if (root != null) {
                val wc = root.value.components.find { it is SpatialWindowComponent } as? SpatialWindowComponent
                if (wc != null) {
                    SpatialWebViewUI(wc.nativeWebView, Modifier)
                }
            }
            Orbiter(
                position = OrbiterEdge.Top,
                offset = EdgeOffset.inner(offset = 20.dp),
                alignment = Alignment.End,
                shape = SpatialRoundedCornerShape(CornerSize(28.dp))
            ) {
                HomeSpaceModeIconButton(
                    onClick = onRequestHomeSpaceMode,
                    modifier = Modifier.size(56.dp)
                ).apply {
                    if (debugSpaceToggle) {
                        CoroutineScope(Dispatchers.Main).launch {
                            delay(1000)
                            onRequestHomeSpaceMode()
                        }
                    }
                }
            }
        }
        Volume(SubspaceModifier.width(300.dp).height(300.dp).depth(100.dp).movable()) {
            scope.launch {
                val modelResource = session.createGltfResourceAsync("https://github.com/KhronosGroup/glTF-Sample-Models/raw/refs/heads/main/2.0/Avocado/glTF-Binary/Avocado.glb")
                val model = modelResource.await()
                val modelEntity = session.createGltfEntity(model)
                it.addChild(modelEntity)
            }
        }
    }
}

@SuppressLint("RestrictedApi")
@Composable
fun My2DContent(onRequestFullSpaceMode: () -> Unit) {
    Surface(color = Color.Transparent) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Add a button to transition to homespace (maybe this should be handled by the webpage instead?)
            if (LocalHasXrSpatialFeature.current) {
                FullSpaceModeIconButton(
                    onClick = onRequestFullSpaceMode,
                    modifier = Modifier.padding(32.dp)
                ).apply {
                    if (debugSpaceToggle) {
                        CoroutineScope(Dispatchers.Main).launch {
                            delay(1000)
                            onRequestFullSpaceMode()
                        }
                    }

                }
            }
            // In 2D mode (homespace) we can only show one panel so we pick the first window containers root entity
            windowContainers.forEach { c ->
                val root = c.getEntities().entries.firstOrNull { it.value.coordinateSpace == CoordinateSpaceMode.ROOT }
                if (root != null) {
                    val wc = root.value.components.find { it is SpatialWindowComponent } as? SpatialWindowComponent
                    if (wc != null) {
                        SpatialWebViewUI(wc.nativeWebView, Modifier)
                    }
                }
            }
        }
    }
}

@Composable
fun MainContent(modifier: Modifier = Modifier) {
    Text(text = stringResource(R.string.hello_android_xr), modifier = modifier)
}

@Composable
fun FullSpaceModeIconButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    IconButton(onClick = onClick, modifier = modifier) {
        Icon(
            painter = painterResource(id = R.drawable.ic_full_space_mode_switch),
            contentDescription = stringResource(R.string.switch_to_full_space_mode)
        )
    }
}

@Composable
fun HomeSpaceModeIconButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    FilledTonalIconButton(onClick = onClick, modifier = modifier) {
        Icon(
            painter = painterResource(id = R.drawable.ic_home_space_mode_switch),
            contentDescription = stringResource(R.string.switch_to_home_space_mode)
        )
    }
}

@PreviewLightDark
@Composable
fun My2dContentPreview() {
    WebSpatialAndroidTheme {
        My2DContent(onRequestFullSpaceMode = {})
    }
}

@Preview(showBackground = true)
@Composable
fun FullSpaceModeButtonPreview() {
    WebSpatialAndroidTheme {
        FullSpaceModeIconButton(onClick = {})
    }
}

@PreviewLightDark
@Composable
fun HomeSpaceModeButtonPreview() {
    WebSpatialAndroidTheme {
        HomeSpaceModeIconButton(onClick = {})
    }
}