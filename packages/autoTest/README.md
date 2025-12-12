# Webspatial Puppeteer Implementation

This directory contains an implementation that simulates VisionOS spatial WebView features in a Puppeteer environment. It enables developers to test spatial web applications without relying on VisionOS devices.

## Overview

We implemented components with similar logic and functionality to VisionOS `spatialWebController`, `spatialWebView`, and `SpatialWebViewModel`, mainly including:

1. **Iframe management system**: use iframes to simulate VisionOS `window.open` behavior
2. **Protocol interception and handling**: support the `webspatial://` protocol
3. **Spatial element creation and management**: implement `Spatialized2DElement` creation and management

## Core Components

### 1. WebView-related components
- **PuppeteerWebController**: manages WebView instances and iframes
- **PuppeteerWebViewModel**: handles protocol handler registration and iframe management
- **PuppeteerWebView**: concrete WebView implementation that manages iframe instances

### 2. Protocol handling system
- **ProtocolHandlerManager**: manages registration and dispatch of protocol handlers
- **WebspatialProtocolHandler**: handles `webspatial://` protocol requests

### 3. Model classes
- **SpatialScene**: spatial scene model
- **Spatialized2DElement**: spatial 2D element model

## Usage

### Initialize WebView system

```typescript
// Initialize Puppeteer WebController and WebViewModel
import { PuppeteerWebController } from './src/webview/PuppeteerWebController';
import { PuppeteerWebViewModel } from './src/webview/PuppeteerWebViewModel';

// After creating a Puppeteer page instance
const webController = new PuppeteerWebController(puppeteerPage);
const webViewModel = new PuppeteerWebViewModel(webController);

// Set protocol handlers
webViewModel.setupProtocolHandlers();
```

### Register a custom protocol handler

```typescript
// Register custom protocol handler
webViewModel.addOpenWindowListener('myapp', async (url) => {
  // Handle custom protocol request
  console.log('Handle custom protocol:', url);
  // Return result
  return { id: 'custom-window-1', webViewModel };
});
```

### Handle webspatial protocol

Handling of the webspatial protocol is built-in, including:

- `createSpatializedElement`: create spatial element
- `updateSpatializedElement`: update spatial element
- `addChildElement`: add child element
- other actions

Example:

```typescript
// Create spatial element via webspatial protocol
const url = 'webspatial://createSpatializedElement?type=Spatialized2DElement&width=300&height=200&x=100&y=50';
const result = await webViewModel.onOpenWindowInvoke(url);
console.log('Created element ID:', result.id);
```

## Run tests

### Prerequisites

Ensure project dependencies are installed:

```bash
cd /Users/bytedance/Projects/reactProj/webspatialTest/webspatial-sdk
npm install
```

### Execute tests

Run tests with:

```bash
# In autoTest package directory
cd packages/autoTest
npx vitest run

# Or directly from repository root
npm test -- --scope=@webspatial/autotest
```

### Test contents

The test suite verifies:

1. Iframe management in PuppeteerWebController
2. Protocol handling in PuppeteerWebViewModel
3. Protocol registration and dispatch in ProtocolHandlerManager
4. Parsing and handling in WebspatialProtocolHandler
5. Creation and management of Spatialized2DElement
6. Full flow from protocol invocation to element creation

## License

MIT
