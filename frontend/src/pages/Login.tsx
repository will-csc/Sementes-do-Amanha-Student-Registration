import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import { Mail, Lock } from 'lucide-react';

function toastError(message: string) {
  const msg = message.trim() || 'Erro ao entrar.';
  toast.error(msg, { id: `error:${msg}` });
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const result = login(email, password);
      if (result.ok) {
        navigate('/students');
        return;
      }
      toastError(result.reason);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-[108px] w-[108px] items-center justify-center rounded-2xl border border-border bg-transparent shadow-elevated">
            <img src={logo} alt="Logo" className="h-[90px] w-[90px] object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre na sua conta para continuar</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" size="lg">
              Entrar
            </Button>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
