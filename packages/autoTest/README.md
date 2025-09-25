# WebSpatial 自动化测试包

这个包提供了针对WebSpatial应用的自动化测试能力，特别适用于Linux环境下的无图形界面测试。

## 特性

- 基于Puppeteer的无头浏览器运行时，支持Linux环境
- 消费继承了WebSpatial SDK的HTML页面
- 适配CoreSDK中的PlatformAbility接口
- 提供SpatialScene和Spatialized2DElement等领域模型
- 支持Spatialized2DElement.windowProxy接口，可以往里面写入HTML内容

## 安装

```bash
npm install --save-dev @webspatial/autotest
```

## 使用方法

### 基本用法

```typescript
import { TestRunner } from '@webspatial/autotest';

// 创建测试运行器
const testRunner = new TestRunner();

// 初始化测试环境
await testRunner.init();

// 加载HTML内容
await testRunner.loadHtml('<html>...</html>');

// 获取场景
const scene = testRunner.getScene();

// 创建2D空间化元素
const element = await testRunner.createSpatialized2DElement();

// 更新元素属性
await element.updateProperties({
  width: 300,
  height: 200,
  cornerRadius: 10,
  resolution: 2
});

// 更新元素变换
await element.updateTransform({
  position: { x: 0, y: 1.5, z: -2 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
});

// 添加元素到场景
await scene.addElement(element);

// 使用windowProxy写入HTML内容
await element.setContent('<html>...</html>');

// 在windowProxy中执行JavaScript
const result = await element.evaluateInWindow(() => {
  return document.title;
});

// 关闭测试环境
await testRunner.close();
```

### 与Jest集成

```typescript
import { TestRunner } from '@webspatial/autotest';

describe('WebSpatial测试', () => {
  let testRunner: TestRunner;

  beforeAll(async () => {
    testRunner = new TestRunner();
    await testRunner.init();
  });

  afterAll(async () => {
    await testRunner.close();
  });

  beforeEach(async () => {
    await testRunner.clearNativeCalls();
  });

  test('应该能够创建2D元素', async () => {
    await testRunner.loadHtml('<html>...</html>');
    const scene = testRunner.getScene();
    const element = await testRunner.createSpatialized2DElement();
    
    await scene.addElement(element);
    
    // 验证JSB调用
    const jsbCalls = await testRunner.getJSBCalls();
    expect(jsbCalls.length).toBeGreaterThan(0);
  });
});
```

## API参考

### TestRunner

测试运行器，提供测试环境的初始化、场景和元素的创建等功能。

```typescript
class TestRunner {
  // 初始化测试环境
  async init(options?: TestRunnerOptions): Promise<void>;
  
  // 加载HTML内容
  async loadHtml(html: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }): Promise<void>;
  
  // 获取场景
  getScene(sceneSelector?: string): SpatialScene;
  
  // 创建2D空间化元素
  async createSpatialized2DElement(): Promise<Spatialized2DElement>;
  
  // 获取记录的原生调用
  getNativeCalls(): NativeCall[];
  
  // 清除记录的原生调用
  async clearNativeCalls(): Promise<void>;
  
  // 获取记录的JSB调用
  async getJSBCalls(): Promise<string[]>;
  
  // 关闭测试环境
  async close(): Promise<void>;
}
```

### SpatialScene

空间场景，用于管理空间化元素。

```typescript
class SpatialScene {
  // 添加元素到场景
  async addElement(element: SpatializedElement): Promise<void>;
  
  // 从场景中移除元素
  async removeElement(element: SpatializedElement): Promise<void>;
  
  // 获取场景中的元素
  async getElements(): Promise<SpatializedElement[]>;
}
```

### Spatialized2DElement

2D空间化元素，支持windowProxy接口。

```typescript
class Spatialized2DElement extends SpatializedElement {
  // 获取windowProxy
  getWindowProxy(): WindowProxy;
  
  // 设置HTML内容
  async setContent(html: string): Promise<void>;
  
  // 在windowProxy中执行JavaScript
  async evaluateInWindow<T>(fn: () => T): Promise<T>;
  
  // 更新2D元素属性
  async updateProperties(properties: Spatialized2DElementProperties): Promise<void>;
}
```

## 在Linux环境中使用

在Linux环境中使用时，需要安装Puppeteer所需的依赖：

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

## 注意事项

- 此测试包仅模拟了CoreSDK的部分功能，不能完全替代真实设备上的测试
- 在CI/CD环境中使用时，确保安装了所有必要的依赖
- 对于复杂的3D交互测试，建议结合真实设备测试进行验证