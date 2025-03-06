import { Log, ConsoleLog } from '../utils/Log'
import { ParsedArgs } from 'minimist'

const HELP_MESSAGES = new Map<string, string>([
  [
    'main',
    [
      'webspatial [command] <options>',
      '',
      '',
      'help ................ shows this menu',
      'build ................ initializes a new WebSpatial Project' +
        ' and generates an Apple Vision Pro App from a WebSpatial Project',
      'dev ................ build and run WebSpatial Project on Apple Vision Pro simulator',
      'publish.............. upload WebSpatial Project to App Store Connect',
    ].join('\n'),
  ],
  [
    'build',
    [
      'Usage:',
      '',
      '',
      'webspatial build --manifest=<local-manifest-path> --project=<local-web-project-path> --teamId=<teamId> [--version=version] [--buildType=release-testing]',
      '',
      '',
      'webspatial build --manifest-url=<net-manifest-url> --teamId=<teamId> [--version=version] [--buildType=release-testing]',
    ].join('\n'),
  ],
  [
    'dev',
    [
      'Usage:',
      '',
      '',
      'webspatial dev --manifest=<local-manifest-path> --project=<local-web-project-path>',
      '',
      '',
      'webspatial dev --manifest-url=<net-manifest-url>',
    ].join('\n'),
  ],
  [
    'publish',
    [
      'Usage:',
      '',
      '',
      'webspatial publish --manifest=<local-manifest-path> --project=<local-web-project-path> --teamId=<teamId> --version=<version> --u=<username> --p=<password>',
      '',
      '',
      'webspatial publish --manifest-url=<net-manifest-url> --teamId=<teamId> --version=<version> --u=<username> --p=<password>',
      '',
      '',
      'webspatial publish --name=<app-name> --version=<version> --u=<username> --p=<password>',
    ].join('\n'),
  ],
])

export async function help(
  args: ParsedArgs,
  log: Log = new ConsoleLog('help'),
): Promise<boolean> {
  // minimist uses an `_` object to store details.
  const command = args._[1]
  const message = HELP_MESSAGES.get(command) || HELP_MESSAGES.get('main')

  // We know we have a message for 'main', in case the command is invalid.
  log.info(message!)
  return true
}
