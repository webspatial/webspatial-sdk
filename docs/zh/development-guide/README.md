# 开发指南

WebSpatial SDK 开发综合指南。

## 目录

- [支持 WebSpatial 的 Web 项目](web-projects-that-support-webspatial/README.md)
  - [创建新的 Web 项目](web-projects-that-support-webspatial/creating-new-web-projects.md)
- [在 Web 项目中启用 WebSpatial](enabling-webspatial-in-web-projects/README.md)
  - [前置任务：成为（最简单的）PWA](enabling-webspatial-in-web-projects/prerequisite-become-a-minimal-pwa.md)
    - [添加图标文件](enabling-webspatial-in-web-projects/add-icon-files.md)
    - [[选项 1] 手动添加 Manifest](enabling-webspatial-in-web-projects/option-1-manually-add-a-manifest.md)
    - [[选项 2] 使用工具自动添加 Manifest](enabling-webspatial-in-web-projects/option-2-auto-add-manifest-using-tools.md)
    - [测试 PWA 可安装性](enabling-webspatial-in-web-projects/test-pwa-installability.md)
  - [步骤 1：安装 WebSpatial SDK](enabling-webspatial-in-web-projects/step-1-install-the-webspatial-sdk.md)
  - [步骤 2：添加 WebSpatial 应用打包构建工具](enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps.md)
    - [WebSpatial Builder 的参数](enabling-webspatial-in-web-projects/parameters-of-the-webspatial-builder.md)
    - [[可选] 用 dotenv 简化 Builder 的用法](enabling-webspatial-in-web-projects/optional-simplify-webspatial-builder-using-dotenv.md)
  - [步骤 3：在 Web 构建工具中集成 WebSpatial SDK](enabling-webspatial-in-web-projects/step-3-integrate-webspatial-sdk-into-web-build-tools.md)
    - [配置 JS/TS 编译器](enabling-webspatial-in-web-projects/configure-js-ts-compiler.md)
    - [在 Web 构建工具中集成优化和默认配置](enabling-webspatial-in-web-projects/add-optimizations-and-defaults-to-web-build-tools.md)
    - [生成 WebSpatial 专用网站](enabling-webspatial-in-web-projects/generate-a-webspatial-specific-website.md)
    - [检查是否在 WebSpatial 模式下运行](enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md)
- [使用 WebSpatial API](using-the-webspatial-api/README.md)
  - [把 HTML 元素空间化](using-the-webspatial-api/spatialize-html-elements.md)
  - [添加材质背景](using-the-webspatial-api/add-material-backgrounds.md)
  - [抬升 2D 元素](using-the-webspatial-api/elevate-2d-elements.md)
  - [管理多个场景](using-the-webspatial-api/manage-multiple-scenes.md)
  - [添加 3D 内容](using-the-webspatial-api/add-3d-content.md)
- [使用 Core SDK](using-the-core-sdk/README.md)
- [常见问题](faq.md)
- [故障排除](troubleshooting.md)
