import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { generateReport, getUserReports } from "../services/interview.api";
import { useAuth } from "@auth/hooks/useAuth";
import "../style/home.scss";

const SAMPLE_RESUME = `Pranav Sananse
Software Engineer | Full Stack Developer

LinkedIn: linkedin.com/in/pranav-sananse
Email: sanansepranav@gmail.com
Phone: +91 9876543210
Location: Pune, India (Remote Available)

PROFESSIONAL SUMMARY
Highly skilled and motivated Software Engineer with 3 years of experience in full stack development. 
Proficient in JavaScript, React, Node.js, and MongoDB. 
Strong problem-solving abilities and a passion for building scalable web applications.

TECHNICAL SKILLS
Languages: JavaScript, Python, SQL, HTML/CSS
Frontend: React, Redux, Tailwind CSS, Material-UI
Backend: Node.js, Express.js, REST APIs
Databases: MongoDB, MySQL
Tools: Git, Docker, AWS, Linux, VS Code`;

const SAMPLE_SELF_DESC = `I am a dedicated full stack developer with a strong foundation in JavaScript and web technologies.
I have 3 years of experience building end-to-end web applications using the MERN stack.
I am passionate about writing clean, maintainable code and continuously learning new technologies.
I enjoy collaborating with teams and solving complex problems through innovative approaches.`;

const SAMPLE_JOB_DESC = `We are looking for a Full Stack Developer with:
- 2-4 years of experience with JavaScript and React
- Strong knowledge of Node.js and Express.js
- Experience with MongoDB and relational databases
- RESTful API design and development
- Experience with Git version control
- Strong problem-solving and communication skills
- Experience with Docker and cloud deployment (AWS preferred)
- Knowledge of software testing and CI/CD pipelines

Responsibilities:
- Develop and maintain full stack web applications
- Collaborate with team members to design and implement features
- Write clean, efficient, and well-documented code
- Participate in code reviews and contribute to team improvements
- Troubleshoot and debug applications
- Work with product managers to define requirements`;

const SAMPLE_FRONTEND_RESUME = `Pratham Sharma
Senior Frontend Engineer | React Specialist

Email: pratham.sharma@example.com
Phone: +91 9811223344
Location: Bengaluru, India
LinkedIn: linkedin.com/in/pratham-sharma-ui
GitHub: github.com/pratham-sharma

PROFESSIONAL SUMMARY
Creative Frontend Engineer with 4 years of expertise in architecting high-performance web applications using React, TypeScript, Redux, and modern CSS/SCSS. Passionate about pixel-perfect UI/UX, responsive layouts, and web accessibility.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript (ES6+), HTML5, CSS3, SCSS
Frontend: React 19, Redux Toolkit, Tailwind CSS, Vite, Next.js
Testing & Tools: Jest, Cypress, Git, Figma, Webpack, Postman`;

const SAMPLE_FRONTEND_SELF_DESC = `I specialize in building accessible, high-performing user interfaces with React, modern state management, and responsive CSS architectures. I have led frontend refactoring projects improving Core Web Vitals and user conversion.`;

const SAMPLE_FRONTEND_JOB_DESC = `Senior Frontend Engineer (React / TypeScript)
Requirements:
- 3+ years in front-end development with React and modern JavaScript/TypeScript
- Deep mastery of HTML5, CSS3, responsive design, and CSS Modules / Tailwind
- State management with Redux Toolkit or Zustand
- Experience optimizing page load performance, bundle sizes, and Core Web Vitals
- Knowledge of unit testing with Jest / React Testing Library
- Strong collaboration with UX/UI designers`;

const SAMPLE_BACKEND_RESUME = `Suyesh Date
Backend Engineer & Cloud Systems Developer

Email: suyesh.date@example.com
Phone: +91 9765432109
Location: Hyderabad, India
LinkedIn: linkedin.com/in/suyesh-date-backend
GitHub: github.com/suyesh-date-dev

PROFESSIONAL SUMMARY
Backend Engineer with 3.5 years of experience building secure, high-throughput microservices, REST and GraphQL APIs, and scalable MongoDB and PostgreSQL databases. Expertise in Node.js, Express, Docker, and AWS.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Backend: Node.js, Express.js, NestJS, RESTful APIs, JWT Auth, Microservices
Databases: MongoDB, PostgreSQL, Redis, Mongoose
DevOps & Cloud: Docker, AWS (EC2, S3, Lambda), Git, CI/CD pipelines`;

const SAMPLE_BACKEND_SELF_DESC = `I am a backend specialist focused on high-availability API design, database indexing, caching strategies with Redis, and containerized cloud deployments. I enjoy solving complex concurrency and data integrity challenges.`;

const SAMPLE_BACKEND_JOB_DESC = `Backend Node.js & Cloud Engineer
Requirements:
- 3+ years experience with Node.js and Express
- Database design, indexing, and query optimization for MongoDB and SQL
- API security: JWT, rate limiting, data encryption
- Docker containerization and CI/CD pipelines
- Understanding of distributed systems and caching with Redis`;

const Home = () => {
    const navigate = useNavigate();
    const { user, handleLogout } = useAuth();

    const [isGenerating, setIsGenerating] = useState(false);
    const [resumeMode, setResumeMode] = useState("text"); // "text" | "file"
    const [activePreset, setActivePreset] = useState(null); // "fullstack" | "frontend" | "backend" | null
    const [isDragging, setIsDragging] = useState(false);

    const [formData, setFormData] = useState({
        jobDescription: "",
        selfDescription: "",
        resumeText: "",
        resumeFile: null,
    });

    const [recentReports, setRecentReports] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await getUserReports();
                if (data && data.reports) {
                    setRecentReports(data.reports);
                }
            } catch (err) {
                console.warn("Could not fetch recent reports:", err);
            }
        };
        fetchReports();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setActivePreset(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, resumeFile: e.target.files[0] }));
        }
    };

    const handleDropFile = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                setFormData(prev => ({ ...prev, resumeFile: file }));
                setResumeMode("file");
            } else {
                setError("Please upload a valid PDF document.");
            }
        }
    };

    const handleLoadSample = () => {
        setFormData({
            jobDescription: SAMPLE_JOB_DESC,
            selfDescription: SAMPLE_SELF_DESC,
            resumeText: SAMPLE_RESUME,
            resumeFile: null,
        });
        setResumeMode("text");
        setActivePreset("fullstack");
        setError("");
    };

    const handleLoadFrontendSample = () => {
        setFormData({
            jobDescription: SAMPLE_FRONTEND_JOB_DESC,
            selfDescription: SAMPLE_FRONTEND_SELF_DESC,
            resumeText: SAMPLE_FRONTEND_RESUME,
            resumeFile: null,
        });
        setResumeMode("text");
        setActivePreset("frontend");
        setError("");
    };

    const handleLoadBackendSample = () => {
        setFormData({
            jobDescription: SAMPLE_BACKEND_JOB_DESC,
            selfDescription: SAMPLE_BACKEND_SELF_DESC,
            resumeText: SAMPLE_BACKEND_RESUME,
            resumeFile: null,
        });
        setResumeMode("text");
        setActivePreset("backend");
        setError("");
    };

    const handleClear = () => {
        setFormData({
            jobDescription: "",
            selfDescription: "",
            resumeText: "",
            resumeFile: null,
        });
        setActivePreset(null);
        setError("");
    };

    const handleGenerate = async () => {
        setError("");

        if (!formData.jobDescription.trim()) {
            return setError("Please enter the Target Job Description.");
        }
        if (!formData.selfDescription.trim()) {
            return setError("Please enter your Self Description / Career Goals.");
        }
        if (resumeMode === "text" && !formData.resumeText.trim()) {
            return setError("Please paste or type your Resume info, or upload a PDF file.");
        }
        if (resumeMode === "file" && !formData.resumeFile) {
            return setError("Please select a resume PDF file to upload, or switch to text mode.");
        }

        setIsGenerating(true);
        try {
            const data = new FormData();
            data.append("jobDescription", formData.jobDescription);
            data.append("selfDescription", formData.selfDescription);

            if (resumeMode === "file" && formData.resumeFile) {
                data.append("resume", formData.resumeFile);
            } else if (formData.resumeText) {
                data.append("resume", formData.resumeText);
            }

            const result = await generateReport(data);
            const interviewId = result.interviewReport ? result.interviewReport._id : result._id;
            navigate(`/interview/${interviewId}`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to generate report. Please verify connection and try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="home-container">
            {/* Top Navigation Bar */}
            <nav className="top-nav">
                <div className="brand">
                    <span className="logo-icon">⚡</span>
                    <strong className="brand-text">Interview AI & Resume Studio</strong>
                </div>

                <div className="user-section">
                    {user && (
                        <span className="user-greeting">
                            Welcome, <strong>{user.username || user.email}</strong>
                        </span>
                    )}

                    {(user?.role === "admin" || user?.username === "admin" || user?.email === "admin@interviewai.com") && (
                        <Link to="/admin" className="admin-nav-btn">
                            <span>🛡️ Admin Panel</span>
                        </Link>
                    )}

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Ambient Centered Header */}
            <header className="page-header">
                <div className="header-ambient-glow" />
                <div className="header-content">
                    <div className="header-badge">AI CAREER COPILOT</div>
                    <h1>
                        AI Interview Plan & <span className="highlight">Tailored Resume Creator</span>
                    </h1>
                    <p>
                        Input your target job role and existing background. Our AI analyzes alignment, formulates personalized 
                        interview questions, and crafts an ATS-optimized, high-impact resume tailored for the position.
                    </p>

                    {/* Interactive Quick Presets Chips */}
                    <div className="action-banner">
                        <span className="preset-label">⚡ Quick Presets:</span>
                        <div className="presets-group">
                            <button
                                type="button"
                                className={`preset-chip ${activePreset === "fullstack" ? "active" : ""}`}
                                onClick={handleLoadSample}
                            >
                                <span className="chip-icon">✨</span>
                                <span>Full Stack (Pranav)</span>
                            </button>

                            <button
                                type="button"
                                className={`preset-chip frontend-chip ${activePreset === "frontend" ? "active" : ""}`}
                                onClick={handleLoadFrontendSample}
                            >
                                <span className="chip-icon">🎨</span>
                                <span>Frontend React (Pratham)</span>
                            </button>

                            <button
                                type="button"
                                className={`preset-chip backend-chip ${activePreset === "backend" ? "active" : ""}`}
                                onClick={handleLoadBackendSample}
                            >
                                <span className="chip-icon">⚙️</span>
                                <span>Backend Cloud (Suyesh)</span>
                            </button>

                            <button
                                type="button"
                                className="clear-chip-btn"
                                onClick={handleClear}
                                title="Clear all input fields"
                            >
                                <span>✕ Clear All</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Error Notification */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    <button className="dismiss-btn" onClick={() => setError("")}>✕</button>
                </div>
            )}

            {/* Clean 2-Column Side-by-Side Grid */}
            <main className="studio-form-grid">
                {/* Column 1: Target Job Description */}
                <div className="form-col left-col">
                    <div className="col-header">
                        <div className="col-title-wrap">
                            <span className="col-num">1</span>
                            <div>
                                <h2>Target Job Description <span className="req">*</span></h2>
                                <p className="col-desc">Paste the role requirements, responsibilities, and qualifications</p>
                            </div>
                        </div>
                        <span className="char-badge">
                            {formData.jobDescription.length} chars
                        </span>
                    </div>

                    <div className="textarea-card">
                        <textarea
                            name="jobDescription"
                            id="jobDescription"
                            value={formData.jobDescription}
                            onChange={handleChange}
                            placeholder="Paste the target job description here (responsibilities, required tech stack, qualifications)..."
                        />
                    </div>
                </div>

                {/* Column 2: Resume & Self Description */}
                <div className="form-col right-col">
                    {/* Resume Section */}
                    <div className="resume-block">
                        <div className="col-header">
                            <div className="col-title-wrap">
                                <span className="col-num">2</span>
                                <div>
                                    <h2>Your Resume Info <span className="req">*</span></h2>
                                    <p className="col-desc">Provide your current resume data or upload your existing PDF</p>
                                </div>
                            </div>

                            {/* Mode Toggle Chips */}
                            <div className="mode-pill-toggle">
                                <button
                                    type="button"
                                    className={`pill-btn ${resumeMode === "text" ? "active" : ""}`}
                                    onClick={() => setResumeMode("text")}
                                >
                                    ✏️ Paste Text
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${resumeMode === "file" ? "active" : ""}`}
                                    onClick={() => setResumeMode("file")}
                                >
                                    📁 Upload PDF
                                </button>
                            </div>
                        </div>

                        {resumeMode === "text" ? (
                            <div className="textarea-card">
                                <textarea
                                    name="resumeText"
                                    id="resumeText"
                                    value={formData.resumeText}
                                    onChange={handleChange}
                                    placeholder="Paste or edit your resume text (Contact, Summary, Technical Skills, Work Experience, Education)..."
                                />
                            </div>
                        ) : (
                            <div
                                className={`file-dropzone ${isDragging ? "dragging" : ""} ${formData.resumeFile ? "has-file" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDropFile}
                            >
                                <label className="dropzone-label" htmlFor="resumeFile">
                                    <div className="dropzone-icon">📄</div>
                                    <div className="dropzone-text">
                                        <strong>{formData.resumeFile ? formData.resumeFile.name : "Drag & drop your Resume PDF here"}</strong>
                                        <span>or click to browse from your device</span>
                                        <small className="format-hint">Supports PDF files up to 5 MB</small>
                                    </div>
                                    {formData.resumeFile && (
                                        <span className="file-size-badge">
                                            {(formData.resumeFile.size / 1024).toFixed(0)} KB ready
                                        </span>
                                    )}
                                </label>
                                <input
                                    hidden
                                    type="file"
                                    name="resumeFile"
                                    id="resumeFile"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                            </div>
                        )}
                    </div>

                    {/* Self Description / Career Goals */}
                    <div className="self-desc-block">
                        <div className="col-header sub-header">
                            <div>
                                <h3>Self Description & Career Goals <span className="req">*</span></h3>
                                <p className="col-desc">Highlight your top strengths, motivations, and target career direction</p>
                            </div>
                        </div>
                        <div className="textarea-card compact">
                            <textarea
                                name="selfDescription"
                                id="selfDescription"
                                rows={3}
                                value={formData.selfDescription}
                                onChange={handleChange}
                                placeholder="Describe your background, core strengths, and goals in a few sentences..."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* High-Visibility Centered Primary Action Button */}
            <div className="primary-action-container">
                <button
                    className="generate-plan-btn"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                >
                    {isGenerating ? (
                        <>
                            <span className="spinner" />
                            <span>Synthesizing Interview Strategy & Crafting Resume...</span>
                        </>
                    ) : (
                        <>
                            <span className="btn-icon">🚀</span>
                            <span>Generate Plan & Resume</span>
                            <span className="btn-arrow">→</span>
                        </>
                    )}
                </button>
                <p className="action-hint">Generates 15+ tailored interview questions, skill analysis, and a bespoke ATS resume.</p>
            </div>

            {/* Recent Reports Section */}
            {recentReports && recentReports.length > 0 && (
                <section className="recent-reports-container">
                    <div className="section-header">
                        <h2>📁 Your Previous Interview Plans & Resumes</h2>
                        <span className="report-count-tag">{recentReports.length} reports</span>
                    </div>

                    <div className="reports-grid">
                        {recentReports.map(item => (
                            <div
                                key={item._id || item.id}
                                className="report-card"
                                onClick={() => navigate(`/interview/${item._id || item.id}`)}
                            >
                                <div className="card-top">
                                    <span className="report-badge">Analysis Complete</span>
                                    <div className="score-pill">
                                        <span className="score-num">{item.matchScore || "85"}%</span>
                                        <span className="score-lbl">Match</span>
                                    </div>
                                </div>
                                <h3>{item.title || "Customized Interview Report"}</h3>
                                <p className="card-snippet">
                                    {item.jobDescription ? item.jobDescription.slice(0, 110) + "..." : "Target job analysis ready to review."}
                                </p>
                                <div className="card-footer">
                                    <span className="date-text">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                                    </span>
                                    <span className="view-link">Open Plan & Resume →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <footer className="page-footer">
                <p>AI Career Studio • Powered by Google Gemini AI & Supabase</p>
            </footer>
        </div>
    );
};

export default Home;
