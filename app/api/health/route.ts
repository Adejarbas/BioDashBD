import { NextRequest, NextResponse } from 'next/server'
import logger from "@/lib/logger-winston";

let isReplicaWarm = false;

export async function GET(req: NextRequest) {
  try {
    const verbose = req.nextUrl.searchParams.get('verbose') === 'true';
    if (!isReplicaWarm) {
      isReplicaWarm = true;
      logger.info("Starting BioDash API - Health check readiness confirmed (Cold Start)", {
        coldStart: true,
        status: 'ok',
      });
    } else if (verbose || process.env.LOG_HEALTH_CHECKS === 'true') {
      logger.info("Health check called", { status: 'ok', verbose });
    } else {
      logger.debug("Health check called", { status: 'ok' });
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'biodash-backend',
      version: '1.0.0'
    })
  } catch (error: any) {
    logger.error("Health check failed", { error: error.message });
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
