import { startServer } from '../src/server/index.js';
if (!process.env.GAMEVERSE_DATABASE_URL || !process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
  throw Error('Configure GameVerse production database, auth secret and public origin before deploying');
}
const runtime = await startServer(3000, '127.0.0.1', true, undefined, { listen: false });
export default runtime.server;
