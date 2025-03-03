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
      'build ................ initializes a new TWA Project' +
        ' and generates an Apple Vision Pro App from a TWA Project',
    ].join('\n'),
  ],
  [
    'build',
    [
      'Usage:',
      '',
      '',
      'webspatial build --manifest=[local-manifest-path] --project=[local-web-project-path] --teamId=[teamId]',
      '',
      '',
      'webspatial build --manifest-url=[net-manifest-url] --teamId=[teamId]',
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
