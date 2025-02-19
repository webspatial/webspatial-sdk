import { Cli } from './lib/Cli'
import { ConsoleLog } from './lib/utils/Log'
import { CustomError } from './lib/utils/CustomError'

module.exports = async (): Promise<void> => {
  const cli = new Cli()
  const log = new ConsoleLog('cli')
  const args = process.argv.slice(2)

  let success
  try {
    success = await cli.run(args)
  } catch (err) {
    if (err instanceof CustomError) {
      const errors = err.customMessage
      if (Array.isArray(errors)) {
        errors.forEach(error => {
          log.error(`${error.code}: ${error.message}`)
        })
      } else {
        log.error(`${errors.code}: ${errors.message}`)
      }
    } else {
      log.error((err as any).message)
    }
    success = false
  }
  if (!success) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}
