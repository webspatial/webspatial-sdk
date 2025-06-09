# Test PWA Installability

Previous step: [Add Web App Manifest](add-web-app-manifest.md)

---

You can now launch the React site locally using your project's existing workflow.

Run the DevServer:

```shell
pnpm dev
```

Or run a static web server:

```shell
pnpm build
pnpm preview # `pnpm start` for Next.js
```

Then open the site's local URL in Chrome or Edge. You should see the PWA install button in the address bar of your browser:

![](../../../assets/guide/pwa-1.png)
![](../../../assets/guide/pwa-2.png)

Open your browser's DevTools, you should see how the browser has parsed the Web App Manifest for this page.

![](../../../assets/guide/pwa-3.png)

At this point, the site qualifies as a minimal PWA.

> [!NOTE]
> After deploying to production, the site must be served over HTTPS. Otherwise, the browser will not recognize it as a PWA.

---

Next step: [Step 1: Install the WebSpatial SDK](step-1-install-the-webspatial-sdk.md)
