'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Terminal,
  Bell,
  Settings,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Items del menú de navegación
 */
const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dispositivos',
    href: '/dashboard/devices',
    icon: Cpu,
  },
  {
    title: 'Telemetría',
    href: '/dashboard/telemetry',
    icon: Activity,
  },
  {
    title: 'Comandos',
    href: '/dashboard/commands',
    icon: Terminal,
  },
  {
    title: 'Alertas',
    href: '/dashboard/alerts',
    icon: Bell,
  },
  {
    title: 'Analíticas',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Usuarios',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

/**
 * Componente Sidebar
 * 
 * Menú lateral de navegación del dashboard.
 * Incluye:
 * - Logo de la aplicación
 * - Items de navegación con iconos
 * - Indicador de ruta activa
 * - Responsive (colapsable en mobile)
 */
export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-white border-r transition-all duration-300',
          'md:sticky md:top-0 md:z-30',
          collapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo y Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-lg">IoT Platform</span>
              </Link>
            )}
            {collapsed && (
              <div className="bg-blue-600 p-2 rounded-lg mx-auto">
                <Cpu className="h-6 w-6 text-white" />
              </div>
            )}
            
            {/* Botón de colapsar (solo desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-gray-100',
                    isActive
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'text-gray-700',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            {!collapsed ? (
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">Plataforma IoT v1.0</p>
                <p>© 2025 Todos los derechos reservados</p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500">
                <p>v1.0</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
