
# 测试 PWA 可安装性

上一步：[添加 Web App Manifest](add-web-app-manifest.md)

---

现在可以直接用当前项目原有的运行方式，把这个 React 网站在本地运行起来。

运行 DevServer：

```shell
pnpm dev
```

或运行静态 web 服务器：

```shell
pnpm build
pnpm preview # `pnpm start` for Next.js
```

然后在 Chrome / Edge 浏览器里打开网站的本地网址。
应该可以看到地址栏上出现了 PWA 的安装按钮：

![](../../../assets/guide/pwa-1.png)
![](../../../assets/guide/pwa-2.png)

打开浏览器 DevTools，应该可以看到浏览器对这个网页中 Web App Manifest 的解析结果：

![](../../../assets/guide/pwa-3.png)

到这里为止，这个网站已经成为了一个最简单的 PWA。

> [!NOTE]
> 部署到产品环境之后，需要使用 HTTPS 的 URL，否则不会被浏览器识别为 PWA


---

下一步： [步骤 1：安装 WebSpatial SDK](step-1-install-the-webspatial-sdk.md)
