/**
 * Optional client for the Python Flask + SQLite backend (see /backend).
 * Enabled by setting VITE_API_URL, e.g. VITE_API_URL=http://127.0.0.1:5000
 * When unset, the app keeps analyzing resumes fully in the browser.
 */

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "");

export const backendEnabled = Boolean(API_URL);

export interface BackendAnalysis {
  id: number;
  score: number;
  match_percent: number | null;
  word_count: number;
  sections_present: string[];
  skills_found: string[];
  skills_missing: string[];
  suggestions: string[];
  breakdown: Record<string, number>;
}

export interface BackendHistoryItem {
  id: number;
  file_name: string;
  score: number;
  match_percent: number | null;
  skills_found: string[];
  skills_missing: string[];
  suggestions: string[];
  word_count: number;
  created_at: string;
}

export async function checkBackend(): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeWithBackend(
  file: File,
  jobDescription = "",
): Promise<BackendAnalysis> {
  if (!API_URL) throw new Error("Backend not configured (VITE_API_URL missing).");
  const form = new FormData();
  form.append("resume", file);
  form.append("job_description", jobDescription);

  const res = await fetch(`${API_URL}/api/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(detail.error ?? "Analysis failed on the server.");
  }
  return (await res.json()) as BackendAnalysis;
}

export async function fetchHistory(): Promise<BackendHistoryItem[]> {
  if (!API_URL) return [];
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) return [];
  return (await res.json()) as BackendHistoryItem[];
}

export async function deleteHistoryItem(id: number): Promise<void> {
  if (!API_URL) return;
  await fetch(`${API_URL}/api/history/${id}`, { method: "DELETE" });
}
