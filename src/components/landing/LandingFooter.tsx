'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingFooter() {
  return (
    <footer className="py-12 border-t border-gray-100 dark:border-gray-800 text-center space-y-4">
      <p className="text-gray-800 dark:text-gray-200 text-lg font-black">Bora travar o lucro por km e dirigir no seu ritmo?</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-full px-6">
          <Link href="/login">Criar conta grátis</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link href="/giropro-plus">Conhecer o Pro+</Link>
        </Button>
      </div>
      <p className="text-gray-400 text-sm font-medium">© 2025 GiroPro. Feito para quem não para.</p>
    </footer>
  );
}
