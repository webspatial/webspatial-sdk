import {Cli} from './lib/Cli';
import {ConsoleLog} from './lib/utils/Log';
import {CustomError} from './lib/utils/CustomError';
// TODO: 检测本包更新，提示用户更新
// TODO: 代码混淆，压缩为单个文件，删除ts
module.exports = async (): Promise<void> =>{
  // console.log('start', new Date().toLocaleString());
  const cli = new Cli();
  const log = new ConsoleLog('cli');
  const args = process.argv.slice(2);

  let success;
  try {
    success = await cli.run(args);
  } catch (err) {
    // 可安装检测错误
    if (err instanceof CustomError) {
      const errors = err.customMessage;
      if (Array.isArray(errors)) {
        errors.forEach((error) => {
          log.error(`${error.code}: ${error.message}`);
        });
      } else {
        log.error(`${errors.code}: ${errors.message}`);
      }
      // 其他错误
    } else {
      log.error((err as any).message);
    }
    success = false;
  }
  if (!success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};
