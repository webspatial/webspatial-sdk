import { Command } from 'commander'
import { major } from 'semver'
import { fetchUtils } from './lib/utils/FetchUtils-1'
import { store, run, build } from './lib/cmds/build'
import { getVersion } from './lib/cmds/version'
import {
  fetch,
  downloadFile,
  decompressResponseBuffer,
} from './lib/utils/fetch'
import { launch } from './lib/cmds/launch'
import { shutdown } from './lib/cmds/shutdown'

module.exports = async (): Promise<void> => {
  if (major(process.versions.node) < 14) {
    throw new Error(
      `Current Node.js version is ${process.versions.node}.` +
        ' Node.js version 14 or above is required to run XRAPP BUILDER.',
    )
  }
  const program = new Command()
  fetchUtils.setFetch(fetch)
  fetchUtils.setDownloadFile(downloadFile)
  fetchUtils.setDecompressResponseBuffer(decompressResponseBuffer)
  await setupCommands(program)
  await program.parseAsync(process.argv)
}

async function setupCommands(program: Command) {
  const v = await getVersion()

  program
    .name('webspatial-builder')
    .description(
      'WebSpatial Builder is a client-side CLI tool used to generate cross platform XRApp projects.',
    )
    .version(v, '-v, --version')
    .configureHelp({ showGlobalOptions: true })

  // run command
  program
    .command('run')
    .description(
      'By compiling or running directly on the simulator the WebSpatial App',
    )
    .option('--manifest <manifest>', 'manifest path')
    .option('--project <project>', 'project path')
    .option('--manifest-url <manifestUrl>', 'manifest url')
    .option('--platform <platform>', 'xr platform')
    .option('--base <base>', 'base path')
    .option('--bundle-id <bundleId>', 'bundle id')
    .option('--tryWithoutBuild <tryWithoutBuild>', 'run without build')
    .action(async options => {
      await run(options)
    })

  // build command
  program
    .command('build')
    .description('Build WebSpatial App')
    .option('--manifest <manifest>', 'manifest path')
    .option('--project <project>', 'project path')
    .option('--manifest-url <manifest-url>', 'manifest url')
    .option('--platform <platform>', 'xr platform')
    .option('--version <version>', 'app version')
    .option('--buildType <buildType>', 'app build type')
    .option('--export <export>', 'export path')
    .option('--bundle-id <bundleId>', 'bundle id')
    .requiredOption('--base <base>', 'base path')
    .requiredOption('--teamId <teamId>', 'team id')
    .action(async options => {
      console.log(options)
      await build(options)
    })

  // store command
  program
    .command('publish')
    .description('Publish WebSpatial App')
    .option('--manifest <manifest>', 'manifest path')
    .option('--project <project>', 'project path')
    .option('--manifest-url <manifestUrl>', 'manifest url')
    .option('--platform <platform>', 'xr platform')
    .option('--buildType <buildType>', 'app build type')
    .option('--export <export>', 'export path')
    .option('--bundle-id <bundleId>', 'bundle id')
    .requiredOption('--base <base>', 'base path')
    .requiredOption('--teamId <teamId>', 'team id')
    .requiredOption('--version <version>', 'app version')
    .requiredOption('--u <username>', 'username')
    .requiredOption('--p <password>', 'password')
    .action(async options => {
      console.log(options)
      await store(options)
    })

  // launch command
  program
    .command('launch')
    .description('Launch WebSpatial App')
    .option('--bundle-id <bundleId>', 'bundle id')
    .action(async options => {
      console.log(options)
      await launch(options)
    })

  // shutdown command
  program
    .command('shutdown')
    .description('Shutdown Simulator')
    .action(async options => {
      console.log(options)
      await shutdown(options)
    })
}
