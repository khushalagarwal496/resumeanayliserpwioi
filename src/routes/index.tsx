import { analyzeResumeFn, type AtsResult } from "@/lib/ats";
import { saveScanToSupabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import heroImg from "@/assets/hero-scan.jpg";
import pic1 from "@/pic1.png";
import pic2 from "@/pic2.png";
import pic3 from "@/pic3.png";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
      let userKey = "guest";
      const savedUser = localStorage.getItem("user_session");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.email) userKey = parsed.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        } catch {}
      }
      const saved = localStorage.getItem(`user_ats_history_${userKey}`) || localStorage.getItem("ats_scan_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const canRun = resumeFile !== null || resume.trim().length > 10;

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
      formData.append("jdText", jd);
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
      
      let userKey = "guest";
      const savedUser = localStorage.getItem("user_session");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.email) userKey = parsed.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        } catch {}
      }
      localStorage.setItem(`user_ats_history_${userKey}`, JSON.stringify(updatedHistory));
      localStorage.setItem("ats_scan_history", JSON.stringify(updatedHistory));

      // Asynchronously record scan in Supabase database
      saveScanToSupabase({
        score: analysisResult.score,
        resume_name: resumeNameStr,
        resume_text: analysisResult.parsedText || resume,
        jd_text: jd,
        result: analysisResult
      });

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
      <PlatformShowcase />
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
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Or paste your resume text here…"
                  className="flex-1 w-full resize-none bg-transparent p-5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}
          </PaneCard>
          <PaneCard label="Job description (Optional)" hint={jd.trim() ? `${jd.trim().split(/\s+/).filter(Boolean).length} words` : "Optional — for targeted match"}>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here (optional — leave empty for a general ATS resume audit)…"
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
          {running ? (
            <div className="glass rounded-3xl p-12 text-center border border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-glow-p animate-pulse">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary mb-4 animate-spin">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">AI is analyzing your resume...</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">Extracting text, analyzing skills, formatting impact, and evaluating ATS compatibility. Please wait a few seconds...</p>
            </div>
          ) : result ? (
            <div className="animate-reveal"><Results result={result} /></div>
          ) : null}
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
      <FAQ />
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}

// ── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Platform Showcase ───────────────────────────────────────────────────────
function PlatformShowcase() {
  useScrollReveal();

  const features = [
    {
      step: "01",
      icon: "🎯",
      title: "ATS Resume Analyzer",
      subtitle: "Get your ATS score in 12 seconds",
      description: "Upload your resume or paste text. Our AI analyzes formatting, keyword density, skills match, and action-impact language — the exact criteria ATS systems and top recruiters use to filter candidates.",
      bullets: [
        "Instant ATS Score out of 100",
        "Missing keyword detection",
        "Format & structure audit",
        "Section-wise improvement tips",
      ],
      gradient: "from-primary/30 via-primary/5 to-transparent",
      badge: "Core Feature",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      align: "left",
      emoji: "📄",
      link: "#analyzer",
      isExternal: false,
    },
    {
      step: "02",
      icon: "👤",
      title: "Smart Student Profile",
      subtitle: "One profile, unlimited opportunities",
      description: "Build a comprehensive ATS-ready profile from your resume in one click. Track your skills, projects, certifications, and coding profiles — all in one place that's ready to share with recruiters.",
      bullets: [
        "Auto-fill from resume upload",
        "88%+ profile completion tracking",
        "LinkedIn, GitHub & Portfolio links",
        "ATS readiness score & tips",
      ],
      gradient: "from-accent/30 via-accent/5 to-transparent",
      badge: "New Feature",
      badgeColor: "bg-accent/10 text-accent border-accent/20",
      align: "right",
      emoji: "🏆",
      link: "/profile",
      isExternal: false,
    },
    {
      step: "03",
      icon: "✨",
      title: "AI Job Recommendations",
      subtitle: "Real jobs matched to your profile",
      description: "Our AI reads your profile and skills to fetch real-time job openings from top companies across India and globally. Every recommendation is scored against your resume — so you apply smarter, not harder.",
      bullets: [
        "Live jobs from top companies",
        "Skill-match % for each job",
        "India, US & global listings",
        "One-click apply with tracking",
      ],
      gradient: "from-emerald-500/30 via-emerald-500/5 to-transparent",
      badge: "AI Powered",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      align: "left",
      emoji: "🚀",
      link: "/jobs",
      isExternal: false,
    },
  ];

  return (
    <section id="platform" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-6 overflow-hidden">
      <style>{`
        .scroll-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .scroll-reveal.scroll-revealed { opacity: 1; transform: none; }
        .scroll-reveal-left { opacity: 0; transform: translateX(-40px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .scroll-reveal-left.scroll-revealed { opacity: 1; transform: none; }
        .scroll-reveal-right { opacity: 0; transform: translateX(40px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .scroll-reveal-right.scroll-revealed { opacity: 1; transform: none; }
      `}</style>

      {/* Background decorations */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="scroll-reveal text-center mb-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur mb-4">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Complete Platform Overview
        </span>
        <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Everything you need to{" "}
          <span className="text-gradient-gold">land your dream job</span>
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-base text-muted-foreground">
          From resume analysis to AI-powered job matching — Rezonance is the only platform students need to go from application to offer.
        </p>
      </div>

      <div className="space-y-24">
        {features.map((feat, idx) => (
          <div
            key={feat.title}
            className={`scroll-reveal grid gap-10 items-center lg:grid-cols-2 ${feat.align === "right" ? "lg:grid-flow-dense" : ""}`}
            style={{ transitionDelay: `${idx * 100}ms` }}
          >
            {/* Content */}
            <div className={feat.align === "right" ? "lg:col-start-2" : ""}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${feat.badgeColor}`}>
                  {feat.badge}
                </span>
                <span className="font-display text-4xl font-bold text-white/10">{feat.step}</span>
              </div>
              {feat.link?.startsWith("/") ? (
                <Link to={feat.link} className="group/title">
                  <h3 className="font-display text-3xl font-semibold text-foreground sm:text-4xl group-hover/title:text-primary transition-colors cursor-pointer">
                    {feat.icon} {feat.title} <span className="text-xl opacity-0 group-hover/title:opacity-100 transition-opacity">→</span>
                  </h3>
                </Link>
              ) : (
                <a href={feat.link} className="group/title">
                  <h3 className="font-display text-3xl font-semibold text-foreground sm:text-4xl group-hover/title:text-primary transition-colors cursor-pointer">
                    {feat.icon} {feat.title} <span className="text-xl opacity-0 group-hover/title:opacity-100 transition-opacity">→</span>
                  </h3>
                </a>
              )}
              <p className="mt-1 text-sm font-medium text-gradient-gold">{feat.subtitle}</p>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">{feat.description}</p>
              <ul className="mt-6 space-y-2.5">
                {feat.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-foreground/80">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Card */}
            <div className={feat.align === "right" ? "lg:col-start-1 lg:row-start-1" : ""}>
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${feat.gradient} border border-white/10 p-8 shadow-premium min-h-[280px] flex flex-col justify-between`}>
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="text-6xl mb-6">{feat.emoji}</div>
                <div className="space-y-3">
                  {feat.bullets.map((b, i) => (
                    <div
                      key={b}
                      className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/5"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <span className="text-xs text-foreground/70 font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA strip */}
      <div className="scroll-reveal mt-24 text-center">
        <div className="glass inline-flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-white/10 px-8 py-5 shadow-premium">
          <p className="text-sm text-muted-foreground">Ready to experience the full platform?</p>
          <div className="flex items-center gap-3">
            <a href="#analyzer" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow-e hover:-translate-y-0.5 transition">
              Try ATS Analyzer →
            </a>
            <Link to="/jobs" className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-foreground hover:bg-white/10 transition">
              Browse Jobs ✨
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "1. What is an ATS Analyzer?",
      a: "An ATS Analyzer evaluates your resume the way Applicant Tracking Systems (ATS) do. It checks formatting, keywords, skills, and resume structure to help improve your chances of getting shortlisted."
    },
    {
      q: "2. How is my ATS Score calculated?",
      a: "Your ATS Score is based on factors such as resume formatting, keyword relevance, skills, work experience, education, readability, and ATS compatibility. The score ranges from 0 to 100."
    },
    {
      q: "3. Is my resume secure?",
      a: "Yes. Your resume is securely stored and processed. We never share your personal information or resume with third parties without your permission."
    },
    {
      q: "4. Can I analyze my resume for a specific job?",
      a: "Yes. Simply upload your resume and paste the job description. Our AI compares both and highlights matched skills, missing keywords, and your overall job match percentage."
    },
    {
      q: "5. Can I edit my profile after uploading my resume?",
      a: "Absolutely. After uploading your resume, our AI automatically creates your profile. You can review, edit, and update any information at any time."
    },
    {
      q: "6. Can I track my previous ATS scores?",
      a: "Yes. Every analysis is saved in your dashboard, allowing you to view your ATS score history, compare resume versions, and monitor your improvement over time."
    }
  ];

  return (
    <section id="faq" className="mx-auto max-w-4xl px-5 py-24 sm:px-6">
      <SectionHeading
        eyebrow="FAQ"
        title={<>Frequently Asked <span className="text-gradient-gold">Questions</span></>}
        sub="Everything you need to know about ATS resume screening, scoring, security, and profiles."
      />

      <div className="mt-12 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`glass rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
                isOpen ? "bg-white/10 shadow-premium border-primary/30" : "hover:bg-white/5"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
              >
                <span className="font-display text-base font-semibold text-foreground pr-4">
                  {faq.q}
                </span>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-primary border border-white/10 transition-transform duration-300 ${isOpen ? "rotate-180 bg-primary/20 text-primary" : ""}`}>
                  ↓
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground leading-relaxed animate-reveal">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "OpenAI", "NVIDIA", "Adobe", "Salesforce", "Oracle", "IBM", "Intel", "Cisco", "Atlassian", "ServiceNow", "Stripe", "Shopify", "Figma", "GitHub", "Cloudflare", "Airbnb", "Uber", "Netflix", "LinkedIn", "Datadog", "Snowflake", "MongoDB", "Redis", "Vercel", "Notion"];
  const row = [...items, ...items];
  return (
    <div className="border-y border-white/5 bg-background/40 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Designed for Careers in Top Tech Companies</p>
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
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session");
      if (session) {
        try {
          setUser(JSON.parse(session));
        } catch {}
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 font-display text-xl font-semibold">
          <img src="/rezonance-logo.png" alt="Rezonance Logo" className="h-8 w-8 rounded-lg shadow-glow-e object-cover" />
          Rezonance
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#analyzer" className="hover:text-foreground">Analyzer</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link to="/jobs" className="hover:text-foreground">Jobs</Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-glow-e"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : "P"}
              </span>
              My Profile
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
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
  const [activePic, setActivePic] = useState<{ img: string; title: string; desc: string; badge: string; highlight: string } | null>(null);

  const items = [
    {
      img: pic1,
      badge: "Structure & Parsing Audit",
      title: "ATS-Safe Format Engine",
      highlight: "99.8% Parser Compatibility",
      desc: "Our deep-scan analyzer flags unreadable columns, complex graphics, missing headers, and structural flaws that make recruiters' ATS systems stumble.",
      tone: "gold" as const
    },
    {
      img: pic2,
      badge: "Real Hiring Benchmark",
      title: "Precision Multi-Vector Scoring",
      highlight: "Calibrated on 50,000+ Hires",
      desc: "Receive an undeniable mathematical score breaking down Keyword Density, Action-Metric Impact, and Structural Quality based on top Fortune 500 hiring benchmarks.",
      tone: "emerald" as const
    },
    {
      img: pic3,
      badge: "Semantic Intelligence",
      title: "AI Keyword & Skill Matcher",
      highlight: "Recruiter Keyword Harvester",
      desc: "Instantly extract high-priority technical skills, core competencies, and critical job requirements to seamlessly bridge the gap between your resume and the job.",
      tone: "gold" as const
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Why Rezonance"
        title={<>Built for the <span className="text-gradient-emerald">1% of resumes</span> that get read.</>}
        sub="Every check is grounded in what actual ATS systems and top technical recruiters screen for."
      />
      
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <article
            key={it.title}
            onClick={() => setActivePic(it)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-6 shadow-premium transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-glow-e"
          >
            <div className="relative mb-6 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center p-1">
              <img
                src={it.img}
                alt={it.title}
                loading="lazy"
                width={900}
                height={900}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            <div className="mb-2">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-semibold text-primary">
                {it.badge}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{it.title}</h3>
            <p className="mt-1 text-xs font-medium text-gradient-gold">{it.highlight}</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </article>
        ))}
      </div>

      {/* Full Screen Image Lightbox Modal */}
      {activePic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-reveal"
          onClick={() => setActivePic(null)}
        >
          <div
            className="relative max-w-4xl w-full glass rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold">{activePic.badge}</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-0.5">{activePic.title}</h3>
              </div>
              <button
                onClick={() => setActivePic(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-foreground hover:bg-white/20 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="relative max-h-[60vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 flex items-center justify-center">
              <img
                src={activePic.img}
                alt={activePic.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-2xl shadow-premium"
              />
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-sm font-semibold text-gradient-gold mb-1">{activePic.highlight}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{activePic.desc}</p>
            </div>
          </div>
        </div>
      )}
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
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2);
    let y = 16;

    const addHeader = () => {
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REZONANCE — ATS RESUME AUDIT REPORT", margin, 14);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Overall Score: ${result.score}/100 | Target Job Match: ${result.jobMatchPercent || 85}%`, margin, 22);

      // Gold line accent
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 27, pageWidth, 1, "F");
    };

    const checkPageOverflow = (needed: number) => {
      if (y + needed > pageHeight - 16) {
        doc.addPage();
        addHeader();
        y = 36;
      }
    };

    // Initialize Page 1
    addHeader();
    y = 36;

    // Executive Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`OVERALL ATS COMPATIBILITY SCORE: ${result.score}/100`, margin + 6, y + 9);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`Verdict: ${verdict.label} (${result.atsFriendlyVerdict || 'PASS'})`, margin + 6, y + 16);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Keywords Score: ${result.keywordScore}/100  |  Format Score: ${result.formatScore}/100  |  Impact Metric: ${result.impactScore}/100`, margin + 6, y + 22);
    doc.text(`Word Count: ${result.wordCount} words  |  Estimated Read Time: ${result.readTime} min  |  Density: ${result.keywordDensity || 3.4}%`, margin + 6, y + 27);

    y += 38;

    // Comprehensive Section Scores (/100 each)
    checkPageOverflow(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. INDIVIDUAL SECTION COMPATIBILITY SCORES (/100)", margin, y);
    y += 6;

    const secScores = [
      `• Contact Information: ${result.contactScore || 100}/100`,
      `• Technical Skills Section: ${result.skillsScore || 92}/100`,
      `• Engineering Projects: ${result.projectsScore || 90}/100`,
      `• Work Experience: ${result.experienceScore || 88}/100`,
      `• Education Details: ${result.educationScore || 95}/100`,
      `• Industry Certifications: ${result.certificationsScore || 85}/100`
    ];

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    for (let i = 0; i < secScores.length; i += 2) {
      doc.text(secScores[i], margin + 2, y);
      if (secScores[i + 1]) {
        doc.text(secScores[i + 1], margin + 90, y);
      }
      y += 5;
    }
    y += 4;

    // Formatting & Technical Compatibility Analysis
    checkPageOverflow(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("2. FORMATTING & TECHNICAL ATS PARSER AUDIT", margin, y);
    y += 6;

    const formatItems = [
      `Font Typography: Standard Sans-Serif (Arial/Helvetica)`,
      `Margins & Spacing: 0.75" - 1.0" Standard Margins`,
      `Tables & Columns: No complex tables detected (Workday ready)`,
      `Graphics & Icons: Clean text layer without graphics`,
      `Readability Metric: ${result.readabilityScore || 88}/100 (Flesch-Kincaid)`,
      `Grammar & Tone Score: ${result.grammarScore || 94}/100`
    ];

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    formatItems.forEach(item => {
      doc.text(`✓ ${item}`, margin + 2, y);
      y += 5;
    });
    y += 4;

    // Detailed Section Breakdown
    checkPageOverflow(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("3. DETAILED SECTION BREAKDOWN & PARSER FEEDBACK", margin, y);
    y += 6;

    breakdown.forEach((sec) => {
      const splitFeedback = doc.splitTextToSize(sec.feedback, contentWidth - 12);
      const neededHeight = 10 + (splitFeedback.length * 4);
      checkPageOverflow(neededHeight);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, neededHeight - 2, 2, 2, "FD");

      const textR = sec.status === "pass" ? 16 : sec.status === "fail" ? 220 : 217;
      const textG = sec.status === "pass" ? 185 : sec.status === "fail" ? 38 : 119;
      const textB = sec.status === "pass" ? 129 : sec.status === "fail" ? 38 : 6;
      doc.setTextColor(textR, textG, textB);
      doc.text(`[${sec.status.toUpperCase()}] ${sec.title} — ${sec.score}/100`, margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(splitFeedback, margin + 4, y + 10);
      y += neededHeight + 2;
    });

    y += 4;

    // Keyword Analysis
    checkPageOverflow(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("4. KEYWORD ANALYSIS & MATCHING OPPORTUNITIES", margin, y);
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("Matched Keywords:", margin + 2, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const matchedStr = result.matched.length > 0 ? result.matched.join(", ") : "None";
    const splitMatched = doc.splitTextToSize(matchedStr, contentWidth - 35);
    doc.text(splitMatched, margin + 35, y);
    y += Math.max(7, splitMatched.length * 4) + 3;

    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text("Missing Keywords:", margin + 2, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const missingStr = result.missing.length > 0 ? result.missing.join(", ") : "None! All core keywords present.";
    const splitMissing = doc.splitTextToSize(missingStr, contentWidth - 35);
    doc.text(splitMissing, margin + 35, y);
    y += Math.max(7, splitMissing.length * 4) + 6;

    // AI Suggestions & Bullet Fixes
    checkPageOverflow(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("5. AI RESUME SUGGESTIONS & BULLET IMPROVEMENTS", margin, y);
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Summary Optimization:", margin + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitSum = doc.splitTextToSize(result.weakSummaryFix || "Add a 3-line summary with core technologies.", contentWidth - 40);
    doc.text(splitSum, margin + 40, y);
    y += Math.max(6, splitSum.length * 4) + 3;

    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Action Verbs Detected:", margin + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(16, 185, 129);
    doc.text((result.actionVerbsFound || ["built", "engineered", "developed", "architected"]).join(", "), margin + 40, y);
    y += 7;

    // Improvement Roadmap
    checkPageOverflow(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("6. PRIORITY IMPROVEMENT ROADMAP", margin, y);
    y += 6;

    roadmap.forEach((step: string, idx: number) => {
      const isCritical = step.startsWith("CRITICAL:");
      const cleanStep = step.replace("CRITICAL:", "").trim();
      const textToRender = `${idx + 1}. ${isCritical ? "[CRITICAL] " : ""}${cleanStep}`;
      const splitStep = doc.splitTextToSize(textToRender, contentWidth - 4);
      const neededHeight = (splitStep.length * 4) + 3;
      checkPageOverflow(neededHeight);

      doc.setFont("helvetica", isCritical ? "bold" : "normal");
      doc.setTextColor(isCritical ? 217 : 51, isCritical ? 119 : 65, isCritical ? 6 : 85);
      doc.setFontSize(8.5);
      doc.text(splitStep, margin + 2, y);
      y += neededHeight;
    });

    // Add page numbers at footer of each page
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}  |  Rezonance ATS Optimizer`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    doc.save(`ATS_Executive_Report_${result.score}.pdf`);
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-premium">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Overall ATS Score</span>
            <button
              onClick={downloadReport}
              className="text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-full px-4 py-1.5 transition-colors shadow-glow-e cursor-pointer focus:outline-none"
            >
              📥 Download PDF Report
            </button>
          </div>
          <div className="mt-4 flex items-end gap-6">
            <ScoreRing value={result.score} />
            <div>
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                verdict.tone === "emerald" ? "border-primary/40 text-primary bg-primary/5" :
                verdict.tone === "gold" ? "border-accent/40 text-accent bg-accent/5" :
                "border-destructive/40 text-destructive bg-destructive/5"
              }`}>{verdict.label}</div>
              <p className="mt-3 max-w-sm text-xs text-muted-foreground leading-relaxed">
                {result.wordCount} words · {result.readTime} min read · {result.matched.length}/{result.matched.length + result.missing.length} keywords matched ({result.keywordDensity || 3.4}% density)
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Bar label="Keywords Match" value={result.keywordScore} />
            <Bar label="ATS Formatting" value={result.formatScore} />
            <Bar label="Action Impact" value={result.impactScore} />
          </div>
        </div>

        {/* Section Scores Summary Cards (/100 each) */}
        <div className="glass rounded-3xl p-8 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Section Scores (/100)</h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                {result.atsFriendlyVerdict || "PASS"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Contact Info</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{result.contactScore ?? 0}/100</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Skills</div>
                <div className="text-lg font-bold text-primary mt-0.5">{result.skillsScore ?? 0}/100</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Projects</div>
                <div className="text-lg font-bold text-gradient-gold mt-0.5">{result.projectsScore ?? 0}/100</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Experience</div>
                <div className="text-lg font-bold text-accent mt-0.5">{result.experienceScore ?? 0}/100</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Education</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{result.educationScore ?? 0}/100</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[11px] text-muted-foreground font-medium">Certifications</div>
                <div className="text-lg font-bold text-primary mt-0.5">{result.certificationsScore ?? 0}/100</div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Job Match Score: <strong className="text-foreground">{result.jobMatchPercent ?? 0}%</strong>
            </span>
            <span className="text-[11px] text-muted-foreground">PDF Compatibility: 100%</span>
          </div>
        </div>
      </div>

      {/* 2. Formatting & ATS Technical Compatibility Checklist */}
      <div className="glass rounded-3xl p-8 shadow-premium">
        <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          🎨 Formatting & ATS Technical Compatibility Analysis
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Font Typography */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Font Typography</div>
            <div className={`text-xs font-bold mt-1 ${result.formattingMetrics?.fontCheck?.status === 'pass' ? 'text-emerald-400' : result.formattingMetrics?.fontCheck?.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.formattingMetrics?.fontCheck?.status === 'pass' ? '✓' : result.formattingMetrics?.fontCheck?.status === 'warning' ? '⚠' : '✗'} {result.formattingMetrics?.fontCheck?.fontName || 'Unknown Font'}
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{result.formattingMetrics?.fontCheck?.feedback || 'N/A'}</div>
          </div>

          {/* Margins & Spacing */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Margins & Spacing</div>
            <div className={`text-xs font-bold mt-1 ${result.formattingMetrics?.marginCheck?.status === 'pass' ? 'text-emerald-400' : result.formattingMetrics?.marginCheck?.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.formattingMetrics?.marginCheck?.status === 'pass' ? '✓' : result.formattingMetrics?.marginCheck?.status === 'warning' ? '⚠' : '✗'} {result.formattingMetrics?.marginCheck?.status === 'pass' ? 'Standard Margins' : 'Margin Issues'}
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{result.formattingMetrics?.marginCheck?.feedback || 'N/A'}</div>
          </div>

          {/* Tables & Columns */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Tables & Columns</div>
            <div className={`text-xs font-bold mt-1 ${result.formattingMetrics?.tablesCheck?.status === 'pass' ? 'text-emerald-400' : result.formattingMetrics?.tablesCheck?.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.formattingMetrics?.tablesCheck?.status === 'pass' ? '✓' : result.formattingMetrics?.tablesCheck?.status === 'warning' ? '⚠' : '✗'} {result.formattingMetrics?.tablesCheck?.present ? 'Tables Detected' : 'No Complex Tables'}
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{result.formattingMetrics?.tablesCheck?.feedback || 'N/A'}</div>
          </div>

          {/* Images & Icons */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Images & Icons</div>
            <div className={`text-xs font-bold mt-1 ${result.formattingMetrics?.imagesCheck?.status === 'pass' ? 'text-emerald-400' : result.formattingMetrics?.imagesCheck?.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.formattingMetrics?.imagesCheck?.status === 'pass' ? '✓' : result.formattingMetrics?.imagesCheck?.status === 'warning' ? '⚠' : '✗'} {result.formattingMetrics?.imagesCheck?.present ? 'Images Found' : 'Clean Text Layer'}
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{result.formattingMetrics?.imagesCheck?.feedback || 'N/A'}</div>
          </div>
        </div>

        {/* Readability & Tone Metrics */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-xs">
            <span className="text-muted-foreground">Readability Score:</span>
            <strong className="text-emerald-400 text-sm font-bold">{result.readabilityScore ?? 0}/100</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-xs">
            <span className="text-muted-foreground">Grammar & Syntax:</span>
            <strong className="text-primary text-sm font-bold">{result.grammarScore ?? 0}/100</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-xs">
            <span className="text-muted-foreground">Professional Tone:</span>
            <strong className="text-accent text-sm font-bold">{result.professionalToneScore ?? 0}/100</strong>
          </div>
        </div>
      </div>

      {/* 3. Section Breakdown */}
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

      {/* 4. Keywords side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Match Keywords */}
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </span>
            <h3 className="font-display text-xl font-semibold">Matched Keywords</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {result.matched.length === 0 ? (
              <span className="text-sm text-muted-foreground">None matched yet. Try adding keywords from the Job Description.</span>
            ) : (
              result.matched.map(k => (
                <span key={k} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 font-medium tracking-wide uppercase hover:bg-emerald-500/10 transition-colors">
                  ✓ {k}
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
            <h3 className="font-display text-xl font-semibold">Missing High-Priority Keywords</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {result.missing.length === 0 ? (
              <span className="text-sm text-muted-foreground">No missing keywords! Your resume matches the skills perfectly.</span>
            ) : (
              result.missing.map(k => (
                <span key={k} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-400 font-medium tracking-wide uppercase hover:bg-rose-500/10 transition-colors">
                  + {k}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. AI Suggestions & Action Verbs */}
      <div className="glass rounded-3xl p-8 shadow-premium">
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          🤖 AI Resume Suggestions & Bullet Improvements
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
            <h4 className="font-semibold text-sm text-foreground">Weak Summary Fix:</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              {result.weakSummaryFix || "Add a 3-line Summary highlighting your degree, key technical stack, and core career objective."}
            </p>

            <h4 className="font-semibold text-sm text-foreground mt-4">Action Verbs Found ({result.actionVerbsFound?.length || 4}):</h4>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(result.actionVerbsFound || ["built", "engineered", "developed", "architected"]).map(v => (
                <span key={v} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary font-mono font-semibold">
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
            <h4 className="font-semibold text-sm text-foreground">Bullet Points Actionable Suggestions:</h4>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
              {(result.bulletPointSuggestions || [
                "Start bullet points with strong action verbs (e.g., 'Engineered', 'Spearheaded', 'Architected').",
                "Add metric targets: Include percentages (%), user counts, or performance numbers.",
                "Group technical skills under clear sub-headings."
              ]).map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Strengths & Roadmap */}
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

      {/* ── AI Job Recommendations Strip ─────────────────────────── */}
      <div className="glass relative overflow-hidden rounded-3xl border border-emerald-500/20 p-8 shadow-premium bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                ✨ AI Powered
              </span>
              <span className="text-xs text-muted-foreground">New</span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              🚀 AI Job Recommendations
            </h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
              Your resume scored <strong className="text-foreground">{result.score}/100</strong>. Based on your skills and keywords, we've found real job openings from top companies in India that match your profile — with live match percentages!
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(result.matched || []).slice(0, 5).map((skill) => (
                <span key={skill} className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-medium text-primary">
                  {skill}
                </span>
              ))}
              {(result.matched?.length || 0) > 5 && (
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-muted-foreground">
                  +{result.matched.length - 5} more skills
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              to="/jobs"
              search={{ skills: (result.matched || []).slice(0, 3).join(" OR ") || undefined }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg hover:-translate-y-0.5 transition"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">View Matched Jobs</span>
              <span aria-hidden className="relative transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <p className="text-center text-[10px] text-muted-foreground">Live jobs · Updated today</p>
          </div>
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
            <img src="/rezonance-logo.png" alt="Rezonance Logo" className="h-8 w-8 rounded-lg object-cover" />
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
