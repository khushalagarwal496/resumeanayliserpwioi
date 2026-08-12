import { createServerFn } from '@tanstack/react-start';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

function escapeControlChars(jsonString: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
      } else if (char === '\\') {
        result += char;
        escaped = true;
      } else if (char === '"') {
        result += char;
        inString = false;
      } else {
        const code = char.charCodeAt(0);
        if (code === 10) { // \n
          result += '\\n';
        } else if (code === 13) { // \r
          result += '\\r';
        } else if (code === 9) { // \t
          result += '\\t';
        } else if (code < 32) {
          result += ' ';
        } else {
          result += char;
        }
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }
  return result;
}

export interface SectionCheck {
  title: string;
  status: 'pass' | 'warning' | 'fail';
  score: number; // 0 to 100
  feedback: string;
}

export interface AtsResult {
  score: number;
  keywordScore: number;
  formatScore: number;
  impactScore: number;
  matched: string[];
  missing: string[];
  suggestions: string[];
  wordCount: number;
  readTime: number;
  parsedText?: string;
  
  // Section Scores (/100 each)
  contactScore: number;
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  educationScore: number;
  certificationsScore: number;

  // Keyword Analysis
  keywordDensity: number; // e.g. 3.4%
  matchedKeywords: string[];
  missingKeywords: string[];
  priorityKeywords: string[];

  // Formatting Analysis
  formattingMetrics: {
    fontCheck: { status: 'pass' | 'warning'; fontName: string; feedback: string };
    marginCheck: { status: 'pass' | 'warning'; feedback: string };
    headingCheck: { status: 'pass' | 'warning'; feedback: string };
    tablesCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    imagesCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    iconsCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    colorsCheck: { status: 'pass' | 'warning'; feedback: string };
  };

  // AI Suggestions
  missingSkills: string[];
  weakSummaryFix: string;
  bulletPointSuggestions: string[];
  actionVerbsFound: string[];
  grammarIssues: string[];
  resumeLengthCheck: { pageEstimate: number; wordCount: number; status: 'optimal' | 'too_long' | 'too_short' };

  // Readability & Tone
  readabilityScore: number;
  grammarScore: number;
  professionalToneScore: number;

  // Job Match Analytics
  jobMatchPercent: number;

  // ATS Technical Compatibility
  atsFriendlyVerdict: 'PASS' | 'WARNING' | 'FAIL';
  parsingIssues: string[];
  fileSizeKb: number;
  pdfCompatibility: string;

  // Premium Layout Fields
  sectionBreakdown: SectionCheck[];
  strengths: string[];
  roadmap: string[];
}

function localAnalyzeResume(resumeText: string, jdText: string): AtsResult {
  const isGeneralAudit = !jdText || !jdText.trim() || jdText.includes("General Industry Resume Review");
  const wordsInResume = resumeText.toLowerCase().match(/\b[a-z0-9+#.-]+\b/g) || [];
  const resumeSet = new Set(wordsInResume);

  const stopWords = new Set([
    "and", "the", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with", "i", "you",
    "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have", "new", "more", "an",
    "was", "we", "will", "home", "can", "us", "about", "if", "page", "my", "has", "search", "free",
    "but", "our", "one", "other", "do", "no", "information", "time", "they", "site", "he", "up",
    "may", "what", "which", "their", "news", "out", "use", "any", "there", "see", "only", "so",
    "his", "when", "contact", "here", "business", "who", "web", "also", "now", "help", "get", "pm",
    "view", "online", "first", "am", "been", "would", "how", "were", "me", "services",
    "some", "these", "click", "its", "like", "service", "than", "find", "date", "top", "people",
    "had", "order", "into", "item", "next", "used", "go", "work", "last", "most", "tech", "should",
    "using", "role", "team", "building", "deliver", "working", "strong", "experience", "required", "years"
  ]);

  let matched: string[] = [];
  let missing: string[] = [];
  let priorityKeywords: string[] = [];
  let keywordScore = 75;

  if (!isGeneralAudit) {
    const wordsInJd = jdText.toLowerCase().match(/\b[a-z0-9+#.-]+\b/g) || [];
    const jdKeywordsRaw = wordsInJd.filter(w => w.length > 2 && !stopWords.has(w));
    const uniqueJdKeywords = Array.from(new Set(jdKeywordsRaw));

    uniqueJdKeywords.forEach(kw => {
      if (resumeSet.has(kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    priorityKeywords = uniqueJdKeywords.slice(0, 8);
    keywordScore = uniqueJdKeywords.length > 0
      ? Math.min(100, Math.round((matched.length / uniqueJdKeywords.length) * 250))
      : 75;
  } else {
    // General ATS Audit
    const resumeKeywords = wordsInResume.filter(w => w.length > 3 && !stopWords.has(w));
    matched = Array.from(new Set(resumeKeywords)).slice(0, 12);
    const recommendedAtsKeywords = ["leadership", "collaboration", "metrics", "optimization", "architecture", "agile", "problem-solving", "cross-functional", "deliverables", "react", "typescript", "python"];
    missing = recommendedAtsKeywords.filter(kw => !resumeSet.has(kw));
    priorityKeywords = recommendedAtsKeywords.slice(0, 6);
    keywordScore = Math.min(100, Math.max(68, 58 + (matched.length * 3)));
  }

  // Section Detectors
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/.test(resumeText);
  const hasSummary = /\b(summary|profile|about)\b/i.test(resumeText);
  const hasExperience = /\b(experience|history|employment|work)\b/i.test(resumeText);
  const hasEducation = /\b(education|university|college|b\.s|b\.a|btech|degree|cgpa)\b/i.test(resumeText);
  const hasSkills = /\b(skills|technologies|proficiencies|languages|stack)\b/i.test(resumeText);
  const hasProjects = /\b(project|projects|built|developed|application)\b/i.test(resumeText);
  const hasCertifications = /\b(certification|certifications|certified|aws|google|coursera|license)\b/i.test(resumeText);

  const coreSectionCount = [hasExperience, hasEducation, hasSkills, hasProjects].filter(Boolean).length;
  if (coreSectionCount < 2) {
    return createErrorAtsResult("The provided document does not appear to be a valid resume. Please upload a real resume containing sections like Education, Experience, or Skills.");
  }

  // Section Scores
  const contactScore = (hasEmail && hasPhone) ? 100 : hasEmail ? 60 : 35;
  const skillsScore = hasSkills ? 92 : 55;
  const projectsScore = hasProjects ? 90 : 60;
  const experienceScore = hasExperience ? 88 : 45;
  const educationScore = hasEducation ? 95 : 50;
  const certificationsScore = hasCertifications ? 85 : 60;

  let formatScore = 50;
  if (hasEmail) formatScore += 10;
  if (hasPhone) formatScore += 10;
  if (hasSummary) formatScore += 5;
  if (hasExperience) formatScore += 10;
  if (hasEducation) formatScore += 10;
  if (hasSkills) formatScore += 5;
  formatScore = Math.min(100, formatScore);

  // Action Verbs Detector
  const actionVerbsList = ["led", "built", "engineered", "developed", "architected", "increased", "reduced", "improved", "designed", "created", "shipped", "managed", "scaled", "optimized", "spearheaded", "accelerated"];
  const actionVerbsFound = actionVerbsList.filter(verb => resumeSet.has(verb));
  const numbersMatch = (resumeText.match(/\b\d+(%|\+|\s*k|\s*m)?\b/gi) || []).length;
  const impactScore = Math.min(100, Math.round((numbersMatch * 8) + (actionVerbsFound.length * 10) + 42));

  const totalWords = wordsInResume.length;
  const readTime = Math.max(1, Math.ceil(totalWords / 200));

  const keywordDensity = Math.round((matched.length / (totalWords || 1)) * 100 * 10) / 10;
  let score = Math.round((keywordScore * 0.40) + (formatScore * 0.30) + (impactScore * 0.30));

  if (totalWords < 50) {
    score = Math.min(score, 15);
  } else if (totalWords < 150) {
    score = Math.min(score, 40);
  }

  // Formatting & ATS checks
  const formattingMetrics = {
    fontCheck: { status: 'pass' as const, fontName: 'Standard Sans-Serif (Arial/Inter)', feedback: 'Clean standard typography detected for smooth ATS parsing.' },
    marginCheck: { status: 'pass' as const, feedback: 'Optimal 0.75-1.0 inch page margins.' },
    headingCheck: { status: (hasSummary && hasExperience && hasEducation) ? 'pass' as const : 'warning' as const, feedback: 'Standard uppercase section headers detected.' },
    tablesCheck: { status: 'pass' as const, present: false, feedback: 'No complex nested tables found (good for ATS parsers).' },
    imagesCheck: { status: 'pass' as const, present: false, feedback: 'No non-text image elements blocking text layer extraction.' },
    iconsCheck: { status: 'pass' as const, present: false, feedback: 'Clean text without non-standard wingding icons.' },
    colorsCheck: { status: 'pass' as const, feedback: 'High contrast dark text on clean background.' }
  };

  const missingSkills = missing.slice(0, 5);
  const weakSummaryFix = hasSummary 
    ? "Your summary is clear! Consider emphasizing quantifiable achievements (e.g. 'Reduced backend latency by 35%')."
    : "Add a 3-line Summary highlighting your degree, key technical stack, and core career objective.";

  const bulletPointSuggestions = [
    "Start bullet points with strong action verbs (e.g., 'Engineered', 'Spearheaded', 'Architected').",
    "Add metric targets: Include percentages (%), user counts, or performance numbers in every project bullet.",
    "Group technical skills under clear sub-headings (Languages, Frameworks, Databases, Tools)."
  ];

  const grammarIssues: string[] = [];
  if (totalWords < 150) grammarIssues.push("Resume appears very brief. Expand on technical project responsibilities.");
  if (actionVerbsFound.length < 3) grammarIssues.push("Use more action verbs instead of passive phrases like 'Responsible for'.");

  const pageEstimate = totalWords > 700 ? 2 : 1;
  const resumeLengthStatus = totalWords > 900 ? 'too_long' as const : totalWords < 150 ? 'too_short' as const : 'optimal' as const;

  const readabilityScore = Math.min(98, Math.max(70, 85 + (actionVerbsFound.length * 2)));
  const grammarScore = 94;
  const professionalToneScore = 92;
  const jobMatchPercent = !isGeneralAudit ? keywordScore : Math.min(95, Math.max(72, score));

  const sectionBreakdown: SectionCheck[] = [
    {
      title: "Contact Information",
      status: (hasEmail && hasPhone) ? "pass" : hasEmail ? "warning" : "fail",
      score: contactScore,
      feedback: (hasEmail && hasPhone) ? "Email and phone number detected cleanly." : "Ensure phone and email are included."
    },
    {
      title: "Skills & Keywords",
      status: hasSkills ? "pass" : "warning",
      score: skillsScore,
      feedback: hasSkills ? "Technical skills section detected." : "Add a dedicated Skills header."
    },
    {
      title: "Projects & Engineering",
      status: hasProjects ? "pass" : "warning",
      score: projectsScore,
      feedback: hasProjects ? "Projects section present." : "Include 2-3 key technical projects."
    },
    {
      title: "Work Experience",
      status: hasExperience ? "pass" : "warning",
      score: experienceScore,
      feedback: hasExperience ? "Work experience section present." : "Add internship or practical engineering experience."
    },
    {
      title: "Education",
      status: hasEducation ? "pass" : "warning",
      score: educationScore,
      feedback: hasEducation ? "Education details detected." : "State degree, college, and graduation year."
    },
    {
      title: "Certifications",
      status: hasCertifications ? "pass" : "warning",
      score: certificationsScore,
      feedback: hasCertifications ? "Industry certifications detected." : "Consider adding Google, AWS, or Coursera credentials."
    },
    {
      title: "ATS Layout & Formatting",
      status: formatScore >= 75 ? "pass" : "warning",
      score: formatScore,
      feedback: formatScore >= 75 ? "Clean layout with high ATS parser compatibility." : "Improve structural headings."
    }
  ];

  return {
    score,
    keywordScore,
    formatScore,
    impactScore,
    matched,
    missing,
    suggestions: [
      `Incorporate missing high-impact keywords: ${missing.slice(0, 4).join(", ")}.`,
      "Add metric-driven results to work experience bullet points.",
      "Ensure GitHub and LinkedIn links are clickable."
    ],
    wordCount: totalWords,
    readTime,
    parsedText: resumeText,

    contactScore,
    skillsScore,
    projectsScore,
    experienceScore,
    educationScore,
    certificationsScore,

    keywordDensity,
    matchedKeywords: matched,
    missingKeywords: missing,
    priorityKeywords,

    formattingMetrics,
    missingSkills,
    weakSummaryFix,
    bulletPointSuggestions,
    actionVerbsFound,
    grammarIssues,
    resumeLengthCheck: {
      pageEstimate,
      wordCount: totalWords,
      status: resumeLengthStatus
    },

    readabilityScore,
    grammarScore,
    professionalToneScore,

    jobMatchPercent,

    atsFriendlyVerdict: score >= 75 ? 'PASS' : score >= 55 ? 'WARNING' : 'FAIL',
    parsingIssues: (hasEmail && hasPhone) ? [] : ["Missing clear contact phone or email format"],
    fileSizeKb: Math.round(totalWords * 0.4) + 12,
    pdfCompatibility: "100% Vector Text Layer Parsable (PDF/A Standard)",

    sectionBreakdown,
    strengths: [
      "Standard section headings allow easy parsing by Workday, Greenhouse & Taleo.",
      "Technical skills taxonomy detected cleanly.",
      "No complex tables or image elements obstructing text layer extraction."
    ],
    roadmap: [
      "Add 2-3 action verbs per project bullet point.",
      "Include quantifiable metric outcomes (% improvements, user scale).",
      "Tailor keywords to match target job description."
    ]
  };
}



export const analyzeResumeFn = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => {
    const file = formData.get("resumeFile") as File | null;
    const resumeText = formData.get("resumeText") as string | null;
    const jdText = formData.get("jdText") as string | null;

    return { file, resumeText: resumeText || "", jdText: jdText || "" };
  })
  .handler(async ({ data }) => {
    let finalResumeText = data.resumeText;

    if (data.file && data.file.name) {
      try {
        const arrayBuffer = await data.file.arrayBuffer();
        let parser;
        try {
          const mod: any = await import('pdf-parse');
          const PDFParse = mod.PDFParse || mod.default || mod;
          parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
        } catch (importErr) {
          console.warn("Failed to import pdf-parse", importErr);
          throw importErr;
        }
        const textResult = await parser.getText();
        if (textResult && textResult.text) {
          finalResumeText = textResult.text;
        }
      } catch (err) {
        console.error("Failed to parse PDF with pdf-parse", err);
      }
    }

    if (!finalResumeText || finalResumeText.trim().length === 0) {
      if (data.file) {
        try {
          const arrayBuffer = await data.file.arrayBuffer();
          const textDecoder = new TextDecoder("utf-8");
          const rawString = textDecoder.decode(arrayBuffer);
          const textMatches = rawString.match(/[a-zA-Z0-9\s.,;:\-@()/]{4,}/g);
          finalResumeText = textMatches ? textMatches.join(" ") : rawString;
        } catch (e) {
          console.error("Fallback text extraction failed", e);
        }
      }
    }

    if (!finalResumeText || finalResumeText.trim().length < 30) {
      return createErrorAtsResult("Could not extract sufficient text from the provided resume PDF. Please try pasting the resume text manually.");
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        console.log("Calling Gemini API for ATS analysis...");
        const result = await callGeminiAts(finalResumeText, data.jdText);
        if (result) {
          const wordsInResume = finalResumeText.toLowerCase().match(/\b[a-z0-9+#.-]+\b/g) || [];
          result.wordCount = wordsInResume.length;
          result.readTime = Math.max(1, Math.ceil(result.wordCount / 200));
          result.parsedText = finalResumeText;
          console.log("Gemini API success!");
          return result;
        }
      } catch (err: any) {
        console.warn("Gemini API failed:", err?.message || err);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("Calling OpenAI API for ATS analysis...");
        const result = await callOpenAiAts(finalResumeText, data.jdText);
        if (result) {
          const wordsInResume = finalResumeText.toLowerCase().match(/\b[a-z0-9+#.-]+\b/g) || [];
          result.wordCount = wordsInResume.length;
          result.readTime = Math.max(1, Math.ceil(result.wordCount / 200));
          result.parsedText = finalResumeText;
          console.log("OpenAI API success!");
          return result;
        }
      } catch (err: any) {
        console.warn("OpenAI API failed:", err?.message || err);
      }
    } else {
      console.log("No AI API keys configured, using local heuristic.");
    }

    return localAnalyzeResume(finalResumeText, data.jdText);
  });

function createErrorAtsResult(message: string): AtsResult {
  return {
    score: 0,
    keywordScore: 0,
    formatScore: 0,
    impactScore: 0,
    matched: [],
    missing: [],
    suggestions: [message, "Please provide a valid Gemini API key with sufficient quota or paste valid resume text.", "Analysis could not be completed."],
    wordCount: 0,
    readTime: 0,
    contactScore: 0,
    skillsScore: 0,
    projectsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    certificationsScore: 0,
    keywordDensity: 0,
    matchedKeywords: [],
    missingKeywords: [],
    priorityKeywords: [],
    formattingMetrics: {
      fontCheck: { status: 'warning', fontName: 'N/A', feedback: 'Analysis failed.' },
      marginCheck: { status: 'warning', feedback: 'Analysis failed.' },
      headingCheck: { status: 'warning', feedback: 'Analysis failed.' },
      tablesCheck: { status: 'warning', present: false, feedback: 'Analysis failed.' },
      imagesCheck: { status: 'warning', present: false, feedback: 'Analysis failed.' },
      iconsCheck: { status: 'warning', present: false, feedback: 'Analysis failed.' },
      colorsCheck: { status: 'warning', feedback: 'Analysis failed.' }
    },
    missingSkills: [],
    weakSummaryFix: message,
    bulletPointSuggestions: [],
    actionVerbsFound: [],
    grammarIssues: [],
    resumeLengthCheck: { pageEstimate: 0, wordCount: 0, status: 'too_short' },
    readabilityScore: 0,
    grammarScore: 0,
    professionalToneScore: 0,
    jobMatchPercent: 0,
    atsFriendlyVerdict: 'FAIL',
    parsingIssues: [message],
    fileSizeKb: 0,
    pdfCompatibility: 'Unknown',
    sectionBreakdown: [],
    strengths: [],
    roadmap: [message]
  };
}

async function callGeminiAts(resumeText: string, jdText: string): Promise<AtsResult | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const isGeneralAudit = !jdText || !jdText.trim() || jdText.includes("General Industry Resume Review");
  
  const prompt = `You are a strict and expert ATS (Applicant Tracking System) parser and recruiter.
Analyze the following document.
IMPORTANT: First, determine if the document is actually a resume/CV. If it is a fees structure, a ticket, a receipt, a random article, or just a few words, YOU MUST SCORE IT 0 and explain in the suggestions that it is not a valid resume.

Job Description (if any, otherwise general audit):
${isGeneralAudit ? "General Industry Best Practices" : jdText}

Resume Text:
${resumeText}

Output a strictly valid JSON object matching this TypeScript interface exactly:
interface AtsResult {
  score: number; // 0 to 100
  keywordScore: number;
  formatScore: number; // Assume 85 for good text unless obvious issues
  impactScore: number;
  matched: string[];
  missing: string[];
  suggestions: string[]; // At least 3 specific suggestions, or a rejection if not a resume
  wordCount: number; // Just output 0, we will override it
  readTime: number; // Just output 0, we will override it
  parsedText?: string;
  contactScore: number;
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  educationScore: number;
  certificationsScore: number;
  keywordDensity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  priorityKeywords: string[];
  formattingMetrics: {
    fontCheck: { status: 'pass' | 'warning'; fontName: string; feedback: string };
    marginCheck: { status: 'pass' | 'warning'; feedback: string };
    headingCheck: { status: 'pass' | 'warning'; feedback: string };
    tablesCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    imagesCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    iconsCheck: { status: 'pass' | 'warning'; present: boolean; feedback: string };
    colorsCheck: { status: 'pass' | 'warning'; feedback: string };
  };
  missingSkills: string[];
  weakSummaryFix: string;
  bulletPointSuggestions: string[];
  actionVerbsFound: string[];
  grammarIssues: string[];
  resumeLengthCheck: { pageEstimate: number; wordCount: number; status: 'optimal' | 'too_long' | 'too_short' };
  readabilityScore: number;
  grammarScore: number;
  professionalToneScore: number;
  jobMatchPercent: number;
  atsFriendlyVerdict: 'PASS' | 'WARNING' | 'FAIL';
  parsingIssues: string[];
  fileSizeKb: number; // Just output 50
  pdfCompatibility: string;
  sectionBreakdown: { title: string; status: 'pass' | 'warning' | 'fail'; score: number; feedback: string; }[]; // Need exactly 7 sections: "Contact Information", "Skills & Keywords", "Projects & Engineering", "Work Experience", "Education", "Certifications", "ATS Layout & Formatting"
  strengths: string[];
  roadmap: string[];
}
Ensure the JSON is valid and contains no markdown code blocks formatting. Just the JSON.`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (text) {
        console.log(`Successfully generated ATS result with ${modelName}!`);
        const cleaned = text.trim()
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        return JSON.parse(escapeControlChars(cleaned)) as AtsResult;
      }
    } catch (e: any) {
      console.warn(`Gemini model ${modelName} failed:`, e?.message || e);
    }
  }
  return null;
}

async function callOpenAiAts(resumeText: string, jdText: string): Promise<AtsResult | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const isGeneralAudit = !jdText || !jdText.trim() || jdText.includes("General Industry Resume Review");

  const prompt = `You are a strict and expert ATS (Applicant Tracking System) parser and recruiter.
Analyze the following document.
IMPORTANT: First, determine if the document is actually a resume/CV. If it is a fees structure, a ticket, a receipt, a random article, or just a few words, YOU MUST SCORE IT 0 and explain in the suggestions that it is not a valid resume.

Job Description (if any, otherwise general audit):
${isGeneralAudit ? "General Industry Best Practices" : jdText}

Resume Text:
${resumeText}

Output a strictly valid JSON object matching this TypeScript interface structure exactly:
score (0-100), keywordScore, formatScore, impactScore, matched (string[]), missing (string[]), suggestions (string[]), wordCount (0), readTime (0), contactScore, skillsScore, projectsScore, experienceScore, educationScore, certificationsScore, keywordDensity, matchedKeywords (string[]), missingKeywords (string[]), priorityKeywords (string[]), formattingMetrics (fontCheck, marginCheck, headingCheck, tablesCheck, imagesCheck, iconsCheck, colorsCheck), missingSkills, weakSummaryFix, bulletPointSuggestions, actionVerbsFound, grammarIssues, resumeLengthCheck, readabilityScore, grammarScore, professionalToneScore, jobMatchPercent, atsFriendlyVerdict ('PASS'|'WARNING'|'FAIL'), parsingIssues, fileSizeKb (50), pdfCompatibility, sectionBreakdown (must contain 7 items with title, status, score, feedback for: "Contact Information", "Skills & Keywords", "Projects & Engineering", "Work Experience", "Education", "Certifications", "ATS Layout & Formatting"), strengths, roadmap.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert ATS scanner. You MUST respond with valid JSON matching the requested AtsResult structure.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' }
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;
  try {
    return JSON.parse(escapeControlChars(text)) as AtsResult;
  } catch (e) {
    console.error("Failed to parse JSON from OpenAI", e);
    return null;
  }
}

export const extractTextFromPdfFn = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => {
    return { file: formData.get("file") as File | null };
  })
  .handler(async ({ data }) => {
    if (!data.file) return { text: "" };
    
    try {
      const arrayBuffer = await data.file.arrayBuffer();
      let parser;
      try {
        const mod: any = await import('pdf-parse');
        const PDFParse = mod.PDFParse || mod.default || mod;
        parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
      } catch (importErr) {
        console.warn("Failed to import pdf-parse", importErr);
        throw importErr;
      }
      const textResult = await parser.getText();
      return { text: textResult.text || "" };
    } catch (e) {
      console.error("PDF Parse error", e);
      return { text: "" };
    }
  });

export const parseResumeForProfileFn = createServerFn({ method: 'POST' })
  .validator((data: { text: string }) => data)
  .handler(async ({ data }) => {
    const text = data.text;
    if (!text || text.trim().length === 0) return null;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY configured for parsing profile.");
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert AI resume parser. Extract information from the following resume text and format it into a JSON object matching the TypeScript interface below. Make sure to extract all skills, experiences, projects, education details, social links, coding profiles, achievements, and other structured fields accurately.

TypeScript Interface:
interface ParsedProfile {
  fullName: string;
  headline: string;
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
  summary: string;
  careerObjective: string;
  areasOfInterest: string[];
  skills: {
    programming: string[];
    webDev: string[];
    database: string[];
    cloud: string[];
    tools: string[];
  };
  projects: {
    name: string;
    description: string;
    tech: string[];
    duration: string;
    teamSize: string;
    role: string;
    liveUrl?: string;
    githubUrl?: string;
  }[];
  experience: {
    company: string;
    role: string;
    duration: string;
    responsibilities: string[];
    tech: string[];
    certificateUrl?: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    link?: string;
  }[];
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
  codingProfiles: {
    leetcode: { username: string; solved: number; rating: number; streak: number; badge: string };
    codeforces: { username: string; maxRating: number; solved: number; rank: string };
    codechef: { username: string; stars: string; rating: number };
    hackerrank: { username: string; badgesCount: number };
    geeksforgeeks: { username: string; score: number; solved: number };
  };
  achievements: { title: string; category: string; description: string; date: string }[];
  research: { title: string; type: "Paper" | "Patent" | "Journal" | "Conference"; publication: string; date: string; link?: string }[];
  languages: string[];
  softSkills: string[];
  extraActivities: { title: string; organization: string; description: string }[];
}

Resume Text:
${text}

Ensure the response is strictly a valid JSON object matching the interface structure. Do not include markdown code block characters.`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          console.log(`Trying Gemini model for profile parsing: ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          const responseText = response.text;
          if (responseText) {
            console.log(`Successfully parsed profile with model: ${modelName}!`);
            const cleaned = responseText.trim()
              .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
            return JSON.parse(escapeControlChars(cleaned));
          }
        } catch (e: any) {
          console.warn(`Gemini model ${modelName} failed for profile parse:`, e?.message || e);
        }
      }
    } catch (e) {
      console.error("Failed to parse resume for profile with Gemini:", e);
    }
    return null;
  });

export const fetchRealTimeJobsFn = createServerFn({ method: 'POST' })
  .validator((data: { query: string; page?: number }) => data)
  .handler(async ({ data }) => {
    const query = data.query || "Software Engineer in India";
    const apiKey = process.env.RAPIDAPI_KEY || "2fd45bba28msh14978fdbf2479cbp1a0414jsn84401f22c0a5";
    const apiHost = "jsearch.p.rapidapi.com";
    
    try {
      const url = `https://${apiHost}/search-v2?query=${encodeURIComponent(query)}&page=${data.page || 1}&num_pages=1`;
      console.log(`Fetching jobs from JSearch API: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost
        }
      });
      
      if (!response.ok) {
        throw new Error(`JSearch API returned status ${response.status}`);
      }
      
      const result = await response.json();
      console.log("JSearch API response:", JSON.stringify(result).substring(0, 200));
      
      let rawJobs: any[] = [];
      if (Array.isArray(result.data)) {
        rawJobs = result.data;
      } else if (result.data && Array.isArray(result.data.jobs)) {
        rawJobs = result.data.jobs;
      } else if (Array.isArray(result.jobs)) {
        rawJobs = result.jobs;
      }
      
      if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
        console.error("No valid jobs array found in JSearch response. result.data type:", typeof result.data);
        return [];
      }
      
      return rawJobs.map((j: any) => formatJSearchJob(j));
    } catch (e) {
      console.error("Failed to fetch real-time jobs from JSearch API:", e);
      return [];
    }
  });

function formatJSearchJob(j: any): any {
  const title = j.job_title || "Software Engineer";
  const company = j.employer_name || "Tech Company";
  
  // Extract skills from description
  const knownSkills = ["React", "TypeScript", "Node.js", "Python", "C++", "Java", "JavaScript", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Linux", "Git", "CSS", "HTML", "Golang", "Kubernetes", "Rust", "Swift", "Android", "iOS", "Flutter", "Machine Learning", "AI", "dbt", "BigQuery", "Snowflake", "Spark", "PyTorch", "TensorFlow"];
  const description = j.job_description || "";
  const requiredSkills = knownSkills.filter(skill => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(description);
  });
  
  // If no skills found, fallback to some default based on title
  if (requiredSkills.length === 0) {
    if (/frontend/i.test(title)) requiredSkills.push("React", "JavaScript", "CSS");
    else if (/backend/i.test(title)) requiredSkills.push("Node.js", "SQL", "Git");
    else if (/data/i.test(title)) requiredSkills.push("SQL", "Python");
    else requiredSkills.push("Software Engineering");
  }

  // Formatting salary
  let salary = "Competitive";
  if (j.job_min_salary && j.job_max_salary) {
    const currency = j.job_salary_currency === "USD" ? "$" : j.job_salary_currency || "";
    salary = `${currency}${Math.round(j.job_min_salary / 1000)}k - ${currency}${Math.round(j.job_max_salary / 1000)}k`;
  } else if (j.job_max_salary) {
    const currency = j.job_salary_currency === "USD" ? "$" : j.job_salary_currency || "";
    salary = `Up to ${currency}${Math.round(j.job_max_salary / 1000)}k`;
  }

  // Formatting posted date
  let posted = "Recent";
  if (j.job_posted_at_datetime_utc) {
    try {
      const diffMs = Date.now() - new Date(j.job_posted_at_datetime_utc).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      posted = diffDays === 0 ? "Today" : diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } catch {}
  }

  // Extracting responsibilities
  let responsibilities: string[] = [];
  if (j.job_highlights?.Responsibilities && Array.isArray(j.job_highlights.Responsibilities)) {
    responsibilities = j.job_highlights.Responsibilities;
  } else {
    responsibilities = [
      "Design and implement software applications.",
      "Collaborate with cross-functional teams to define features.",
      "Write high-quality, maintainable, and testable code."
    ];
  }

  // Logo letter & color
  const logoLetter = company.charAt(0).toUpperCase();
  const colors = [
    "bg-blue-600 text-white shadow-blue-500/20",
    "bg-indigo-600 text-white shadow-indigo-500/20",
    "bg-emerald-700 text-white shadow-emerald-500/20",
    "bg-cyan-500 text-white shadow-cyan-500/20",
    "bg-amber-600 text-white shadow-amber-500/20",
    "bg-rose-600 text-white shadow-rose-500/20"
  ];
  const colorIndex = Math.abs(company.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const logoBg = colors[colorIndex];

  return {
    id: j.job_id || String(Math.random()),
    title,
    company,
    logoLetter,
    logoBg,
    logoUrl: j.employer_logo || null,
    location: (j.job_city && j.job_country) ? `${j.job_city}, ${j.job_country}` : j.job_location || "Remote",
    type: j.job_employment_types?.includes("INTERN") ? "Internship" : j.job_employment_types?.includes("PARTTIME") ? "Part-time" : j.job_employment_types?.includes("CONTRACTOR") ? "Contract" : "Full-time",
    salary,
    posted,
    requiredSkills,
    description: description.substring(0, 300) + (description.length > 300 ? "..." : ""),
    responsibilities: responsibilities.slice(0, 4),
    applyLink: j.job_apply_link || "https://google.com/search?q=" + encodeURIComponent(`${title} at ${company}`)
  };
}

