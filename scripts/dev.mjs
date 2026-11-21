import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const windows = process.platform === 'win32';
const pythonPaths = [path.join(root, '.venv', windows ? 'Scripts/python.exe' : 'bin/python'), path.join(root, 'backend', '.venv', windows ? 'Scripts/python.exe' : 'bin/python')];
const python = pythonPaths.find(existsSync);
if (!python) {
  console.error('Prepara .venv en la raíz e instala backend/requirements-lock.txt antes de iniciar.');
  process.exit(1);
}
const services = [
  spawn(python, ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--env-file', '.env', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
  }),
  spawn(process.execPath, [path.join(root, 'frontend/node_modules/vite/bin/vite.js')], {
    cwd: path.join(root, 'frontend'), stdio: 'inherit', windowsHide: true,
  }),
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const service of services) service.kill();
  process.exitCode = code;
}
for (const service of services) {
  service.on('error', error => { console.error(error.message); stop(1); });
  service.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
