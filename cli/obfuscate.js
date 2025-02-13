const obfuscator = require('javascript-obfuscator');
const fs = require('fs-extra');
const glob = require('glob');
const obfuscate = async () => {
  try {
    const jsfiles = glob.sync('dist/**/*.js', {nodir: true});

    const tsfiles = [];// glob.sync('dist/**/*.ts', {nodir: true});
    const files=[...jsfiles, ...tsfiles];
    for (const file of files) {
      const code = await fs.readFile(file, 'utf-8');
      const obfuscatedCode = obfuscator.obfuscate(code).getObfuscatedCode();
      await fs.writeFile(file, obfuscatedCode, 'utf-8');
    }
  } catch (error) {
    console.error('Error while obfuscating files:', error);
  }
};

obfuscate();
