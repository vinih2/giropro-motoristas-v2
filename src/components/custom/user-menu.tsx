"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, LogOut, Settings, User as UserIcon, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService"; // Importa o serviço de auth

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();

  // Função de Logout Corrigida
  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast.error("Erro ao fazer logout.");
    } else {
      // MUDANÇA AQUI: Redireciona para a raiz (Landing Page)
      router.push("/");
      router.refresh(); // Força a atualização do layout
    }
  };

  // Função de atalho para a Garagem
  const goToGarage = () => {
    router.push('/manutencao');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-gray-200 dark:border-gray-800"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.user_metadata?.avatar_url || ""}
              alt={user?.user_metadata?.full_name || "Avatar"}
            />
            <AvatarFallback>
              {user?.email ? user.email[0].toUpperCase() : "G"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.user_metadata?.full_name || "Motorista Pro"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/giropro-plus')} className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4 text-orange-500" />
            <span>Meu Plano (PRO)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={goToGarage} className="cursor-pointer">
            <Wrench className="mr-2 h-4 w-4" />
            <span>GiroGarage</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}