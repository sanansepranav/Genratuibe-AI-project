const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const interviewController = require("../../controllers/interview.controller");
const upload = require("../../middleware/file.middleware");

const interviewRouter = express.Router();

/**
 * @route GET /api/interview
 * @description Generate interview report based on resume, self description and job description
 * @access Private
 * 
 */

interviewRouter.post(
    "/",
    authMiddleware,
    upload.single("resume"),
    interviewController.generateInterviewReportController
);

interviewRouter.get(
    "/my-reports",
    authMiddleware,
    interviewController.getUserReportsController
);

interviewRouter.get(
    "/:interviewReportId",
    authMiddleware,
    interviewController.getInterviewReportController
);

/**
 * @route PUT /api/interview/resume/:interviewReportId
 * @description Update customized resume for an interview report
 * @access Private
 */
interviewRouter.put(
    "/resume/:interviewReportId",
    authMiddleware,
    interviewController.updateResumeController
);

/**
 * @router POST /api/interview/resume/pdf/:interviewReportId
 * @description Generate resume PDF based on an interview report
 * @access Private
 */

interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    authMiddleware,
    interviewController.generateResumePdfController
);


module.exports = interviewRouter;