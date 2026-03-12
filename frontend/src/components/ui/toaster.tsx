import React from "react";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      richColors
      position="top-right"
    />
  );
}
