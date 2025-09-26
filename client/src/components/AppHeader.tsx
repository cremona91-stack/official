import { Button } from "@/components/ui/button";
import { FileText, Utensils, ChefHat, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/Logo";

interface AppHeaderProps {
  onExportPDF?: () => void;
}

export default function AppHeader({ onExportPDF }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const handleExportPDF = () => {
    console.log("PDF export triggered");
    onExportPDF?.();
  };
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    // Replit Auth logout via redirect
    window.location.href = "/api/logout";
  };

  // Get display name from Replit Auth user - user can be any object
  const displayName = (user as any)?.firstName || (user as any)?.lastName 
    ? `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim()
    : (user as any)?.email || 'Utente';

  return (
    <header className="bg-card border-b border-card-border p-3 md:p-6">
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleExportPDF}
          variant="destructive"
          size="sm"
          data-testid="button-export-pdf"
          className="flex items-center gap-1 mobile-touch-target shrink-0"
          aria-label="Esporta PDF"
        >
          <FileText className="h-3 w-3" />
          <span className="hidden sm:inline">Esporta PDF</span>
        </Button>
        
        <div className="flex items-center justify-center text-center flex-1 mx-4 md:mx-8">
          <Logo className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto" />
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground">
            <span>Benvenuto</span>
            <span className="font-medium truncate max-w-20">{displayName}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
            className="flex items-center gap-1 mobile-touch-target"
            aria-label={theme === "dark" ? "Attiva modalità chiara" : "Attiva modalità scura"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="hidden md:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
            className="flex items-center gap-1 mobile-touch-target"
            aria-label="Logout - Esci dall'applicazione"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Esci</span>
          </Button>
        </div>
      </div>
    </header>
  );
}