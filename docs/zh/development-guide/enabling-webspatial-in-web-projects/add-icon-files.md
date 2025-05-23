
# 添加图标文件

返回：[前置任务：成为（最简单的）PWA](prerequisite-become-a-minimal-pwa.md)

---

第一步是提供应用图标，WebSpatial 项目的最佳实践是至少提供以下图标文件：

| 图标大小 | 用途        | 场景                                                       | 透明背景 | 自带圆角 | 如何提供                           |
|---------|------------|------------------------------------------------------------|---------|---------|------------------------------------|
| 48×48   | favicon.ico | 浏览器标签栏                                               | 必须    | 允许    | [HTML 里的 `<link>`](#)                 |
| 180×180 | [iOS 设备](#)    | “添加到主屏幕” 功能                                         | 不允许  | 不允许  | [HTML 里的 `<link>`](#)                 |
| 192×192 | 常规 PWA    | 主屏幕上的小图标                                           | 需要    | 需要    | Web App Manifest                   |
| **512×512** | 常规 PWA    | 启动画面和应用商店等场景中更大的图标                       | 需要    | 需要    | Web App Manifest                   |
| **1024×1024** | [visionOS 应用](#) | Vision Pro 中的应用图标                                   | **不允许**  | **不允许**  | WebSpatial + Web App Manifest      |


示例（可以直接在 demo 中使用）：

[webspatial-icon-examples.zip](../../../assets/guide/webspatial-icon-examples.zip)


在 PWA 原有要求的基础上，[Packaged WebSpatial App](#) 对于图标有额外要求：

由于 visionOS 应用的最小图标尺寸是 1024x1024，且系统会自动把图标裁剪为圆形，所以要让网站成为 Packaged WebSpatial App 上架 visionOS 应用商店，必须基于 PWA 标准提供**最小尺寸为 1024x1024、[`maskable` 类型（不能有透明背景和圆角）](#)** 的图标。

> [!TIP]
> 其他 PWA 图标（比如 512x512 和 192x192 这两个版本）默认为 [`"any"` 类型，有圆角和透明背景](#)（因为不是每个平台都支持自动裁剪）。

最简化的情况下，要分别在桌面平台和 visionOS 中作为独立应用运行，至少要提供 512x512 和 1024x1024 这两个版本的图标，前者是 `"any"` 类型，后者是 `"maskable"` 类型。

在 [Web App Manifest](#) 中，这两个图标会这样配置：

```json5
  "icons": [
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-1024-maskable.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
```

---

下一步：[添加 Web App Manifest](add-web-app-manifest.md)
