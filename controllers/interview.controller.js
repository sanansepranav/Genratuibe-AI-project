const { generateInteviewReport, generateResumePdf, renderResumeHtml } = require("../src/services/ai.service");
const interviewReportModel = require("../src/models/interviewReport.model");

/**
 * @description Controller to generate interview report and tailored resume
 */
async function generateInterviewReportController(req, res) {
    try {
        let resumeText = req.body?.resume || "";

        if (req.file) {
            try {
                const { PDFParse } = require("pdf-parse");
                const parser = new PDFParse({ data: req.file.buffer });
                const parsed = await parser.getText();
                if (parsed && parsed.text) {
                    resumeText = parsed.text;
                }
            } catch (parseError) {
                console.warn("Could not extract text from uploaded PDF:", parseError.message);
            }
        }

        const { selfDescription = "", jobDescription = "" } = req.body;

        if (!jobDescription && !selfDescription && !resumeText) {
            return res.status(400).json({ message: "Please provide job description, self description, or resume." });
        }

        const interviewReportByAi = await generateInteviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription,
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user?.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi,
        });

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport,
        });
    } catch (error) {
        console.error("Interview report generation failed:", error);
        res.status(500).json({ message: "Failed to generate interview report", error: error.message });
    }
}

/**
 * @description Controller to get an interview report by ID
 */
async function getInterviewReportController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const interviewReport = await interviewReportModel.findById(interviewReportId);

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        res.status(200).json({ interviewReport });
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ message: "Failed to fetch interview report", error: error.message });
    }
}

/**
 * @description Controller to get all reports for current logged in user
 */
async function getUserReportsController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const reports = await interviewReportModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .select("title jobDescription matchScore createdAt");

        res.status(200).json({ reports });
    } catch (error) {
        console.error("Error fetching user reports:", error);
        res.status(500).json({ message: "Failed to fetch user reports", error: error.message });
    }
}

/**
 * @description Controller to update the customized resume HTML or structured data
 */
async function updateResumeController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const { resumeHtml, resumeData } = req.body;

        const updatePayload = {};
        if (resumeHtml !== undefined) updatePayload.resumeHtml = resumeHtml;
        if (resumeData !== undefined) {
            updatePayload.resumeData = resumeData;
            if (!resumeHtml) {
                updatePayload.resumeHtml = renderResumeHtml(resumeData);
            }
        }

        const interviewReport = await interviewReportModel.findByIdAndUpdate(
            interviewReportId,
            updatePayload,
            { returnDocument: 'after' }
        );

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        res.status(200).json({
            message: "Resume updated successfully",
            interviewReport,
        });
    } catch (error) {
        console.error("Error updating resume:", error);
        res.status(500).json({ message: "Failed to update resume", error: error.message });
    }
}

/**
 * @description Controller to generate a resume PDF based on user resume, self description and job description
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findById(interviewReportId);

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        const { resume, jobDescription, selfDescription, resumeHtml, resumeData } = interviewReport;

        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription,
            resumeHtml,
            resumeData
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error("PDF generation failed:", error);
        res.status(500).json({ message: "Failed to generate resume PDF", error: error.message });
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportController,
    getUserReportsController,
    updateResumeController,
    generateResumePdfController
};
