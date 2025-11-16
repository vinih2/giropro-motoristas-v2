// src/components/custom/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Map, 
  History, 
  Wrench, 
  BarChart3, 
  Crown, 
  Wallet,
  LayoutDashboard // MUDANÇA: Ícone de Dashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "./user-menu";
import ThemeToggle from "../ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth"; 

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  // Lista de Links de Navegação (APP LOGADO)
  const navItems = [
    // MUDANÇA: "Início" -> "Dashboard" e ícone
    { name: "Dashboard", href: "/", icon: LayoutDashboard }, 
    { name: "Insights", href: "/insights", icon: Map },
    { name: "Histórico", href: "/historico", icon: History },
    { name: "Garagem", href: "/manutencao", icon: Wrench },
    { name: "Financeiro", href: "/financeiro", icon: Wallet },
    { name: "Desempenho", href: "/desempenho", icon: BarChart3 },
  ];

  return (
    <>
      {/* --- NAVBAR SUPERIOR (Desktop & Header Mobile App) --- */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-orange-500 to-yellow-500 p-2 rounded-lg group-hover:scale-110 transition-transform shadow-md shadow-orange-500/20">
                <span className="text-white font-bold text-xl leading-none">G</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 hidden sm:block">
              GiroPro
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
               const isActive = pathname === item.href;
               return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                      isActive
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4")} />
                    {item.name}
                  </Link>
               );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/giropro-plus">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 hover:bg-orange-100 hover:text-orange-800 rounded-full px-4 gap-2 group shadow-sm"
                >
                    <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs uppercase tracking-wide">Seja PRO+</span>
                </Button>
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* --- NAVBAR INFERIOR (Mobile Only) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems
            .filter(i => !i.desktopOnly) 
            .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-95 relative",
                  isActive ? "text-orange-600 dark:text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                {isActive && (
                    <span className="absolute -top-0.5 w-8 h-1 bg-orange-500 rounded-b-full shadow-sm shadow-orange-500/50" />
                )}
                
                <item.icon 
                    className={cn("w-6 h-6 transition-transform duration-300", isActive ? "scale-110 -translate-y-0.5" : "scale-100")} 
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-bold uppercase tracking-wide">{item.name}</span>
              </Link>
            );
          })}
          
          <Link
            href="/giropro-plus"
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-yellow-600 dark:text-yellow-500 active:scale-95"
          >
            <Crown className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-wide">PRO+</span>
          </Link>
        </div>
      </nav>
    </>
  );
}