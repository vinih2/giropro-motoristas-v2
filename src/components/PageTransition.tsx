// src/components/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

// Define as animações (Variantes)
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8, // Começa levemente de baixo
  },
  in: {
    opacity: 1,
    y: 0, // Sobe para a posição 0
  },
  out: {
    opacity: 0,
    y: -8, // Sai levemente para cima
  },
};

// Define a duração e tipo de transição
const pageTransition = {
  type: 'tween',
  ease: 'anticipate', // Uma suavização elegante
  duration: 0.3, // Rápido!
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      {/* O "key={pathname}" é o segredo! 
        Ele diz ao AnimatePresence que a página mudou, 
        disparando a animação "exit" (out) da página antiga 
        e a "initial"/"in" da nova.
      */}
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition as any}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}