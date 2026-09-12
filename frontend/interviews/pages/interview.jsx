import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInterviewReport, generateResumePdf, updateResume } from "../services/interview.api";
import "../style/interview.scss";

const Interview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("resume"); // "resume" | "questions"
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Editable resume state
  const [editableResume, setEditableResume] = useState({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    summary: "",
    skills: {
      languages: [],
      frontend: [],
      backend: [],
      databases: [],
      tools: [],
    },
    experience: [],
    education: [],
    projects: [],
  });

  const resumePrintRef = useRef(null);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInterviewReport(interviewId);
        const rep = data.interviewReport;
        setReport(rep);

        if (rep?.resumeData) {
          setEditableResume({
            fullName: rep.resumeData.fullName || "Candidate Name",
            title: rep.resumeData.title || "Full Stack Developer",
            email: rep.resumeData.email || "",
            phone: rep.resumeData.phone || "",
            location: rep.resumeData.location || "",
            linkedin: rep.resumeData.linkedin || "",
            github: rep.resumeData.github || "",
            summary: rep.resumeData.summary || "",
            skills: rep.resumeData.skills || {
              languages: ["JavaScript", "TypeScript", "Python"],
              frontend: ["React", "Redux", "Tailwind CSS"],
              backend: ["Node.js", "Express.js", "REST APIs"],
              databases: ["MongoDB", "MySQL"],
              tools: ["Git", "Docker", "AWS"],
            },
            experience: rep.resumeData.experience || [],
            education: rep.resumeData.education || [],
            projects: rep.resumeData.projects || [],
          });
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load interview report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      loadReport();
    }
  }, [interviewId]);

  const downloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await generateResumePdf({ interviewReportId: interviewId });
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Unable to generate PDF directly from server. You can also use the 'Print / Save PDF' button.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResumeFieldChange = (field, value) => {
    setEditableResume(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillChange = (category, commaSeparatedString) => {
    const list = commaSeparatedString.split(",").map(s => s.trim()).filter(Boolean);
    setEditableResume(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: list
      }
    }));
  };

  // Work Experience Handlers
  const handleExpChange = (index, field, value) => {
    setEditableResume(prev => {
      const updated = [...(prev.experience || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const handleExpBulletChange = (expIndex, bulletIndex, value) => {
    setEditableResume(prev => {
      const updated = [...(prev.experience || [])];
      const bullets = [...(updated[expIndex]?.bullets || [])];
      bullets[bulletIndex] = value;
      updated[expIndex] = { ...updated[expIndex], bullets };
      return { ...prev, experience: updated };
    });
  };

  const handleAddExpBullet = (expIndex) => {
    setEditableResume(prev => {
      const updated = [...(prev.experience || [])];
      const bullets = [...(updated[expIndex]?.bullets || []), "Engineered high-impact feature and boosted application throughput by 25%."];
      updated[expIndex] = { ...updated[expIndex], bullets };
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExpBullet = (expIndex, bulletIndex) => {
    setEditableResume(prev => {
      const updated = [...(prev.experience || [])];
      const bullets = (updated[expIndex]?.bullets || []).filter((_, i) => i !== bulletIndex);
      updated[expIndex] = { ...updated[expIndex], bullets };
      return { ...prev, experience: updated };
    });
  };

  const handleAddExperience = () => {
    setEditableResume(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          role: editableResume.title || "Senior Software Engineer",
          company: "Enterprise Technology Corp",
          period: "2023 - Present",
          bullets: [
            "Spearheaded full-stack application development delivering scalable user features.",
            "Designed and optimized microservices and RESTful API endpoints with Node.js and Express."
          ]
        }
      ]
    }));
  };

  const handleRemoveExperience = (index) => {
    setEditableResume(prev => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== index)
    }));
  };

  // Key Projects Handlers
  const handleProjChange = (index, field, value) => {
    setEditableResume(prev => {
      const updated = [...(prev.projects || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const handleProjBulletChange = (projIndex, bulletIndex, value) => {
    setEditableResume(prev => {
      const updated = [...(prev.projects || [])];
      const bullets = [...(updated[projIndex]?.bullets || [])];
      bullets[bulletIndex] = value;
      updated[projIndex] = { ...updated[projIndex], bullets };
      return { ...prev, projects: updated };
    });
  };

  const handleAddProjBullet = (projIndex) => {
    setEditableResume(prev => {
      const updated = [...(prev.projects || [])];
      const bullets = [...(updated[projIndex]?.bullets || []), "Integrated real-time caching and optimized latency to sub-50ms."];
      updated[projIndex] = { ...updated[projIndex], bullets };
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProjBullet = (projIndex, bulletIndex) => {
    setEditableResume(prev => {
      const updated = [...(prev.projects || [])];
      const bullets = (updated[projIndex]?.bullets || []).filter((_, i) => i !== bulletIndex);
      updated[projIndex] = { ...updated[projIndex], bullets };
      return { ...prev, projects: updated };
    });
  };

  const handleAddProject = () => {
    setEditableResume(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          name: "High-Performance Cloud Web App",
          tech: "React, Node.js, Express, MongoDB, Docker",
          bullets: [
            "Architected full stack cloud platform with responsive UI and authenticated REST APIs."
          ]
        }
      ]
    }));
  };

  const handleRemoveProject = (index) => {
    setEditableResume(prev => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index)
    }));
  };

  // Education Handlers
  const handleEduChange = (index, field, value) => {
    setEditableResume(prev => {
      const updated = [...(prev.education || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const handleAddEducation = () => {
    setEditableResume(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          degree: "Bachelor of Technology in Computer Science & Engineering",
          institution: "State University of Technology",
          year: "2020 - 2024"
        }
      ]
    }));
  };

  const handleRemoveEducation = (index) => {
    setEditableResume(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }));
  };

  // Reset to original generated resume
  const handleResetToGenerated = () => {
    if (report?.resumeData) {
      setEditableResume(report.resumeData);
      setSaveSuccessMsg("Reset to original AI tailored resume draft.");
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    }
  };

  const handleSaveResume = async () => {
    setIsSavingResume(true);
    setSaveSuccessMsg("");
    try {
      const updated = await updateResume(interviewId, {
        resumeData: editableResume,
      });
      if (updated?.interviewReport) {
        setReport(updated.interviewReport);
      }
      setIsEditingResume(false);
      setSaveSuccessMsg("Resume successfully saved and updated!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to save resume edits. Please try again.");
    } finally {
      setIsSavingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-loading-view">
        <div className="spinner">
          <img
            src="https://img.magnific.com/premium-photo/tech-evolution-generative-ai-logo_1106493-60018.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Interview AI logo"
          />
        </div>
        <h2>Loading Interview Prep & Tailored Resume...</h2>
        <p>Analyzing profile against target job description</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="interview-error-view">
        <h2>Report Not Found</h2>
        <p>{error || "The requested interview report could not be located."}</p>
        <button onClick={() => navigate("/")} className="primary-button">
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="interview-report-page">
      {/* Top Header & Navigation */}
      <header className="page-header no-print">
        <div className="header-nav">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Generator
          </button>
          <div className="match-pill">
            <span>Match Score:</span>
            <strong>{report.matchScore || "85"}%</strong>
          </div>
        </div>

        <div className="header-title-bar">
          <div>
            <h1>{report.title || "Target Role Analysis & Tailored Resume"}</h1>
            <p className="subtitle">
              Generated on {new Date(report.createdAt).toLocaleDateString()} for your target application
            </p>
          </div>
          <div className="header-actions">
            <button 
              onClick={downloadPdf} 
              className="primary-button download-btn"
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? "Generating PDF..." : "📥 Download Resume PDF"}
            </button>
            <button onClick={handlePrint} className="secondary-button">
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="success-toast">
            ✓ {saveSuccessMsg}
          </div>
        )}

        {/* Studio Navigation Tabs */}
        <div className="report-tabs">
          <button 
            className={`tab-btn ${activeTab === "resume" ? "active" : ""}`}
            onClick={() => setActiveTab("resume")}
          >
            📄 Tailored Resume Studio
          </button>
          <button 
            className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            🎯 Interview Questions & 5-Day Plan
          </button>
        </div>
      </header>

      {/* TAB 1: RESUME STUDIO */}
      {activeTab === "resume" && (
        <section className="resume-studio-section">
          {/* Editor Controls Bar */}
          <div className="resume-controls-bar no-print">
            <div className="resume-status">
              <h3>✨ Newly Created Resume</h3>
              <p>Tailored with matching keywords and achievements for your target position.</p>
            </div>
            <div className="controls-btns">
              {isEditingResume ? (
                <>
                  <button 
                    className="save-btn primary-button" 
                    onClick={handleSaveResume}
                    disabled={isSavingResume}
                  >
                    {isSavingResume ? "Saving Changes..." : "💾 Save Changes"}
                  </button>
                  <button 
                    className="cancel-btn secondary-button" 
                    onClick={() => setIsEditingResume(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  className="edit-btn secondary-button" 
                  onClick={() => setIsEditingResume(true)}
                >
                  ✏️ Edit Resume Details
                </button>
              )}
            </div>
          </div>

          {/* EDIT MODE */}
          {isEditingResume ? (
            <div className="resume-edit-form no-print">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editableResume.fullName} 
                    onChange={e => handleResumeFieldChange("fullName", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Target Professional Title</label>
                  <input 
                    type="text" 
                    value={editableResume.title} 
                    onChange={e => handleResumeFieldChange("title", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editableResume.email} 
                    onChange={e => handleResumeFieldChange("email", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="text" 
                    value={editableResume.phone} 
                    onChange={e => handleResumeFieldChange("phone", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    value={editableResume.location} 
                    onChange={e => handleResumeFieldChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="text" 
                    value={editableResume.linkedin} 
                    onChange={e => handleResumeFieldChange("linkedin", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>GitHub / Portfolio URL</label>
                  <input 
                    type="text" 
                    value={editableResume.github} 
                    onChange={e => handleResumeFieldChange("github", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Professional Summary</label>
                <textarea 
                  rows={4}
                  value={editableResume.summary} 
                  onChange={e => handleResumeFieldChange("summary", e.target.value)}
                />
              </div>

              <h4 className="subhead">Technical Skills (comma-separated)</h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Languages</label>
                  <input 
                    type="text" 
                    value={editableResume.skills?.languages?.join(", ") || ""} 
                    onChange={e => handleSkillChange("languages", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Frontend Skills</label>
                  <input 
                    type="text" 
                    value={editableResume.skills?.frontend?.join(", ") || ""} 
                    onChange={e => handleSkillChange("frontend", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Backend Skills</label>
                  <input 
                    type="text" 
                    value={editableResume.skills?.backend?.join(", ") || ""} 
                    onChange={e => handleSkillChange("backend", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Databases</label>
                  <input 
                    type="text" 
                    value={editableResume.skills?.databases?.join(", ") || ""} 
                    onChange={e => handleSkillChange("databases", e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Tools & Cloud</label>
                  <input 
                    type="text" 
                    value={editableResume.skills?.tools?.join(", ") || ""} 
                    onChange={e => handleSkillChange("tools", e.target.value)}
                  />
                </div>
              </div>

              {/* WORK EXPERIENCE EDIT */}
              <div className="section-edit-header">
                <h4 className="subhead">Work Experience</h4>
                <button type="button" className="add-item-btn" onClick={handleAddExperience}>
                  + Add Experience
                </button>
              </div>

              {(editableResume.experience || []).map((exp, expIdx) => (
                <div key={expIdx} className="edit-card-item">
                  <div className="card-top-bar">
                    <span className="card-item-title">Experience #{expIdx + 1}</span>
                    <button 
                      type="button" 
                      className="delete-card-btn" 
                      onClick={() => handleRemoveExperience(expIdx)}
                      title="Delete this experience"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Job Title / Role</label>
                      <input 
                        type="text" 
                        value={exp.role || ""} 
                        onChange={e => handleExpChange(expIdx, "role", e.target.value)}
                        placeholder="e.g. Full Stack Developer"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company / Organization</label>
                      <input 
                        type="text" 
                        value={exp.company || ""} 
                        onChange={e => handleExpChange(expIdx, "company", e.target.value)}
                        placeholder="e.g. Tech Solutions Inc."
                      />
                    </div>
                    <div className="form-group">
                      <label>Period / Dates</label>
                      <input 
                        type="text" 
                        value={exp.period || ""} 
                        onChange={e => handleExpChange(expIdx, "period", e.target.value)}
                        placeholder="e.g. 2022 - Present"
                      />
                    </div>
                  </div>

                  <div className="bullets-edit-section">
                    <div className="bullets-header">
                      <label>Bullet Points / Achievements</label>
                      <button 
                        type="button" 
                        className="add-bullet-btn" 
                        onClick={() => handleAddExpBullet(expIdx)}
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(exp.bullets || []).map((bullet, bIdx) => (
                      <div key={bIdx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input 
                          type="text" 
                          value={bullet} 
                          onChange={e => handleExpBulletChange(expIdx, bIdx, e.target.value)}
                          placeholder="Action verb + technical detail + business impact..."
                        />
                        <button 
                          type="button" 
                          className="remove-bullet-btn" 
                          onClick={() => handleRemoveExpBullet(expIdx, bIdx)}
                          title="Remove bullet"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* KEY PROJECTS EDIT */}
              <div className="section-edit-header">
                <h4 className="subhead">Key Projects</h4>
                <button type="button" className="add-item-btn" onClick={handleAddProject}>
                  + Add Project
                </button>
              </div>

              {(editableResume.projects || []).map((proj, projIdx) => (
                <div key={projIdx} className="edit-card-item">
                  <div className="card-top-bar">
                    <span className="card-item-title">Project #{projIdx + 1}</span>
                    <button 
                      type="button" 
                      className="delete-card-btn" 
                      onClick={() => handleRemoveProject(projIdx)}
                      title="Delete this project"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Project Name</label>
                      <input 
                        type="text" 
                        value={proj.name || ""} 
                        onChange={e => handleProjChange(projIdx, "name", e.target.value)}
                        placeholder="e.g. AI-Powered Platform"
                      />
                    </div>
                    <div className="form-group">
                      <label>Technologies Used</label>
                      <input 
                        type="text" 
                        value={proj.tech || ""} 
                        onChange={e => handleProjChange(projIdx, "tech", e.target.value)}
                        placeholder="e.g. React, Node.js, Express, MongoDB"
                      />
                    </div>
                  </div>

                  <div className="bullets-edit-section">
                    <div className="bullets-header">
                      <label>Project Details / Highlights</label>
                      <button 
                        type="button" 
                        className="add-bullet-btn" 
                        onClick={() => handleAddProjBullet(projIdx)}
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(proj.bullets || []).map((bullet, bIdx) => (
                      <div key={bIdx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input 
                          type="text" 
                          value={bullet} 
                          onChange={e => handleProjBulletChange(projIdx, bIdx, e.target.value)}
                          placeholder="Feature implemented, architecture, or outcome..."
                        />
                        <button 
                          type="button" 
                          className="remove-bullet-btn" 
                          onClick={() => handleRemoveProjBullet(projIdx, bIdx)}
                          title="Remove bullet"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* EDUCATION EDIT */}
              <div className="section-edit-header">
                <h4 className="subhead">Education</h4>
                <button type="button" className="add-item-btn" onClick={handleAddEducation}>
                  + Add Education
                </button>
              </div>

              {(editableResume.education || []).map((edu, eduIdx) => (
                <div key={eduIdx} className="edit-card-item">
                  <div className="card-top-bar">
                    <span className="card-item-title">Education #{eduIdx + 1}</span>
                    <button 
                      type="button" 
                      className="delete-card-btn" 
                      onClick={() => handleRemoveEducation(eduIdx)}
                      title="Delete this education entry"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Degree / Qualification</label>
                      <input 
                        type="text" 
                        value={edu.degree || ""} 
                        onChange={e => handleEduChange(eduIdx, "degree", e.target.value)}
                        placeholder="e.g. B.Tech in Computer Science"
                      />
                    </div>
                    <div className="form-group">
                      <label>Institution / University</label>
                      <input 
                        type="text" 
                        value={edu.institution || ""} 
                        onChange={e => handleEduChange(eduIdx, "institution", e.target.value)}
                        placeholder="e.g. Savitribai Phule Pune University"
                      />
                    </div>
                    <div className="form-group">
                      <label>Year / Duration</label>
                      <input 
                        type="text" 
                        value={edu.year || ""} 
                        onChange={e => handleEduChange(eduIdx, "year", e.target.value)}
                        placeholder="e.g. 2018 - 2022"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="form-actions">
                <button className="primary-button" onClick={handleSaveResume} disabled={isSavingResume}>
                  {isSavingResume ? "Saving Changes..." : "✓ Save Resume Changes"}
                </button>
                <button type="button" className="reset-draft-btn" onClick={handleResetToGenerated}>
                  ✨ Reset to AI Draft
                </button>
                <button className="secondary-button" onClick={() => setIsEditingResume(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* RESUME PAPER VIEW */}
          <div className="resume-sheet-container" ref={resumePrintRef}>
            <div className="resume-sheet">
              <header className="resume-sheet-header">
                <h2 className="r-name">{editableResume.fullName}</h2>
                <div className="r-title">{editableResume.title}</div>
                <div className="r-contact">
                  {editableResume.email && <span>📧 {editableResume.email}</span>}
                  {editableResume.phone && <span>📱 {editableResume.phone}</span>}
                  {editableResume.location && <span>📍 {editableResume.location}</span>}
                  {editableResume.linkedin && <span>🔗 {editableResume.linkedin}</span>}
                  {editableResume.github && <span>💻 {editableResume.github}</span>}
                </div>
              </header>

              <div className="r-section">
                <h3 className="r-sec-title">Professional Summary</h3>
                <p className="r-summary">{editableResume.summary}</p>
              </div>

              <div className="r-section">
                <h3 className="r-sec-title">Technical Skills</h3>
                {editableResume.skills?.languages?.length > 0 && (
                  <div className="r-skill-line">
                    <strong>Languages:</strong> {editableResume.skills.languages.join(", ")}
                  </div>
                )}
                {editableResume.skills?.frontend?.length > 0 && (
                  <div className="r-skill-line">
                    <strong>Frontend:</strong> {editableResume.skills.frontend.join(", ")}
                  </div>
                )}
                {editableResume.skills?.backend?.length > 0 && (
                  <div className="r-skill-line">
                    <strong>Backend:</strong> {editableResume.skills.backend.join(", ")}
                  </div>
                )}
                {editableResume.skills?.databases?.length > 0 && (
                  <div className="r-skill-line">
                    <strong>Databases:</strong> {editableResume.skills.databases.join(", ")}
                  </div>
                )}
                {editableResume.skills?.tools?.length > 0 && (
                  <div className="r-skill-line">
                    <strong>Tools & Cloud:</strong> {editableResume.skills.tools.join(", ")}
                  </div>
                )}
              </div>

              <div className="r-section">
                <h3 className="r-sec-title">Work Experience</h3>
                {(editableResume.experience || []).map((exp, i) => (
                  <div key={i} className="r-exp-item">
                    <div className="r-exp-row">
                      <span className="r-exp-role">
                        <strong>{exp.role}</strong> - {exp.company}
                      </span>
                      <span className="r-exp-period">{exp.period}</span>
                    </div>
                    <ul className="r-bullet-list">
                      {(exp.bullets || []).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="r-section">
                <h3 className="r-sec-title">Key Projects</h3>
                {(editableResume.projects || []).map((proj, pi) => (
                  <div key={pi} className="r-proj-item">
                    <div className="r-proj-row">
                      <span className="r-proj-name">
                        <strong>{proj.name}</strong> {proj.tech && <em>| {proj.tech}</em>}
                      </span>
                    </div>
                    <ul className="r-bullet-list">
                      {(proj.bullets || []).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="r-section">
                <h3 className="r-sec-title">Education</h3>
                {(editableResume.education || []).map((edu, ei) => (
                  <div key={ei} className="r-edu-item">
                    <div className="r-edu-row">
                      <span><strong>{edu.degree}</strong> - {edu.institution}</span>
                      <span>{edu.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: INTERVIEW REPORT & PREPARATION PLAN */}
      {activeTab === "questions" && (
        <section className="interview-analysis-section no-print">
          {/* Target Info Summary */}
          <div className="analysis-card summary-card">
            <h2>📋 Target Job Alignment</h2>
            <div className="summary-grid">
              <div>
                <strong>Match Score:</strong>
                <span className="score-highlight">{report.matchScore || "85"} / 100</span>
              </div>
              <div>
                <strong>Job Requirements Analyzed:</strong>
                <p>{report.jobDescription?.slice(0, 240)}...</p>
              </div>
            </div>
          </div>

          {/* Technical Questions */}
          <div className="analysis-card">
            <h2>💻 High-Yield Technical Interview Questions</h2>
            <div className="questions-grid">
              {report.technicalQuestions?.map((item, index) => (
                <div key={index} className="question-card">
                  <div className="q-badge">Question #{index + 1}</div>
                  <h3 className="q-text">{item.question}</h3>
                  <div className="q-intention">
                    <strong>Why Interviewers Ask This:</strong>
                    <p>{item.intention}</p>
                  </div>
                  <div className="q-answer">
                    <strong>Model Answer / Key Points:</strong>
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Questions */}
          <div className="analysis-card">
            <h2>🤝 Core Behavioral & Leadership Questions</h2>
            <div className="questions-grid">
              {report.behaviorQuestions?.map((item, index) => (
                <div key={index} className="question-card behavioral">
                  <div className="q-badge behavioral-badge">Scenario #{index + 1}</div>
                  <h3 className="q-text">{item.question}</h3>
                  <div className="q-intention">
                    <strong>Evaluator Goal:</strong>
                    <p>{item.intention}</p>
                  </div>
                  <div className="q-answer">
                    <strong>Recommended STAR Approach:</strong>
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="analysis-card">
            <h2>⚠️ Skill Gap Analysis</h2>
            <div className="gaps-grid">
              {report.skillGaps?.map((gap, index) => (
                <div key={index} className={`skill-gap-card severity-${gap.severity?.toLowerCase() || "medium"}`}>
                  <div className="gap-top">
                    <span className="gap-name">{gap.skill}</span>
                    <span className="gap-badge">{gap.severity} priority</span>
                  </div>
                  <p className="gap-tip">
                    Prioritize strengthening this area to exceed expectations for this role.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Preparation Roadmap */}
          <div className="analysis-card">
            <h2>📅 5-Day Rapid Preparation Roadmap</h2>
            <div className="plan-grid">
              {report.preparationPlan?.map((plan, index) => (
                <div key={index} className="plan-day-card">
                  <div className="day-header">
                    <span className="day-num">Day {plan.day}</span>
                    <span className="day-focus">{plan.focus}</span>
                  </div>
                  <ul className="tasks-list">
                    {plan.tasks?.map((task, taskIndex) => (
                      <li key={taskIndex}>
                        <label className="task-checkbox-label">
                          <input type="checkbox" />
                          <span>{task}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Interview;
