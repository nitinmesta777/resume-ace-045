import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  Mail,
  Printer,
  Save,
  Target,
  Upload,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScoreRing } from "@/components/ScoreRing";
import { extractResumeText } from "@/lib/resume-text";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeResume,
  prettySkill,
  SAMPLE_JD,
  SAMPLE_RESUME,
  type AnalysisResult,
} from "@/lib/analyzer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Resume Analyzer | Resume Score, Skill Gaps & Job Description Match" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume to get an instant 100-point resume score, detected skills, missing sections, job description match percentage and improvement suggestions. Runs in your browser.",
      },
      { property: "og:title", content: "AI Resume Analyzer" },
      {
        property: "og:description",
        content:
          "Check your resume before you apply: a 100-point score, detected skills, missing sections, job description match and improvement suggestions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const SCORE_MODEL = [
  { label: "Contact details", max: 15, detail: "Email, phone, LinkedIn or GitHub found" },
  { label: "Resume sections", max: 25, detail: "Education, experience, projects, certifications, achievements" },
  { label: "Technical skills", max: 25, detail: "Recognised skills across six categories" },
  { label: "Length and structure", max: 15, detail: "Roughly 250 to 900 words reads best" },
  { label: "Impact and action words", max: 15, detail: "Strong verbs and measurable results" },
  { label: "Job description alignment", max: 5, detail: "Keyword match with the pasted job role" },
];

function Home() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const text = await extractResumeText(file);
      if (text.trim().length < 40) {
        throw new Error("Could not read enough text. Try a text-based PDF or a DOCX file.");
      }
      setFileName(file.name);
      setResumeText(text);
      setResult(null);
      setSavedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read the file.");
    } finally {
      setLoading(false);
    }
  }

  function runAnalysis() {
    if (!resumeText.trim()) {
      setError("Please upload a resume (or load the sample resume) first.");
      return;
    }
    setError("");
    const res = analyzeResume(fileName || "pasted-resume.txt", resumeText, jd);
    setResult(res);
    setSavedId(null);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function loadSample() {
    setFileName("sample-resume.txt");
    setResumeText(SAMPLE_RESUME);
    setJd(SAMPLE_JD);
    setResult(null);
    setSavedId(null);
    setError("");
  }

  async function saveToAccount() {
    if (!result || !user || savedId) return;
    setSaving(true);
    const { data, error: saveError } = await supabase
      .from("saved_analyses")
      .insert({
        user_id: user.id,
        file_name: result.fileName,
        score: result.score,
        match_percent: result.jd.provided ? result.jd.matchPercent : null,
        word_count: result.words,
        sections_present: result.sections.filter((s) => s.found).map((s) => s.label),
        skills_found: result.detectedSkills.map((s) => s.skill),
        skills_missing: result.jd.missingKeywords,
        suggestions: result.suggestions,
        breakdown: result.scoreBreakdown,
      })
      .select("id")
      .single();
    setSaving(false);
    if (saveError) {
      toast.error("Could not save this analysis. Please try again.");
      return;
    }
    setSavedId(data?.id ?? null);
    toast.success("Analysis saved to your account.");
  }

  function downloadReport() {
    if (!result) return;
    const lines = [
      "AI RESUME ANALYZER - ANALYSIS REPORT",
      `Generated: ${new Date(result.createdAt).toLocaleString()}`,
      `File: ${result.fileName}   Words: ${result.words}`,
      "",
      `OVERALL SCORE: ${result.score}/100`,
      ...result.scoreBreakdown.map((b) => `  - ${b.label}: ${b.earned}/${b.max}`),
      "",
      "SECTIONS",
      ...result.sections.map((s) => `  [${s.found ? "x" : " "}] ${s.label}`),
      "",
      `DETECTED SKILLS (${result.detectedSkills.length})`,
      "  " + result.detectedSkills.map((s) => prettySkill(s.skill)).join(", "),
      "",
      result.jd.provided
        ? `JOB DESCRIPTION MATCH: ${result.jd.matchPercent}%`
        : "JOB DESCRIPTION: not provided",
      result.jd.provided ? "  Missing keywords: " + result.jd.missingKeywords.join(", ") : "",
      "",
      "IMPROVEMENT SUGGESTIONS",
      ...result.suggestions.map((s, i) => `  ${i + 1}. ${s}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-analysis-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:pt-20">
        <div className="rise-in max-w-3xl">
          <Badge variant="secondary" className="mb-5">
            BCA 3rd Year Mini Project
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Check your resume before you apply
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Upload a PDF or DOCX resume and get a clear score out of 100, the skills it detects,
            sections that are missing, an optional job description match percentage, and specific
            improvements you can make right away. The analysis runs entirely in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a href="#analyze">
                <Upload className="size-4" /> Analyze a resume
              </a>
            </Button>
            <Button variant="outline" onClick={loadSample}>
              <FileText className="size-4" /> Load the sample resume
            </Button>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Resume score",
                text: "A six-factor scoring model out of 100 points.",
              },
              {
                icon: Target,
                title: "Job description match",
                text: "Compare your resume against a pasted job role.",
              },
              {
                icon: Lightbulb,
                title: "Improvement suggestions",
                text: "Rule-based checks that point to concrete fixes.",
              },
            ].map((f) => (
              <div key={f.title} className="card-elevated rounded-xl p-4">
                <f.icon className="mb-2 size-5 text-primary" />
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload + JD */}
      <section id="analyze" className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5 text-primary" /> Step 1: Upload Resume
              </CardTitle>
              <CardDescription>Supported formats: PDF, DOCX and TXT.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleFile(e.dataTransfer.files[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/70"
              >
                {loading ? (
                  <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                  <Upload className="size-8 text-primary" />
                )}
                <p className="font-medium">
                  {fileName ? fileName : "Click to browse, or drag and drop your resume"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resumeText
                    ? `${resumeText.trim().split(/\s+/).filter(Boolean).length} words extracted`
                    : "Your file stays on your device"}
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Or paste your resume text here"
                className="min-h-28 bg-muted/40"
              />
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" /> Step 2: Job Description (optional)
              </CardTitle>
              <CardDescription>Paste the job description to get a match percentage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description or required skills here"
                className="min-h-52 bg-muted/40"
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={runAnalysis} disabled={loading}>
                  <BarChart3 className="size-4" /> Analyze Now
                </Button>
                <Button variant="ghost" onClick={() => setJd(SAMPLE_JD)}>
                  Use the sample job description
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results dashboard */}
      {result && (
        <section ref={resultsRef} className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rise-in space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Analysis Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  {result.fileName} · {result.words} words ·{" "}
                  {new Date(result.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                {user ? (
                  <Button variant="outline" onClick={() => void saveToAccount()} disabled={saving || Boolean(savedId)}>
                    {savedId ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {savedId ? "Saved" : saving ? "Saving…" : "Save to my account"}
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to="/auth">Sign in to save your analyses</Link>
                  </Button>
                )}
                <Button variant="outline" onClick={downloadReport}>
                  <FileText className="size-4" /> Download Report
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="card-elevated lg:col-span-1">
                <CardHeader>
                  <CardTitle>Overall Resume Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-5">
                  <ScoreRing value={result.score} />
                  <p className="text-center text-sm text-muted-foreground">
                    {result.score >= 80
                      ? "Strong resume. It covers the essentials recruiters look for."
                      : result.score >= 60
                        ? "Good base, but a few sections still need polish."
                        : "Needs work. Follow the suggestions below."}
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elevated lg:col-span-2">
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>How each factor contributed to your score.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.scoreBreakdown.map((b) => (
                    <div key={b.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{b.label}</span>
                        <span className="text-muted-foreground">
                          {b.earned}/{b.max}
                        </span>
                      </div>
                      <Progress value={(b.earned / b.max) * 100} />
                      <p className="mt-1 text-xs text-muted-foreground">{b.hint}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="size-5 text-primary" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(
                    [
                      ["Email", result.contact.email],
                      ["Phone", result.contact.phone],
                      ["LinkedIn", result.contact.linkedin],
                      ["GitHub", result.contact.github],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="flex items-center gap-1.5 truncate">
                        {value ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <XCircle className="size-4 shrink-0 text-destructive" />
                        )}
                        <span className="truncate">{value ?? "Not found"}</span>
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-primary" /> Resume Sections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {result.sections.map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <span>{s.label}</span>
                      {s.found ? (
                        <Badge variant="secondary" className="text-success">Found</Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive">Missing</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="size-5 text-primary" /> Job Description Match
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.jd.provided ? (
                    <>
                      <ScoreRing value={result.jd.matchPercent} size={128} label="Match Percentage" />
                      <div>
                        <p className="mb-2 text-sm font-medium">Missing keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.jd.missingKeywords.length ? (
                            result.jd.missingKeywords.map((k) => (
                              <Badge key={k} variant="outline" className="text-destructive">
                                {prettySkill(k)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Nothing important is missing.
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add a job description in Step 2 to see your match percentage and missing
                      keywords.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" /> Skills and Skill Gaps
                </CardTitle>
                <CardDescription>
                  {result.detectedSkills.length} skills detected across{" "}
                  {result.skillsByCategory.filter((c) => c.found.length).length} categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {result.skillsByCategory.map((cat) => (
                  <div key={cat.category} className="rounded-lg bg-muted/40 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground">
                        {cat.found.length}/{cat.total}
                      </span>
                    </div>
                    <Progress value={(cat.found.length / cat.total) * 100} className="mb-3" />
                    <div className="flex flex-wrap gap-1.5">
                      {cat.found.length ? (
                        cat.found.map((s) => (
                          <Badge key={s} variant="secondary" className="bg-primary/10 text-primary">
                            {prettySkill(s)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No skills detected in this category.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-primary" /> Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Scoring model */}
      <section id="scoring" className="mx-auto max-w-6xl px-4 py-10">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">How the 100-point score works</CardTitle>
            <CardDescription>
              Every resume is checked against the same six factors. The points are added up to give
              the overall score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {SCORE_MODEL.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.detail}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-primary">{f.max} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">About the project</CardTitle>
            <CardDescription>AI Resume Analyzer, a BCA 3rd year mini project</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This project helps students and job seekers evaluate their resume before applying.
                The resume file is parsed to plain text in the browser, then a rule-based analysis
                engine detects skills, sections and contact details, computes a weighted score out
                of 100, and compares the resume against a pasted job description using keyword
                matching.
              </p>
              <p>
                The analysis runs in the browser, so your resume file and text are never uploaded to
                a server. If you create an account and choose to save an analysis, only the summary
                of that analysis (file name, score, detected skills, missing keywords and
                suggestions) is stored in the project database, visible only to you.
              </p>
              <p>
                The repository also includes an optional Python Flask backend with a SQLite database
                that can run the same analysis server-side for a demonstration of a client-server
                architecture.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <p className="mb-1 font-medium text-foreground">Modules</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Text extraction for PDF, DOCX and TXT resumes</li>
                  <li>Skill detection across six skill categories</li>
                  <li>Section, contact and impact checks</li>
                  <li>Weighted scoring engine out of 100 points</li>
                  <li>Job description keyword matching</li>
                  <li>Account with saved analysis history</li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <p className="mb-1 font-medium text-foreground">Built with</p>
                <p className="text-muted-foreground">
                  React and TypeScript frontend, Tailwind CSS design system, account and saved
                  analyses handled by a hosted backend, plus an optional Flask and SQLite backend in
                  the repository.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Closing CTA */}
      <section className="no-print mx-auto max-w-6xl px-4 pb-20">
        <div className="card-elevated flex flex-col items-start justify-between gap-4 rounded-xl p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Ready to see your score?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the sample resume, or upload your own. Create an account to keep a history
              of your analyses.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Go to My Analyses</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link to="/auth/sign-up">Create an account</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#analyze">Analyze without signing in</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
