/* @vitest-environment jsdom */

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpatialPBRMaterialOptions } from '@webspatial/core-sdk'

vi.mock('./UnlitMaterial', () => ({
  UnlitMaterial: (props: { id: string }) => (
    <div data-testid="unlit-material" data-id={props.id} />
  ),
}))

vi.mock('./PBRMaterial', () => ({
  PBRMaterial: (props: { id: string } & SpatialPBRMaterialOptions) => (
    <div
      data-testid="pbr-material"
      data-id={props.id}
      data-metalness={props.metalness}
    />
  ),
}))

describe('Material dispatcher', () => {
  afterEach(cleanup)

  it('routes SpatialMaterialType "pbr" to PBRMaterial', async () => {
    const { Material } = await import('./Material')
    const { getByTestId, queryByTestId } = render(
      <Material type="pbr" id="hood" metalness={0} roughness={0.2} />,
    )

    expect(getByTestId('pbr-material').getAttribute('data-id')).toBe('hood')
    expect(getByTestId('pbr-material').getAttribute('data-metalness')).toBe('0')
    expect(queryByTestId('unlit-material')).toBeNull()
  })

  it('routes SpatialMaterialType "unlit" to UnlitMaterial', async () => {
    const { Material } = await import('./Material')
    const { getByTestId, queryByTestId } = render(
      <Material type="unlit" id="flat" color="#fff" />,
    )

    expect(getByTestId('unlit-material').getAttribute('data-id')).toBe('flat')
    expect(queryByTestId('pbr-material')).toBeNull()
  })
})
