const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*(\w+)=(.*)$/m);
    if (m) {
      let val = m[2].replace(/\r$/, '');
      val = val.replace(/^['"]|['"]$/g, '');
      process.env[m[1]] = val;
    }
  }
}

const isWin = process.platform === 'win32';
const bin = path.join(__dirname, '..', 'node_modules', '.bin',
  isWin ? 'electron-builder.cmd' : 'electron-builder');
const args = process.argv.slice(2).join(' ');

execSync(`"${bin}" ${args}`, {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
  shell: true,
});
