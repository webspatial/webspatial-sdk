import { createSpatialized2DElementCommand } from './JSBCommand'
import { Spatialized2DElement } from './Spatialized2DElement'

export async function createSpatialized2DElement(): Promise<Spatialized2DElement> {
  const result = await new createSpatialized2DElementCommand().execute()
  if (!result.success) {
    throw new Error('createSpatialized2DElement failed')
  } else {
    const { id, windowProxy } = result.data!
    return new Spatialized2DElement(id, windowProxy)
  }
}
