---
sidebar_position: 2
slug: mdx-demo-real
title: 03 MDX test page
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import BrowserWindow from '@site/src/components/BrowserWindow';

**Over all introduction**：[What is WebSpatial](https://bytedance.larkoffice.com/wiki/XpeywZRbdiSt2DkWepmck8CHnnc)

> 本章节是一个简短的、最简化的示例，包括项目搭建、SDK 安装和配置、开发流程示例、空间化能力预览等。
>
> This section provides a **brief and minimal example** covering project setup, SDK installation and configuration, a basic development workflow, and a preview of spatial capabilities.
>
> To keep things **concise and immediately impactful**, the example in this section does **not include detailed explanations**. Please follow each step **exactly as written**—many of them are essential—to ensure a smooth experience.
>
> Once you've completed the walkthrough and seen WebSpatial in action, you can refer to the **[WebSpatial Developer Guide](https://bytedance.larkoffice.com/wiki/HcAkwmwHzirkXpkgzMHckDrhnac)** for more advanced use cases, option explanations, and best practices tailored to real-world projects.

## 1.  Create a standard React + Vite + TypeScript project

> First, make sure **Node.js is installed** on your system. (You can find installation instructions on the [official Node.js website](https://nodejs.org).)

Run the following command to create the project:

```javascript
npx create-vite --template react-ts
```

In the project’s root directory, install dependencies:

```javascript
npm install
```

> 🔴 **Note:** Any text highlighted in red below indicates **temporary commands or configuration** that are functional for now but **will be updated to official syntax before the public release**.

## 1.  **Install WebSpatial SDK**

```json
npm install --save @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
npm install --save-dev @webspatial/builder @webspatial/vite-plugin @webspatial/platform-visionos vite-plugin-html
```

## 1.  **Integrate the WebSpatial SDK into your web build tool (Vite)**

First, Edit  `tsconfig.app.json` 和 `tsconfig.node.json`, Add the following configuration:

```javascript
{
  "compilerOptions": {
    "jsxImportSource": "@webspatial/react-sdk",
```

Edit `vite.config.ts`：

- **Add the WebSpatial Vite plugin**
- **Inject the** **`$XR_ENV`** **environment variable** into both JavaScript and HTML to distinguish WebSpatial runtime mode

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import WebSpatial from "@webspatial/vite-plugin";
import { createHtmlPlugin } from "vite-plugin-html";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    WebSpatial(),
    createHtmlPlugin({
      inject: {
        data: {
          XR_ENV: process.env.XR_ENV,
        },
      },
    }),
  ],
});
```

Run the **Dev Server for non-XR platforms** (e.g. desktop or mobile). **Keep this server running throughout the following steps.**

```javascript
npm run dev
```

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=ZDVlNWYzN2QwYjJlZTcxMjYxMzdkYWM2YTYwYjAwNmVfWG9QRzgyZWlnZVhGU0Z1dURxVmNYdEwwa1V3dklWOEVfVG9rZW46RnFScWIyYkxSb1I4MjN4VFB4YXVHeGE1c0NiXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

Open the URL shown in the terminal using a desktop browser (e.g. Chrome) and confirm that the app renders correctly.

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=OGQ0YzdlY2JkNWNmNDY1NDcxMDhiZmVmZWYzOTcyMjVfeUVrM3A5VTI0cUtNV096Z1g0a3A1bkFlclZPZ1RLdVVfVG9rZW46SlhXMWJTNEszb1lKNmN4VGoyQXU3M2kwczRnXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

Next, open a **new terminal window** (from the project root directory), and run a **second Dev Server** dedicated to serving the **WebSpatial application on visionOS**. **Keep this server running throughout the rest of the setup process.**

```javascript
XR_ENV=avp npm run dev
```

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=NDM1MWNkOTUzZmVmYTZhZWY2MzQ1YjZhYjQ4NGVhZWRfM1R6YVh6QjBtZVFLa0h3emhNbEZFcG1lcFN0MW1kNmxfVG9rZW46T011SmJLd21ub2ZhVm14V0hRanVBNWZNc2lmXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Build and Run Your WebSpatial App**

Before using the WebSpatial build toolchain, you’ll need to install **Xcode** and the **visionOS Simulator**.

> **Prerequisite:** You must be using a **Mac** computer.

Steps:

1. Open the **Mac App Store**, search for **“Xcode”**, and install it.
2. Launch Xcode for the first time. Accept the license agreement and enter your administrator password to install additional components.
3. From the top menu, go to **“Xcode” > “Settings…”** to open the settings panel.
4. In the **“Components”** tab under **Platform Support**, find and install **visionOS** and **visionOS Simulator**.

Run the **WebSpatial packaging tool’s development command**:

> Replace $XR_DEV_SERVER the URL that generated from previous step `XR_ENV=avp npm run dev`

```javascript
npx webspatial-builder run --base=$XR_DEV_SERVER
```

This will automatically launch the **visionOS Simulator**, install the packaged WebSpatial app, and run it immediately.

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=NjUxMzMzODEyYWIyYTZmNTY2MmFlNDY4ZmFiMmM2ODVfMWxKTnRycmFXd251eWsxR0JOaDVPOG5BOE1LMU92M05fVG9rZW46TVp4dGJXeUZIb3EyYjh4dkNpeHVOTk96c2JjXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=OGIwYWMwMGJkMDQxNzgwY2I4OGFjMzg3MDU2YmViOTdfWUNJYzJBRk80R3BvUFVNS3c5MnVoSHJxeW9pSG5mcHlfVG9rZW46VHJERmJsekR6b1JTNEJ4TFpQcXU3emVyc0RmXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Configure Initial Scene Properties**

The following configuration is **currently functional** as a temporary solution:：

> First, follow **[Option 1]** under the [[Option 1\] Manually Add Manifest](https://bytedance.larkoffice.com/wiki/L51owDHc2iX4TqkJyXbcKZT0nld) section to manually create a **Web App Manifest** file.
>
> Then, add the following configuration to define the **default size of the initial scene (xr_main_scene)**:
>
> ```json
>   "display": "minimal-ui",
>   "xr_main_scene": {
>     "default_size": {
>       "width": 500,
>       "height": 1000
>     }
>   },
>   "icons": [
> ```

The following is the **intended official configuration**, but it is **not yet supported** in the current version:

> You’ll need to create a **partial Web App Manifest** (only compatible with the `webspatial-builder run` command for now).
>
> ```javascript
> touch public/manifest.webmanifest
> ```
>
> Inside the `xr_main_scene`, configure the **default size of the initial scene (starting window)** as follows:
>
> ```json
> {
>   "xr_main_scene": {
>     "default_size": {
>       "width": 500,
>       "height": 1000
>     }
>   }
> }
> ```

Rerun the WebSpatial application packaging tool introduced earlier (execute the `run `command), and you can see that the starting scene of the application becomes the style of the mobile application:

> Note: There is currently a bug that causes sometimes the starting scene of the application to be blank after repackaging and running. In this case, as long as you manually delete the application in the emulator, exit the emulator, and repackage and run it, it will work normally.

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=N2MyOGNiMDU2NTY0YTk3M2E3N2ViN2EzYjZlMTRiZTVfU3FMajdNUlRiNU9YMXRwd0JSU3cxMzduTVZnMVVvTVpfVG9rZW46VUhUWmI2b0t2b1dEMUx4aDNyRXVvcGFDc3dlXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Add a new scene**

First, add a new page.

Create `src/SecondPage.tsx `:

```TypeScript
import { useState } from "react";
import "./App.css";

function SecondPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Second Page</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default SecondPage;
```

In `src/App.tsx` add:

```python
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SecondPage from "./SecondPage";
```

Install the routing library:

```json
npm install --save react-router-dom
```

Put the original JSX content of the App component in `src/App.tsx `into the specified position of the new JSX below:

```javascript
  return (
    <Router basename={__XR_ENV_BASE__}>
      <Routes>
        <Route path="/second-page" element={<SecondPage />} />
        <Route
          path="/"
          element={
            /* 把 src/App.tsx 中 App 组件原有的 JSX 内容全部放到这里 */
          }
        />
      </Routes>
    </Router>
  );
```

Added page "/second-page":

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=OGY5YjBlZGVlMTNjNDJlZDgwNmJkYjM0YzViMGRkMWRfWXEyUDZJVTY4Szc3NmRZakhjcWpTb1YxeUVoOUtuaWJfVG9rZW46WDhuWmJYUWtjb3AwQTV4ZFBteXVHdTEzc3VkXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

Add a card at the end `of src/App.tsx `(below `< p className = "read-the-docs" > `) that contains:

- A link that always opens in a new window "/second-page"
- A button opens "/second-page" in the window with the specified name.

```xml
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
              <div className="card" style={{ marginTop: "0px" }}>
                <h2>Open Second Page</h2>
                <p>
                  <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
                </p>
                <p>
                  <button
                    onClick={() => {
                      window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
                    }}>
                    Open Second Page with a Button
                  </button>
                </p>
              </div>
```

Click the link or button to display a new space application scenario with the content of "/second-page":

<video data-lark-video-uri="drivetoken://ER4vbUz2loAopZxjjOquP8Xss1b" data-lark-video-mime="video/mp4" data-lark-video-size="76193434" data-lark-video-duration="0" data-lark-video-name="3月21日.mp4" data-lark-video-width="1522" data-lark-video-height="1080"></video>

## 1.  **Set the initialization properties of the new scene**

Introduce the scene initialization API of WebSpatial SDK `in src/App.tsx `:

```javascript
import { initScene } from "@webspatial/react-sdk";
```

Before opening the scene named "secondScene", initialize it first.

```javascript
                    onClick={() => {
                      initScene("secondScene", prevConfig => {
                        return {
                          ...prevConfig,
                          defaultSize: {
                            width: 500,
                            height: 500,
                          },
                        };
                      });
                      window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
```

Click the button to see that the default size of the secondScene scene has changed.

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=NmExOWQ3NjU2NTZjNmEyYzVjYjY5ZWE0OThlYzYxZjdfOTJlOWkwOEZNZnA0QnBvak5yWGE3V205Q1BZNHJZN3ZfVG9rZW46RGlIVWJHQXc4b2Y2VFp4UnJ2TXVIWXlnc2ViXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Add material background**

Modify `index.html `to add a `XR_ENV `-specific classname to `< html > `:

```javascript
<%- XR_ENV === 'avp' ? `
<html lang="en" class="is-spatial">
  ` : `
  <html lang="en">
    ` %>
```

Add the following code at the end of `src/index.css `to set the background of the scene in `XR_ENV `mode to a fully transparent material (using the `--xr-background-material `in the WebSpatial API):

```javascript
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;
}
```

> Note: Because WebSpatial API does not support HMR temporarily, sometimes you need to manually refresh the page (through the scene menu in the lower right corner) or restart devServer to see the changes take effect

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=NmMzMjM1ZWRkYzQ2ODJiMGI4MzRkZTFkZDM2ZjQ2NWNfdzNhcHZ2OWs5R2R5SnN1ZGVqOHJMTVU0UWprMm1KanBfVG9rZW46UWdyMmJ1TFZHb1lnTkx4SXZXWXVzdmlYc2RlXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=MTE4ODc5YzE5OTc3ZTc4N2M4MDdhMTNjOWY3MmEyNGRfcU5RdHZrUVQ0MHRzOU5wVU53cmZvQzRWRGNLbUNnT01fVG9rZW46Q0FvaWJBMnExb0JUTnN4WDlCZXUyNEJDc2ViXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

Modify `src/App.tsx `to set the two card elements as "spatialized elements" and add a special classname.

Set the links in the link-card as "spatialized elements".

```xml
              <h1>Vite + React</h1>
              <div className="card count-card" enable-xr>
              <div className="card link-card" enable-xr>
                <h2>Open Second Page</h2>
                <p>
                  <a href="/second-page" target="_blank" enable-xr>
                    Open Second Page with a Link
                  </a>
```

In the `XR_ENV `mode special style of `src/index.css `, set the background of these two card elements to different translucent materials, and set the nested links in link-card to different translucent material backgrounds:

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;

  .count-card {
    --xr-background-material: thick;
    position: relative;
  }

  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    top: 20px;

    a {
      display: block;
      --xr-background-material: thick;
      border-radius: 10px;
    }
  }
}
```

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=OTRiM2UyMTU4N2ExYzUzYjg0NWNkZjMxYWQ0NTliYjNfY2tIbWo4UXFXcWxKVmYwU0VJaVA0bWJyV0ZuRDdCZlpfVG9rZW46UUNRdWIyVmNZb0UySzF4Qko4cHU5bXhqczNYXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=NWQ3ZjVkNDQzMWE2MTVkZGMyNmI4YzBkYmI0YWMwMjZfTVdPdWd2M3pYZkUyT1dPWXg0SGtVT293S1FuY3l0eEdfVG9rZW46VWhrV2I2dXk3b2JKYXR4VXhVRnVVOHFjc1NnXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Uplift "spatialized element**

Set the description information in count-card as "spatialized element".

```HTML
                <p enable-xr>
                  Edit <code>src/App.tsx</code> and save to test HMR
                </p>
```

In the `XR_ENV `mode-specific style of `src/index.css `, change this description information to relative positioning, and use the new Z-axis positioning API ( **`--xr-back `**) in the WebSpatial API to "lift" it to the 3D space in front of the webpage plane.

For the link elements that have been spatialized before, they are also "lifted" to varying degrees.

```yaml
  .count-card {
    --xr-background-material: thick;
    position: relative;

    p {
      --xr-background-material: transparent;
      position: absolute;
      bottom: -10px;
      left: 0;
      right: 0;
      --xr-back: 20;
    }
  }

  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
```

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=M2I1NzA2MDE2NDM1MjkyMWUwZGE5OTE5Nzk3MDUwM2VfTXdtMkZUb2V3c1VCeUpId0E1WTloRThHbTIySnVsQUdfVG9rZW46Skh2emJQQ1kxb2JyV0N4bUI2WHVkT0Juc09iXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=ZTQ0MTIxZDVkNTJmNzc0NWQ2OGFkMjdiNmFjMTc0MDlfODc2THdmeGM4MnU2RFIyd0pxTjBPS2JoWDVGd09JNFNfVG9rZW46WmxtUGJMVTdzb25QSnR4Tml0aXU4c0Vjc1QxXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

Another "lift" method is to use CSS Transform, which can not only change the positioning on the Z-axis in 3D space, but also deform and rotate in 3D space.

In `src/index.css `'s `XR_ENV `mode special style, do some Z-axis movement and rotation (around the X-axis) on the link-card:

```css
  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
    transform-origin: top left;
    transform: translateZ(30px) rotateX(30deg);
```

![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=Y2M2MGQ4NjZiZDQ3ZGU5ZmE3Njk2YzlkMjkyZTMyMzZfUUdWZmZZOE0wdUxZYVF0ZUplSndibXpxYUMwOHNTRDhfVG9rZW46TTdrb2JFTGZxb3ZTZ2t4NUJwYnVjUWJJczNiXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)![img](https://bytedance.larkoffice.com/space/api/box/stream/download/asynccode/?code=ZDM4MzE5MjI1M2UxZDgyZTMwZGViMWFmNTI2ZWYwZjFfcFBtaVF0MFkyOWxCUkVLZEhUVGlUOWgxN3h4VXlJdktfVG9rZW46Qmt4VGJRSXBhb1RFSmN4VEx4MXVodXF4c0hHXzE3NDY3Nzk2MjM6MTc0Njc4MzIyM19WNA)

## 1.  **Add static 3D content**

> To be supplemented

Know more about WebSpatial Core Concepts: [WebSpatial Core Concepts (WIP)](https://bytedance.larkoffice.com/wiki/R6AHwkmTuiRV4xk8RPCc2M5Intc)
