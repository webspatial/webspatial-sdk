import { GetSessionShape } from './getSession'

// Create the default Spatial session for the app
let spatial: GetSessionShape['spatial'] = null

/** @hidden */
export const getSession: GetSessionShape['getSession'] = () => {
  return null
}

export { spatial }
