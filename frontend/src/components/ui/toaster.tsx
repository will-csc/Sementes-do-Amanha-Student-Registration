import React from "react";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      richColors
      position="top-center"
      duration={5000}
      offset={{ top: "45%" }}
    />
  );
}
