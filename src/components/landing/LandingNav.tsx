'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
            G
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">GiroPro</span>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost" className="font-bold text-gray-600 dark:text-gray-300">
            <Link href="/login">Entrar no app</Link>
          </Button>
          <Button
            asChild
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 font-bold rounded-full px-6 shadow-lg"
          >
            <Link href="/giropro-plus">Conhecer o Pro+</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
