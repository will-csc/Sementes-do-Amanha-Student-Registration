import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    const timeoutId = window.setTimeout(() => {
      navigate(user ? "/students" : "/login", { replace: true });
    }, 2500);
    return () => window.clearTimeout(timeoutId);
  }, [isReady, navigate, user]);

  const destination = user ? "/students" : "/login";
  const destinationLabel = user ? "Voltar para alunos" : "Ir para login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">Pagina nao encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          {isReady
            ? user
              ? "Redirecionando para a lista de alunos..."
              : "Redirecionando para o login..."
            : "Carregando..."}
        </p>
        <Button type="button" onClick={() => navigate(destination, { replace: true })}>
          {destinationLabel}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
