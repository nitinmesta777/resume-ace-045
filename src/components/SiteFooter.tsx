import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-sm font-semibold">AI Resume Analyzer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A BCA mini project. Resume analysis runs in your browser.
          </p>
        </div>
        <nav className="flex gap-5 text-xs text-muted-foreground">
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms and Conditions
          </Link>
        </nav>
      </div>
    </footer>
  );
}
