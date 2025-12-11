'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ScenarioTagDialogProps = {
  open: boolean;
  value: string;
  suggestion: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ScenarioTagDialog({
  open,
  value,
  suggestion,
  onValueChange,
  onConfirm,
  onSkip,
  onOpenChange,
}: ScenarioTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">Adicionar etiqueta</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Ajude a identificar rapidamente este plano no simulador. Este passo é opcional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={suggestion || 'Ex.: Plano manhã, Evento especial'}
            autoFocus
          />
          <p className="text-[11px] text-gray-400">Você pode deixar em branco e salvar mesmo assim.</p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={onSkip}>
            Salvar sem etiqueta
          </Button>
          <Button className="w-full sm:w-auto" onClick={onConfirm}>
            Salvar favorito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
