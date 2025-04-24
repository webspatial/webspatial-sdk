import * as minimist from 'minimist'
import { major } from 'semver'
import { ConsoleLog } from '../lib/utils/Log'
import { fetchUtils } from './utils/FetchUtils-1'
import { help } from './cmds/help'
import { start, store, run, build } from './cmds/build'
import { version } from './cmds/version'
import { fetch, downloadFile, decompressResponseBuffer } from './utils/fetch'
import { launch } from './cmds/launch'
import { shutdown } from './cmds/shutdown'
export class Cli {
  static log: ConsoleLog = new ConsoleLog('webspatial-builder')
  async run(args: string[]): Promise<boolean> {
    if (major(process.versions.node) < 14) {
      throw new Error(
        `Current Node.js version is ${process.versions.node}.` +
          ' Node.js version 14 or above is required to run XRAPP BUILDER.',
      )
    }

    fetchUtils.setFetch(fetch)
    fetchUtils.setDownloadFile(downloadFile)
    fetchUtils.setDecompressResponseBuffer(decompressResponseBuffer)
    const parsedArgs = minimist(args)

    let command: any = undefined
    if (parsedArgs._.length === 0) {
      // Accept --version and --help alternatives for the help and version commands.
      if (parsedArgs.version) {
        command = 'version'
      } else if (parsedArgs.help) {
        command = 'help'
      }
    } else {
      command = parsedArgs._[0]
    }

    // If no command is given, default to 'help'.
    if (!command) {
      command = 'help'
    }
    switch (command) {
      case 'help':
      case 'h':
        return await help(parsedArgs)
      case 'build':
        return await build(parsedArgs)
      case 'publish':
        return await store(parsedArgs)
      case 'run':
        return await run(parsedArgs)
      case 'launch':
        return launch(parsedArgs)
      case 'shutdown':
        return shutdown(parsedArgs)
      // case 'check':
      //   return await check(config, parsedArgs);
      case 'version': {
        return await version()
      }
      default:
        throw new Error(
          `"${command}" is not a valid command! Use 'bubblewrap help' for a list of commands`,
        )
    }
  }
}
