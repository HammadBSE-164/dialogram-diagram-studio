import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, ChevronRight, FileText, Mic, Paperclip, Pencil, Plus, Search, Settings, UserCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LogoMark } from '@/components/Logo';
import { useProject } from '@/components/ProjectContext';
import { DiagramPreview } from '@/components/DiagramPreview';
import { DiagramEditor, downloadDiagram } from '@/components/DiagramEditor';
import { sampleStories, type DiagramKind } from '@/lib/diagram-data';
import { toast } from 'sonner';

export const Route = createFileRoute('/results')({
  head: () => ({ meta: [
    { title: 'Interview results — Dialogram' },
    { name: 'description', content: 'Review interview user stories, use cases and class diagrams, and edit your system visually.' },
    { property: 'og:title', content: 'Interview results — Dialogram' },
    { property: 'og:description', content: 'Review and edit user stories and UML diagrams in Dialogram.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Results,
});
function Results() {
  const { transcript, diagrams } = useProject();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [editor, setEditor] = useState<DiagramKind | null>(null);
  const [view, setView] = useState<DiagramKind | 'transcript' | 'attention' | 'settings' | null>(null);
  const [message, setMessage] = useState('');
  const [stories, setStories] = useState(sampleStories);
  return <div className="results-layout flex min-h-screen bg-background text-foreground">
    <aside className="results-sidebar flex w-60 shrink-0 flex-col border-r border-border bg-sidebar p-5">
      <Link to="/" className="flex items-center gap-3"><LogoMark className="h-9 w-9" /><span className="font-serif text-2xl">Dialogram</span></Link>
      <Button asChild className="mt-6 w-full"><Link to="/app"><Plus />New project</Link></Button>
      <label className="mt-3 flex items-center gap-2 rounded border border-border px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Search projects" placeholder="Search projects..." value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none" /></label>
      <p className="mb-3 mt-5 text-xs text-muted-foreground">Today</p>
      {'campus food delivery interview 2'.includes(query.toLowerCase()) && <Button variant="secondary" className="h-auto justify-start bg-accent px-3 py-3 whitespace-normal text-left" onClick={() => setView(null)}><FileText className="self-start text-primary" /><span className="text-xs">Campus Food Delivery - Interview 2<span className="mt-1 block font-mono text-[10px] text-muted-foreground">2:14 PM</span></span></Button>}
      <div className="mt-auto space-y-3 border-t border-border pt-5">
        <Button variant="ghost" className="h-auto justify-start px-1" onClick={() => toast('Free plan · UI prototype')}><UserCircle2 /><span className="text-left text-xs">Dialogram<span className="block text-muted-foreground">Free plan</span></span></Button>
        <Button variant="ghost" size="sm" className="px-1" onClick={() => setView('settings')}><Settings />Settings</Button>
      </div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="flex h-16 items-center gap-3 border-b border-border px-6 text-xs font-medium"><Button asChild variant="ghost" size="icon"><Link to="/app" aria-label="Back to transcript"><ArrowLeft /></Link></Button>Campus Food Delivery - Interview 2</header>
      <div className="results-content mx-auto max-w-[900px] px-8 py-5">
        <Button variant="outline" size="sm" className="rounded-full text-[10px] text-muted-foreground" onClick={() => setView('transcript')}><FileText />Campus Food Delivery Interview<span className="hidden font-mono sm:inline">{transcript ? transcript.split(/[.!?]+/).filter(s => s.trim()).length : 47} sentences · 6 min</span><span className="ml-3 underline">View</span></Button>
        <div className="relative mt-3"><Bot className="results-bot absolute -left-11 top-1 h-8 w-8 rounded-full border border-border p-1.5 text-muted-foreground" /><h1 className="font-serif text-xl leading-snug">I found 6 people and 12 things your system needs to do.<br />Here's the overview.</h1></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-border px-3 py-2"><span className="font-serif text-xl">12</span><p className="text-[11px] text-muted-foreground">User stories</p></div>
          <div className="rounded border border-border px-3 py-2"><span className="font-serif text-xl">6</span><p className="text-[11px] text-muted-foreground">Actors</p></div>
          <Button variant="secondary" className="h-auto flex-col items-start gap-0 border border-primary/40 bg-accent px-3 py-2" onClick={() => setView('attention')}><span className="font-serif text-xl">2</span><span className="text-[11px] text-muted-foreground">Need your attention</span></Button>
        </div>
        <section className="mt-4 rounded-lg border border-primary/50 bg-card px-3 py-3">
          <Button variant="ghost" className="h-auto w-full justify-start p-0 hover:bg-transparent" onClick={() => setExpanded(!expanded)}><FileText className="self-start text-muted-foreground" /><span className="text-left"><span className="block text-xs font-semibold">User Stories</span><span className="block text-[10px] font-normal text-muted-foreground">The key things users want to do.</span></span><span className="ml-auto text-[10px] font-normal text-muted-foreground">{expanded ? 'Collapse' : 'Click to expand'}</span><ChevronRight /></Button>
          <ul className="ml-7 mt-2 space-y-1 font-mono text-[10px] leading-relaxed">{(expanded ? stories : stories.slice(0, 3)).map((story, i) => <li key={i} className="flex gap-2"><span className="text-primary">●</span>{expanded ? <input aria-label={`User story ${i + 1}`} value={story} onChange={e => setStories(s => s.map((v, index) => index === i ? e.target.value : v))} className="w-full border-b border-border bg-transparent py-1" /> : story}</li>)}</ul>
          <Button variant="link" className="ml-7 h-5 p-0 text-[10px]" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show all 12'}<ChevronRight /></Button>
        </section>
        {(['usecase', 'class'] as const).map(kind => <section key={kind} className="mt-2 rounded-lg border border-border bg-card px-3 py-3">
          <Button variant="ghost" className="h-auto w-full justify-start p-0 hover:bg-transparent" onClick={() => setView(kind)}><FileText className="self-start text-muted-foreground" /><span className="text-left"><span className="block text-xs font-semibold">{kind === 'usecase' ? 'How people use the system' : 'What the system stores'}</span><span className="block text-[10px] font-normal text-muted-foreground">{kind === 'usecase' ? 'A simplified view of the main use cases.' : 'Core data entities and their relationships.'}</span></span><span className="ml-auto text-[10px] font-normal text-muted-foreground">Click to expand</span><ChevronRight /></Button>
          <div className={`mt-2 ${kind === 'class' ? 'class-preview' : ''}`}><DiagramPreview data={diagrams[kind]} /></div>
          <div className="mt-1 flex justify-end gap-2"><Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-primary" onClick={() => setEditor(kind)}><Pencil />Edit diagram</Button><Button variant="outline" size="sm" className="h-6 border-primary/50 px-2 text-[10px] text-primary" onClick={() => setView(kind)}>Open diagram</Button></div>
        </section>)}
        <form className="mt-7 flex items-center gap-3 rounded-lg border border-border bg-card p-2" onSubmit={e => { e.preventDefault(); if (!message.trim()) return; setStories(s => [...s.slice(0, -1), message.trim()]); setMessage(''); setExpanded(true); toast.success('Last user story updated'); }}>
          <Button asChild size="icon" className="h-8 w-8 rounded-full"><Link to="/app" aria-label="Attach another transcript"><Paperclip /></Link></Button><input aria-label="Update last user story" value={message} onChange={e => setMessage(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full text-primary" aria-label="Voice input" onClick={() => toast('Voice input is not connected in this UI prototype')}><Mic /></Button><Button type="submit" size="icon" className="h-8 w-8 rounded-full" aria-label="Apply story update"><ArrowRight /></Button>
        </form>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">Sample interview results · Changes are kept while this page is open.</p>
      </div>
    </main>
    {editor && <DiagramEditor key={editor} kind={editor} onClose={() => setEditor(null)} />}
    <Dialog open={view !== null} onOpenChange={open => { if (!open) setView(null); }}><DialogContent className={view === 'usecase' || view === 'class' ? 'max-w-5xl' : ''}>
      <DialogTitle className="font-serif">{view === 'transcript' ? 'Interview transcript' : view === 'attention' ? 'Needs your attention' : view === 'settings' ? 'Settings' : view === 'class' ? 'What the system stores' : 'How people use the system'}</DialogTitle>
      <DialogDescription>Campus Food Delivery — Interview 2</DialogDescription>
      {view === 'transcript' && <p className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6">{transcript || 'No transcript submitted. These are sample interview results.'}</p>}
      {view === 'attention' && <ul className="space-y-4 text-sm"><li>1. Confirm whether faculty and staff use the same ordering process as students.</li><li>2. Confirm which payment methods and delivery areas are supported.</li></ul>}
      {view === 'settings' && <p className="text-sm text-muted-foreground">Dialogram · Free plan · English</p>}
      {(view === 'class' || view === 'usecase') && <><DiagramPreview data={diagrams[view]} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => downloadDiagram(diagrams[view])}><Download />Download SVG</Button><Button onClick={() => { setEditor(view); setView(null); }}><Pencil />Edit diagram</Button></div></>}
    </DialogContent></Dialog>
  </div>;
}