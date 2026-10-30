import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h1 className="mt-3 font-display text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for {email}, a password reset link is on its way. The link opens a
          page where you can set a new password.
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <a href="/auth">Back to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold tracking-tight">Forgot password?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email you signed up with and we will send you a reset link.
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
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />} Send reset link
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <a href="/auth" className="font-medium text-primary hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
