import { rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

['dist', resolve(__dirname, '../client/dist')].forEach(d => {
  if (existsSync(d)) {
    rmSync(d, { recursive: true, force: true });
    console.log(`🧹 cleaned ${d}`);
  }
});
