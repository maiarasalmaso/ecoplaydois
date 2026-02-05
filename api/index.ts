// Vercel Serverless Function Entry Point (ESM Wrapper)

export default async function handler(req: any, res: any) {
    try {
        // Dynamic import to handle potential startup errors safely
        const appModule = await import('../server/src/app');
        const app = appModule.default;

        // Forward request to Express app
        return app(req, res);
    } catch (error: any) {
        console.error("Critical Startup Error:", error);
        res.status(500).json({
            error: "Critical Startup Error",
            message: error.message,
            stack: error.stack,
            type: "ESM Import Failure"
        });
    }
}
