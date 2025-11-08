'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';




/**
 * Layout del Dashboard
 * 
 * Layout protegido que incluye:
 * - Sidebar de navegación
 * - Header con usuario y notificaciones
 * - Área de contenido principal
 * - Responsive con menú colapsable
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#0B0F20] via-[#0B0F20] to-[#1B1445]">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Contenido Principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          {/* Área de Contenido */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
