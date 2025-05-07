import { ParsedArgs } from 'minimist'
import Xcrun from '../xcode/xcrun'
export async function launch(args: ParsedArgs): Promise<boolean> {
  const bundleId = args['bundle-id'] ?? 'com.webspatial.test'
  const appInfo = {
    name: '',
    id: bundleId,
  }
  Xcrun.launchWithSimulator(appInfo)
  return true
}
