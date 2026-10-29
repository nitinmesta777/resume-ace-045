import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import iconMark from "@/assets/icon-mark.png";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={iconMark} alt="" className="size-7 rounded-md" width={28} height={28} />
          <span className="font-display text-base font-semibold tracking-tight">
            AI Resume Analyzer
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-5">
          <Link
            to="/"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Analyze
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              My Analyses
            </Link>
          )}
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-44 truncate text-xs text-muted-foreground md:block">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                aria-label="Sign out"
              >
                <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
