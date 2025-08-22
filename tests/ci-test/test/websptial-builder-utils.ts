import { exec, execSync } from 'child_process'

export async function runWebSpatialBuilder(
  base: string,
  logBuilder: boolean = true,
) {
  return new Promise((resolve, reject) => {
    exec(
      `node ../../packages/cli/bin/bundlepwa.js run --base=${base}`,
      (error: any, stdout: any, stderr: any) => {
        if (logBuilder) {
          if (stdout) {
            console.log('stdout:' + stdout)
          }
          if (stderr) {
            console.log('stderr:' + stderr)
          }
          if (error) {
            console.log('error:' + error)
          }
        }

        if (error) {
          reject(error)
        } else {
          console.log('Builder finished')
          resolve(null)
        }
      },
    )
  })
}
