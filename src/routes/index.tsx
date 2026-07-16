import { analyzeResumeFn, type AtsResult } from "@/lib/ats";
import { jsPDF } from "jspdf";
import heroImg from "@/assets/hero-scan.jpg";
import featAts from "@/assets/feature-ats.jpg";
import featScore from "@/assets/feature-score.jpg";
import featKw from "@/assets/feature-keywords.jpg";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const SAMPLE_RESUME = `Alex Rivera
alex.rivera@email.com · +1 415 555 0142 · San Francisco, CA

SUMMARY
Senior product engineer with 7 years shipping consumer-scale React and TypeScript apps.

EXPERIENCE
Staff Engineer — Northlight (2022–Present)
- Led a team of 6 to ship a new checkout, increasing conversion by 24%.
- Architected a design system in React and Tailwind used across 12 products.
- Reduced p95 API latency by 38% through caching and query optimization.

Senior Engineer — Orbit Labs (2019–2022)
- Built real-time collaboration features in TypeScript and WebSockets.
- Drove adoption of testing with Jest, raising coverage from 42% to 88%.

EDUCATION
B.S. Computer Science — UC Berkeley

SKILLS
React, TypeScript, Node, PostgreSQL, GraphQL, AWS, Docker, Figma`;

const SAMPLE_JD = `We are hiring a Senior Frontend Engineer to build a premium SaaS product.
You will own features end-to-end in React, TypeScript and Next.js, work closely
with design in Figma, and ship performant, accessible interfaces with Tailwind.
Experience with GraphQL, testing (Jest, Cypress), CI/CD, and AWS is required.
You will mentor engineers and drive architecture decisions in an agile team.`;

interface HistoryItem {
  id: string;
  timestamp: number;
  score: number;
  resumeName: string;
  resumeText: string;
  jdText: string;
  result: AtsResult;
  parsedPdfName: string | null;
}

function Landing() {
  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [running, setRunning] = useState(false);
  const [parsedPdfName, setParsedPdfName] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ats_scan_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const canRun = (resumeFile !== null || resume.trim().length > 10) && jd.trim().length > 3;

  function loadHistoryItem(item: HistoryItem) {
    if (!item.result) {
      alert("This is an old scan record that does not contain detailed report data. Run a new scan to save full details.");
      return;
    }
    setResult(item.result);
    setResume(item.resumeText || "");
    setJd(item.jdText || "");
    setParsedPdfName(item.parsedPdfName || null);
    setResumeFile(null); // Clear file upload state so text editor is active

    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function run() {
    if (!canRun) return;
    setRunning(true);
    try {
      const formData = new FormData();
      formData.append("jd", jd);
      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      } else {
        formData.append("resumeText", resume);
      }

      const analysisResult = await analyzeResumeFn({ data: formData });
      setResult(analysisResult);

      const resumeNameStr = resumeFile ? resumeFile.name : (parsedPdfName ? `Edited: ${parsedPdfName}` : "Pasted Resume");

      // Save to scan history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        score: analysisResult.score,
        resumeName: resumeNameStr,
        resumeText: analysisResult.parsedText || resume,
        jdText: jd,
        result: analysisResult,
        parsedPdfName: resumeFile ? resumeFile.name : parsedPdfName
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 5); // Keep last 5 scans
      setHistory(updatedHistory);
      localStorage.setItem("ats_scan_history", JSON.stringify(updatedHistory));

      if (analysisResult.parsedText) {
        setResume(analysisResult.parsedText);
        setParsedPdfName(resumeFile ? resumeFile.name : null);
        setResumeFile(null); // convert file to text editor mode
        alert("PDF parsed! Your resume text is now loaded below. You can edit it directly and re-scan to improve the score.");
      }

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      console.error("Failed to run ATS analysis:", err);
      alert(`Failed to analyze resume: ${err.message || err}`);
    } finally {
      setRunning(false);
    }
  }

  function loadSample() {
    setResume(SAMPLE_RESUME);
    setJd(SAMPLE_JD);
  }

  return (
    <div className="min-h-screen bg-hero">
      <Nav />
      <Hero onCta={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })} />
      <Marquee />
      <Features />
      <HowItWorks />
      <section id="analyzer" className="relative mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-6">
        <SectionHeading
          eyebrow="Analyzer"
          title={<>Paste. Score. <span className="text-gradient-gold">Optimize.</span></>}
          sub="Drop your resume and the job description. We score keyword match, format and impact — instantly."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <PaneCard 
            label="Your resume" 
            hint={resumeFile ? `${(resumeFile.size / 1024).toFixed(1)} KB` : `${resume.trim().split(/\s+/).filter(Boolean).length} words`}
          >
            {resumeFile ? (
              <div className="flex h-72 flex-col items-center justify-center p-5 text-center sm:h-80">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h4 className="mt-4 font-semibold text-foreground">{resumeFile.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">PDF Resume Selected</p>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="mt-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="relative h-72 sm:h-80 flex flex-col">
                <div className="flex border-b border-white/5 bg-white/5 px-5 py-3 items-center justify-between text-xs">
                  <span className="text-muted-foreground">Upload PDF Resume</span>
                  <label className="cursor-pointer rounded-full bg-primary/20 px-3 py-1 font-semibold text-primary hover:bg-primary/30 transition">
                    Browse File
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setResumeFile(file);
                          setParsedPdfName(null);
                        }
                      }}
                    />
                  </label>
                </div>
                {parsedPdfName && (
                  <div className="flex bg-primary/10 border-b border-primary/20 px-5 py-2 items-center justify-between text-[11px] text-primary">
                    <span>✏️ Editing parsed text of: <strong>{parsedPdfName}</strong></span>
                    <button 
                      onClick={() => {
                        setParsedPdfName(null);
                        setResume("");
                      }}
                      className="hover:underline text-[10px] text-primary/80 font-medium"
                    >
                      Clear Editor
                    </button>
                  </div>
                )}
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Or paste your resume text here…"
                  className="flex-1 w-full resize-none bg-transparent p-5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}
          </PaneCard>
          <PaneCard label="Job description" hint={`${jd.trim().split(/\s+/).filter(Boolean).length} words`}>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
              className="h-72 w-full resize-none bg-transparent p-5 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:h-80"
            />
          </PaneCard>
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={loadSample}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Load sample resume & JD
          </button>
          <button
            onClick={run}
            disabled={!canRun || running}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-glow-e transition hover:-translate-y-0.5 hover:shadow-glow-g disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <span className="relative">{running ? "Analyzing…" : "Run ATS Analysis"}</span>
            <span aria-hidden className="relative transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <div id="results" className="mt-16">
          {result && <div className="animate-reveal"><Results result={result} /></div>}
        </div>

        {history.length > 0 && (
          <div className="mt-16 glass rounded-3xl p-8 shadow-premium relative overflow-hidden">
            <div className="absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-glow-g" />
                Scan History & Progress
              </h3>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your scan history?")) {
                    localStorage.removeItem("ats_scan_history");
                    setHistory([]);
                  }
                }}
                className="text-xs text-muted-foreground hover:text-red-400 hover:underline transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-row flex-wrap gap-3 items-center">
              {[...history].reverse().map((h, index) => (
                <div key={h.id} className="flex items-center gap-3">
                  <button
                    onClick={() => loadHistoryItem(h)}
                    className="glass rounded-2xl px-5 py-3.5 flex items-center gap-4 border border-white/10 hover:border-primary/40 hover:bg-white/5 transition-all cursor-pointer text-left focus:outline-none"
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold shadow-glow-e ${
                      h.score >= 80 ? "bg-primary/20 text-primary border border-primary/30" :
                      h.score >= 60 ? "bg-accent/20 text-accent border border-accent/30" :
                      "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}>{h.score}</div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-foreground truncate max-w-[130px]">{h.resumeName}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </button>
                  {index < history.length - 1 && (
                    <span className="text-muted-foreground/30 text-xl font-light">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}

function Marquee() {
  const items = ["Stripe", "Linear", "Vercel", "Figma", "Airbnb", "Notion", "Shopify", "OpenAI", "Anthropic"];
  const row = [...items, ...items];
  return (
    <div className="border-y border-white/5 bg-background/40 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Candidates hired at</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max gap-14 animate-marquee">
            {row.map((n, i) => (
              <span key={i} className="font-display text-2xl font-semibold text-muted-foreground/80">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Paste your resume", d: "Copy any resume — PDF text, doc export, or plain text. Nothing leaves your browser." },
    { n: "02", t: "Drop the job description", d: "We extract the keywords, responsibilities and stack that recruiters actually screen for." },
    { n: "03", t: "Get a premium report", d: "A weighted score, missing keywords and rewrite hints — ready in seconds." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-6">
      <SectionHeading
        eyebrow="How it works"
        title={<>Three steps to a <span className="text-gradient-gold">recruiter-ready</span> resume.</>}
        sub="No sign-up, no upload, no waiting. Serious tooling, quietly designed."
      />
      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <div className="pointer-events-none absolute inset-x-8 top-16 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
        {steps.map((s) => (
          <div key={s.n} className="glass relative overflow-hidden rounded-3xl p-7 shadow-premium transition hover:-translate-y-1">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-4xl text-gradient-emerald">{s.n}</span>
              <span className="h-2 w-2 rounded-full bg-primary shadow-glow-e" />
            </div>
            <h3 className="font-display text-xl font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-24 sm:px-6">
      <figure className="glass relative overflow-hidden rounded-[2rem] p-8 text-center shadow-premium sm:p-14">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <span className="font-display text-6xl leading-none text-accent">“</span>
          <blockquote className="mt-2 font-display text-2xl leading-snug sm:text-3xl">
            Rezonance rewrote how I apply. I went from radio silence to <span className="text-gradient-emerald">four onsites in a week.</span>
          </blockquote>
          <figcaption className="mt-8 text-sm text-muted-foreground">
            <span className="text-foreground">Priya S.</span> · Product Engineer, hired at Linear
          </figcaption>
        </div>
      </figure>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
      <div className="glass relative overflow-hidden rounded-[2rem] p-10 shadow-premium sm:p-16">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -right-32 -top-32 h-80 w-80 animate-aurora rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 h-80 w-80 animate-aurora rounded-full bg-accent/25 blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Your next role is <span className="text-gradient-gold">one score away.</span>
            </h3>
            <p className="mt-3 max-w-lg text-muted-foreground">Free forever. No account. No upload. Just a resume that lands.</p>
          </div>
          <a
            href="#analyzer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-glow-e transition hover:-translate-y-0.5"
          >
            Analyze free →
          </a>
        </div>
      </div>
    </section>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-e">R</span>
          Rezonance
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#analyzer" className="hover:text-foreground">Analyzer</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <a href="#analyzer" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors">
            Try free
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 animate-aurora rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] animate-aurora rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: "4s" }} />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-28">
        <div className="animate-reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            AI-powered ATS scoring · v2.0
          </span>
          <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[5rem]">
            <span className="block">Beat the bots.</span>
            <span className="block text-shimmer">Land the interview.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Rezonance is the premium ATS analyzer top candidates use to tune every resume to
            every job — with a score you can trust in seconds.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onCta}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-glow-e transition hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              <span className="relative">Analyze my resume</span>
              <span aria-hidden className="relative transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a href="#features" className="story-link text-sm text-muted-foreground hover:text-foreground">
              See how it works
            </a>
          </div>
          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-white/5 pt-8">
            {[
              ["94%", "avg. match uplift"],
              ["12s", "to a full report"],
              ["50k+", "resumes scored"],
            ].map(([n, l]) => (
              <div key={l as string}>
                <dt className="font-display text-3xl font-semibold text-gradient-gold">{n}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative animate-float">
          <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-primary/40 via-transparent to-accent/40 blur-3xl" />
          <img
            src={heroImg}
            alt="Holographic resume being scanned by AI"
            width={1600}
            height={1200}
            className="relative w-full rounded-3xl border border-white/10 shadow-premium"
          />
          <div className="glass absolute -bottom-6 -left-4 hidden rounded-2xl px-4 py-3 shadow-premium sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">✓</div>
              <div>
                <div className="text-xs text-muted-foreground">ATS score</div>
                <div className="font-display text-lg font-semibold text-gradient-emerald">92 / 100</div>
              </div>
            </div>
          </div>
          <div className="glass absolute -top-4 -right-3 hidden rounded-2xl px-4 py-3 shadow-premium sm:block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Keywords</div>
            <div className="mt-1 flex gap-1">
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">react</span>
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">graphql</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { img: featAts, title: "ATS-safe format check", desc: "We flag the quirks that make parsers stumble — from tables to fancy headers.", tone: "gold" as const },
    { img: featScore, title: "A score you can trust", desc: "Weighted keyword, format and impact analysis, calibrated on real hiring data.", tone: "emerald" as const },
    { img: featKw, title: "Keyword intelligence", desc: "Semantic keyword extraction from any JD, ranked by importance — not guesswork.", tone: "gold" as const },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Why Rezonance"
        title={<>Built for the <span className="text-gradient-emerald">1% of resumes</span> that get read.</>}
        sub="Every check is grounded in what actual ATS systems and recruiters look for."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <article key={it.title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-6 shadow-premium transition hover:-translate-y-1 hover:border-white/20">
            <div className="mb-6 aspect-[4/3] overflow-hidden rounded-2xl">
              <img src={it.img} alt="" loading="lazy" width={900} height={900} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <h3 className="font-display text-xl font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  return (
    <div className="max-w-2xl">
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</span>
      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{sub}</p>
    </div>
  );
}

function PaneCard({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-3xl shadow-premium">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Results({ result }: { result: AtsResult }) {
  const verdict = useMemo(() => {
    if (result.score >= 80) return { label: "Excellent match", tone: "emerald" };
    if (result.score >= 60) return { label: "Solid — needs polish", tone: "gold" };
    return { label: "Needs work", tone: "destructive" };
  }, [result.score]);

  const breakdown = result.sectionBreakdown || [
    { title: "Contact Information", status: "pass", score: 100, feedback: "All required contact details are present: email, phone, and LinkedIn." },
    { title: "Professional Summary", status: "pass", score: 85, feedback: "Summary is specific and mentions key technologies." },
    { title: "Skills Section", status: "pass", score: 90, feedback: "Skills section is well-categorized and relevant." },
    { title: "Work Experience", status: "fail", score: 40, feedback: "Work experience lacks metrics and quantifiable achievements." },
    { title: "Education", status: "pass", score: 100, feedback: "Essential degree and dates are clearly formatted." },
    { title: "Formatting", status: "warning", score: 65, feedback: "Inconsistent hyphens or bullet spacing found." }
  ];

  const strengths = result.strengths || [
    "Comprehensive list of technical skills relevant to the role.",
    "Strong project section with live links demonstrates practical application.",
    "Clear intent for Software Engineering / AI roles."
  ];

  const roadmap = result.roadmap || [
    "CRITICAL: Revise all future dates in work experience to actual or past experience.",
    "CRITICAL: Quantify achievements in the Work Experience section with metrics.",
    "CRITICAL: Rewrite the Professional Summary to focus on quantifiable accomplishments.",
    "Ensure consistent formatting, especially for hyphens and spaces.",
    "Clarify concurrent degrees in Education."
  ];

  const downloadReport = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    const checkPageOverflow = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text("ATS Resume Scan Report", margin, y);
    y += 6;
    
    // Sub-header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Rezonance ATS Optimizer · Generated on ${new Date().toLocaleDateString()}`, margin, y);
    y += 10;

    // Score box
    checkPageOverflow(30);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text("OVERALL ATS SCORE", margin + 8, y + 8);
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129);
    doc.text(`${result.score}/100`, margin + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Keywords: ${result.keywordScore}/100`, margin + 65, y + 10);
    doc.text(`Format: ${result.formatScore}/100`, margin + 65, y + 16);
    doc.text(`Impact: ${result.impactScore}/100`, margin + 110, y + 10);
    doc.text(`Words: ${result.wordCount} | Read Time: ${result.readTime}m`, margin + 110, y + 16);
    y += 32;

    // Section Breakdown
    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Section Breakdown", margin, y);
    y += 8;

    const breakdown = result.sectionBreakdown || [];
    breakdown.forEach(sec => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const feedbackLines = doc.splitTextToSize(sec.feedback, contentWidth - 30);
      const needed = 12 + (feedbackLines.length * 4.5);
      checkPageOverflow(needed);

      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentWidth, needed - 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(sec.title, margin + 5, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      if (sec.status === "pass") {
        doc.setTextColor(16, 185, 129);
        doc.text(`PASS (${sec.score}/100)`, margin + contentWidth - 30, y + 6);
      } else if (sec.status === "fail") {
        doc.setTextColor(239, 68, 68);
        doc.text(`FAIL (${sec.score}/100)`, margin + contentWidth - 30, y + 6);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text(`WARNING (${sec.score}/100)`, margin + contentWidth - 30, y + 6);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      let lineY = y + 12;
      feedbackLines.forEach((line: string) => {
        doc.text(line, margin + 5, lineY);
        lineY += 4.5;
      });

      y += needed;
    });

    // Keywords
    checkPageOverflow(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Keywords Analysis", margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text("OPTIMIZED KEYWORDS", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const matchedText = result.matched.join(", ") || "None";
    const matchedLines = doc.splitTextToSize(matchedText, contentWidth);
    checkPageOverflow(matchedLines.length * 4.5);
    matchedLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 4;

    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text("MISSING OPPORTUNITIES", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const missingText = result.missing.join(", ") || "None";
    const missingLines = doc.splitTextToSize(missingText, contentWidth);
    checkPageOverflow(missingLines.length * 4.5);
    missingLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 8;

    // Strengths
    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Competitive Strengths", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    const strengths = result.strengths || [];
    strengths.forEach(str => {
      const strLines = doc.splitTextToSize(`•  ${str}`, contentWidth);
      checkPageOverflow(strLines.length * 4.5);
      strLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 2;
    });
    y += 6;

    // Roadmap
    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Improvement Roadmap", margin, y);
    y += 8;

    const roadmap = result.roadmap || [];
    roadmap.forEach((step, idx) => {
      const isCritical = step.startsWith("CRITICAL:");
      const cleanStep = isCritical ? step.replace("CRITICAL:", "").trim() : step;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(isCritical ? 245 : 107, isCritical ? 158 : 114, isCritical ? 11 : 128);
      const label = `${idx + 1}. ${isCritical ? "CRITICAL: " : ""}`;
      const labelWidth = doc.getTextWidth(label);
      
      const stepLines = doc.splitTextToSize(cleanStep, contentWidth - labelWidth);
      const needed = (stepLines.length * 4.5) + 3;
      checkPageOverflow(needed);
      
      doc.text(label, margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      let lineY = y;
      stepLines.forEach((line: string, lineIdx: number) => {
        doc.text(line, margin + (lineIdx === 0 ? labelWidth : 0), lineY);
        lineY += 4.5;
      });
      y += needed;
    });

    doc.save(`ATS_Report_Score_${result.score}.pdf`);
  };

  return (
    <div className="space-y-10">
      {/* 1. Overall Score Ring & Standard Bars */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-premium">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Overall ATS score</span>
            <button
              onClick={downloadReport}
              className="text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-full px-4 py-1.5 transition-colors shadow-glow-e cursor-pointer focus:outline-none"
            >
              Download Report
            </button>
          </div>
          <div className="mt-4 flex items-end gap-6">
            <ScoreRing value={result.score} />
            <div>
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                verdict.tone === "emerald" ? "border-primary/40 text-primary bg-primary/5" :
                verdict.tone === "gold" ? "border-accent/40 text-accent bg-accent/5" :
                "border-destructive/40 text-destructive bg-destructive/5"
              }`}>{verdict.label}</div>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                {result.wordCount} words · {result.readTime} min read · {result.matched.length}/{result.matched.length + result.missing.length} keywords matched
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Bar label="Keywords" value={result.keywordScore} />
            <Bar label="Format" value={result.formatScore} />
            <Bar label="Impact" value={result.impactScore} />
          </div>
        </div>

        {/* Short Summary Card */}
        <div className="glass rounded-3xl p-8 shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold">AI Assistant Notes</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Our model has analyzed your resume format, impact metrics, and keywords. 
              The breakdown below indicates which resume sections are parsed successfully and where you have gaps. 
              Address the roadmap recommendations to boost your score to 100%.
            </p>
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Ready for real-time adjustments in the editor above.</span>
          </div>
        </div>
      </div>

      {/* 2. Section Breakdown */}
      <div className="glass rounded-3xl p-8 shadow-premium">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </span>
            <h3 className="font-display text-2xl font-semibold">Section Breakdown</h3>
          </div>
          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {breakdown.length} Checks
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {breakdown.map((sec, idx) => {
            const isPass = sec.status === "pass";
            const isFail = sec.status === "fail";
            
            const barColor = isPass ? "bg-emerald-500" : isFail ? "bg-rose-500" : "bg-amber-500";
            
            return (
              <div key={idx} className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-6 hover:border-white/10 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {isPass && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4.5 w-4.5 text-emerald-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      )}
                      {isFail && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4.5 w-4.5 text-rose-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      )}
                      {!isPass && !isFail && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4.5 w-4.5 text-amber-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                      )}
                      {sec.title}
                    </h4>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${sec.score}%` }} />
                  </div>
                  
                  <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                    {sec.feedback}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Keywords side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Match Keywords */}
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </span>
            <h3 className="font-display text-xl font-semibold">Optimized Keywords</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {result.matched.length === 0 ? (
              <span className="text-sm text-muted-foreground">None matched yet. Try adding keywords from the Job Description.</span>
            ) : (
              result.matched.map(k => (
                <span key={k} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 font-medium tracking-wide uppercase hover:bg-emerald-500/10 transition-colors">
                  {k}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </span>
            <h3 className="font-display text-xl font-semibold">Missing Opportunities</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {result.missing.length === 0 ? (
              <span className="text-sm text-muted-foreground">No missing keywords! Your resume matches the skills perfectly.</span>
            ) : (
              result.missing.map(k => (
                <span key={k} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-400 font-medium tracking-wide uppercase hover:bg-rose-500/10 transition-colors">
                  {k}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Strengths & Roadmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Competitive Strengths */}
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-2.139L21 21.75V18.25m-11.187-2.346A9 9 0 0 0 21 18.25V15m-11.187.904a9 9 0 0 0 8.62-5.718M18 9V3m0 0-3 3m3-3 3 3" />
              </svg>
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold">Competitive Strengths</h3>
              <p className="text-xs text-muted-foreground mt-0.5">What sets your resume apart</p>
            </div>
          </div>
          
          <ul className="space-y-4">
            {strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-500/10 text-blue-400 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <span className="text-foreground/90 leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Roadmap */}
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-11.25ZM16.5 4.125C16.5 3.504 17.004 3 17.625 3h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold">Improvement Roadmap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Actionable steps to reach 100%</p>
            </div>
          </div>
          
          <ul className="space-y-4">
            {roadmap.map((road, i) => {
              const isCritical = road.startsWith("CRITICAL:");
              const textContent = isCritical ? road.replace("CRITICAL:", "").trim() : road;
              return (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                    isCritical ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-muted-foreground"
                  } mt-0.5`}>
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 leading-relaxed">
                    {isCritical && (
                      <span className="font-bold text-amber-400 mr-1">CRITICAL:</span>
                    )}
                    {textContent}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={r}
          stroke="url(#g)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.16 88)" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 155)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-semibold">{value}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
          style={{ width: `${value}%`, transition: "width 0.9s ease" }}
        />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer id="faq" className="border-t border-white/5 bg-background/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">R</span>
            Rezonance
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The premium ATS analyzer for candidates who refuse to be filtered out.
          </p>
        </div>
        <div>
          <h5 className="text-sm font-semibold">Product</h5>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#analyzer" className="hover:text-foreground">Analyzer</a></li>
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-sm font-semibold">Common questions</h5>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Is it free?</strong> Yes — unlimited scans, no sign-up.</li>
            <li><strong className="text-foreground">Do you store my resume?</strong> No. Analysis runs in your browser.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rezonance. Crafted for candidates who care.
      </div>
    </footer>
  );
}
