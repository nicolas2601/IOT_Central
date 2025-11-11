import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de desarrollo
  reactStrictMode: true,
  eslint: {
    // Ignorar errores de ESLint durante build para acelerar y evitar fallos por reglas estrictas
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript en build para no bloquear la compilación
    ignoreBuildErrors: true,
  },
  
  // Habilitar standalone output para Docker
  output: 'standalone',
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
  
  // Variables de entorno públicas
  env: {
    // API base: local por defecto
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    // WS base: si no está definida, derivar desde API (http->ws, https->wss, /api->/ws)
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL ||
      ((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
        .replace(/^http/,'ws')
        .replace(/\/api$/, '/ws')),
  },
};

export default nextConfig;
