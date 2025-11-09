"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/animations/FadeInSection";
import { 
  Home, 
  Cpu, 
  BarChart2, 
  Settings, 
  Terminal, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Dispositivos",
      href: "/dashboard/devices",
      icon: <Cpu className="h-5 w-5" />,
    },
    {
      title: "Telemetría",
      href: "/dashboard/telemetry",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Comandos",
      href: "/dashboard/commands",
      icon: <Terminal className="h-5 w-5" />,
    },
    {
      title: "Configuración",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      

      {/* Sidebar */}
      <FadeInSection>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300 md:relative md:z-0",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            collapsed ? "w-[70px]" : "w-64"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary p-1 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary-foreground"
                >
                  <path d="M16 22h4a2 2 0 0 0 2-2v-4" />
                  <path d="M9 16.25a2.25 2.25 0 0 0 4.5 0" />
                  <path d="M13 2H9.5a5.5 5.5 0 0 0 0 11H13a5.5 5.5 0 0 0 0-11Z" />
                  <path d="M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18" />
                </svg>
              </div>
              {!collapsed && <span className="font-semibold">IoT Platform</span>}
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        collapsed ? "justify-center px-2" : "px-3"
                      )}
                    >
                      {item.icon}
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground text-center">
              {!collapsed && <p>IoT Platform v1.0</p>}
            </div>
          </div>
        </aside>
      </FadeInSection>
    </>
  );
}
