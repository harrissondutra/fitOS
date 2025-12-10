
import { VercelRequest, VercelResponse } from '@vercel/node';
import server from '../src/index';

// Initialize the server (this connects to DB but skips listening on port in Vercel mode)
// We await the start process to ensure DB connection is initiated
// Note: In serverless, cold start might delay the first request.
const appPromise = server.start().then(() => server.getApp());

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const app = await appPromise;

    // Forward the request to the Express app
    // @ts-ignore - Express app is compatible with Vercel handler signature mostly
    return app(req, res);
}
