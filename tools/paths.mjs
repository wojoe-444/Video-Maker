// Where generated content lives. The repo holds code only; pieces, renders and media live in the content root:
//   VIDEOMAKER_HOME if set, else %LOCALAPPDATA%\VideoMaker on Windows, else ~/.local/share/VideoMaker.
// resolvePiece(arg): an existing path is used as given; a bare name like "my-piece" means <content root>/pieces/my-piece.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function contentRoot() {
  if (process.env.VIDEOMAKER_HOME) return path.resolve(process.env.VIDEOMAKER_HOME);
  if (process.env.LOCALAPPDATA) return path.join(process.env.LOCALAPPDATA, 'VideoMaker');
  return path.join(os.homedir(), '.local', 'share', 'VideoMaker');
}

export function resolvePiece(arg) {
  if (!arg) return arg;
  if (fs.existsSync(arg)) return path.resolve(arg);
  if (!/[\\/]/.test(arg)) return path.join(contentRoot(), 'pieces', arg);
  return path.resolve(arg);
}
