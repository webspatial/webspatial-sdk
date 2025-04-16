import { ParsedArgs } from 'minimist'
import Xcrun from '../xcode/xcrun'
export async function launch(args: ParsedArgs): Promise<boolean> {
  const bundleId = args['bundle-id'] ?? 'com.webspatial.test'
  Xcrun.launchWithSimulator(bundleId)
  return true
}
