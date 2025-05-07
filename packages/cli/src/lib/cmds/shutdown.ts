import { ParsedArgs } from 'minimist'
import Xcrun from '../xcode/xcrun'
export async function shutdown(args: ParsedArgs): Promise<boolean> {
  Xcrun.shutdownSimulator()
  return true
}
