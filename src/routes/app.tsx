import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Plus, Search, FileText, Paperclip, Mic, ChevronDown, ArrowRight, UploadCloud, Link2, Scan, UserCircle2, Settings } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/Logo";
import { useProject } from "@/components/ProjectContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — Dialogram" },
      { name: "description", content: "Paste a conversation and let Dialogram draw the system." },
      { property: "og:title", content: "Dialogram Workspace" },
      { property: "og:description", content: "Paste the conversation. We'll draw the system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

const SAMPLE = `CLIENT 00:01 So, we're building a campus food delivery app for our university.
CLIENT 00:12 Students should be able to order food from nearby restaurants and get it delivered to their dorms or common areas.
ANALYST 00:28 Mostly students, but we also want to support faculty and staff.
CLIENT 00:42 It should be fast, reliable and easy to use especially during busy hours.`;

type Project = { id: number; name: string; time: string; text: string };

function Workspace() {
  const navigate = useNavigate();
  const { setTranscript } = useProject();
  const [projects, setProjects] = useState<Project[]>([{ id: 1, name: "Campus Food Delivery - Interview 2", time: "2:14 PM", text: SAMPLE }]);
  const [active, setActive] = useState<number | null>(1);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [lang, setLang] = useState("English");
  const [out, setOut] = useState("Stories - Use Case");
  const [rec, setRec] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const newProject = () => {
    const p = { id: Date.now(), name: `Untitled project ${projects.length + 1}`, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), text: "" };
    setProjects([p, ...projects]); setActive(p.id); setText("");
  };
  const submit = () => {
    if (!text.trim()) { toast.error("Paste a transcript first"); return; }
    setTranscript(text);
    navigate({ to: '/results' });
  };

  const ghost = "inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:bg-accent";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4">
        <Link to="/" className="flex items-center gap-3 px-1"><LogoMark className="h-9 w-9" /><span className="font-serif text-2xl">Dialogram</span></Link>
        <button onClick={newProject} className="mt-6 flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" />New project</button>
        <label className="mt-4 flex items-center gap-2 rounded border border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
        </label>
        <p className="mt-5 text-xs text-muted-foreground">Today</p>
        <div className="mt-2 space-y-1 overflow-y-auto">
          {projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
            <button key={p.id} onClick={() => { setActive(p.id); setText(p.text); }} className={`flex w-full gap-3 rounded p-2.5 text-left ${active === p.id ? "bg-accent" : "hover:bg-muted"}`}>
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span><span className="block text-xs">{p.name}</span><span className="font-mono text-[10px] text-muted-foreground">{p.time}</span></span>
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <button onClick={() => toast("Account: Free plan")} className="flex items-center gap-3 px-2 text-left"><UserCircle2 className="h-7 w-7" /><span><span className="block text-xs">Dialogram</span><span className="font-mono text-[10px] text-muted-foreground">Free plan</span></span></button>
          <button onClick={() => toast("Settings coming soon")} className="flex items-center gap-3 px-2 text-xs"><Settings className="h-5 w-5" />Settings</button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center px-8 pt-28">
        <h1 className="text-center font-serif text-4xl font-semibold leading-tight md:text-5xl">Paste the conversation.<br />We'll draw the system.</h1>
        <div className="mt-10 w-full max-w-3xl rounded-lg border border-border bg-card">
          <div className="p-2"><span className="rounded border border-primary px-2 py-0.5 font-mono text-[10px] text-primary">TRANSCRIPT</span></div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste an interview transcript, type notes, or press the mic and just talk..." className="w-full resize-none bg-[repeating-linear-gradient(transparent,transparent_27px,var(--border)_28px)] bg-transparent px-3 font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground" />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border p-2">
            <input ref={fileRef} type="file" accept=".txt,.docx,.mp3,.wav" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              if (f.name.endsWith(".txt")) setText(await f.text());
              toast.success(`Uploaded ${f.name}`);
            }} />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" />Upload .txt/.docx/.mp3/.wav</button>
            <button onClick={() => { setRec(!rec); toast(rec ? "Recording stopped" : "Listening…"); }} className={`rounded-full border p-2 ${rec ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}><Mic className="h-4 w-4" /></button>
            <Select label="Language" value={lang} options={["English", "Urdu"]} onChange={setLang} />
            <Select label="Output" value={out} options={["Stories - Use Case", "Stories - Class", "Use Case Only", "Class Only"]} onChange={setOut} />
            <Button onClick={submit} aria-label="Convert transcript" size="icon" className="rounded-full"><ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => { setText(SAMPLE); toast("Sample interview loaded"); }} className={ghost}><FileText className="h-4 w-4" />Try a sample interview</button>
          <button onClick={() => fileRef.current?.click()} className={ghost}><UploadCloud className="h-4 w-4" />Upload a Zoom recording</button>
          <button onClick={() => toast("Google Meet import coming soon")} className={ghost}><Link2 className="h-4 w-4" />Import from Google Meet</button>
          <Link to="/" hash="how" className={ghost}><Scan className="h-4 w-4" />See an example output</Link>
        </div>
      </main>
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="relative flex items-center gap-2 rounded border border-border px-3 py-1.5 font-mono text-xs">
      <span>{label}: {value}</span><ChevronDown className="h-4 w-4" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
      </select>
    </label>
  );
}
