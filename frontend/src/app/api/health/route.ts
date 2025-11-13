import { NextResponse } from 'next/server';

/**
 * Health check endpoint para Coolify y Docker
 * 
 * GET /api/health
 */
export async function GET() {
  try {
    // Verificar que las variables de entorno críticas estén configuradas
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'frontend',
      version: '1.0',
      environment: process.env.NODE_ENV,
      config: {
        api_url_configured: !!apiUrl,
        ws_url_configured: !!wsUrl,
      }
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'frontend',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
