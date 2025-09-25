// tests/example.test.ts

import { TestRunner, Spatialized2DElement, Transform } from '../src/test-api';
// 导入Jest类型
import type { jest } from '@jest/globals';

describe('WebSpatial自动化测试示例', () => {
  let testRunner: TestRunner;

  beforeAll(async () => {
    // 初始化测试环境
    testRunner = new TestRunner();
    await testRunner.init();
  });

  afterAll(async () => {
    // 关闭测试环境
    await testRunner.close();
  });

  beforeEach(async () => {
    // 清除之前测试的调用记录
    await testRunner.clearNativeCalls();
  });

  test('应该能够创建场景并添加2D元素', async () => {
    // 加载测试HTML
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSpatial Test</title>
        </head>
        <body>
          <div id="app">WebSpatial Test App</div>
        </body>
      </html>
    `;
    await testRunner.loadHtml(testHtml);

    // 获取场景
    const scene = testRunner.getScene();
    expect(scene).toBeDefined();

    // 创建2D元素
    const element = await testRunner.createSpatialized2DElement();
    expect(element).toBeDefined();
    expect(element.getId()).toMatch(/spatialized_2d_/);

    // 更新元素属性
    await element.updateProperties({
      width: 300,
      height: 200,
      cornerRadius: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 },
      material: "Translucent"
    });

    // 更新元素变换
    await element.updateTransform({
      position: { x: 0, y: 1.5, z: -2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });

    // 添加元素到场景
    await scene.add(element);

    // 验证JSB调用
    const jsbCalls = await testRunner.getJSBCalls();
    expect(jsbCalls.length).toBeGreaterThan(0);

    // 使用windowProxy写入HTML内容
    const windowProxy = element.windowProxy;
    expect(windowProxy).toBeDefined();

    // 设置内容
    await element.updateContent(`
      <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; }
            h1 { color: blue; }
          </style>
        </head>
        <body>
          <h1>Hello from WebSpatial Test</h1>
          <p>This content is injected via windowProxy</p>
        </body>
      </html>
    `);

    // 在windowProxy中执行JavaScript
    const title = await element.evaluate(() => {
      return document.querySelector('h1')?.textContent;
    });
    expect(title).toBe('Hello from WebSpatial Test');
  });

  test('应该能够模拟PlatformAbility接口', async () => {
    // 加载测试HTML
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PlatformAbility Test</title>
          <script>
            function testPlatformAbility() {
              if (window.WebSpatial && window.WebSpatial.PlatformAbility) {
                window.WebSpatial.PlatformAbility.callJSB('testMethod', { param: 'value' });
                return true;
              }
              return false;
            }
          </script>
        </head>
        <body>
          <button onclick="testPlatformAbility()">Test Platform Ability</button>
        </body>
      </html>
    `;
    await testRunner.loadHtml(testHtml);

    // 执行测试函数
    const result = await testRunner.runner.evaluate(() => {
      return (window as any).testPlatformAbility();
    });

    expect(result).toBe(true);

    // 验证JSB调用被记录
    const jsbCalls = await testRunner.getJSBCalls();
    expect(jsbCalls.length).toBe(1);
    expect(jsbCalls[0]).toContain('testMethod');
  });
});