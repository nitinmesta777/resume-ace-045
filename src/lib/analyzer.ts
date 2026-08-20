// Resume analysis engine: skills, sections, score, JD match and suggestions.

export const SKILL_LIBRARY: Record<string, string[]> = {
  Programming: [
    "python", "java", "javascript", "typescript", "c++", "c#", "php", "kotlin", "swift", "go", "ruby", "r",
  ],
  "Web Development": [
    "html", "css", "react", "angular", "vue", "node.js", "express", "flask", "django", "bootstrap",
    "tailwind", "next.js", "rest api", "jquery",
  ],
  "Data & Database": [
    "sql", "mysql", "sqlite", "postgresql", "mongodb", "oracle", "excel", "power bi", "tableau",
    "pandas", "numpy", "data analysis",
  ],
  "AI & Machine Learning": [
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "opencv",
    "artificial intelligence", "computer vision",
  ],
  "Tools & Cloud": [
    "git", "github", "docker", "linux", "aws", "azure", "firebase", "figma", "jira", "postman", "vs code",
  ],
  "Soft Skills": [
    "teamwork", "communication", "leadership", "problem solving", "time management", "presentation",
    "adaptability", "critical thinking",
  ],
};

const ALL_SKILLS = Object.entries(SKILL_LIBRARY).flatMap(([category, skills]) =>
  skills.map((skill) => ({ skill, category })),
);

const SECTION_KEYWORDS = {
  education: ["education", "b.c.a", "bca", "bachelor", "university", "college", "degree", "cgpa", "12th", "school"],
  experience: ["experience", "intern", "internship", "worked", "company", "employment", "freelance"],
  projects: ["project", "projects", "developed", "built", "implemented", "mini project"],
  certifications: ["certification", "certificate", "certified", "course", "udemy", "coursera", "nptel"],
  achievements: ["achievement", "award", "winner", "rank", "hackathon", "scholarship"],
} as const;

export type SectionKey = keyof typeof SECTION_KEYWORDS | "contact" | "summary";

export interface DetectedSkill {
  skill: string;
  category: string;
}

export interface AnalysisResult {
  fileName: string;
  words: number;
  score: number;
  scoreBreakdown: { label: string; earned: number; max: number; hint: string }[];
  sections: { key: SectionKey; label: string; found: boolean }[];
  detectedSkills: DetectedSkill[];
  skillsByCategory: { category: string; found: string[]; total: number }[];
  contact: { email?: string | undefined; phone?: string | undefined; linkedin?: string | undefined; github?: string | undefined };
  jd: {
    provided: boolean;
    matchPercent: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  };
  suggestions: string[];
  createdAt: string;
}

const titleCase = (s: string) =>
  s.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bApi\b/, "API").replace(/\bSql\b/, "SQL");

export function prettySkill(skill: string) {
  const special: Record<string, string> = {
    "node.js": "Node.js",
    "next.js": "Next.js",
    nlp: "NLP",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    aws: "AWS",
    "rest api": "REST API",
    "c++": "C++",
    "c#": "C#",
    "vs code": "VS Code",
    r: "R",
  };
  return special[skill] ?? titleCase(skill);
}

const STOP_WORDS = new Set(
  ("a an the and or of for to in on with as at by from is are be will we you your our their this that " +
    "have has had must should can able using used strong good work working role job candidate " +
    "hiring hire developer junior senior full stack basics agile team teams projects project " +
    "required requirement requirements looking apply position company also want need needs " +
    "experience experienced knowledge skills ability plus etc other others any all more most who what").split(" "),
);

function keywordsFrom(text: string) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, ""))
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
  return Array.from(new Set(tokens));
}

export function analyzeResume(
  fileName: string,
  resumeText: string,
  jobDescription: string,
): AnalysisResult {
  const text = resumeText.toLowerCase();
  const words = resumeText.trim().split(/\s+/).filter(Boolean).length;

  // --- skills -------------------------------------------------------------
  const detectedSkills = ALL_SKILLS.filter(({ skill }) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });

  const skillsByCategory = Object.entries(SKILL_LIBRARY).map(([category, skills]) => ({
    category,
    total: skills.length,
    found: detectedSkills.filter((d) => d.category === category).map((d) => d.skill),
  }));

  // --- contact ------------------------------------------------------------
  const email = resumeText.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0];
  const phone = resumeText.match(/(\+?\d[\d\s-]{8,13}\d)/)?.[0];
  const linkedin = resumeText.match(/linkedin\.com\/[\w/-]+/i)?.[0];
  const github = resumeText.match(/github\.com\/[\w/-]+/i)?.[0];
  const contact = { email, phone, linkedin, github };

  // --- sections -----------------------------------------------------------
  const sectionChecks = (Object.keys(SECTION_KEYWORDS) as (keyof typeof SECTION_KEYWORDS)[]).map((key) => ({
    key: key as SectionKey,
    label: titleCase(key),
    found: SECTION_KEYWORDS[key].some((k) => text.includes(k)),
  }));
  const hasSummary = /(summary|objective|profile|about me)/i.test(resumeText);
  const sections: AnalysisResult["sections"] = [
    { key: "contact", label: "Contact Info", found: Boolean(email || phone) },
    { key: "summary", label: "Summary / Objective", found: hasSummary },
    ...sectionChecks,
  ];

  // --- job description match ---------------------------------------------
  const jdProvided = jobDescription.trim().length > 20;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let matchPercent = 0;

  if (jdProvided) {
    const jdSkills = ALL_SKILLS.filter(({ skill }) =>
      jobDescription.toLowerCase().includes(skill),
    ).map((s) => s.skill);
    const jdWords = keywordsFrom(jobDescription);
    const pool = Array.from(new Set([...jdSkills, ...jdWords])).slice(0, 60);
    matchedKeywords = pool.filter((k) => text.includes(k));
    missingKeywords = pool.filter((k) => !text.includes(k));
    matchPercent = pool.length ? Math.round((matchedKeywords.length / pool.length) * 100) : 0;
  }

  // --- score --------------------------------------------------------------
  const contactScore = [email, phone, linkedin || github].filter(Boolean).length * 5;
  const sectionScore = Math.round((sections.filter((s) => s.found).length / sections.length) * 25);
  const skillScore = Math.min(25, detectedSkills.length * 2);
  const lengthScore = words >= 250 && words <= 900 ? 15 : words >= 120 ? 9 : 4;
  const actionVerbs = [
    "developed", "designed", "implemented", "created", "built", "managed", "led", "optimized",
    "analyzed", "automated", "improved", "collaborated",
  ];
  const verbHits = actionVerbs.filter((v) => text.includes(v)).length;
  const impactScore = Math.min(10, verbHits * 2) + (/\d+%|\d+\s*(users|projects|hours)/.test(text) ? 5 : 0);
  const jdScore = jdProvided ? Math.round((matchPercent / 100) * 5) : 5;

  const scoreBreakdown = [
    { label: "Contact Details", earned: contactScore, max: 15, hint: "Email, phone, LinkedIn/GitHub" },
    { label: "Resume Sections", earned: sectionScore, max: 25, hint: "Education, experience, projects…" },
    { label: "Technical Skills", earned: skillScore, max: 25, hint: "Recognised industry keywords" },
    { label: "Length & Structure", earned: lengthScore, max: 15, hint: "250–900 words is ideal" },
    { label: "Impact & Action Words", earned: Math.min(15, impactScore), max: 15, hint: "Strong verbs + numbers" },
    { label: "JD Alignment", earned: jdScore, max: 5, hint: "Keyword match with the job role" },
  ];
  const score = Math.min(100, scoreBreakdown.reduce((sum, s) => sum + s.earned, 0));

  // --- suggestions --------------------------------------------------------
  const suggestions: string[] = [];
  if (!email) suggestions.push("Add a professional email address at the top of your resume.");
  if (!phone) suggestions.push("Include a phone number so recruiters can reach you quickly.");
  if (!linkedin && !github)
    suggestions.push("Add your LinkedIn profile and GitHub link to showcase your work.");
  if (!hasSummary)
    suggestions.push("Start with a 2–3 line career objective mentioning your target role.");
  sections
    .filter((s) => !s.found && !["contact", "summary"].includes(s.key))
    .forEach((s) => suggestions.push(`Add a clear "${s.label}" section — it is missing right now.`));
  if (detectedSkills.length < 8)
    suggestions.push("List more relevant technical skills grouped by category (languages, web, database, tools).");
  if (verbHits < 4)
    suggestions.push("Rewrite bullet points with action verbs like Developed, Implemented, Optimized.");
  if (!/\d+%|\d+\s*(users|projects|hours)/.test(text))
    suggestions.push("Quantify your achievements, e.g. \"improved load time by 40%\" or \"served 500+ users\".");
  if (words < 250) suggestions.push("Your resume looks short — expand project descriptions with 2–3 bullets each.");
  if (words > 900) suggestions.push("Trim your resume to 1–2 pages by removing repetitive details.");
  if (jdProvided && matchPercent < 60)
    suggestions.push(
      `Your job-description match is ${matchPercent}%. Naturally add the missing keywords shown below.`,
    );
  if (suggestions.length === 0)
    suggestions.push("Excellent resume! Keep it updated and tailor keywords for each application.");

  return {
    fileName,
    words,
    score,
    scoreBreakdown,
    sections,
    detectedSkills,
    skillsByCategory,
    contact,
    jd: { provided: jdProvided, matchPercent, matchedKeywords, missingKeywords: missingKeywords.slice(0, 18) },
    suggestions,
    createdAt: new Date().toISOString(),
  };
}

export const SAMPLE_RESUME = `RAHUL SHARMA
Email: rahul.sharma@example.com | Phone: +91 98765 43210
LinkedIn: linkedin.com/in/rahulsharma | GitHub: github.com/rahulsharma

CAREER OBJECTIVE
Final-year BCA student seeking a software developer internship where I can apply my web
development and Python skills to build real products.

EDUCATION
Bachelor of Computer Applications (BCA), St. Xavier's College, University of Mumbai - CGPA 8.4
Higher Secondary (12th), Science stream - 82%

TECHNICAL SKILLS
Languages: Python, Java, JavaScript, SQL
Web: HTML, CSS, React, Flask, Bootstrap, REST API
Database: MySQL, SQLite, MongoDB
Tools: Git, GitHub, VS Code, Postman, Linux

PROJECTS
AI Resume Analyzer - Developed a web application that parses PDF resumes and generates a
resume score, improving shortlisting speed by 40% for the college placement cell.
Library Management System - Built a Flask and SQLite app used by 300+ students.

INTERNSHIP EXPERIENCE
Web Development Intern, TechNova Solutions (2 months) - Implemented responsive pages and
optimized API calls, reducing page load time by 30%.

CERTIFICATIONS
Python for Everybody (Coursera), Web Development Bootcamp (Udemy), NPTEL DBMS

ACHIEVEMENTS
Winner - Intra-college Hackathon 2025. Teamwork, communication and problem solving skills.`;

export const SAMPLE_JD = `We are hiring a Junior Full Stack Developer.
Required skills: Python, Flask, JavaScript, React, HTML, CSS, SQL, MySQL, REST API, Git.
Good to have: Docker, AWS, MongoDB, machine learning basics.
The candidate should have strong communication and problem solving skills and be able to
work in a team on agile projects.`;
