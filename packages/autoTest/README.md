# Webspatial Puppeteer 实现

本目录包含了用于在Puppeteer环境中模拟Vision OS空间WebView功能的实现。该实现使开发者能够在不依赖Vision OS设备的情况下测试空间Web应用程序。

## 实现概览

我们实现了与Vision OS中的`spatialWebController`、`spatialWebView`和`SpatialWebViewModel`相同逻辑和功能的组件，主要包括：

1. **iframe管理系统**：使用iframe模拟Vision OS中的window.open功能
2. **协议拦截和处理机制**：支持`webspatial://`开头的协议处理
3. **空间元素创建和管理**：实现`Spatialized2DElement`创建和管理流程

## 核心组件

### 1. WebView相关组件
- **PuppeteerWebController**：负责管理WebView实例和iframe
- **PuppeteerWebViewModel**：处理协议处理器注册和iframe管理
- **PuppeteerWebView**：具体的WebView实现，管理iframe实例

### 2. 协议处理系统
- **ProtocolHandlerManager**：统一管理协议处理器的注册和分发
- **WebspatialProtocolHandler**：专门处理`webspatial://`协议请求

### 3. 模型类
- **SpatialScene**：空间场景模型
- **Spatialized2DElement**：空间2D元素模型

## 使用方法

### 初始化WebView系统

```typescript
// 初始化Puppeteer WebController和WebViewModel
import { PuppeteerWebController } from './src/webview/PuppeteerWebController';
import { PuppeteerWebViewModel } from './src/webview/PuppeteerWebViewModel';

// 创建Puppeteer页面实例后
const webController = new PuppeteerWebController(puppeteerPage);
const webViewModel = new PuppeteerWebViewModel(webController);

// 设置协议处理器
webViewModel.setupProtocolHandlers();
```

### 注册自定义协议处理器

```typescript
// 注册自定义协议处理器
webViewModel.addOpenWindowListener('myapp', async (url) => {
  // 处理自定义协议请求
  console.log('处理自定义协议:', url);
  // 返回处理结果
  return { id: 'custom-window-1', webViewModel };
});
```

### 处理webspatial协议

webspatial协议处理已内置支持，包括：

- `createSpatializedElement`：创建空间元素
- `updateSpatializedElement`：更新空间元素
- `addChildElement`：添加子元素
- 等其他操作

示例：

```typescript
// 通过webspatial协议创建空间元素
const url = 'webspatial://createSpatializedElement?type=Spatialized2DElement&width=300&height=200&x=100&y=50';
const result = await webViewModel.onOpenWindowInvoke(url);
console.log('创建的元素ID:', result.id);
```

## 运行测试

### 前置条件

确保已安装项目依赖：

```bash
cd /Users/bytedance/Projects/reactProj/webspatialTest/webspatial-sdk
npm install
```

### 运行测试

使用以下命令运行测试：

```bash
# 在autoTest包目录下
cd packages/autoTest
npx vitest run

# 或直接从项目根目录
npm test -- --scope=@webspatial/autotest
```

### 测试内容

测试套件验证了以下功能：

1. PuppeteerWebController的iframe管理功能
2. PuppeteerWebViewModel的协议处理功能
3. ProtocolHandlerManager的协议注册和分发功能
4. WebspatialProtocolHandler的协议解析和处理功能
5. Spatialized2DElement的创建和管理功能
6. 完整的从协议调用到元素创建的流程

## License

MIT