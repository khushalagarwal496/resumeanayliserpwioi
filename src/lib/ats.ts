import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

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
  
  // Premium Layout Fields
  sectionBreakdown: SectionCheck[];
  strengths: string[];
  roadmap: string[];
}

export const analyzeResumeFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("Invalid request: Expected FormData");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables.");
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    const jd = data.get('jd') as string;
    const resumeText = data.get('resumeText') as string | null;
    const resumeFile = data.get('resumeFile') as File | null;

    let finalResumeText = "";

    if (resumeFile && resumeFile.size > 0) {
      try {
        const pdfModule = await import('pdf-parse');
        const arrayBuffer = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        let pdfText = "";
        
        if (typeof pdfModule.default === 'function') {
          const pdfData = await pdfModule.default(buffer);
          pdfText = pdfData.text;
        } else if (typeof pdfModule.default === 'object' && pdfModule.default !== null && typeof (pdfModule.default as any).PDFParse === 'function') {
          const PDFParseClass = (pdfModule.default as any).PDFParse;
          const parser = new PDFParseClass({ data: buffer });
          const pdfResult = await parser.getText();
          pdfText = pdfResult.text;
        } else if (typeof pdfModule.PDFParse === 'function') {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          pdfText = pdfResult.text;
        } else if (typeof pdfModule === 'function') {
          const pdfData = await (pdfModule as any)(buffer);
          pdfText = pdfData.text;
        } else {
          throw new Error("Could not find a valid parser in pdf-parse package.");
        }
        
        finalResumeText = pdfText;
      } catch (err: any) {
        console.error("Failed to parse PDF resume file:", err);
        throw new Error(`Failed to parse PDF: ${err.message || err}`);
      }
    } else if (resumeText) {
      finalResumeText = resumeText;
    } else {
      throw new Error("Please upload a PDF resume or paste your resume text.");
    }

    if (!finalResumeText.trim()) {
      throw new Error("Resume content is empty.");
    }

    if (!jd || !jd.trim()) {
      throw new Error("Job Description is empty.");
    }

    const prompt = `
You are an expert ATS (Applicant Tracking System) optimizer. Analyze the following Resume against the Job Description.

Resume:
"""
${finalResumeText}
"""

Job Description:
"""
${jd}
"""

Calculate and return a JSON object containing:
1. Overall ATS score (0-100).
2. Keyword score (0-100) based on matches of important skills, tools, and experience.
3. Format score (0-100) based on typical ATS parsing standards (structure, clear headers, bullet points).
4. Impact score (0-100) based on action verbs and quantified metrics (numbers/percentages).
5. List of matched keywords.
6. List of missing keywords (important skills or tools in JD not found in Resume).
7. List of specific actionable suggestions to improve the resume.
8. Word count of the resume.
9. Estimated read time in minutes.
10. sectionBreakdown: An array of 6 objects, representing checks for the following 6 sections exactly:
    - "Contact Information"
    - "Professional Summary"
    - "Skills Section"
    - "Work Experience"
    - "Education"
    - "Formatting"
    For each section, provide:
      - title: name of the section (e.g. "Contact Information")
      - status: "pass", "warning", or "fail" based on content quality and standards.
      - score: integer from 0 to 100.
      - feedback: a detailed string explaining what is good or what needs to be fixed.
11. strengths: An array of 3-5 strings detailing competitive strengths (what sets the resume apart).
12. roadmap: An array of 5-6 strings representing an improvement roadmap with actionable steps to reach 100%. Highlight critical items with a prefix "CRITICAL: ".

You must output a JSON object matching this schema:
{
  "score": number,
  "keywordScore": number,
  "formatScore": number,
  "impactScore": number,
  "matched": string[],
  "missing": string[],
  "suggestions": string[],
  "wordCount": number,
  "readTime": number,
  "sectionBreakdown": [
    {
      "title": string,
      "status": "pass" | "warning" | "fail",
      "score": number,
      "feedback": string
    }
  ],
  "strengths": string[],
  "roadmap": string[]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                keywordScore: { type: "INTEGER" },
                formatScore: { type: "INTEGER" },
                impactScore: { type: "INTEGER" },
                matched: { type: "ARRAY", items: { type: "STRING" } },
                missing: { type: "ARRAY", items: { type: "STRING" } },
                suggestions: { type: "ARRAY", items: { type: "STRING" } },
                wordCount: { type: "INTEGER" },
                readTime: { type: "INTEGER" },
                sectionBreakdown: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      status: { type: "STRING", enum: ["pass", "warning", "fail"] },
                      score: { type: "INTEGER" },
                      feedback: { type: "STRING" }
                    },
                    required: ["title", "status", "score", "feedback"]
                  }
                },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                roadmap: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: [
                "score",
                "keywordScore",
                "formatScore",
                "impactScore",
                "matched",
                "missing",
                "suggestions",
                "wordCount",
                "readTime",
                "sectionBreakdown",
                "strengths",
                "roadmap"
              ]
            }
          }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const resJson = await response.json();
      const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed = JSON.parse(textContent) as AtsResult;
      parsed.parsedText = finalResumeText;
      return parsed;
    } catch (e: any) {
      console.error("Gemini API invocation failed:", e);
      throw new Error(`ATS analysis failed: ${e.message || e}`);
    }
  });
