import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Fallback - redirecionar mesmo se der erro
      window.location.href = "/";
    }
  };

  const navItems = [
    { path: "/", label: "Home", icon: "fas fa-home" },
    { path: "/forums", label: "Fóruns", icon: "fas fa-comments" },
    { path: "/calendar", label: "Calendário", icon: "fas fa-calendar" },
    { path: "/rules", label: "Regras", icon: "fas fa-gavel" },
  ];

  const activities = [
    { path: "/activities", label: "Todas Atividades", icon: "fas fa-clock" },
    { path: "/search", label: "Pesquisar", icon: "fas fa-search" },
  ];

  const tools = [
    { path: "/metadata-cleaner", label: "Limpador de Metadados", icon: "fas fa-tools" },
    { path: "/copy-obfuscator", label: "Ofuscador de Copy", icon: "fas fa-shield-alt" },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-border flex-shrink-0">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center transform rotate-45">
                <div className="transform -rotate-45">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Fórum</h1>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  BlackByte
                </h2>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    location === item.path
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Activities Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Atividades
            </h3>
            <div className="space-y-1">
              {activities.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      location === item.path
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <i className={`${item.icon} w-5`}></i>
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Links Úteis
            </h3>
            <div className="space-y-1">
              {tools.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      location === item.path
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <i className={`${item.icon} w-5`}></i>
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Area */}
        <div className="p-4 border-t border-border">
          {user ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.firstName?.[0] || (user.email?.[0] ?? 'U').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {user.firstName || user.email}
                  </div>
                  <div 
                    className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      user.role === 'moderador' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      user.role === 'vip' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="secondary"
                className="w-full"
                data-testid="button-logout"
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                data-testid="button-login"
              >
                Entrar
              </Button>
              <Button
                onClick={() => window.location.href = '/register'}
                variant="secondary"
                className="w-full"
                data-testid="button-register"
              >
                Cadastrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
