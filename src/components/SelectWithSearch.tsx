// src/components/SelectWithSearch.tsx
'use client';

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "./ui/skeleton";

interface FipeOption {
  codigo: string;
  nome: string;
}

interface SelectWithSearchProps {
  label: string;
  placeholder: string;
  options: FipeOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  onClear: () => void;
}

/**
 * Componente Select com funcionalidade de busca (Combobox) baseado em Popover e Command.
 * Usado para listas grandes como Marcas e Modelos FIPE.
 */
export function SelectWithSearch({
  options,
  selectedValue,
  onSelect,
  placeholder = "Selecione...",
  label,
  disabled = false,
  loading = false,
  onClear,
}: SelectWithSearchProps) {
  const [open, setOpen] = React.useState(false);

  // Busca o rótulo (label) do valor selecionado
  const selectedLabel = options.find((option) => option.codigo === selectedValue)?.nome;

  return (
    <div className="relative">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              'w-full justify-between h-12 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-base transition-all',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
                <span className="animate-pulse text-sm text-gray-500 dark:text-gray-400">Carregando...</span>
            ) : selectedLabel ? (
              <span className="truncate text-base">{selectedLabel}</span>
            ) : (
              <span className="text-base text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
            
            <div className="flex items-center gap-2">
              {selectedValue && !loading && (
                   <X 
                      className="size-4 shrink-0 opacity-70 hover:opacity-100 transition-opacity" 
                      onClick={(e) => {
                          e.stopPropagation();
                          onClear();
                      }}
                   />
              )}
              <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} className="h-9" />
            <CommandList>
              <CommandEmpty>
                {loading ? <Skeleton className="w-full h-8" /> : "Nenhum resultado encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.codigo}
                    value={option.nome}
                    onSelect={(currentValue) => {
                      const selected = options.find(o => o.nome.toLowerCase() === currentValue.toLowerCase());
                      if (selected) {
                          onSelect(selected.codigo);
                      }
                      setOpen(false);
                    }}
                    className="text-sm cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedValue === option.codigo ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
