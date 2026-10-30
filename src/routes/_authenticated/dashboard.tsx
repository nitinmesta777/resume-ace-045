import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, LogOut, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { prettySkill } from "@/lib/analyzer";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Analyses | AI Resume Analyzer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

interface SavedAnalysis {
  id: string;
  file_name: string;
  score: number;
  match_percent: number | null;
  word_count: number;
  skills_found: string[];
  skills_missing: string[];
  suggestions: string[];
  created_at: string;
}

function DashboardPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: ["saved-analyses"],
    queryFn: async (): Promise<SavedAnalysis[]> => {
      const { data, error } = await supabase
        .from("saved_analyses")
        .select(
          "id, file_name, score, match_percent, word_count, skills_found, skills_missing, suggestions, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SavedAnalysis[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-analyses"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-analyses"] });
    },
  });

  const analyses = analysesQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Analyses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resume analyses you saved while signed in. Only you can see these.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Signed in as {user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>

        {analysesQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your analyses…
          </div>
        )}

        {analysesQuery.isError && (
          <Card className="card-elevated">
            <CardContent className="py-8 text-center text-sm text-destructive">
              Could not load your analyses. Please refresh the page and try again.
            </CardContent>
          </Card>
        )}

        {!analysesQuery.isLoading && !analysesQuery.isError && analyses.length === 0 && (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No saved analyses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run an analysis on the home page and choose "Save to my account".
                </p>
              </div>
              <Button asChild>
                <Link to="/">Analyze a resume</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {analyses.map((a) => (
          <Card key={a.id} className="card-elevated">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.file_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()} · {a.word_count} words
                  {a.match_percent !== null ? ` · ${a.match_percent}% job match` : ""}
                </p>
                {a.skills_missing.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Missing keywords:</span>
                    {a.skills_missing.slice(0, 6).map((k) => (
                      <Badge key={k} variant="outline" className="text-destructive">
                        {prettySkill(k)}
                      </Badge>
                    ))}
                    {a.skills_missing.length > 6 && (
                      <span className="text-xs text-muted-foreground">
                        +{a.skills_missing.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-primary">{a.score}</p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete analysis for ${a.file_name}`}
                  onClick={() => deleteMutation.mutate(a.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables === a.id}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
