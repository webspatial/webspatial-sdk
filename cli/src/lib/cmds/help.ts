import {Log, ConsoleLog} from'../utils/Log';
import {ParsedArgs} from 'minimist';

const HELP_MESSAGES = new Map<string, string>(
  [
    ['main', [
      'picoxr-web [command] <options>',
      '',
      '',
      'help ................ shows this menu',
      'build ................ initializes a new TWA Project'+
        ' and generates an Android APK from a TWA Project',
      'check ............ validates if an URL matches the PWA Quality Criteria for Trusted' +
            ' Web Activity',
    ].join('\n')],
    ['build', [
      'Usage:',
      '',
      '',
      'picoxr-web build --url=[url]',
      'picoxr-web build --manifest=[local-manifest-path]',
    ].join('\n')],
    ['check', [
      'Usage:',
      '',
      '',
      'picoxr-web validate --url=[pwa-url]',
    ].join('\n')],
  ],
);

export async function help(args: ParsedArgs, log: Log = new ConsoleLog('help')): Promise<boolean> {
  // minimist uses an `_` object to store details.
  const command = args._[1];
  const message = HELP_MESSAGES.get(command) || HELP_MESSAGES.get('main');

  // We know we have a message for 'main', in case the command is invalid.
  log.info(message!);
  return true;
}
