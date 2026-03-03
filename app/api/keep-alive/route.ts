import { NextRequest, NextResponse } from "next/server";
import { keepAliveConfig } from "@/config/keep-alive-config";
import { pingSupabase } from "./helper";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    // Basic security check for Vercel Cron
    if (
        process.env.NODE_ENV === "production" &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const results = await Promise.all(
            keepAliveConfig.projects.map((project) => pingSupabase(project))
        );

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        return NextResponse.json({
            message: `Checked ${results.length} projects.`,
            summary: {
                success: successCount,
                failed: failureCount,
            },
            details: results,
        });
    } catch (error: any) {
        console.error("[Keep-Alive API Error]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
