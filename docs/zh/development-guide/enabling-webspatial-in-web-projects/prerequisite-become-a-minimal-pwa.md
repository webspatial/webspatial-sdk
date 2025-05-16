
# 前置任务：成为（最简单的）PWA

上一步：
- 使用已存在的 Web 项目：[支持 WebSpatial 的 Web 项目](../web-projects-that-support-webspatial/README.md)
- 创建全新的 WebSpatial 项目：[创建新的 Web 项目](../web-projects-that-support-webspatial/creating-new-web-projects.md)

---

要让 WebSpatial 应用具备原生空间应用的能力和体验（比如能有[自己的独立窗口]()，而不是只能运行在浏览器里），首先需要它不仅仅是「一堆网页」，要先成为一个「应用」，需要增加应用层面的信息——比如应用名称、应用图标、应用的[起始界面]()。

> 传统网站只是一堆网页的松散组合，原本是不包含这些信息的，只有网页自身的信息（比如网页标题、网页图标）。

有些 WebSpatial 应用还需要能像原生应用一样上架应用商店，通过应用商店接触到平台上的用户。

> [!TIP]
> 对于当前[基于 Hybrid 技术]()的 WebSpatial 应用，上架应用商店对于获取用户来说是非常必要的。

在成为「应用」的同时，需要保证自己仍然是一个标准的网站，可以在浏览器里运行，才能保持 Web 项目[原有的能力——比如跨平台、可以用 URL 分享、免安装按需运行]()。

Web 标准中的 [PWA 技术]()可以满足以上需求，为网站补充应用层面的信息，让网站具备可安装能力。
WebSpatial 基于各种现有的主流 Web API，包括 PWA 标准。

所以在引入 WebSpatial API 之前，需要首先确保你的网站已经是一个标准的 PWA。

> [!IMPORTANT]
> 如果只需要生成应用[在 visionOS 模拟器里安装和运行]()，不需要先成为一个 PWA，[WebSpatial Builder]() 会自动补充默认的应用名称、应用图标等信息（类似 placeholder 的作用）。
> 而如果要构建出应用安装包，[在真实的 Vision Pro 设备上安装和测试]()，乃至[通过 App Store Connect 来分发]()，有自己真正的名称和图标等基础应用信息，就需要先成为一个 PWA 了。

如果你的网站还不是 PWA，你只需要让它成为一个最简单的 PWA——只要网站中[包含 Web App Manifest，能作为 PWA 被安装]()，就能满足 WebSpatial 的需求。

步骤如下：
1. [添加图标文件](add-icon-files.md)
2. [添加 Web App Manifest](add-web-app-manifest.md)
3. [测试 PWA 可安装性](test-pwa-installability.md)


