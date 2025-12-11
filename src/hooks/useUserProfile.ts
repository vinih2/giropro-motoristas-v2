"use client";

import { useContext } from "react";
import { UserProfileContext } from "@/context/UserProfileContext";

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return context;
}
