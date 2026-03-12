import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import { LogOut, Users, UserPlus, Settings as SettingsIcon } from 'lucide-react';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/students', label: 'Alunos', icon: Users },
    { path: '/students/new', label: 'Cadastrar', icon: UserPlus },
  ];
  if (isAdmin) {
    navItems.push({ path: '/settings', label: 'Configurações', icon: SettingsIcon });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/students" className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-transparent">
              <img src={logo} alt="Logo" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-lg font-bold text-foreground">Sementes do Amanhã</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-sm text-muted-foreground md:inline">{user?.email}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
