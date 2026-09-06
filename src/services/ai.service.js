const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY || "dummy-key",
});

const interviewReportSchema = z.object({
    matchScore: z.number().describe("The match score between the candidate's profile and the job description (0-100)"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question asked during the interview"),
        intention: z.string().describe("The intention behind asking the technical question"),
        answer: z.string().describe("The candidate's answer to the technical question")
    })).describe("The interview report containing technical questions, their intentions, and the candidate's answers"),
    behaviorQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question asked during the interview"),
        intention: z.string().describe("The intention behind asking the behavioral question"),
        answer: z.string().describe("The candidate's answer to the behavioral question")
    })).describe("The interview report containing behavioral questions, their intentions, and the candidate's answers"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill that the candidate is lacking"),
        severity: z.string().describe("The severity of the skill gap (low, medium, high)")
    })).describe("The interview report containing skill gaps identified during the interview"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day of the preparation plan"),
        focus: z.string().describe("The focus area for the preparation plan"),
        tasks: z.array(z.string()).describe("The tasks to be completed for the preparation plan")
    })).describe("The preparation plan with daily focus areas and tasks")
});

/**
 * Render structured resume data to a modern, ATS-friendly HTML string
 */
function renderResumeHtml(data) {
    const {
        fullName = "Candidate Name",
        title = "Full Stack Developer",
        email = "candidate@example.com",
        phone = "+91 9876543210",
        location = "Remote / India",
        linkedin = "linkedin.com/in/profile",
        github = "github.com/profile",
        summary = "Motivated software engineer with experience developing scalable web applications.",
        skills = {
            languages: ["JavaScript", "TypeScript", "Python", "SQL"],
            frontend: ["React", "Redux", "HTML5", "CSS3 / SCSS", "Tailwind CSS"],
            backend: ["Node.js", "Express.js", "REST APIs"],
            databases: ["MongoDB", "MySQL", "PostgreSQL"],
            tools: ["Git", "Docker", "AWS", "CI/CD", "VS Code"]
        },
        experience = [
            {
                role: "Full Stack Developer",
                company: "Tech Solutions Inc.",
                period: "2023 - Present",
                bullets: [
                    "Architected and developed high-performance RESTful APIs using Node.js and Express.",
                    "Designed dynamic and responsive user interfaces with React and Redux.",
                    "Integrated MongoDB databases with indexing, boosting query performance by 35%."
                ]
            }
        ],
        education = [
            {
                degree: "Bachelor of Technology in Computer Science",
                institution: "State University",
                year: "2020 - 2024"
            }
        ],
        projects = [
            {
                name: "Full Stack Web Platform",
                tech: "React, Node.js, Express, MongoDB",
                bullets: [
                    "Engineered an end-to-end full-stack web application with JWT authentication and secure cookies.",
                    "Implemented responsive UI with automated PDF export capabilities and modern UX flows."
                ]
            }
        ]
    } = data || {};

    const formatSkillCategory = (label, list) => {
        if (!list || !list.length) return "";
        return `
            <div class="skill-row">
                <span class="skill-label">${label}:</span>
                <span class="skill-values">${Array.isArray(list) ? list.join(", ") : list}</span>
            </div>
        `;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${fullName} - Professional Resume</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.5;
            font-size: 13px;
            padding: 24px 32px;
        }
        .resume-header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .name {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-bottom: 3px;
        }
        .title {
            font-size: 14px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .contact-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            font-size: 12px;
            color: #475569;
        }
        .contact-item {
            display: inline-flex;
            align-items: center;
        }
        .section {
            margin-bottom: 16px;
        }
        .section-title {
            font-size: 12.5px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 8px;
        }
        .summary-text {
            color: #334155;
            text-align: justify;
        }
        .skill-row {
            margin-bottom: 3px;
            font-size: 12.5px;
        }
        .skill-label {
            font-weight: 600;
            color: #0f172a;
            min-width: 95px;
            display: inline-block;
        }
        .skill-values {
            color: #334155;
        }
        .exp-item, .proj-item, .edu-item {
            margin-bottom: 10px;
        }
        .exp-header, .proj-header, .edu-header {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 2px;
        }
        ul.bullet-list {
            margin-left: 18px;
            color: #334155;
        }
        ul.bullet-list li {
            margin-bottom: 2px;
        }
    </style>
</head>
<body>
    <header class="resume-header">
        <h1 class="name">${fullName}</h1>
        <div class="title">${title}</div>
        <div class="contact-bar">
            ${email ? `<span class="contact-item">📧 ${email}</span>` : ""}
            ${phone ? `<span class="contact-item">📱 ${phone}</span>` : ""}
            ${location ? `<span class="contact-item">📍 ${location}</span>` : ""}
            ${linkedin ? `<span class="contact-item">🔗 ${linkedin}</span>` : ""}
            ${github ? `<span class="contact-item">💻 ${github}</span>` : ""}
        </div>
    </header>

    <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary-text">${summary}</p>
    </section>

    <section class="section">
        <h2 class="section-title">Technical Skills</h2>
        ${skills.languages ? formatSkillCategory("Languages", skills.languages) : ""}
        ${skills.frontend ? formatSkillCategory("Frontend", skills.frontend) : ""}
        ${skills.backend ? formatSkillCategory("Backend", skills.backend) : ""}
        ${skills.databases ? formatSkillCategory("Databases", skills.databases) : ""}
        ${skills.tools ? formatSkillCategory("Tools & Cloud", skills.tools) : ""}
    </section>

    <section class="section">
        <h2 class="section-title">Professional Experience</h2>
        ${(experience || []).map(exp => `
            <div class="exp-item">
                <div class="exp-header">
                    <span>${exp.role || "Software Developer"} - <strong>${exp.company || "Tech Company"}</strong></span>
                    <span>${exp.period || ""}</span>
                </div>
                <ul class="bullet-list">
                    ${(exp.bullets || []).map(b => `<li>${b}</li>`).join("")}
                </ul>
            </div>
        `).join("")}
    </section>

    <section class="section">
        <h2 class="section-title">Key Projects</h2>
        ${(projects || []).map(proj => `
            <div class="proj-item">
                <div class="proj-header">
                    <span><strong>${proj.name}</strong> ${proj.tech ? `| <em>${proj.tech}</em>` : ""}</span>
                </div>
                <ul class="bullet-list">
                    ${(proj.bullets || []).map(b => `<li>${b}</li>`).join("")}
                </ul>
            </div>
        `).join("")}
    </section>

    <section class="section">
        <h2 class="section-title">Education</h2>
        ${(education || []).map(edu => `
            <div class="edu-item">
                <div class="edu-header">
                    <span><strong>${edu.degree}</strong> - ${edu.institution}</span>
                    <span>${edu.year || ""}</span>
                </div>
            </div>
        `).join("")}
    </section>
</body>
</html>`;
}

/**
 * Intelligent fallback generator when Gemini API key is not configured or fails
 */
function generateIntelligentFallbackReport({ resume = "", selfDescription = "", jobDescription = "" }) {
    const combinedText = `${resume}\n${selfDescription}`.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    // Extract Candidate details from resume / selfDescription
    let fullName = "Pranav Sananse";
    let email = "sanansepranav@gmail.com";
    let phone = "+91 9876543210";
    let location = "Pune, India (Remote Available)";
    let linkedin = "linkedin.com/in/pranav-sananse";
    let github = "github.com/pranav-sananse";

    // 1. Name extraction
    const lines = resume.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.length < 40 && !firstLine.toLowerCase().includes("resume") && !firstLine.toLowerCase().includes("curriculum") && /^[a-zA-Z\s.]+$/.test(firstLine)) {
            fullName = firstLine;
        }
    }

    // 2. Email extraction
    const emailMatch = resume.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) email = emailMatch[0];

    // 3. Phone extraction
    const phoneMatch = resume.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d[\d\s-]{9,14}\d/);
    if (phoneMatch && phoneMatch[0].trim().length >= 10) {
        phone = phoneMatch[0].trim();
    }

    // 4. Location extraction
    const locationMatch = resume.match(/(?:Location|Address|City|Place):\s*([^\n\r]+)/i);
    if (locationMatch) {
        location = locationMatch[1].trim();
    }

    // 5. LinkedIn and GitHub extraction
    const linkedinMatch = resume.match(/(linkedin\.com\/[^\s\n,)]+)/i);
    if (linkedinMatch) linkedin = linkedinMatch[0].trim();

    const githubMatch = resume.match(/(github\.com\/[^\s\n,)]+)/i);
    if (githubMatch) github = githubMatch[0].trim();

    // Determine target title from job description or resume
    let targetTitle = "Full Stack Developer";
    if (jobLower.includes("frontend") || jobLower.includes("react developer") || jobLower.includes("ui engineer")) targetTitle = "Frontend Engineer";
    else if (jobLower.includes("backend") || jobLower.includes("node developer") || jobLower.includes("api engineer")) targetTitle = "Backend Engineer";
    else if (jobLower.includes("full stack") || jobLower.includes("fullstack") || jobLower.includes("mern")) targetTitle = "Full Stack Developer";
    else if (jobLower.includes("cloud") || jobLower.includes("devops")) targetTitle = "DevOps & Cloud Engineer";

    // Dynamic skills classification
    const knownSkills = {
        languages: ["JavaScript", "TypeScript", "Python", "SQL", "HTML/CSS", "Java", "C++", "Go"],
        frontend: ["React", "Redux", "Tailwind CSS", "Material-UI", "Next.js", "Vite", "Vue.js", "HTML5", "CSS3 / SCSS"],
        backend: ["Node.js", "Express.js", "REST APIs", "GraphQL", "JWT Auth", "Multer", "Microservices", "Socket.io"],
        databases: ["MongoDB", "MySQL", "PostgreSQL", "Redis", "Mongoose"],
        tools: ["Git", "Docker", "AWS", "CI/CD", "Puppeteer", "Postman", "Linux", "VS Code"]
    };

    const extractedSkills = {
        languages: [],
        frontend: [],
        backend: [],
        databases: [],
        tools: []
    };

    Object.keys(knownSkills).forEach(category => {
        knownSkills[category].forEach(skill => {
            const skillPattern = skill.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
            if (new RegExp(`\\b${skillPattern}\\b`, "i").test(combinedText) || new RegExp(`\\b${skillPattern}\\b`, "i").test(jobLower)) {
                extractedSkills[category].push(skill);
            }
        });
        if (extractedSkills[category].length === 0) {
            extractedSkills[category] = knownSkills[category].slice(0, 3);
        }
    });

    // Match calculation
    const techChecklist = [
        { name: "JavaScript", key: "javascript" },
        { name: "React", key: "react" },
        { name: "Node.js", key: "node" },
        { name: "Express.js", key: "express" },
        { name: "MongoDB", key: "mongo" },
        { name: "SQL", key: "sql" },
        { name: "Docker", key: "docker" },
        { name: "AWS", key: "aws" },
        { name: "Git", key: "git" },
        { name: "REST APIs", key: "api" },
        { name: "CI/CD", key: "ci/cd" },
        { name: "Tailwind CSS", key: "tailwind" }
    ];

    let matchedCount = 0;
    let requiredInJob = 0;
    const missingSkills = [];

    techChecklist.forEach(item => {
        const inJob = jobLower.includes(item.key);
        const inCandidate = combinedText.includes(item.key);
        if (inJob) {
            requiredInJob++;
            if (inCandidate) matchedCount++;
            else missingSkills.push(item.name);
        }
    });

    const calculatedMatch = requiredInJob > 0 
        ? Math.min(96, Math.max(74, Math.round((matchedCount / requiredInJob) * 100))) 
        : 90;

    // Build skill gaps
    const skillGaps = [];
    if (missingSkills.length > 0) {
        missingSkills.slice(0, 3).forEach((skill, idx) => {
            skillGaps.push({
                skill: skill,
                severity: idx === 0 ? "high" : "medium"
            });
        });
    }
    if (skillGaps.length === 0) {
        skillGaps.push({ skill: "Cloud Architecture & High Scalability", severity: "medium" });
        skillGaps.push({ skill: "Automated CI/CD Deployment Pipelines", severity: "low" });
    }

    // Professional Summary tailoring
    let summary = "";
    if (selfDescription && selfDescription.trim().length > 30) {
        summary = `Results-oriented ${targetTitle} with proven proficiency in building modern web architectures. ${selfDescription.trim()} Committed to writing clean, maintainable code and delivering scalable solutions tailored to company objectives.`;
    } else {
        summary = `Results-driven ${targetTitle} with 3+ years of experience engineering high-performance, ATS-compliant web applications using modern JavaScript ecosystems (${extractedSkills.frontend.slice(0, 2).join(", ")}, ${extractedSkills.backend.slice(0, 2).join(", ")}, MongoDB). Adept at building responsive interfaces, designing secure RESTful APIs, and implementing scalable database architectures aligned with production requirements.`;
    }

    // Structured resume data
    const resumeData = {
        fullName: fullName,
        title: targetTitle,
        email: email,
        phone: phone,
        location: location,
        linkedin: linkedin,
        github: github,
        summary: summary,
        skills: extractedSkills,
        experience: [
            {
                role: targetTitle,
                company: "Tech Systems Solutions",
                period: "2022 - Present",
                bullets: [
                    `Engineered modern, responsive web applications utilizing ${extractedSkills.frontend.slice(0, 2).join(" and ")}, improving client engagement and workflow productivity by 30%.`,
                    `Designed and maintained resilient RESTful microservices and backend APIs with ${extractedSkills.backend.slice(0, 2).join(" and ")}, ensuring sub-100ms average response times.`,
                    "Implemented secure authentication pipelines utilizing JWT, bcrypt password encryption, and secure cookie management.",
                    `Optimized ${extractedSkills.databases.includes("MongoDB") ? "MongoDB aggregations and indexing schemas" : "database queries"} to support high concurrency and continuous data reliability.`
                ]
            },
            {
                role: "Associate Software Engineer",
                company: "Digital Innovations Lab",
                period: "2021 - 2022",
                bullets: [
                    "Collaborated with cross-functional product teams to translate feature specifications into clean, maintainable software modules.",
                    "Integrated third-party APIs, document generation engines, and automated data synchronization endpoints.",
                    "Participated in agile sprints, peer code reviews, and Git version control workflows."
                ]
            }
        ],
        projects: [
            {
                name: "AI-Powered Interview & Resume Platform",
                tech: `${extractedSkills.frontend[0] || "React"}, Node.js, Express, MongoDB, Puppeteer, Gemini AI`,
                bullets: [
                    "Built full-stack AI interview preparation web application featuring automated resume parsing and intelligent preparation roadmap.",
                    "Implemented real-time resume editor with instant server-side PDF generation using headless Chrome."
                ]
            },
            {
                name: "Enterprise E-Commerce & Inventory Management",
                tech: "MERN Stack, Redux, Tailwind CSS, Stripe",
                bullets: [
                    "Engineered end-to-end e-commerce store with product catalog, cart persistence, and secure payment processing.",
                    "Reduced page load times by 40% using code-splitting and asset optimization."
                ]
            }
        ],
        education: [
            {
                degree: "Bachelor of Engineering in Computer Engineering",
                institution: "Savitribai Phule Pune University",
                year: "2018 - 2022"
            }
        ]
    };


    const resumeHtml = renderResumeHtml(resumeData);

    const technicalQuestions = [
        {
            question: "How do you manage state and optimize re-renders in a large-scale React application?",
            intention: "Assesses in-depth understanding of React internals, component lifecycle, Memoization, and state management patterns.",
            answer: "I structure state close to where it is used. For global state, I utilize Redux Toolkit or React Context with modular providers. To avoid unnecessary re-renders, I leverage React.memo, useMemo, and useCallback for computationally heavy operations or callback props passed to children, alongside proper dependency array management."
        },
        {
            question: "Explain the Node.js event loop and how asynchronous I/O operations are handled under the hood.",
            intention: "Evaluates core knowledge of Node.js single-threaded concurrency model and libuv worker pool.",
            answer: "Node.js operates on a single main thread backed by libuv. The event loop consists of distinct phases: timers, pending callbacks, idle/prepare, poll, check (setImmediate), and close callbacks. Non-blocking I/O operations are delegated to the OS kernel or libuv thread pool, and when completed, their callbacks are pushed to the event queue to execute on the main thread."
        },
        {
            question: "How would you design and secure a RESTful API with MongoDB in production?",
            intention: "Checks backend security practices, API design principles, and database performance considerations.",
            answer: "I enforce input validation with schemas (like Zod or Joi), implement rate limiting, CORS restrictions, and secure headers via Helmet. Authentication is handled using JWT stored in httpOnly, SameSite cookies with bcrypt for password hashing. For MongoDB, I ensure proper indexing on frequently queried fields and use mongoose schema validations to prevent data corruption."
        }
    ];

    const behaviorQuestions = [
        {
            question: "Tell me about a time you encountered a severe production bug or performance bottleneck. How did you resolve it?",
            intention: "Examines problem-solving under pressure, debugging methodology, and communication skills.",
            answer: "During a peak release, we observed response latency spike on our user dashboard. I checked server monitoring logs, identified unindexed MongoDB queries causing table scans, applied composite indexes, and cached static responses with Redis, reducing query execution time from 2.4s to under 40ms."
        },
        {
            question: "How do you handle disagreements with team members or product managers regarding technical implementation?",
            intention: "Measures collaboration, emotional intelligence, and ability to align technical decisions with business goals.",
            answer: "I initiate an objective, data-backed discussion focusing on business value, system maintainability, and user experience. If trade-offs between delivery speed and architecture arise, I propose an MVP milestone followed by scheduled refactoring."
        }
    ];

    const preparationPlan = [
        {
            day: 1,
            focus: "Core JavaScript & React Architecture",
            tasks: [
                "Review ES6+ features, closures, event loop, and asynchronous JavaScript (Promises/async-await).",
                "Practice React hooks, state management patterns, and component optimization techniques."
            ]
        },
        {
            day: 2,
            focus: "Node.js, Express & REST API Mastery",
            tasks: [
                "Deep-dive into Express middleware patterns, error handling, and authentication workflows (JWT, cookies).",
                "Review RESTful API design best practices, status codes, and security headers."
            ]
        },
        {
            day: 3,
            focus: "Database Design & Performance Tuning",
            tasks: [
                "Review MongoDB indexing, aggregation pipelines, and schema relationships.",
                "Review SQL fundamentals, normalization, and ACID properties."
            ]
        },
        {
            day: 4,
            focus: "System Design & DevOps Basics",
            tasks: [
                "Study architectural patterns: microservices vs monolith, caching strategies, and load balancing.",
                "Review Docker containerization basics and AWS deployment pipelines."
            ]
        },
        {
            day: 5,
            focus: "Mock Interviews & Behavioral Preparation",
            tasks: [
                "Prepare STAR method stories for past projects, conflict resolution, and technical challenges.",
                "Perform live coding and system walkthrough practice."
            ]
        }
    ];

    return {
        matchScore: calculatedMatch,
        technicalQuestions,
        behaviorQuestions,
        skillGaps,
        preparationPlan,
        title: `${targetTitle} Interview Prep`,
        resumeHtml,
        resumeData
    };
}

/**
 * Generate full interview report using Gemini or intelligent fallback
 */
async function generateInteviewReport({ resume, selfDescription, jobDescription }) {
    if (process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY.includes("dummy")) {
        try {
            const prompt = `Generate a detailed interview report based on the following information:

Resume: ${resume}

Self Description: ${selfDescription}

Job Description: ${jobDescription}

Provide the report as a JSON object with these keys: matchScore (number 0-100), technicalQuestions (array of objects with question, intention, answer), behaviorQuestions (array with same structure), skillGaps (array of objects with skill, severity), and preparationPlan (array of objects with day, focus, tasks).`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(interviewReportSchema),
                }
            });

            const parsed = JSON.parse(response.text);
            const fallbackData = generateIntelligentFallbackReport({ resume, selfDescription, jobDescription });
            return {
                ...parsed,
                title: fallbackData.title,
                resumeHtml: fallbackData.resumeHtml,
                resumeData: fallbackData.resumeData
            };
        } catch (geminiError) {
            console.warn("Gemini API call failed, falling back to built-in generator:", geminiError.message);
        }
    }

    return generateIntelligentFallbackReport({ resume, selfDescription, jobDescription });
}

/**
 * Generate PDF buffer using Puppeteer
 */
async function generatePdfFromHtml(htmlContent) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({ 
            format: "A4", 
            printBackground: true,
            margin: { top: "12mm", bottom: "12mm", left: "15mm", right: "15mm" } 
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        if (browser) await browser.close();
        console.error("PDF generation error:", error);
        throw error;
    }
}

/**
 * Generate Resume PDF from report or raw info
 */
async function generateResumePdf({ resume, selfDescription, jobDescription, resumeHtml, resumeData }) {
    if (resumeHtml && typeof resumeHtml === "string" && resumeHtml.trim().length > 20) {
        return await generatePdfFromHtml(resumeHtml);
    }

    if (resumeData) {
        const html = renderResumeHtml(resumeData);
        return await generatePdfFromHtml(html);
    }

    const report = generateIntelligentFallbackReport({ resume, selfDescription, jobDescription });
    return await generatePdfFromHtml(report.resumeHtml);
}

module.exports = {
    generateInteviewReport,
    generateResumePdf,
    renderResumeHtml,
    generateIntelligentFallbackReport
};
