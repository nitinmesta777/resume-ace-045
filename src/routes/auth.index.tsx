import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { safeRedirect } from "@/lib/redirect";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SignInPage,
});

function authErrorMessage(error: AuthError): string {
  if (error.message === "Invalid login credentials") {
    return "Incorrect email or password. Please try again.";
  }
  if (error.message.includes("Email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (error.message.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return error.message;
}

function SignInPage() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.history.push(safeRedirect(redirect));
    }
  }, [user, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (authError) {
      setError(authErrorMessage(authError));
      return;
    }
    router.history.push(safeRedirect(redirect));
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Access your saved resume analyses.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />} Sign in
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <a href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground">
          Forgot password?
        </a>
        <a href="/auth/sign-up" className="font-medium text-primary hover:underline">
          Create account
        </a>
      </div>
    </div>
  );
}
