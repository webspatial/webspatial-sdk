export class AbortResourceManager {
  private resources: { destroy: () => Promise<void> | void }[] = []
  private aborted = false

  constructor(private signal: AbortSignal) {
    signal.addEventListener('abort', () => {
      this.aborted = true
      void this.dispose()
    })
  }

  async addResource<T extends { destroy: () => Promise<void> | void }>(
    factory: () => Promise<T>,
  ): Promise<T> {
    if (this.aborted) throw new DOMException('Aborted', 'AbortError')
    const resource = await factory()
    if (this.aborted) {
      await resource.destroy()
      throw new DOMException('Aborted', 'AbortError')
    }
    this.resources.push(resource)
    return resource
  }

  async dispose() {
    const resources = this.resources.splice(0)
    for (const r of resources) {
      try {
        await r.destroy()
      } catch (e) {
        console.error('AbortResourceManager dispose error:', e, r)
      }
    }
  }
}
