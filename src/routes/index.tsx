import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Play, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dialogram — Talk it through. We'll draw the system." },
      { name: "description", content: "Paste or speak a client interview. Dialogram turns it into user stories, use-case and class diagrams." },
      { property: "og:title", content: "Dialogram — Talk it through." },
      { property: "og:description", content: "Interviews in, traceable UML diagrams out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const transcript = [
  { who: "CLIENT", t: "00:01", text: "So, we're building a campus food delivery app for our university." },
  { who: "CLIENT", t: "00:12", text: "Students should be able to order food from nearby restaurants and get it delivered to their dorms or common areas." },
  { who: "ANALYST", t: "00:28", text: "Mostly students, but we also want to support faculty and staff." },
  { who: "CLIENT", t: "00:42", text: "It should be fast, reliable and easy to use especially during busy hours.", hl: true },
  { who: "ANALYST", t: "01:10", text: "Got it. Should we include different cuisines and a rating system?" },
];

function Landing() {
  const [demo, setDemo] = useState(false);
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-2xl font-semibold">Dialogram</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          {[["How it works", "how"], ["Features", "features"], ["Pricing", "pricing"], ["FAQ", "faq"]].map(([l, id]) => (
            <button key={id} onClick={() => scroll(id)} className="transition-colors hover:text-foreground">{l}</button>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/app" className="text-muted-foreground hover:text-foreground">Log in</Link>
          <Link to="/app" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">Start free</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
        <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          Talk it through.<br />We'll draw the system.
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-muted-foreground">
          Paste or speak your client interview. Dialogram turns it into user stories, use-case diagrams and class diagrams, each one linked to the sentence it came from.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/app" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90">
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={() => setDemo(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-2.5 hover:bg-accent">
            <Play className="h-4 w-4 fill-current" /> Watch 60-sec demo
          </button>
        </div>
        <p className="mt-5 font-mono text-xs text-muted-foreground">English + Urdu · Exports to PlantUML, Mermaid, PNG</p>
      </section>

      <section id="how" className="mx-auto mt-16 max-w-5xl px-6">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <span className="rounded border border-primary px-2 py-0.5 font-mono text-[10px] text-primary">TRANSCRIPT</span>
            <div className="mt-3 divide-y divide-border font-mono text-xs">
              {transcript.map((r, i) => (
                <div key={i} className="flex gap-4 py-2.5">
                  <span className="w-14 shrink-0">{r.who}</span>
                  <span className="shrink-0 text-muted-foreground">{r.t}</span>
                  <span className={r.hl ? "bg-primary/80 px-1 text-primary-foreground" : ""}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-lg border border-border p-4">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Use Case Diagram</p>
                <p className="text-xs text-muted-foreground">Main actors and core use cases.</p>
              </div>
            </div>
            <UseCaseSvg />
            <Link to="/app" className="absolute bottom-3 right-3 rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10">Open diagram</Link>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto mt-28 grid max-w-5xl gap-6 px-6 md:grid-cols-3">
        {[["User stories", "Every requirement becomes an “As a… I want… so that…” story."], ["UML diagrams", "Use-case and class diagrams generated automatically."], ["Traceability", "Each element links back to the sentence it came from."]].map(([h, p]) => (
          <div key={h} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-serif text-xl">{h}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="mx-auto mt-28 max-w-5xl px-6 text-center">
        <h2 className="font-serif text-4xl">Pricing</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[["Free", "$0", "5 projects / month"], ["Pro", "$12", "Unlimited projects & exports"]].map(([n, p, d]) => (
            <div key={n} className="rounded-xl border border-border bg-card p-8">
              <p className="text-muted-foreground">{n}</p>
              <p className="mt-2 font-serif text-4xl">{p}</p>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              <Link to="/app" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground">Get started</Link>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto mt-28 max-w-3xl px-6 pb-24">
        <h2 className="text-center font-serif text-4xl">FAQ</h2>
        {[["Which languages are supported?", "English and Urdu."], ["What formats can I export?", "PlantUML, Mermaid and PNG."], ["Can I upload audio?", "Yes — .mp3 and .wav files are transcribed."]].map(([q, a]) => (
          <details key={q} className="mt-4 rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </section>

      {demo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6" onClick={() => setDemo(false)}>
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDemo(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
              <button onClick={() => toast("Demo video coming soon")}><Play className="h-14 w-14 text-primary" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UseCaseSvg() {
  const E = ({ x, y, l }: { x: number; y: number; l: string }) => (
    <g>
      <ellipse cx={x} cy={y} rx="38" ry="14" className="fill-card stroke-foreground" />
      <text x={x} y={y + 3} textAnchor="middle" className="fill-foreground" fontSize="8">{l}</text>
    </g>
  );
  const Actor = ({ x, y, l }: { x: number; y: number; l: string }) => (
    <g className="stroke-foreground" fill="none">
      <circle cx={x} cy={y} r="6" />
      <path d={`M${x} ${y + 6}v16M${x - 9} ${y + 12}h18M${x} ${y + 22}l-7 10M${x} ${y + 22}l7 10`} />
      <text x={x} y={y + 44} textAnchor="middle" className="fill-foreground stroke-none" fontSize="8">{l}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 400 200" className="mt-2 w-full">
      <rect x="70" y="12" width="300" height="180" className="fill-none stroke-muted-foreground" strokeDasharray="4 3" />
      <text x="220" y="26" textAnchor="middle" className="fill-foreground" fontSize="8">Campus Food Delivery System</text>
      <Actor x={30} y={80} l="Customer" />
      <Actor x={385} y={80} l="Admin" />
      <g className="stroke-foreground"><path d="M40 85L110 52M40 90L115 90M40 95L110 126M40 100L115 160M375 95L300 140M375 90L300 98" /></g>
      <path d="M150 52h80M220 140h60" className="stroke-muted-foreground" strokeDasharray="3 2" />
      <path d="M150 112C200 120 200 92 155 92" className="fill-none stroke-muted-foreground" strokeDasharray="3 2" />
      <E x={140} y={50} l="Browse Restaurants" />
      <g><ellipse cx="140" cy="88" rx="38" ry="14" className="fill-card stroke-primary" strokeWidth="1.5" /><text x="140" y="91" textAnchor="middle" className="fill-foreground" fontSize="8">Place Order</text></g>
      <E x={140} y={124} l="Track Delivery" />
      <E x={140} y={160} l="View Order History" />
      <E x={265} y={52} l="Make Payment" />
      <E x={265} y={98} l="Manage Menu" />
      <E x={300} y={145} l="Update Inventory" />
    </svg>
  );
}
