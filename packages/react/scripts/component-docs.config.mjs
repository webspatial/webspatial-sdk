export const componentDocgenConfig = {
  outputFile: 'docs/generated/react-components.json',
  components: [
    {
      name: 'Model',
      sourceFile: 'packages/react/src/Model.tsx',
      propsType: 'ModelProps',
      refType: 'ModelRef',
    },
    {
      name: 'Reality',
      sourceFile: 'packages/react/src/reality/components/Reality.tsx',
      propsType: 'RealityProps',
    },
    {
      name: 'Entity',
      sourceFile: 'packages/react/src/reality/components/Entity.tsx',
      propsType: 'EntityComponentProps',
    },
    {
      name: 'BoxEntity',
      sourceFile: 'packages/react/src/reality/components/BoxEntity.tsx',
      propsType: 'BoxEntityProps',
    },
  ],
}
