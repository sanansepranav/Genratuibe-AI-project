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

const SAMPLE_FRONTEND_RESUME = `pratham Sharma
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
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, resumeFile: e.target.files[0] }));
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
        setError("");
    };

    const handleClear = () => {
        setFormData({
            jobDescription: "",
            selfDescription: "",
            resumeText: "",
            resumeFile: null,
        });
        setError("");
    };

    const handleGenerate = async () => {
        setError("");

        if (!formData.jobDescription.trim()) {
            return setError("Please enter the Job Description.");
        }
        if (!formData.selfDescription.trim()) {
            return setError("Please enter your Self Description.");
        }
        if (resumeMode === "text" && !formData.resumeText.trim()) {
            return setError("Please paste or type your Resume info, or upload a resume file.");
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
            setError("Failed to generate report. Please verify connection and try again.");
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
                    <strong>Interview AI & Resume Studio</strong>
                </div>
                <div className="user-section">
                    {user && (
                        <span className="user-greeting">
                            Welcome, <strong>{user.username || user.email}</strong>
                        </span>
                    )}
                    {(user?.role === "admin" || user?.username === "admin" || user?.email === "admin@interviewai.com") && (
                        <Link to="/admin" style={{
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#fff",
                            textDecoration: "none",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.4)",
                            transition: "all 0.2s ease"
                        }}>
                            <span>🛡️ Admin Panel</span>
                        </Link>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <header className="page-header">
                <h1>AI Interview Plan & <span className="highlight">Tailored Resume Creator</span></h1>
                <p>
                    Provide your target job requirements and profile. Our system crafts an in-depth interview plan
                    and generates a brand new, ATS-optimized professional resume tailored specifically to the role.
                </p>

                <div className="action-banner">
                    <span className="preset-label">⚡ Quick Presets:</span>
                    <button type="button" className="sample-btn" onClick={handleLoadSample}>
                        ✨ Full Stack (Pranav)
                    </button>
                    <button type="button" className="sample-btn frontend-preset" onClick={handleLoadFrontendSample}>
                        🎨 Frontend React (Pratham)
                    </button>
                    <button type="button" className="sample-btn backend-preset" onClick={handleLoadBackendSample}>
                        ⚙️ Backend Cloud (Suyesh)
                    </button>
                    <button type="button" className="clear-btn" onClick={handleClear}>
                        ✕ Clear All
                    </button>
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <main className="home">
                {/* Left Column: Job Description */}
                <div className="left">
                    <div className="field-header">
                        <label htmlFor="jobDescription">Target Job Description *</label>
                        <span className="field-hint">Paste the role requirements, responsibilities, and tech stack</span>
                    </div>
                    <textarea 
                        name="jobDescription" 
                        id="jobDescription" 
                        rows={16}
                        value={formData.jobDescription} 
                        onChange={handleChange} 
                        placeholder="Paste job description here (responsibilities, required skills, experience level)..."
                    />
                </div>

                {/* Right Column: Resume & Profile */}
                <div className="right">
                    {/* Resume Input Mode Toggle */}
                    <div className="resume-section">
                        <div className="field-header">
                            <label>Your Resume Info *</label>
                            <div className="mode-toggle">
                                <button 
                                    type="button" 
                                    className={resumeMode === "text" ? "active" : ""} 
                                    onClick={() => setResumeMode("text")}
                                >
                                    ✏️ Paste / Edit Resume Text
                                </button>
                                <button 
                                    type="button" 
                                    className={resumeMode === "file" ? "active" : ""} 
                                    onClick={() => setResumeMode("file")}
                                >
                                    📁 Upload PDF
                                </button>
                            </div>
                        </div>

                        {resumeMode === "text" ? (
                            <textarea
                                name="resumeText"
                                id="resumeText"
                                rows={8}
                                value={formData.resumeText}
                                onChange={handleChange}
                                placeholder="Paste or edit your current resume details (Name, contact info, summary, skills, experience, education)..."
                            />
                        ) : (
                            <div className="file-upload-box">
                                <label className="file-label" htmlFor="resumeFile">
                                    <span className="upload-icon">📄</span>
                                    <span>{formData.resumeFile ? formData.resumeFile.name : "Click to select a Resume PDF file"}</span>
                                    <small>Supports .pdf files up to 3MB</small>
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

                    {/* Self Description */}
                    <div className="input-group">
                        <div className="field-header">
                            <label htmlFor="selfDescription">Self Description / Career Goals *</label>
                            <span className="field-hint">Your strengths, background, and specific career goals</span>
                        </div>
                        <textarea 
                            name="selfDescription" 
                            id="selfDescription" 
                            rows={4}
                            value={formData.selfDescription} 
                            onChange={handleChange} 
                            placeholder="Describe your background, core strengths, and goals in a few sentences..."
                        />
                    </div>

                    <button 
                        className="generate-btn primary-button" 
                        disabled={isGenerating} 
                        onClick={handleGenerate}
                    >
                        {isGenerating ? "⚡ Generating Analysis & Creating Tailored Resume..." : "🚀 Generate Interview Report & Create Tailored Resume"}
                    </button>
                </div>
            </main>

            {/* Recent Reports Section */}
            {recentReports && recentReports.length > 0 && (
                <section className="recent-reports">
                    <h2>📁 My Recent Interview Reports & Resumes</h2>
                    <ul className="report-list">
                        {recentReports.map(item => (
                            <li 
                                key={item._id} 
                                className="report-item" 
                                onClick={() => navigate(`/interview/${item._id}`)}
                            >
                                <div className="report-info">
                                    <h3>{item.title || "Software Engineering Interview"}</h3>
                                    <p className="report-snippet">
                                        {item.jobDescription ? item.jobDescription.slice(0, 100) + "..." : "No job preview available"}
                                    </p>
                                    <span className="report-meta">
                                        Generated on {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="report-score-badge">
                                    <span className="score-val">{item.matchScore || "85"}%</span>
                                    <span className="score-lbl">Match</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <footer className="page-footer">
                <p>Terms & Conditions</p>
            </footer>
        </div>
    );
};

export default Home;
