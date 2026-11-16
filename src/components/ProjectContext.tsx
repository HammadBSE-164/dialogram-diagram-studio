import { createContext, useContext, useState, type ReactNode } from 'react';
import { sampleDiagrams, type DiagramKind, type DiagramData } from '@/lib/diagram-data';
import type { TranscriptAnalysis } from '@/lib/api';

type ProjectState = { transcript: string; setTranscript: (text: string) => void; analysis: TranscriptAnalysis | null; setAnalysis: (value: TranscriptAnalysis) => void; diagrams: Record<DiagramKind, DiagramData>; saveDiagram: (kind: DiagramKind, data: DiagramData) => void };
const ProjectContext = createContext<ProjectState | null>(null);
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [transcript, setTranscript] = useState('');
  const [diagrams, setDiagrams] = useState(sampleDiagrams);
  const [analysis, setStoredAnalysis] = useState<TranscriptAnalysis | null>(null);
  const setAnalysis = (value: TranscriptAnalysis) => {
    setStoredAnalysis(value);
    setDiagrams(value.diagrams);
  };
  return <ProjectContext.Provider value={{ transcript, setTranscript, analysis, setAnalysis, diagrams, saveDiagram: (kind, data) => setDiagrams(previous => ({ ...previous, [kind]: data })) }}>{children}</ProjectContext.Provider>;
}
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('Project provider is missing');
  return context;
}
