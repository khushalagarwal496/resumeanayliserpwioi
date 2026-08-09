import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchRealTimeJobsFn } from "@/lib/ats";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Filter, 
  Sparkles, 
  X, 
  Building, 
  Award,
  ChevronRight,
  TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: JobsComponent,
});

interface Job {
  id: string;
  title: string;
  company: string;
  logoLetter: string;
  logoBg: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  requiredSkills: string[];
  description: string;
  responsibilities: string[];
}

const JOBS_DATA: Job[] = [
  {
    id: "j1",
    title: "Frontend Engineer (React / Next.js)",
    company: "Vercel",
    logoLetter: "▲",
    logoBg: "bg-black text-white border border-white/20",
    location: "Remote (Global)",
    type: "Full-time",
    salary: "$120k - $160k",
    posted: "1 day ago",
    requiredSkills: ["React", "TypeScript", "Next.js", "CSS", "Tailwind", "JavaScript"],
    description: "We are looking for a Frontend Engineer to help us build the future of the Web. You will design, develop, and deploy rich web applications, optimizing for performance and developers' experience.",
    responsibilities: [
      "Develop highly accessible and responsive components using React and Next.js.",
      "Work closely with product managers and designers to craft elegant user experiences.",
      "Optimize web applications for maximum speed and scalability.",
      "Contribute to open-source tools and libraries."
    ]
  },
  {
    id: "j2",
    title: "Software Engineer Intern",
    company: "Google",
    logoLetter: "G",
    logoBg: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
    location: "Bangalore, India",
    type: "Internship",
    salary: "₹1,20,000 / mo",
    posted: "3 days ago",
    requiredSkills: ["C++", "Java", "Python", "Data Structures", "Algorithms", "SQL"],
    description: "Join Google as a Software Engineering Intern and work on real-world systems that impact billions of lives. You will collaborate with elite teams on search engineering, infrastructure design, or AI cloud solutions.",
    responsibilities: [
      "Write clean, testable code to resolve complex software engineering problems.",
      "Analyze and improve the efficiency, stability, and scalability of system resources.",
      "Collaborate with senior developers on product features and cloud infrastructure.",
      "Document codebase changes and test plans."
    ]
  },
  {
    id: "j3",
    title: "Full Stack Developer",
    company: "Stripe",
    logoLetter: "S",
    logoBg: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
    location: "New York, USA (Hybrid)",
    type: "Full-time",
    salary: "$140k - $180k",
    posted: "2 days ago",
    requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "SQL", "Git", "REST APIs"],
    description: "Stripe is building the infrastructure of the internet economy. As a Full Stack Developer, you will build user-facing financial dashboards and integrate robust API endpoints to support global scale commerce.",
    responsibilities: [
      "Build secure, transaction-oriented dashboard features using React.",
      "Implement scalable microservices in Node.js and TypeScript.",
      "Design database schemas and optimize query performance in PostgreSQL.",
      "Ensure robust test coverage and security compliance across the full stack."
    ]
  },
  {
    id: "j4",
    title: "AI/ML Engineer (Python & PyTorch)",
    company: "OpenAI",
    logoLetter: "O",
    logoBg: "bg-emerald-700 text-white shadow-lg shadow-emerald-500/20",
    location: "San Francisco, CA (Onsite)",
    type: "Full-time",
    salary: "$180k - $250k",
    posted: "Just now",
    requiredSkills: ["Python", "PyTorch", "Machine Learning", "Transformers", "LLMs", "Linux"],
    description: "OpenAI's mission is to ensure that artificial general intelligence benefits all of humanity. You will train large language models, optimize model parameters, and design inference systems for our next-generation systems.",
    responsibilities: [
      "Train, fine-tune, and evaluate deep learning architectures (Transformers, LLMs).",
      "Deploy low-latency inference pipelines on NVIDIA GPU clusters.",
      "Conduct empirical experiments to improve model reasoning and reliability.",
      "Implement secure APIs for model access."
    ]
  },
  {
    id: "j5",
    title: "Backend Engineer (Golang)",
    company: "Uber",
    logoLetter: "U",
    logoBg: "bg-zinc-900 text-white border border-white/10",
    location: "Remote (US)",
    type: "Full-time",
    salary: "$130k - $170k",
    posted: "5 days ago",
    requiredSkills: ["Golang", "Docker", "Kubernetes", "SQL", "Kafka", "Linux"],
    description: "We are seeking a backend engineer to optimize Uber's real-time matching and routing algorithms. You will build highly scalable systems that process millions of requests per second.",
    responsibilities: [
      "Write high-throughput backend services in Go.",
      "Containerize and orchestrate services using Docker and Kubernetes.",
      "Design event-driven data streaming structures using Apache Kafka.",
      "Resolve performance bottlenecks in distributed database systems."
    ]
  },
  {
    id: "j6",
    title: "Data Engineer",
    company: "Snowflake",
    logoLetter: "F",
    logoBg: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20",
    location: "Pune, India (Hybrid)",
    type: "Full-time",
    salary: "₹18L - ₹24L / yr",
    posted: "1 week ago",
    requiredSkills: ["SQL", "Python", "BigQuery", "Snowflake", "dbt", "Spark"],
    description: "As a Data Engineer at Snowflake, you will design enterprise data pipelines, implement analytical data warehouses, and help build automated reporting metrics for corporate business intelligence.",
    responsibilities: [
      "Design and maintain scalable ETL/ELT pipelines using Snowflake and dbt.",
      "Write advanced SQL models and optimize warehouse query performances.",
      "Collaborate with data analysts and business leaders to define schema requirements.",
      "Configure data governance, lineage, and access controls."
    ]
  }
];

function JobsComponent() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  
  // Real-time jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user session and profile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUserSession = localStorage.getItem("user_session");
      if (savedUserSession) {
        try {
          const parsed = JSON.parse(savedUserSession);
          setCurrentUser(parsed);
          
          const userKey = parsed.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const savedProfile = localStorage.getItem(`user_profile_${userKey}`);
          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      const savedApplications = localStorage.getItem("user_applied_jobs");
      if (savedApplications) {
        try {
          setAppliedJobs(JSON.parse(savedApplications));
        } catch {}
      }
    }
  }, []);

  // Fetch real-time jobs from JSearch API
  const fetchJobs = async (queryText: string) => {
    setLoading(true);
    try {
      console.log("Fetching real-time jobs from JSearch for:", queryText);
      const data = await fetchRealTimeJobsFn({ data: { query: queryText } });
      if (data && data.length > 0) {
        setJobs(data);
      } else {
        setJobs([]);
      }
    } catch (e) {
      console.error("JSearch API call failed:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search query triggers API fetch
  useEffect(() => {
    let queryToFetch = "Software Engineer in India";
    
    if (searchQuery.trim()) {
      queryToFetch = searchQuery.trim();
    } else if (userProfile) {
      // Extract role or top skills for tailored search
      const role = userProfile.personalInfo?.title || userProfile.experience?.[0]?.title || userProfile.experience?.[0]?.role || "";
      let skills = "";
      
      if (userProfile.skills) {
        // Flatten skills and take top 2
        const allSkills = Object.values(userProfile.skills).flat().filter(Boolean);
        if (allSkills.length > 0) {
          skills = allSkills.slice(0, 2).join(" OR ");
        }
      }
      
      let keyword = "";
      if (role && skills) {
        // Keep role broad (first 1-2 words) and combine with skills using OR
        const shortRole = role.split(" ").slice(0, 2).join(" ");
        keyword = `${shortRole} OR ${skills}`;
      } else {
        keyword = role || skills || "Software Engineer";
      }
      queryToFetch = `${keyword} in India`;
    } else {
      queryToFetch = "Software Engineer in India";
    }

    const delayDebounceFn = setTimeout(() => {
      fetchJobs(queryToFetch);
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userProfile]);

  // Calculate matching score for a job based on profile skills
  const getMatchScore = (requiredSkills: string[]): { score: number; matched: string[]; missing: string[] } => {
    if (!userProfile) return { score: 70, matched: [], missing: requiredSkills };
    
    // Extract all user skills into a flat array
    const userSkillsSet = new Set(
      Object.values(userProfile.skills || {})
        .flat()
        .map((s: any) => String(s).toLowerCase().trim())
    );

    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach(skill => {
      if (userSkillsSet.has(skill.toLowerCase().trim())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    // Score: Base is 60, and we add up to 40 points proportionally to matched skills
    const matchRatio = requiredSkills.length > 0 ? matched.length / requiredSkills.length : 0;
    const score = Math.round(60 + (matchRatio * 40));

    return { score, matched, missing };
  };

  const handleApply = (job: Job) => {
    // Open immediately to bypass popup blockers
    if (job.applyLink) {
      window.open(job.applyLink, "_blank");
    }

    setApplying(true);
    setTimeout(() => {
      if (!appliedJobs.includes(job.id)) {
        const updated = [...appliedJobs, job.id];
        setAppliedJobs(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("user_applied_jobs", JSON.stringify(updated));
        }
      }
      setApplying(false);
    }, 800);
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requiredSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesType = selectedType === "All" || job.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Calculate display keyword
  let currentSearchKeyword = "Software Engineer in India";
  if (searchQuery.trim()) {
    currentSearchKeyword = searchQuery.trim();
  } else if (userProfile) {
    const role = userProfile.personalInfo?.title || userProfile.experience?.[0]?.title || userProfile.experience?.[0]?.role || "";
    let skills = "";
    if (userProfile.skills) {
      const allSkills = Object.values(userProfile.skills).flat().filter(Boolean);
      if (allSkills.length > 0) {
        // Join top 2-3 skills with OR to get a variety of job domains
        skills = allSkills.slice(0, 2).join(" OR ");
      }
    }
    
    let keyword = "";
    if (role && skills) {
      // Keep role broad (first 1-2 words) and combine with skills using OR
      const shortRole = role.split(" ").slice(0, 2).join(" ");
      keyword = `${shortRole} OR ${skills}`;
    } else {
      keyword = role || skills || "Software Engineer";
    }
    
    currentSearchKeyword = `${keyword} in India`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-12">
      {/* Background Lights */}
      <div className="pointer-events-none absolute -left-48 top-10 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-40 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-e font-bold">R</span>
            Rezonance <span className="text-xs text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">STUDENT ATS PORTAL</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">ATS Analyzer</Link>
            {currentUser && <Link to="/profile" className="hover:text-foreground transition-colors">My Profile</Link>}
            <Link to="/jobs" className="text-primary font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Jobs
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-glow-e"
              >
                👤 My Profile
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Top Hero Section */}
      <section className="relative pt-12 pb-8 text-center max-w-4xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl mb-4 shadow-glow">
            AI Job Recommendations
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg mb-4">
            We match your Rezonance profile skills with real job openings. Upload your resume in the profile section to get instant match scores!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Showing tailored results for: <strong className="font-semibold">{currentSearchKeyword}</strong>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by job title, company, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 mr-2">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {["All", "Full-time", "Internship"].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                selectedType === type
                  ? "bg-primary text-primary-foreground shadow-glow-e"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid / List */}
      <div className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass rounded-2xl border border-white/5 p-6 h-64 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-white/5" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-5">
                    <div className="h-5 bg-white/5 rounded-full w-20" />
                    <div className="h-5 bg-white/5 rounded-full w-16" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-white/5 rounded w-full" />
                    <div className="h-2.5 bg-white/5 rounded w-5/6" />
                  </div>
                </div>
                <div className="h-8 bg-white/5 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 border border-white/5 bg-white/2 rounded-3xl">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No jobs found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map(job => {
              const { score, matched, missing } = getMatchScore(job.requiredSkills);
              const isApplied = appliedJobs.includes(job.id);

              return (
                <div 
                  key={job.id} 
                  className="glass group relative flex flex-col justify-between rounded-2xl border border-white/5 p-6 hover:border-primary/30 hover:shadow-premium transition-all duration-300 overflow-hidden"
                >
                  {/* Matching Indicator Card */}
                  <div className="absolute top-0 right-0">
                    <div className={`text-[10px] font-bold px-3 py-1.5 rounded-bl-xl border-l border-b border-white/5 flex items-center gap-1.5 ${
                      score >= 90 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : score >= 75 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {score}% Match
                    </div>
                  </div>

                  <div>
                    {/* Company and Logo */}
                    <div className="flex items-center gap-3.5 mb-4">
                      {job.logoUrl ? (
                        <img 
                          src={job.logoUrl} 
                          alt={job.company} 
                          className="h-11 w-11 rounded-xl object-contain bg-white p-1 border border-white/10 shrink-0 animate-fade-in" 
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = document.getElementById(`fallback-logo-${job.id}`);
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-lg font-display ${job.logoBg}`}
                        style={{ display: job.logoUrl ? "none" : "flex" }}
                        id={`fallback-logo-${job.id}`}
                      >
                        {job.logoLetter}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors pr-16">
                          {job.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Building className="h-3 w-3" /> {job.company}
                        </p>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2.5 mb-5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <MapPin className="h-3 w-3 text-muted-foreground" /> {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <Clock className="h-3 w-3 text-muted-foreground" /> {job.posted}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/10">
                        {job.type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                        {job.salary}
                      </span>
                    </div>

                    {/* Skills Breakdown */}
                    <div className="mb-6">
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold">SKILLS ALIGNMENT:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills.map(skill => {
                          const isMatched = matched.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                          return (
                            <span 
                              key={skill} 
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                isMatched 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm"
                                  : "bg-white/5 text-muted-foreground border-white/5"
                              }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Details & Apply
                    </button>
                    {isApplied && (
                      <span className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> Visited
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        handleApply(job);
                      }}
                      disabled={applying}
                      className="rounded-xl bg-gradient-to-br from-primary to-accent hover:from-primary hover:to-accent px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow-e hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {isApplied ? "Apply Again" : "Apply Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details & Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedJob(null)}
            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
          />
          
          {/* Modal Content */}
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 md:p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Logo, Title & Company */}
            <div className="flex items-start gap-4 mb-6">
              {selectedJob.logoUrl ? (
                <img 
                  src={selectedJob.logoUrl} 
                  alt={selectedJob.company} 
                  className="h-14 w-14 rounded-2xl object-contain bg-white p-1.5 border border-white/10 shrink-0" 
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = document.getElementById(`modal-fallback-logo-${selectedJob.id}`);
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div 
                className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-2xl font-display shrink-0 ${selectedJob.logoBg}`}
                style={{ display: selectedJob.logoUrl ? "none" : "flex" }}
                id={`modal-fallback-logo-${selectedJob.id}`}
              >
                {selectedJob.logoLetter}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground font-display leading-tight pr-6">
                  {selectedJob.title}
                </h3>
                <p className="text-sm text-primary font-semibold mt-1 flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> {selectedJob.company}
                </p>
                <div className="flex flex-wrap gap-2.5 mt-3">
                  <span className="text-xs text-muted-foreground bg-white/5 border border-white/5 rounded-full px-2.5 py-0.5">
                    {selectedJob.location}
                  </span>
                  <span className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5 font-bold">
                    {selectedJob.type}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 font-bold">
                    {selectedJob.salary}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Score Analytics */}
            {(() => {
              const { score, matched, missing } = getMatchScore(selectedJob.requiredSkills);
              return (
                <div className="bg-white/2 border border-white/5 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" /> Profile Match Alignment
                    </span>
                    <span className={`text-sm font-bold ${
                      score >= 90 ? "text-emerald-400" : score >= 75 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {score}% Match
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 90 ? "bg-emerald-500" : score >= 75 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-emerald-400 font-semibold mb-1">Matched Skills ({matched.length}):</p>
                      {matched.length === 0 ? (
                        <p className="text-muted-foreground italic">None matched yet</p>
                      ) : (
                        <p className="text-muted-foreground">{matched.join(", ")}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-orange-400 font-semibold mb-1">Missing Skills ({missing.length}):</p>
                      {missing.length === 0 ? (
                        <p className="text-emerald-400 italic">No missing skills! Ideal match.</p>
                      ) : (
                        <p className="text-muted-foreground">{missing.join(", ")}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Description */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-foreground mb-2">Job Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            {/* Responsibilities */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-foreground mb-2.5">Key Responsibilities</h4>
              <ul className="space-y-2">
                {selectedJob.responsibilities.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer / Apply */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="text-xs text-muted-foreground">
                Posted {selectedJob.posted}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {appliedJobs.includes(selectedJob.id) && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> Visited before
                  </span>
                )}
                <button
                  onClick={() => handleApply(selectedJob)}
                  disabled={applying}
                  className="rounded-xl bg-gradient-to-br from-primary to-accent px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow-e hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  {applying ? "Opening..." : appliedJobs.includes(selectedJob.id) ? "Apply Again" : "Submit Application"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
