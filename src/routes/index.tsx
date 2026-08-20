import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  Mail,
  Printer,
  Sparkles,
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
      { title: "AI Resume Analyzer | Resume Score, Skill Gaps & JD Match" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume to get an instant resume score, detected skills, skill gaps, job-description match percentage and improvement suggestions.",
      },
      { property: "og:title", content: "AI Resume Analyzer" },
      {
        property: "og:description",
        content:
          "Instant resume scoring, skill-gap analysis and job-description matching — a BCA mini project dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [fileName, setFileName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
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
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function loadSample() {
    setFileName("sample-resume.txt");
    setResumeText(SAMPLE_RESUME);
    setJd(SAMPLE_JD);
    setResult(null);
    setError("");
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
      result.jd.provided ? `JOB DESCRIPTION MATCH: ${result.jd.matchPercent}%` : "JOB DESCRIPTION: not provided",
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
    <main className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-6 text-primary" />
            <span className="font-display text-lg font-bold">AI Resume Analyzer</span>
          </div>
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#analyze" className="transition-colors hover:text-foreground">Analyze</a>
            <a href="#about" className="transition-colors hover:text-foreground">About Project</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
        <div className="rise-in max-w-3xl">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> BCA 3rd Year Mini Project
          </Badge>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            Score your resume with <span className="text-gradient">AI-style analysis</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Upload a PDF or DOCX resume and instantly get an overall score out of 100, detected
            skills, skill gaps, a job-description match percentage and personalised improvement
            suggestions — all in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#analyze">
                <Upload className="size-4" /> Analyze Resume
              </a>
            </Button>
            <Button size="lg" variant="outline" onClick={loadSample}>
              <FileText className="size-4" /> Load Sample Data
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: BarChart3, title: "Resume Score", text: "6-factor scoring model out of 100" },
              { icon: Target, title: "JD Matching", text: "Keyword match percentage vs the job role" },
              { icon: Lightbulb, title: "Suggestions", text: "Actionable, personalised improvements" },
            ].map((f) => (
              <div key={f.title} className="glass-card rounded-xl p-4">
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
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5 text-primary" /> Step 1 — Upload Resume
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
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2/40 px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-surface-2/70"
              >
                {loading ? (
                  <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                  <Upload className="size-8 text-primary" />
                )}
                <p className="font-medium">
                  {fileName ? fileName : "Click to browse or drag & drop your resume"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resumeText ? `${resumeText.trim().split(/\s+/).length} words extracted` : "PDF · DOCX · TXT"}
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
                placeholder="…or paste your resume text here"
                className="min-h-28 bg-surface-2/40"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" /> Step 2 — Job Description (optional)
              </CardTitle>
              <CardDescription>Paste the job description to get a match percentage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description / required skills here…"
                className="min-h-52 bg-surface-2/40"
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={runAnalysis} disabled={loading}>
                  <BrainCircuit className="size-4" /> Analyze Now
                </Button>
                <Button variant="ghost" onClick={() => setJd(SAMPLE_JD)}>
                  Use sample job description
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
                <h2 className="text-2xl font-bold sm:text-3xl">Analysis Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  {result.fileName} · {result.words} words ·{" "}
                  {new Date(result.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="no-print flex gap-2">
                <Button variant="outline" onClick={downloadReport}>
                  <FileText className="size-4" /> Download Report
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="glass-card lg:col-span-1">
                <CardHeader>
                  <CardTitle>Overall Resume Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-5">
                  <ScoreRing value={result.score} />
                  <p className="text-center text-sm text-muted-foreground">
                    {result.score >= 80
                      ? "Excellent — recruiter ready."
                      : result.score >= 60
                        ? "Good, but a few sections need polish."
                        : "Needs improvement — follow the suggestions below."}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card lg:col-span-2">
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
              <Card className="glass-card">
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

              <Card className="glass-card">
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

              <Card className="glass-card">
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
                              Great! Nothing important is missing.
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

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" /> Skills & Skill Gaps
                </CardTitle>
                <CardDescription>
                  {result.detectedSkills.length} skills detected across{" "}
                  {result.skillsByCategory.filter((c) => c.found.length).length} categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {result.skillsByCategory.map((cat) => (
                  <div key={cat.category} className="rounded-xl bg-surface-2/40 p-4">
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
                            <Badge key={s} className="bg-primary/15 text-primary" variant="secondary">
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

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-primary" /> Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
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

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 pb-20">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl">About the Project</CardTitle>
            <CardDescription>
              AI Resume Analyzer — BCA 3rd Year Mini Project
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This project helps students and job seekers evaluate their resume before applying.
                The resume file is parsed to plain text, then a rule-based analysis engine detects
                skills, sections and contact details, computes a weighted score out of 100 and
                compares the resume against a job description using keyword matching.
              </p>
              <p>
                Everything runs in the browser, so no resume data is uploaded to any server —
                making it privacy-friendly and easy to demonstrate on a college projector.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-surface-2/40 p-4">
                <p className="mb-1 font-medium">Modules</p>
                <p className="text-sm text-muted-foreground">
                  Resume upload · Text extraction · Skill detection · Score engine · JD matching ·
                  Suggestion generator · Report export
                </p>
              </div>
              <div className="rounded-xl bg-surface-2/40 p-4">
                <p className="mb-1 font-medium">Technology used</p>
                <p className="text-sm text-muted-foreground">
                  React + TypeScript (UI), Tailwind CSS (design system), pdf.js and Mammoth.js
                  (open-source PDF/DOCX parsing), TanStack Start (routing & build).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          AI Resume Analyzer · Mini project demo · Built with open-source libraries
        </p>
      </section>
    </main>
  );
}
