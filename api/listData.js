// api/listData.js  (Vercel serverless function, ESM)
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const basePath = process.cwd();
  const dataDir = path.join(basePath, 'data');
  let dirList = [];
  let stat = null;
  try {
    dirList = fs.readdirSync(dataDir);
  } catch {}
  try {
    stat = fs.statSync(path.join(dataDir, 'ninety.csv'));
  } catch {}
  res.status(200).json({
    basePath,
    dataDir,
    dirList,
    ninetyExists: !!stat,
    ninetySize: stat?.size || 0
  });
}
