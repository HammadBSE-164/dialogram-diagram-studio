import type { DiagramData } from "@/lib/diagram-data";

export type TranscriptAnalysis = {
  summary: string;
  stories: string[];
  attention: string[];
  actor_count: number;
  diagrams: { usecase: DiagramData; class: DiagramData };
};

export async function analyzeTranscript(text: string, language: string, output: string) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, output }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail || `Analysis failed (${response.status})`);
  }
  return response.json() as Promise<TranscriptAnalysis>;
}
