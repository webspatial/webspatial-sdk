// src/runtime/puppeteerRunner.ts

import puppeteer, { Browser, Page } from 'puppeteer';

export class PuppeteerRunner {
  browser: Browser | null = null;
  page: Page | null = null;
  private jsHandlers: Map<string, (...args: any[]) => any> = new Map();

  async start(options?: { width?: number; height?: number }): Promise<void> {
    const width = options?.width || 1280;
    const height = options?.height || 800;
    
    this.browser = await puppeteer.launch({
      headless: true as any, // 使用无头模式，更好地支持Linux环境
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        `--window-size=${width},${height}`
      ]
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width, height });
    
    // 设置默认超时时间
    await this.page.setDefaultNavigationTimeout(60000);
    await this.page.setDefaultTimeout(30000);
  }

  async setContent(html: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }): Promise<void> {
    if (!this.page) throw new Error('Runner not started');
    await this.page.setContent(html, { waitUntil: options?.waitUntil || 'networkidle0' });
  }

  async expose(name: string, fn: (...args: any[]) => any): Promise<void> {
    if (!this.page) throw new Error('Runner not started');
    await this.page.exposeFunction(name, fn);
  }

  async evaluate<T>(fn: (...args: any[]) => T | Promise<T>, ...args: any[]): Promise<T> {
    if (!this.page) throw new Error('Runner not started');
    return this.page.evaluate(fn, ...args);
  }

  async evaluateOnNewDocument(fn: () => void | Promise<void>): Promise<void> {
    if (!this.page) throw new Error('Runner not started');
    await this.page.evaluateOnNewDocument(fn);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
