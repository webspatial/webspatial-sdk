import { SpatialCustomVars, BackgroundMaterialDefault } from './const'

export const InjectClassName = 'xr-css-spatial-default'

function injectClassStyle() {
  const style = document.createElement('style')
  style.innerHTML = `
   .${InjectClassName} {
        ${SpatialCustomVars.backgroundMaterial}: ${BackgroundMaterialDefault};
    }
  `
  document.head.prepend(style)
}
injectClassStyle()
