// @ts-nocheck
import React, { useEffect } from 'react'
import {
  testCreateSpatialized2DElement,
  testSpatialSceneCorner,
  testSpatialSceneMaterial,
  testSpatialInspect,
  testSpatialSceneInspect,
  testAddMultipleSpatialized2DElement,
  testAddMultipleSpatializedStatic3DElement,
} from './jsapi'

export default function JSAPITest() {
  useEffect(() => {
    testCreateSpatialized2DElement().then(spatialized2DElement => {
      testAddMultipleSpatialized2DElement(spatialized2DElement)
    })
    window.testSpatialSceneInspect = testSpatialSceneInspect
  }, [])

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">JS API Test</h1>
      <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
        <p className="mb-4">
          JS API tests are running. Check the scene for created elements.
        </p>
        <div className="flex flex-col gap-2">
          <button
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => testSpatialSceneInspect()}
          >
            Inspect Scene
          </button>
        </div>
      </div>
    </div>
  )
}
