import { createSpatialized2DElementCommand } from './JSBCommand'
import { Spatialized2DElement } from './Spatialized2DElement'

export async function createSpatialized2DElement(): Promise<Spatialized2DElement> {
  const result = await new createSpatialized2DElementCommand().execute()
  const id = result.data?.id
  if (!id) {
    throw new Error('createSpatialized2DElement failed')
  }
  return new Spatialized2DElement(id)
}
