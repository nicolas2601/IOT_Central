# Dockerfile optimizado para Frontend Next.js con standalone output
# Plataforma IoT - Despliegue en Coolify

# Stage 1: Base con Node.js
FROM node:18-alpine AS base

# Metadatos
LABEL maintainer="IoT Platform Team"
LABEL description="Frontend Next.js para Plataforma IoT"
LABEL version="1.0"

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat curl

# Stage 2: Instalar dependencias
FROM base AS deps

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Build de la aplicación
FROM base AS builder

WORKDIR /app

# Copiar dependencias desde deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de la aplicación Next.js con standalone output
RUN npm run build

# Stage 4: Imagen final optimizada para producción
FROM base AS runner

WORKDIR /app

# Configurar entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios desde builder
COPY --from=builder /app/public ./public

# Copiar standalone app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto 3000
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
