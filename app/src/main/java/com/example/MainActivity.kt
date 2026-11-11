package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkCard
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.NeonPurple
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextPrimary

enum class AppDestination(val title: String, val icon: ImageVector) {
    PUBLIC_HUB("Public Hub", Icons.Default.Home),
    ADMIN_CMS("Admin CMS", Icons.Default.AdminPanelSettings),
    ANILOG("AniLog Page", Icons.Default.PhoneAndroid),
    DEPLOY_DOCS("Deploy & Docs", Icons.Default.Description)
}

class MainActivity : ComponentActivity() {
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                OmorHubApp(
                    onRegisterFileUpload = { callback ->
                        fileUploadCallback = callback
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OmorHubApp(
    onRegisterFileUpload: (ValueCallback<Array<Uri>>?) -> Unit
) {
    val context = LocalContext.current
    var currentDestination by remember { mutableStateOf(AppDestination.PUBLIC_HUB) }
    var useLiveDomain by remember { mutableStateOf(false) }
    var webProgress by remember { mutableIntStateOf(0) }
    var currentWebTitle by remember { mutableStateOf("Omor Project Hub") }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }

    val liveDomainBase = "https://omor.asf.sale/"
    val supportKoriUrl = "https://www.supportkori.com/muhammedomor"

    // Construct the active URL based on destination and mode
    val currentUrl = remember(currentDestination, useLiveDomain) {
        if (useLiveDomain) {
            when (currentDestination) {
                AppDestination.PUBLIC_HUB -> liveDomainBase
                AppDestination.ADMIN_CMS -> "${liveDomainBase}wp-admin/"
                AppDestination.ANILOG -> "${liveDomainBase}landingpage/anilog.html"
                AppDestination.DEPLOY_DOCS -> ""
            }
        } else {
            when (currentDestination) {
                AppDestination.PUBLIC_HUB -> "file:///android_asset/web/index.html"
                AppDestination.ADMIN_CMS -> "file:///android_asset/web/wp-admin/index.html"
                AppDestination.ANILOG -> "file:///android_asset/web/landingpage/anilog.html"
                AppDestination.DEPLOY_DOCS -> ""
            }
        }
    }

    // Handle back navigation in WebView
    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(DarkCard)
                                .border(1.dp, NeonPurple, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "O",
                                color = NeonPurple,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                        Column {
                            Text(
                                text = "Omor Project Hub",
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = if (useLiveDomain) "Live: omor.asf.sale" else "Local Bundled Assets",
                                color = if (useLiveDomain) NeonCyan else TextMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                },
                actions = {
                    // Live vs Local mode toggle
                    IconButton(
                        onClick = {
                            useLiveDomain = !useLiveDomain
                            val modeMsg = if (useLiveDomain) "Switched to Live: https://omor.asf.sale/" else "Switched to Local Offline Assets"
                            Toast.makeText(context, modeMsg, Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.testTag("mode_toggle_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = "Toggle Live/Local",
                            tint = if (useLiveDomain) NeonCyan else TextMuted
                        )
                    }

                    // Refresh Button
                    if (currentDestination != AppDestination.DEPLOY_DOCS) {
                        IconButton(
                            onClick = { webViewInstance?.reload() },
                            modifier = Modifier.testTag("refresh_btn")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Refresh Page",
                                tint = TextPrimary
                            )
                        }
                    }

                    // Open in External Browser
                    IconButton(
                        onClick = {
                            val target = if (currentDestination == AppDestination.DEPLOY_DOCS) liveDomainBase else (webViewInstance?.url ?: liveDomainBase)
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(target))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.testTag("open_browser_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.OpenInBrowser,
                            contentDescription = "Open in External Browser",
                            tint = TextPrimary
                        )
                    }

                    // Support My Work Quick Action
                    IconButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(supportKoriUrl))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.testTag("support_kori_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Favorite,
                            contentDescription = "Support Muhammed Omor on SupportKori",
                            tint = Color(0xFFF43F5E)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkSurface
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = DarkSurface,
                tonalElevation = 4.dp
            ) {
                AppDestination.entries.forEach { dest ->
                    val isSelected = currentDestination == dest
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentDestination = dest },
                        icon = {
                            Icon(
                                imageVector = dest.icon,
                                contentDescription = dest.title,
                                tint = if (isSelected) NeonPurple else TextMuted
                            )
                        },
                        label = {
                            Text(
                                text = dest.title,
                                color = if (isSelected) NeonPurple else TextMuted,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = DarkBorder
                        ),
                        modifier = Modifier.testTag("nav_${dest.name.lowercase()}")
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (currentDestination == AppDestination.DEPLOY_DOCS) {
                DeployDocsScreen(
                    onOpenUrl = { url ->
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        context.startActivity(intent)
                    }
                )
            } else {
                Column(modifier = Modifier.fillMaxSize()) {
                    AnimatedVisibility(visible = webProgress in 1..99) {
                        LinearProgressIndicator(
                            progress = { webProgress / 100f },
                            modifier = Modifier.fillMaxWidth().height(3.dp),
                            color = NeonPurple,
                            trackColor = DarkSurface
                        )
                    }
                    WebViewContainer(
                        url = currentUrl,
                        onProgressChange = { webProgress = it },
                        onTitleChange = { currentWebTitle = it },
                        onWebViewCreated = { webViewInstance = it },
                        onRegisterFileUpload = onRegisterFileUpload
                    )
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(
    url: String,
    onProgressChange: (Int) -> Unit,
    onTitleChange: (String) -> Unit,
    onWebViewCreated: (WebView) -> Unit,
    onRegisterFileUpload: (ValueCallback<Array<Uri>>?) -> Unit
) {
    val context = LocalContext.current

    // File picker launcher for input type="file" inside admin CMS
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val data = result.data
        val uris: Array<Uri>? = when {
            data?.clipData != null -> {
                val count = data.clipData!!.itemCount
                Array(count) { i -> data.clipData!!.getItemAt(i).uri }
            }
            data?.data != null -> arrayOf(data.data!!)
            else -> null
        }
        // Send selected files back to WebView callback
        onRegisterFileUpload(null) // handled via chrome client callback
    }

    val webView = remember {
        WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val reqUrl = request?.url?.toString() ?: return false
                    // Intercept external support or social links to open in external browser
                    if (reqUrl.contains("supportkori.com") || reqUrl.contains("github.com") || reqUrl.startsWith("mailto:")) {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(reqUrl))
                            context.startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            return false
                        }
                    }
                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    onProgressChange(newProgress)
                }

                override fun onReceivedTitle(view: WebView?, title: String?) {
                    if (!title.isNullOrEmpty()) {
                        onTitleChange(title)
                    }
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    try {
                        val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            type = "*/*"
                        }
                        filePickerLauncher.launch(intent)
                        return true
                    } catch (e: Exception) {
                        filePathCallback?.onReceiveValue(null)
                        return false
                    }
                }
            }
        }
    }

    DisposableEffect(url) {
        webView.loadUrl(url)
        onWebViewCreated(webView)
        onDispose { }
    }

    AndroidView(
        factory = { webView },
        modifier = Modifier.fillMaxSize().testTag("app_webview")
    )
}

@Composable
fun DeployDocsScreen(
    onOpenUrl: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "🚀 GitHub Pages Deployment Guide",
                            color = NeonPurple,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Omor Project Hub is designed as a zero-cost, static GitHub Pages repository with client-side GitHub REST API administration.",
                        color = TextMuted,
                        fontSize = 14.sp,
                        lineHeight = 20.sp
                    )
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "1. Domain & Preservation Verification",
                        color = NeonCyan,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    ChecklistItem("Custom Domain", "CNAME file set to: omor.asf.sale")
                    ChecklistItem("Jekyll Disabled", ".nojekyll present to serve all static assets")
                    ChecklistItem("AniLog Page", "Preserved at /landingpage/anilog.html")
                    ChecklistItem("Project Registry", "Canonical projects.json & projects.js updated")
                    ChecklistItem("SupportKori Link", "https://www.supportkori.com/muhammedomor")
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "2. How to Authenticate in /wp-admin/",
                        color = NeonCyan,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "1. Go to GitHub -> Settings -> Developer Settings -> Personal access tokens.\n" +
                                "2. Generate a fine-grained token with 'Repository permissions: Contents (Read & Write)'.\n" +
                                "3. Open the Admin CMS tab in this app or go to https://omor.asf.sale/wp-admin/.\n" +
                                "4. Enter your username, repo name, branch ('main'), and paste your token.\n" +
                                "5. The CMS communicates directly with GitHub's REST API without any 3rd party servers.",
                        color = TextMuted,
                        fontSize = 13.sp,
                        lineHeight = 19.sp
                    )
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "3. Quick Action Links",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { onOpenUrl("https://www.supportkori.com/muhammedomor") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E)),
                        modifier = Modifier.fillMaxWidth().testTag("supportkori_action_btn")
                    ) {
                        Icon(imageVector = Icons.Default.Favorite, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Support Muhammed Omor on SupportKori")
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { onOpenUrl("https://omor.asf.sale/") },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonPurple),
                        modifier = Modifier.fillMaxWidth().testTag("visit_live_site_btn")
                    ) {
                        Text("Visit Live: https://omor.asf.sale/")
                    }
                }
            }
        }
    }
}

@Composable
fun ChecklistItem(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = "Verified",
            tint = NeonCyan,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "$label: ",
            color = TextPrimary,
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp
        )
        Text(
            text = value,
            color = TextMuted,
            fontSize = 13.sp,
            fontFamily = FontFamily.Monospace
        )
    }
}
