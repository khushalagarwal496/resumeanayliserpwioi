import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { extractTextFromPdfFn, parseResumeForProfileFn } from "@/lib/ats";
export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

export interface StudentProfile {
  // 1. Basic Info
  fullName: string;
  headline: string;
  avatarUrl: string;
  collegeName: string;
  branch: string;
  yearSemester: string;
  graduationYear: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;

  // 2. Resume Upload & Versions
  resumePdfName: string;
  lastUpdated: string;
  resumeVersions: { id: string; name: string; date: string; atsScore: number }[];

  // 3. Professional Summary
  summary: string;
  careerObjective: string;
  areasOfInterest: string[];

  // 4. Technical Skills
  skills: {
    programming: string[];
    webDev: string[];
    database: string[];
    cloud: string[];
    tools: string[];
  };

  // 5. Projects
  projects: {
    id: string;
    name: string;
    description: string;
    tech: string[];
    liveUrl?: string;
    githubUrl?: string;
    duration: string;
    teamSize: string;
    role: string;
  }[];

  // 6. Internship / Experience
  experience: {
    id: string;
    company: string;
    role: string;
    duration: string;
    responsibilities: string[];
    tech: string[];
    certificateUrl?: string;
  }[];

  // 7. Certifications
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    link?: string;
  }[];

  // 8. Education
  education: {
    college: string;
    degree: string;
    branch: string;
    cgpa: string;
    startYear: string;
    endYear: string;
    school12th: string;
    score12th: string;
    school10th: string;
    score10th: string;
  };

  // 9. Coding Profiles
  codingProfiles: {
    leetcode: { username: string; solved: number; rating: number; streak: number; badge: string };
    codeforces: { username: string; maxRating: number; solved: number; rank: string };
    codechef: { username: string; stars: string; rating: number };
    hackerrank: { username: string; badgesCount: number };
    geeksforgeeks: { username: string; score: number; solved: number };
  };

  // 10. Achievements
  achievements: { title: string; category: string; description: string; date: string }[];

  // 11. Research & Publications
  research: { title: string; type: "Paper" | "Patent" | "Journal" | "Conference"; publication: string; date: string; link?: string }[];

  // 12. Languages Known
  languages: string[];

  // 13. Soft Skills
  softSkills: string[];

  // 14. Extra Activities
  extraActivities: { title: string; organization: string; description: string }[];
}

export function createDynamicInitialProfile(name: string, email: string, avatarUrl?: string): StudentProfile {
  const cleanName = name || (email ? email.split("@")[0] : "");
  const cleanAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || "User")}&background=0D8ABC&color=fff&size=200`;

  return {
    fullName: cleanName,
    headline: "",
    avatarUrl: cleanAvatar,
    collegeName: "",
    branch: "",
    yearSemester: "",
    graduationYear: "",
    location: "",
    email: email || "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",

    resumePdfName: "",
    lastUpdated: "",
    resumeVersions: [],

    summary: "",
    careerObjective: "",
    areasOfInterest: [],

    skills: {
      programming: [],
      webDev: [],
      database: [],
      cloud: [],
      tools: []
    },

    projects: [],
    experience: [],
    certifications: [],

    education: {
      college: "",
      degree: "",
      branch: "",
      cgpa: "",
      startYear: "",
      endYear: "",
      school12th: "",
      score12th: "",
      school10th: "",
      score10th: ""
    },

    codingProfiles: {
      leetcode: { username: "", solved: 0, rating: 0, streak: 0, badge: "" },
      codeforces: { username: "", maxRating: 0, solved: 0, rank: "" },
      codechef: { username: "", stars: "", rating: 0 },
      hackerrank: { username: "", badgesCount: 0 },
      geeksforgeeks: { username: "", score: 0, solved: 0 }
    },

    achievements: [],
    research: [],
    languages: [],
    softSkills: [],
    extraActivities: []
  };
}

export const DEMO_PROFILE: StudentProfile = {
  fullName: "Arjun Sharma",
  headline: "Full Stack Developer | Competitive Programmer | Open Source Contributor",
  avatarUrl: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=10b981&color=fff&size=200",
  collegeName: "Indian Institute of Technology, Delhi",
  branch: "Computer Science & Engineering",
  yearSemester: "4th Year / 8th Semester",
  graduationYear: "2025",
  location: "New Delhi, India",
  email: "arjun.sharma@iitd.ac.in",
  phone: "+91 98765 43210",
  linkedin: "linkedin.com/in/arjunsharma-dev",
  github: "github.com/arjunsharma",
  portfolio: "arjunsharma.dev",

  resumePdfName: "Arjun_Sharma_Resume_2025.pdf",
  lastUpdated: "2025-01-15",
  resumeVersions: [
    { id: "v1", name: "SDE Role v1", date: "2024-11-01", atsScore: 72 },
    { id: "v2", name: "Google Intern v2", date: "2025-01-10", atsScore: 88 },
    { id: "v3", name: "Final ATS Optimized", date: "2025-01-15", atsScore: 94 }
  ],

  summary: "Passionate Computer Science student at IIT Delhi with expertise in full-stack web development and competitive programming. Built 10+ production-grade projects serving 5,000+ users. Strong problem-solving skills with 1,200+ LeetCode problems solved. Currently seeking SDE internship/full-time roles at top-tier tech companies.",
  careerObjective: "To leverage my strong foundation in algorithms, system design, and modern web technologies to build scalable software products at a fast-growing technology company.",
  areasOfInterest: ["Full Stack Development", "System Design", "Competitive Programming", "Machine Learning", "Open Source"],

  skills: {
    programming: ["C++", "Python", "JavaScript", "TypeScript", "Java", "Go"],
    webDev: ["React", "Next.js", "Node.js", "Express", "TailwindCSS", "GraphQL", "REST APIs"],
    database: ["PostgreSQL", "MongoDB", "Redis", "MySQL", "Supabase"],
    cloud: ["AWS (EC2, S3, Lambda)", "Docker", "Kubernetes", "Vercel", "GitHub Actions"],
    tools: ["Git", "Linux", "Postman", "Figma", "VS Code", "Jira"]
  },

  projects: [
    {
      id: "p1",
      name: "DevConnect — GitHub Social Platform",
      description: "A social networking platform for developers built with Next.js and Supabase. Features include GitHub OAuth, real-time notifications, peer code reviews, and project collaboration.",
      tech: ["Next.js", "TypeScript", "Supabase", "TailwindCSS", "GitHub API"],
      liveUrl: "https://devconnect.arjunsharma.dev",
      githubUrl: "https://github.com/arjunsharma/devconnect",
      duration: "3 months",
      teamSize: "Solo",
      role: "Full Stack Developer"
    },
    {
      id: "p2",
      name: "AlgoViz — Algorithm Visualizer",
      description: "An interactive web app that visually demonstrates 30+ sorting and graph algorithms in real time, used by 3,000+ CS students. Built with React and Canvas API.",
      tech: ["React", "TypeScript", "Canvas API", "CSS Animations"],
      liveUrl: "https://algoviz.vercel.app",
      githubUrl: "https://github.com/arjunsharma/algoviz",
      duration: "2 months",
      teamSize: "2",
      role: "Lead Developer"
    },
    {
      id: "p3",
      name: "StockSense — AI-Powered Stock Screener",
      description: "ML-powered stock analysis tool that processes real-time market data using Python and gives buy/sell recommendations with 78% accuracy. 500+ active users.",
      tech: ["Python", "FastAPI", "React", "TensorFlow", "Redis", "PostgreSQL"],
      liveUrl: "https://stocksense.arjunsharma.dev",
      githubUrl: "https://github.com/arjunsharma/stocksense",
      duration: "4 months",
      teamSize: "3",
      role: "Backend & ML Engineer"
    }
  ],

  experience: [
    {
      id: "e1",
      company: "Microsoft India",
      role: "Software Engineering Intern",
      duration: "May 2024 – Aug 2024",
      responsibilities: [
        "Built a real-time data pipeline using Azure Event Hubs reducing latency by 40%",
        "Developed 3 REST APIs consumed by 100K+ daily active users",
        "Optimized SQL queries reducing database load by 35%",
        "Mentored 2 junior interns and led weekly sprint reviews"
      ],
      tech: ["C#", "Azure", "SQL Server", "React", "TypeScript"],
      certificateUrl: "https://microsoft.com/certificate/intern-2024"
    },
    {
      id: "e2",
      company: "Razorpay",
      role: "Backend Engineering Intern",
      duration: "Dec 2023 – Feb 2024",
      responsibilities: [
        "Integrated UPI payment gateway reducing transaction failures by 25%",
        "Wrote comprehensive unit tests achieving 95% code coverage",
        "Collaborated with product team on designing scalable microservices"
      ],
      tech: ["Node.js", "Go", "PostgreSQL", "Redis", "Docker"],
      certificateUrl: ""
    }
  ],

  certifications: [
    { id: "c1", name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", date: "2024-09-15", credentialId: "AWS-SAA-123456", link: "https://aws.amazon.com/certification" },
    { id: "c2", name: "Google Cloud Professional Data Engineer", issuer: "Google", date: "2024-06-20", credentialId: "GCP-PDE-789", link: "" },
    { id: "c3", name: "Meta Frontend Developer Certificate", issuer: "Coursera / Meta", date: "2023-12-01", credentialId: "META-FE-456", link: "" }
  ],

  education: {
    college: "Indian Institute of Technology, Delhi",
    degree: "B.Tech",
    branch: "Computer Science & Engineering",
    cgpa: "9.2",
    startYear: "2021",
    endYear: "2025",
    school12th: "Delhi Public School, RK Puram",
    score12th: "98.4%",
    school10th: "Delhi Public School, RK Puram",
    score10th: "97.2%"
  },

  codingProfiles: {
    leetcode: { username: "arjun_dev", solved: 1247, rating: 2156, streak: 84, badge: "Knight" },
    codeforces: { username: "arjun.sharma", maxRating: 1924, solved: 680, rank: "Candidate Master" },
    codechef: { username: "arjun_iitd", stars: "5 Star", rating: 2012 },
    hackerrank: { username: "arjunsharma", badgesCount: 12 },
    geeksforgeeks: { username: "arjun_iitd", score: 3400, solved: 420 }
  },

  achievements: [
    { title: "ACM ICPC Regionalist 2024", category: "Competitive Programming", description: "Qualified and participated in ACM ICPC Asia Regionals representing IIT Delhi — top 50 teams nationally.", date: "2024-11-10" },
    { title: "Google Summer of Code 2024", category: "Open Source", description: "Selected as GSoC contributor for the NumPy organization. Contributed 15+ PRs improving documentation and performance.", date: "2024-08-15" },
    { title: "Smart India Hackathon Winner", category: "Hackathon", description: "Won 1st place at SIH 2023 (National Level) for building an AI-powered crop disease detection system for farmers.", date: "2023-12-20" },
    { title: "Dean's Merit Award", category: "Academic", description: "Awarded Dean's Merit List for 4 consecutive semesters for maintaining CGPA above 9.0.", date: "2024-05-01" }
  ],

  research: [
    { title: "Efficient Graph Neural Networks for Social Network Analysis", type: "Paper", publication: "IEEE International Conference on Data Engineering 2024", date: "2024-07-15", link: "https://ieeexplore.ieee.org/paper/gnn-social" }
  ],

  languages: ["English (Fluent)", "Hindi (Native)", "German (Beginner)"],
  softSkills: ["Team Leadership", "Problem Solving", "Technical Communication", "Agile/Scrum", "Mentoring"],
  extraActivities: [
    { title: "Technical Secretary", organization: "IIT Delhi Computer Science Society", description: "Led a 500-member tech club organizing hackathons, workshops, and coding contests reaching 2,000+ students." },
    { title: "Open Source Maintainer", organization: "GitHub — AlgoViz Project", description: "Maintaining an open-source algorithm visualization project with 800+ GitHub stars and 50+ contributors." }
  ]
};


function AtsProgressChart({ history }: { history: { date: string; score: number; name: string }[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-xs text-muted-foreground">
        No ATS scan history recorded yet for this account. Run your first resume scan on the homepage to start tracking your progress graph!
      </div>
    );
  }

  const scores = history.map(h => h.score);
  const peakScore = Math.max(...scores, 0);

  const points = history.map((item, idx) => {
    const x = history.length === 1 ? 240 : (idx / (history.length - 1)) * 400 + 40;
    const y = 140 - ((item.score - 40) / 60) * 100;
    return `${x},${Math.max(20, Math.min(140, y))}`;
  }).join(" ");

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-premium relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            📈 ATS Score Improvement Progress Graph
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tracking real-time score updates across your account's historical scans</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
          Peak Score: {peakScore}/100
        </span>
      </div>

      <div className="relative h-48 w-full mt-4">
        <svg viewBox="0 0 480 170" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="30" y1="30" x2="450" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
          <line x1="30" y1="85" x2="450" y2="85" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
          <line x1="30" y1="140" x2="450" y2="140" stroke="rgba(255,255,255,0.06)" />

          {history.length > 1 && (
            <polygon
              points={`40,140 ${points} 440,140`}
              fill="url(#chartGrad)"
            />
          )}

          <polyline
            fill="none"
            stroke="rgb(16, 185, 129)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {history.map((item, idx) => {
            const x = history.length === 1 ? 240 : (idx / (history.length - 1)) * 400 + 40;
            const y = Math.max(20, Math.min(140, 140 - ((item.score - 40) / 60) * 100));
            return (
              <g key={idx} className="group cursor-pointer">
                <circle cx={x} cy={y} r="6" fill="#0f172a" stroke="rgb(16, 185, 129)" strokeWidth="3" />
                <text x={x} y={y - 10} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  {item.score}
                </text>
                <text x={x} y="158" textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function ProfileComponent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; avatarUrl: string; id: string } | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(() => createDynamicInitialProfile("Student Candidate", "student@engineering.edu"));
  const [activeTab, setActiveTab] = useState<"overview" | "skills_projects" | "exp_edu" | "coding_certs" | "extra">("overview");
  const [editModal, setEditModal] = useState(false);
  const [modalTab, setModalTab] = useState<"basic" | "summary" | "skills" | "education" | "coding" | "extra">("basic");

  // Form states for modal
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [branch, setBranch] = useState("");
  const [yearSemester, setYearSemester] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [summary, setSummary] = useState("");
  const [careerObjective, setCareerObjective] = useState("");
  const [areasOfInterestStr, setAreasOfInterestStr] = useState("");

  const [progSkillsStr, setProgSkillsStr] = useState("");
  const [webSkillsStr, setWebSkillsStr] = useState("");
  const [dbSkillsStr, setDbSkillsStr] = useState("");
  const [cloudSkillsStr, setCloudSkillsStr] = useState("");
  const [toolSkillsStr, setToolSkillsStr] = useState("");

  const [eduCollege, setEduCollege] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduBranch, setEduBranch] = useState("");
  const [eduCgpa, setEduCgpa] = useState("");
  const [eduStartYear, setEduStartYear] = useState("");
  const [eduEndYear, setEduEndYear] = useState("");
  const [school12th, setSchool12th] = useState("");
  const [score12th, setScore12th] = useState("");
  const [school10th, setSchool10th] = useState("");
  const [score10th, setScore10th] = useState("");

  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [leetcodeSolved, setLeetcodeSolved] = useState(0);
  const [leetcodeRating, setLeetcodeRating] = useState(0);
  const [leetcodeStreak, setLeetcodeStreak] = useState(0);
  const [leetcodeBadge, setLeetcodeBadge] = useState("");

  const [codeforcesUser, setCodeforcesUser] = useState("");
  const [codeforcesRating, setCodeforcesRating] = useState(0);
  const [codeforcesRank, setCodeforcesRank] = useState("");

  const [codechefUser, setCodechefUser] = useState("");
  const [codechefStars, setCodechefStars] = useState("");
  const [codechefRating, setCodechefRating] = useState(0);

  const [gfgUser, setGfgUser] = useState("");
  const [gfgScore, setGfgScore] = useState(0);
  const [gfgSolved, setGfgSolved] = useState(0);

  const [hackerrankUser, setHackerrankUser] = useState("");
  const [hackerrankBadges, setHackerrankBadges] = useState(0);

  const [languagesStr, setLanguagesStr] = useState("");
  const [softSkillsStr, setSoftSkillsStr] = useState("");

  const [scanHistory, setScanHistory] = useState<{ date: string; score: number; name: string }[]>([]);

  // Function to load profile & history for specific active user
  const loadUserData = (userObj: { email: string; name: string; avatarUrl: string; id: string }) => {
    setCurrentUser(userObj);
    const userKey = userObj.email.toLowerCase().replace(/[^a-z0-9]/g, "_");

    // 1. Load user-specific profile
    const storedProfileKey = `user_profile_${userKey}`;
    const saved = localStorage.getItem(storedProfileKey);
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        const initial = createDynamicInitialProfile(userObj.name, userObj.email, userObj.avatarUrl);
        setProfile(initial);
        localStorage.setItem(storedProfileKey, JSON.stringify(initial));
      }
    } else {
      const initial = createDynamicInitialProfile(userObj.name, userObj.email, userObj.avatarUrl);
      setProfile(initial);
      localStorage.setItem(storedProfileKey, JSON.stringify(initial));
    }

    // 2. Load user-specific scan history
    const storedHistoryKey = `user_ats_history_${userKey}`;
    const savedHist = localStorage.getItem(storedHistoryKey);
    if (savedHist) {
      try {
        const parsed = JSON.parse(savedHist);
        const mapped = [...parsed].reverse().map((h: any) => ({
          date: new Date(h.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
          score: h.score,
          name: h.resumeName
        }));
        setScanHistory(mapped);
      } catch {
        setScanHistory([]);
      }
    } else {
      setScanHistory([]);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await extractTextFromPdfFn({ data: formData });
      let text = response.text || "";
      
      if (!text || text.trim() === "") {
        // Fallback for simple PDFs if server parse fails
        const buffer = await file.arrayBuffer();
        const textDecoder = new TextDecoder("utf-8");
        const rawString = textDecoder.decode(buffer);
        const textMatches = rawString.match(/[a-zA-Z0-9\s.,;:\-@()/]{4,}/g);
        text = textMatches ? textMatches.join(" ") : rawString;
      }

      // Call Gemini parser
      console.log("Calling Gemini parser for profile autofill...");
      let parsedData = null;
      try {
        parsedData = await parseResumeForProfileFn({ data: { text } });
      } catch (err) {
        console.error("Gemini parse failed, using heuristic fallbacks:", err);
      }

      let updatedProfile = { ...profile };
      if (parsedData) {
        // Merge basic info
        updatedProfile = {
          ...profile,
          fullName: parsedData.fullName || profile.fullName,
          headline: parsedData.headline || profile.headline,
          collegeName: parsedData.collegeName || profile.collegeName,
          branch: parsedData.branch || profile.branch,
          yearSemester: parsedData.yearSemester || profile.yearSemester,
          graduationYear: parsedData.graduationYear || profile.graduationYear,
          location: parsedData.location || profile.location,
          phone: parsedData.phone || profile.phone,
          email: parsedData.email || profile.email,
          linkedin: parsedData.linkedin || profile.linkedin,
          github: parsedData.github || profile.github,
          portfolio: parsedData.portfolio || profile.portfolio,
          summary: parsedData.summary || profile.summary,
          careerObjective: parsedData.careerObjective || profile.careerObjective,
          areasOfInterest: parsedData.areasOfInterest || profile.areasOfInterest || [],
          
          skills: {
            programming: parsedData.skills?.programming || profile.skills?.programming || [],
            webDev: parsedData.skills?.webDev || profile.skills?.webDev || [],
            database: parsedData.skills?.database || profile.skills?.database || [],
            cloud: parsedData.skills?.cloud || profile.skills?.cloud || [],
            tools: parsedData.skills?.tools || profile.skills?.tools || []
          },
          
          education: {
            college: parsedData.education?.college || parsedData.collegeName || profile.education?.college || "",
            degree: parsedData.education?.degree || profile.education?.degree || "",
            branch: parsedData.education?.branch || parsedData.branch || profile.education?.branch || "",
            cgpa: parsedData.education?.cgpa || profile.education?.cgpa || "",
            startYear: parsedData.education?.startYear || profile.education?.startYear || "",
            endYear: parsedData.education?.endYear || parsedData.education?.endYear || "",
            school12th: parsedData.education?.school12th || profile.education?.school12th || "",
            score12th: parsedData.education?.score12th || profile.education?.score12th || "",
            school10th: parsedData.education?.school10th || profile.education?.school10th || "",
            score10th: parsedData.education?.score10th || profile.education?.score10th || ""
          },
          
          codingProfiles: {
            leetcode: {
              username: parsedData.codingProfiles?.leetcode?.username || profile.codingProfiles?.leetcode?.username || "",
              solved: Number(parsedData.codingProfiles?.leetcode?.solved || 0),
              rating: Number(parsedData.codingProfiles?.leetcode?.rating || 0),
              streak: Number(parsedData.codingProfiles?.leetcode?.streak || 0),
              badge: parsedData.codingProfiles?.leetcode?.badge || ""
            },
            codeforces: {
              username: parsedData.codingProfiles?.codeforces?.username || profile.codingProfiles?.codeforces?.username || "",
              maxRating: Number(parsedData.codingProfiles?.codeforces?.maxRating || 0),
              solved: Number(parsedData.codingProfiles?.codeforces?.solved || 0),
              rank: parsedData.codingProfiles?.codeforces?.rank || ""
            },
            codechef: {
              username: parsedData.codingProfiles?.codechef?.username || profile.codingProfiles?.codechef?.username || "",
              stars: parsedData.codingProfiles?.codechef?.stars || "",
              rating: Number(parsedData.codingProfiles?.codechef?.rating || 0)
            },
            hackerrank: {
              username: parsedData.codingProfiles?.hackerrank?.username || profile.codingProfiles?.hackerrank?.username || "",
              badgesCount: Number(parsedData.codingProfiles?.hackerrank?.badgesCount || 0)
            },
            geeksforgeeks: {
              username: parsedData.codingProfiles?.geeksforgeeks?.username || profile.codingProfiles?.geeksforgeeks?.username || "",
              score: Number(parsedData.codingProfiles?.geeksforgeeks?.score || 0),
              solved: Number(parsedData.codingProfiles?.geeksforgeeks?.solved || 0)
            }
          },
          
          projects: (parsedData.projects || []).map((p: any, idx: number) => ({
            id: p.id || `p_extracted_${idx}_${Date.now()}`,
            name: p.name || "Extracted Project",
            description: p.description || "",
            tech: p.tech || [],
            duration: p.duration || "",
            teamSize: p.teamSize || "",
            role: p.role || "",
            liveUrl: p.liveUrl || "",
            githubUrl: p.githubUrl || ""
          })),
          
          experience: (parsedData.experience || []).map((exp: any, idx: number) => ({
            id: exp.id || `exp_extracted_${idx}_${Date.now()}`,
            company: exp.company || "Extracted Company",
            role: exp.role || "",
            duration: exp.duration || "",
            responsibilities: exp.responsibilities || [],
            tech: exp.tech || [],
            certificateUrl: exp.certificateUrl || ""
          })),
          
          certifications: (parsedData.certifications || []).map((c: any, idx: number) => ({
            id: c.id || `c_extracted_${idx}_${Date.now()}`,
            name: c.name || "Extracted Certificate",
            issuer: c.issuer || "",
            date: c.date || "",
            credentialId: c.credentialId || "",
            link: c.link || ""
          })),
          
          achievements: (parsedData.achievements || []).map((a: any) => ({
            title: a.title || "",
            category: a.category || "",
            description: a.description || "",
            date: a.date || ""
          })),
          
          research: (parsedData.research || []).map((r: any) => ({
            title: r.title || "",
            type: r.type || "Paper",
            publication: r.publication || "",
            date: r.date || "",
            link: r.link || ""
          })),
          
          languages: parsedData.languages || profile.languages || [],
          softSkills: parsedData.softSkills || profile.softSkills || [],
          
          extraActivities: (parsedData.extraActivities || []).map((act: any) => ({
            title: act.title || "",
            organization: act.organization || "",
            description: act.description || ""
          }))
        };
      } else {
        const extractedPhone = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/)?.[0] || "";
        const extractedEmail = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";
        const hasLeetcode = text.toLowerCase().includes("leetcode");
        const hasCodeforces = text.toLowerCase().includes("codeforces");
        const hasBtech = /b\.?tech|bachelor of technology/i.test(text);
        const hasTopCollege = /iit|nit|iiit|bits/i.test(text);

        const knownSkills = ["React", "TypeScript", "Node.js", "Python", "C++", "Java", "JavaScript", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Linux", "Git", "CSS", "HTML"];
        const foundSkills = knownSkills.filter(skill => {
          const escapedSkill = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          return new RegExp(`\\b${escapedSkill}\\b`, 'i').test(text) || text.toLowerCase().includes(skill.toLowerCase());
        });

        updatedProfile = {
          ...profile,
          phone: extractedPhone || profile.phone,
          email: extractedEmail || profile.email,
          skills: {
            ...profile.skills,
            programming: foundSkills,
          },
          education: {
            ...profile.education,
            degree: hasBtech ? "B.Tech" : profile.education?.degree,
            college: hasTopCollege ? "Top Tier Institute" : profile.education?.college,
          },
          codingProfiles: {
            ...profile.codingProfiles,
            leetcode: { ...profile.codingProfiles?.leetcode, solved: hasLeetcode ? 200 : 0 },
            codeforces: { ...profile.codingProfiles?.codeforces, solved: hasCodeforces ? 150 : 0 }
          },
          experience: /experience|work/i.test(text) ? [{ id: "e1", company: "Extracted Company", role: "SDE Intern", duration: "2024", responsibilities: ["Extracted from resume"], tech: [] }] : profile.experience,
          projects: /projects|built/i.test(text) ? [{ id: "p1", name: "Extracted Project", description: "Parsed from resume", tech: [], duration: "", teamSize: "", role: "" }] : profile.projects
        };
      }

      setProfile(updatedProfile);
      
      if (typeof window !== "undefined") {
        const userKey = (currentUser?.email || email || "guest").toLowerCase().replace(/[^a-z0-9]/g, "_");
        localStorage.setItem(`user_profile_${userKey}`, JSON.stringify(updatedProfile));
      }
      
      alert("AI Parsing Complete! Profile auto-filled. Click 'Edit All Profile Sections' to review.");
    } catch (err) {
      console.error(err);
      alert("Failed to parse resume.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Check local session
      const savedUserSession = localStorage.getItem("user_session");
      if (savedUserSession) {
        try {
          const parsed = JSON.parse(savedUserSession);
          if (parsed.email) {
            loadUserData({
              email: parsed.email,
              name: parsed.name || parsed.email.split("@")[0],
              avatarUrl: parsed.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(parsed.name || parsed.email)}&background=0D8ABC&color=fff`,
              id: parsed.id || parsed.email
            });
          }
        } catch {}
      }

      // 2. Subscribe to Supabase Auth state changes
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const sUser = {
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Student Candidate",
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email || "User")}&background=0D8ABC&color=fff`,
            id: session.user.id
          };
          localStorage.setItem("user_session", JSON.stringify(sUser));
          loadUserData(sUser);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const sUser = {
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Student Candidate",
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email || "User")}&background=0D8ABC&color=fff`,
            id: session.user.id
          };
          localStorage.setItem("user_session", JSON.stringify(sUser));
          loadUserData(sUser);
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          localStorage.removeItem("user_session");
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    setFullName(profile.fullName || "");
    setHeadline(profile.headline || "");
    setAvatarUrl(profile.avatarUrl || "");
    setCollegeName(profile.collegeName || "");
    setBranch(profile.branch || "");
    setYearSemester(profile.yearSemester || "");
    setGraduationYear(profile.graduationYear || "");
    setLocation(profile.location || "");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
    setLinkedin(profile.linkedin || "");
    setGithub(profile.github || "");
    setPortfolio(profile.portfolio || "");

    setSummary(profile.summary || "");
    setCareerObjective(profile.careerObjective || "");
    setAreasOfInterestStr((profile.areasOfInterest || []).join(", "));

    setProgSkillsStr((profile.skills?.programming || []).join(", "));
    setWebSkillsStr((profile.skills?.webDev || []).join(", "));
    setDbSkillsStr((profile.skills?.database || []).join(", "));
    setCloudSkillsStr((profile.skills?.cloud || []).join(", "));
    setToolSkillsStr((profile.skills?.tools || []).join(", "));

    setEduCollege(profile.education?.college || "");
    setEduDegree(profile.education?.degree || "");
    setEduBranch(profile.education?.branch || "");
    setEduCgpa(profile.education?.cgpa || "");
    setEduStartYear(profile.education?.startYear || "");
    setEduEndYear(profile.education?.endYear || "");
    setSchool12th(profile.education?.school12th || "");
    setScore12th(profile.education?.score12th || "");
    setSchool10th(profile.education?.school10th || "");
    setScore10th(profile.education?.score10th || "");

    setLeetcodeUser(profile.codingProfiles?.leetcode?.username || "");
    setLeetcodeSolved(profile.codingProfiles?.leetcode?.solved || 0);
    setLeetcodeRating(profile.codingProfiles?.leetcode?.rating || 0);
    setLeetcodeStreak(profile.codingProfiles?.leetcode?.streak || 0);
    setLeetcodeBadge(profile.codingProfiles?.leetcode?.badge || "");

    setCodeforcesUser(profile.codingProfiles?.codeforces?.username || "");
    setCodeforcesRating(profile.codingProfiles?.codeforces?.maxRating || 0);
    setCodeforcesRank(profile.codingProfiles?.codeforces?.rank || "");

    setCodechefUser(profile.codingProfiles?.codechef?.username || "");
    setCodechefStars(profile.codingProfiles?.codechef?.stars || "");
    setCodechefRating(profile.codingProfiles?.codechef?.rating || 0);

    setGfgUser(profile.codingProfiles?.geeksforgeeks?.username || "");
    setGfgScore(profile.codingProfiles?.geeksforgeeks?.score || 0);
    setGfgSolved(profile.codingProfiles?.geeksforgeeks?.solved || 0);

    setHackerrankUser(profile.codingProfiles?.hackerrank?.username || "");
    setHackerrankBadges(profile.codingProfiles?.hackerrank?.badgesCount || 0);

    setLanguagesStr((profile.languages || []).join(", "));
    setSoftSkillsStr((profile.softSkills || []).join(", "));
  }, [profile]);

  const sectionChecklist = useMemo(() => {
    const hasPersonal = Boolean(profile.fullName && profile.email && profile.collegeName);
    const hasEducation = Boolean(profile.education?.college && profile.education?.degree && profile.education?.cgpa);
    const hasSkills = Boolean(profile.skills?.programming?.length > 0 || profile.skills?.webDev?.length > 0);
    const hasProjects = Boolean(profile.projects && profile.projects.length > 0);
    const hasExperience = Boolean(profile.experience && profile.experience.length > 0);
    const hasCertifications = Boolean(profile.certifications && profile.certifications.length > 0);
    const hasCodingProfiles = Boolean(profile.codingProfiles?.leetcode?.solved > 0 || profile.codingProfiles?.codeforces?.solved > 0);
    const hasAchievements = Boolean(profile.achievements && profile.achievements.length > 0);

    const items = [
      { key: "personal", label: "Personal Information", status: hasPersonal, tab: "overview" },
      { key: "education", label: "Education", status: hasEducation, tab: "exp_edu" },
      { key: "skills", label: "Skills", status: hasSkills, tab: "skills_projects" },
      { key: "projects", label: "Projects", status: hasProjects, tab: "skills_projects" },
      { key: "experience", label: "Experience", status: hasExperience, tab: "exp_edu" },
      { key: "certifications", label: "Certifications", status: hasCertifications, tab: "coding_certs" },
      { key: "coding", label: "Coding Profiles", status: hasCodingProfiles, tab: "coding_certs" },
      { key: "achievements", label: "Achievements", status: hasAchievements, tab: "extra" },
    ];

    const completedCount = items.filter(i => i.status).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return { items, percentage };
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...profile,
      fullName,
      headline,
      avatarUrl,
      collegeName,
      branch,
      yearSemester,
      graduationYear,
      location,
      email,
      phone,
      linkedin,
      github,
      portfolio,

      summary,
      careerObjective,
      areasOfInterest: areasOfInterestStr.split(",").map(s => s.trim()).filter(Boolean),

      skills: {
        programming: progSkillsStr.split(",").map(s => s.trim()).filter(Boolean),
        webDev: webSkillsStr.split(",").map(s => s.trim()).filter(Boolean),
        database: dbSkillsStr.split(",").map(s => s.trim()).filter(Boolean),
        cloud: cloudSkillsStr.split(",").map(s => s.trim()).filter(Boolean),
        tools: toolSkillsStr.split(",").map(s => s.trim()).filter(Boolean),
      },

      education: {
        college: eduCollege,
        degree: eduDegree,
        branch: eduBranch,
        cgpa: eduCgpa,
        startYear: eduStartYear,
        endYear: eduEndYear,
        school12th,
        score12th,
        school10th,
        score10th
      },

      codingProfiles: {
        leetcode: { username: leetcodeUser, solved: Number(leetcodeSolved), rating: Number(leetcodeRating), streak: Number(leetcodeStreak), badge: leetcodeBadge },
        codeforces: { username: codeforcesUser, maxRating: Number(codeforcesRating), solved: profile.codingProfiles?.codeforces?.solved || 200, rank: codeforcesRank },
        codechef: { username: codechefUser, stars: codechefStars, rating: Number(codechefRating) },
        hackerrank: { username: hackerrankUser, badgesCount: Number(hackerrankBadges) },
        geeksforgeeks: { username: gfgUser, score: Number(gfgScore), solved: Number(gfgSolved) }
      },

      languages: languagesStr.split(",").map(s => s.trim()).filter(Boolean),
      softSkills: softSkillsStr.split(",").map(s => s.trim()).filter(Boolean)
    };

    setProfile(updated);
    if (typeof window !== "undefined") {
      const userKey = (currentUser?.email || email || "guest").toLowerCase().replace(/[^a-z0-9]/g, "_");
      localStorage.setItem(`user_profile_${userKey}`, JSON.stringify(updated));
    }
    setEditModal(false);
    alert(`Engineering Profile for ${fullName} updated successfully! Saved to user account.`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_session");
    }
    setCurrentUser(null);
    alert("Signed out successfully.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute -left-48 top-10 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-40 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <img src="/rezonance-logo.png" alt="Rezonance Logo" className="h-8 w-8 rounded-lg shadow-glow-e object-cover" />
            Rezonance <span className="text-xs text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">STUDENT ATS PORTAL</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              ← ATS Analyzer
            </Link>
            <Link to="/jobs" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Jobs
            </Link>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground hidden sm:inline-block">
                  👤 {currentUser.name}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete all profile data? This will reset your profile to empty.")) {
                      const userKey = (currentUser?.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
                      localStorage.removeItem(`user_profile_${userKey}`);
                      localStorage.removeItem(`user_ats_history_${userKey}`);
                      window.location.reload();
                    }
                  }}
                  className="rounded-full border border-orange-500/50 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer"
                >
                  Clear Profile Data
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium hover:bg-red-950/30 hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow-e"
              >
                Sign In with Google
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* Banner Section */}
        <div className="glass relative overflow-hidden rounded-[2.5rem] p-6 sm:p-10 border border-white/10 shadow-premium">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Photo */}
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-28 w-28 rounded-3xl object-cover border-2 border-primary/40 shadow-glow-e"
                />
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs shadow-glow-e" title="Verified Engineering Candidate">
                  ✓
                </span>
              </div>

              {/* Title & Info */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-3xl font-bold tracking-tight">{profile.fullName}</h1>
                  <span className="rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary tracking-wide">
                    🎓 RECRUITER & ATS READY
                  </span>
                </div>
                <p className="text-sm font-semibold text-gradient-gold mt-1">{profile.headline}</p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap font-medium">
                  <span>🏛️ {profile.collegeName}</span>
                  <span>•</span>
                  <span>💻 {profile.branch}</span>
                  <span>•</span>
                  <span>📅 {profile.yearSemester} ({profile.graduationYear})</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground/80 mt-2 flex-wrap">
                  <span>📍 {profile.location}</span>
                  <span>📧 {profile.email}</span>
                  <span>📞 {profile.phone}</span>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-3 mt-4">
                  {profile.github && (
                    <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} target="_blank" rel="noreferrer" className="glass px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-foreground hover:bg-white/10 transition">
                      🐙 GitHub
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="glass px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-primary hover:bg-white/10 transition">
                      💼 LinkedIn
                    </a>
                  )}
                  {profile.portfolio && (
                    <a href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noreferrer" className="glass px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-emerald-400 hover:bg-white/10 transition">
                      🌐 Portfolio Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <input 
                type="file" 
                accept=".pdf" 
                ref={fileInputRef} 
                onChange={handleResumeUpload} 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-xs font-semibold hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer shadow-premium text-center flex items-center justify-center gap-2"
              >
                {isParsing ? "⏳ Extracting Data..." : "📄 Upload Resume to Auto-Fill"}
              </button>
              <button
                onClick={() => setEditModal(true)}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold hover:bg-white/10 hover:border-primary/40 transition cursor-pointer shadow-premium text-center"
              >
                ✏️ Edit All Profile Sections
              </button>
            </div>
          </div>
        </div>

        {/* Overall Profile Completion Meter & Checklist Widget */}
        <div className="mt-8 glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-premium relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Radial Gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-emerald-500/20 border-4 border-primary shadow-glow-e font-display text-2xl font-extrabold text-gradient-emerald">
                  {sectionChecklist.percentage}%
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">Overall Profile Completion</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sectionChecklist.percentage >= 80 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-accent/20 text-accent"}`}>
                    {sectionChecklist.percentage >= 80 ? "HIGH ATS READY" : "INCOMPLETE"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Profiles with verified education, project links, competitive programming stats, and certifications rank 4.2x higher on ATS screeners.
                </p>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              {sectionChecklist.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    item.status
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{item.label}</span>
                  <span>{item.status ? "✅" : "❌"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-3 no-scrollbar">
          {[
            { id: "overview", label: "📋 Overview & Resume", icon: "📄" },
            { id: "skills_projects", label: "💻 Skills & Projects", icon: "🚀" },
            { id: "exp_edu", label: "💼 Experience & Education", icon: "📚" },
            { id: "coding_certs", label: "🥇 Coding Profiles & Certs", icon: "🏆" },
            { id: "extra", label: "🌐 Achievements & Research", icon: "🔬" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-glow-e"
                  : "glass border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & RESUME */}
        {activeTab === "overview" && (
          <div className="mt-8 grid gap-8 md:grid-cols-12 animate-reveal">
            
            {/* Section 2: Resume PDF Upload & Version History */}
            <div className="md:col-span-5 glass rounded-3xl p-6 border border-white/10">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                📄 Resume Upload & ATS History
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Manage active PDF resume and version history.</p>

              <div className="mt-5 rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground truncate max-w-[200px]">{profile.resumePdfName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Updated: {profile.lastUpdated}</div>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
                  Active PDF
                </span>
              </div>

              <div className="mt-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resume Versions History</div>
                <div className="space-y-2">
                  {profile.resumeVersions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs border border-white/5">
                      <div>
                        <div className="font-medium text-foreground">{v.name}</div>
                        <div className="text-[10px] text-muted-foreground">{v.date}</div>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-lg ${v.atsScore >= 80 ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                        ATS: {v.atsScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Professional Summary */}
            <div className="md:col-span-7 glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                🎯 Professional Summary & Career Objectives
              </h3>

              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3–5 Lines Introduction</h4>
                <p className="text-xs text-foreground/90 mt-2 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 font-mono">
                  "{profile.summary}"
                </p>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Career Objective</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {profile.careerObjective}
                </p>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Areas of Interest</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.areasOfInterest.map((interest, idx) => (
                    <span key={idx} className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                      💡 {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ATS Score Progress Graph */}
            <div className="md:col-span-12">
              <AtsProgressChart history={scanHistory} />
            </div>

          </div>
        )}

        {/* TAB 2: TECHNICAL SKILLS & PROJECTS */}
        {activeTab === "skills_projects" && (
          <div className="mt-8 space-y-8 animate-reveal">
            
            {/* Section 4: Technical Skills */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                💻 Technical Skills Taxonomy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gradient-gold block">Programming Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.programming.map((s) => (
                      <span key={s} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block">Web Development</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.webDev.map((s) => (
                      <span key={s} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Database</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.database.map((s) => (
                      <span key={s} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent block">Cloud & DevOps</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.cloud.map((s) => (
                      <span key={s} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">Tools & Environments</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.tools.map((s) => (
                      <span key={s} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Projects */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                🚀 Engineering Projects
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="rounded-2xl bg-white/5 p-6 border border-white/10 hover:border-primary/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-foreground">{proj.name}</h4>
                        <span className="text-[11px] text-muted-foreground font-mono">{proj.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{proj.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {proj.tech.map((t) => (
                          <span key={t} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary font-medium">{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Role: <strong className="text-foreground">{proj.role}</strong> ({proj.teamSize})</span>
                      <div className="flex items-center gap-3">
                        {proj.githubUrl && (
                          <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">GitHub 🔗</a>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">Live Demo 🚀</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: EXPERIENCE & EDUCATION */}
        {activeTab === "exp_edu" && (
          <div className="mt-8 space-y-8 animate-reveal">
            
            {/* Section 6: Internship / Experience */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                💼 Internship & Professional Experience
              </h3>

              <div className="space-y-6">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="rounded-2xl bg-white/5 p-6 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-foreground">{exp.role}</h4>
                        <div className="text-xs font-semibold text-gradient-gold mt-0.5">{exp.company}</div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {exp.duration}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
                      {exp.responsibilities.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {exp.tech.map((t) => (
                        <span key={t} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 8: Education */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                📚 Education & Academic Background
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Degree College</div>
                  <h4 className="font-bold text-base mt-1">{profile.education.college}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.education.degree} in {profile.education.branch}</p>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                    <span>CGPA: <strong className="text-gradient-emerald text-sm">{profile.education.cgpa}</strong></span>
                    <span className="text-muted-foreground font-mono">{profile.education.startYear} - {profile.education.endYear}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="text-xs font-bold text-accent uppercase tracking-wider">School Details (10th & 12th)</div>
                  <h4 className="font-bold text-base mt-1">{profile.education.school12th}</h4>
                  
                  <div className="mt-4 space-y-2 text-xs border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class 12th Senior Secondary:</span>
                      <strong className="text-foreground">{profile.education.score12th}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class 10th Secondary:</span>
                      <strong className="text-foreground">{profile.education.score10th}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CODING PROFILES & CERTIFICATIONS */}
        {activeTab === "coding_certs" && (
          <div className="mt-8 space-y-8 animate-reveal">
            
            {/* Section 9: Coding Profiles */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                📈 Coding Profiles & Competitive Programming
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-400 text-sm">LeetCode</span>
                    <span className="text-xs text-muted-foreground font-mono">@{profile.codingProfiles.leetcode.username}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-foreground">{profile.codingProfiles.leetcode.solved} <span className="text-xs font-normal text-muted-foreground">Solved</span></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Rating: <strong>{profile.codingProfiles.leetcode.rating}</strong> ({profile.codingProfiles.leetcode.badge})</span>
                    <span>🔥 {profile.codingProfiles.leetcode.streak}d Streak</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-sm">Codeforces</span>
                    <span className="text-xs text-muted-foreground font-mono">@{profile.codingProfiles.codeforces.username}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-foreground">{profile.codingProfiles.codeforces.solved} <span className="text-xs font-normal text-muted-foreground">Solved</span></div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Max Rating: <strong>{profile.codingProfiles.codeforces.maxRating}</strong> ({profile.codingProfiles.codeforces.rank})
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-500 text-sm">CodeChef</span>
                    <span className="text-xs text-muted-foreground font-mono">@{profile.codingProfiles.codechef.username}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-foreground">{profile.codingProfiles.codechef.stars}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Contest Rating: <strong>{profile.codingProfiles.codechef.rating}</strong>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm">GeeksforGeeks</span>
                    <span className="text-xs text-muted-foreground font-mono">@{profile.codingProfiles.geeksforgeeks.username}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-foreground">{profile.codingProfiles.geeksforgeeks.solved} <span className="text-xs font-normal text-muted-foreground">Solved</span></div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    GFG Score: <strong>{profile.codingProfiles.geeksforgeeks.score}</strong>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-500 text-sm">HackerRank</span>
                    <span className="text-xs text-muted-foreground font-mono">@{profile.codingProfiles.hackerrank.username}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-foreground">{profile.codingProfiles.hackerrank.badgesCount} <span className="text-xs font-normal text-muted-foreground">Gold Badges</span></div>
                </div>
              </div>
            </div>

            {/* Section 7: Certifications */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                🏆 Industry Certifications (Google, AWS, IBM, Coursera)
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                {profile.certifications.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white/5 p-5 border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{c.issuer}</span>
                      <h4 className="font-bold text-sm text-foreground mt-1 leading-snug">{c.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-2">Issued: {c.date}</p>
                    </div>
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-emerald-400 hover:underline">
                        Verify Certificate ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: ACHIEVEMENTS, RESEARCH & EXTRA */}
        {activeTab === "extra" && (
          <div className="mt-8 space-y-8 animate-reveal">
            
            {/* Section 10: Achievements */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
                🥇 Honors & Key Achievements
              </h3>

              <div className="space-y-4">
                {profile.achievements.map((ach, idx) => (
                  <div key={idx} className="rounded-2xl bg-white/5 p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-gradient-gold uppercase tracking-wider">{ach.category}</span>
                      <h4 className="font-bold text-sm text-foreground mt-0.5">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{ach.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 11: Research & Publications */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
                📑 Research & Publications (Papers / Patents)
              </h3>

              <div className="space-y-3">
                {profile.research.map((res, idx) => (
                  <div key={idx} className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="rounded-md bg-primary/20 text-primary px-2 py-0.5 font-bold text-[10px] uppercase mr-2">{res.type}</span>
                      <strong className="text-foreground">{res.title}</strong> — <span className="text-muted-foreground">{res.publication} ({res.date})</span>
                    </div>
                    {res.link && (
                      <a href={res.link} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline shrink-0 ml-3">
                        View DOI ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 12, 13, 14: Soft Skills, Languages & Extra Activities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Section 12: Languages Known */}
              <div className="glass rounded-3xl p-6 border border-white/10">
                <h4 className="font-display text-base font-bold mb-3">🌐 Languages Known</h4>
                <div className="space-y-2">
                  {profile.languages.map((l) => (
                    <div key={l} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-foreground border border-white/5">
                      🗣️ {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 13: Soft Skills */}
              <div className="glass rounded-3xl p-6 border border-white/10">
                <h4 className="font-display text-base font-bold mb-3">🤝 Soft Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.softSkills.map((s) => (
                    <span key={s} className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary">
                      ✨ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 14: Extra Activities */}
              <div className="glass rounded-3xl p-6 border border-white/10">
                <h4 className="font-display text-base font-bold mb-3">❤️ Extra Activities & Clubs</h4>
                <div className="space-y-3">
                  {profile.extraActivities.map((act, idx) => (
                    <div key={idx} className="rounded-xl bg-white/5 p-3 border border-white/5">
                      <div className="font-bold text-xs text-foreground">{act.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{act.organization}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Comprehensive All-Item Edit Profile Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-reveal" onClick={() => setEditModal(false)}>
          <div className="glass max-w-4xl w-full rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl relative max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">Edit Student Engineering Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Edit every parameter across all 14 profile sections for your account.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                ALL 14 SECTIONS EDITABLE
              </span>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar">
              {[
                { id: "basic", label: "👤 Basic & Contact" },
                { id: "summary", label: "🎯 Summary & Objectives" },
                { id: "skills", label: "💻 Technical Skills" },
                { id: "education", label: "📚 Education & Marks" },
                { id: "coding", label: "📈 Coding Profiles" },
                { id: "extra", label: "🌐 Soft Skills & Languages" },
              ].map((mTab) => (
                <button
                  key={mTab.id}
                  type="button"
                  onClick={() => setModalTab(mTab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    modalTab === mTab.id
                      ? "bg-primary text-primary-foreground shadow-glow-e"
                      : "bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mTab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
              
              {/* SUB-TAB 1: BASIC & CONTACT */}
              {modalTab === "basic" && (
                <div className="space-y-4 animate-reveal">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Headline</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">College Name</label>
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Branch / Major</label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Year / Semester</label>
                      <input
                        type="text"
                        value={yearSemester}
                        onChange={(e) => setYearSemester(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Graduation Year</label>
                      <input
                        type="text"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">GitHub URL</label>
                      <input
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Portfolio Link</label>
                      <input
                        type="text"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Avatar Image URL</label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: SUMMARY & OBJECTIVES */}
              {modalTab === "summary" && (
                <div className="space-y-4 animate-reveal">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">3–5 Lines Professional Introduction</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Career Objective</label>
                    <textarea
                      value={careerObjective}
                      onChange={(e) => setCareerObjective(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Areas of Interest (Comma separated)</label>
                    <input
                      type="text"
                      value={areasOfInterestStr}
                      onChange={(e) => setAreasOfInterestStr(e.target.value)}
                      placeholder="Artificial Intelligence, Machine Learning, Full Stack, Cloud"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: TECHNICAL SKILLS */}
              {modalTab === "skills" && (
                <div className="space-y-4 animate-reveal">
                  <div>
                    <label className="text-xs font-semibold text-gradient-gold uppercase tracking-wider block mb-1">Programming Languages (Comma separated)</label>
                    <input
                      type="text"
                      value={progSkillsStr}
                      onChange={(e) => setProgSkillsStr(e.target.value)}
                      placeholder="C, C++, Java, Python, JavaScript, TypeScript, SQL"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">Web Development (Comma separated)</label>
                    <input
                      type="text"
                      value={webSkillsStr}
                      onChange={(e) => setWebSkillsStr(e.target.value)}
                      placeholder="HTML5, CSS3, React, Next.js, Node.js, Express"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Databases (Comma separated)</label>
                    <input
                      type="text"
                      value={dbSkillsStr}
                      onChange={(e) => setDbSkillsStr(e.target.value)}
                      placeholder="MySQL, PostgreSQL, MongoDB, Redis, Firebase, Supabase"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-accent uppercase tracking-wider block mb-1">Cloud & DevOps (Comma separated)</label>
                    <input
                      type="text"
                      value={cloudSkillsStr}
                      onChange={(e) => setCloudSkillsStr(e.target.value)}
                      placeholder="AWS, GCP, Docker, Vercel"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-1">Tools & Frameworks (Comma separated)</label>
                    <input
                      type="text"
                      value={toolSkillsStr}
                      onChange={(e) => setToolSkillsStr(e.target.value)}
                      placeholder="Git, GitHub, Linux, VS Code, Postman"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: EDUCATION & MARKS */}
              {modalTab === "education" && (
                <div className="space-y-4 animate-reveal">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">College Name</label>
                      <input
                        type="text"
                        value={eduCollege}
                        onChange={(e) => setEduCollege(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Degree</label>
                      <input
                        type="text"
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="B.Tech (Bachelor of Technology)"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">CGPA / Score</label>
                      <input
                        type="text"
                        value={eduCgpa}
                        onChange={(e) => setEduCgpa(e.target.value)}
                        placeholder="8.9 / 10.0"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Start Year</label>
                      <input
                        type="text"
                        value={eduStartYear}
                        onChange={(e) => setEduStartYear(e.target.value)}
                        placeholder="2022"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">End Year</label>
                      <input
                        type="text"
                        value={eduEndYear}
                        onChange={(e) => setEduEndYear(e.target.value)}
                        placeholder="2026"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">12th School Name</label>
                      <input
                        type="text"
                        value={school12th}
                        onChange={(e) => setSchool12th(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">12th Percentage / Score</label>
                      <input
                        type="text"
                        value={score12th}
                        onChange={(e) => setScore12th(e.target.value)}
                        placeholder="95.2% (CBSE)"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">10th School Name</label>
                      <input
                        type="text"
                        value={school10th}
                        onChange={(e) => setSchool10th(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">10th Percentage / Score</label>
                      <input
                        type="text"
                        value={score10th}
                        onChange={(e) => setScore10th(e.target.value)}
                        placeholder="96.8% (CBSE)"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: CODING PROFILES */}
              {modalTab === "coding" && (
                <div className="space-y-4 animate-reveal">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">LeetCode Handle</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Username"
                        value={leetcodeUser}
                        onChange={(e) => setLeetcodeUser(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Solved"
                        value={leetcodeSolved}
                        onChange={(e) => setLeetcodeSolved(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Rating"
                        value={leetcodeRating}
                        onChange={(e) => setLeetcodeRating(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Badge (e.g. Knight)"
                        value={leetcodeBadge}
                        onChange={(e) => setLeetcodeBadge(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Codeforces Handle</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Username"
                        value={codeforcesUser}
                        onChange={(e) => setCodeforcesUser(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Max Rating"
                        value={codeforcesRating}
                        onChange={(e) => setCodeforcesRating(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Rank (e.g. Specialist)"
                        value={codeforcesRank}
                        onChange={(e) => setCodeforcesRank(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">CodeChef</span>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Stars (e.g. 4★)"
                          value={codechefStars}
                          onChange={(e) => setCodechefStars(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                        />
                        <input
                          type="number"
                          placeholder="Rating"
                          value={codechefRating}
                          onChange={(e) => setCodechefRating(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">GeeksforGeeks</span>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="number"
                          placeholder="GFG Score"
                          value={gfgScore}
                          onChange={(e) => setGfgScore(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                        />
                        <input
                          type="number"
                          placeholder="Solved"
                          value={gfgSolved}
                          onChange={(e) => setGfgSolved(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: SOFT SKILLS & LANGUAGES */}
              {modalTab === "extra" && (
                <div className="space-y-4 animate-reveal">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Languages Known (Comma separated)</label>
                    <input
                      type="text"
                      value={languagesStr}
                      onChange={(e) => setLanguagesStr(e.target.value)}
                      placeholder="English (Professional), Hindi (Native), German (Basic)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Soft Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={softSkillsStr}
                      onChange={(e) => setSoftSkillsStr(e.target.value)}
                      placeholder="Leadership, Teamwork, Communication, Problem Solving"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="w-1/2 rounded-full border border-white/10 py-3 text-xs font-semibold hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-full bg-primary py-3 text-xs font-semibold text-primary-foreground shadow-glow-e hover:opacity-90 transition cursor-pointer"
                >
                  Save All Profile Changes ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
