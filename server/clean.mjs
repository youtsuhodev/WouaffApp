import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

['dist', resolve(__dirname, '../client/dist')].forEach((d) => {
  if (existsSync(d)) {
    rmSync(d, { recursive: true, force: true });
    console.log(`🧹 cleaned ${d}`);
  }
});
