import { Outlet, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

// TODO: Update with your GitHub repo URL
const GITHUB_URL = 'https://github.com/YOUR_USERNAME/YOUR_REPO';

export function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary hover:text-primary-hover">
            My App
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 flex items-center justify-center gap-4 text-muted-foreground text-sm">
          <Link to="/credits" className="underline hover:text-foreground">
            Credits & Licenses
          </Link>
          <span aria-hidden="true">&middot;</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
