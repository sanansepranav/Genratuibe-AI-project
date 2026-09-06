const mongoose = require("mongoose");

/**
 * - job desciption schema
 * - resume text : STRING
 * - self description : string
 * 
 * -matchScore : {
 *      mumber }
 * 
 * -technical skills :[{
 *        quation : "",
 *        intenshtion : ""
 *        answer : ""
 *     }]
 * -behaviour skills
 * skill gap : [{
 *     skill : "",
 *     sevritu: {
 *              type : string,
 *              enum : ["low", "medium", "high"]}}]
 * prepration plan :[{
 *   day : Number
 *   focus : String,
 *   tasks : [string]}]
 * 
 */

const technicalQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Question is required"]
    },
    intention : {
        type : String,
        required : [true, "Intention is required"]
    },
    answer : {
        type: String,
        required : [ true, "Answer is required"]
    }
}, {
    _id: false
});

const brhaviourQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Question is required"]
    },
    intention : {
        type  : String,
        required : [true, "Intention is required"]
    },
    answer : {
        type : String,
        required : [true, "Answer is required"]
    }
}, {
    _id: false
})
///
const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"],
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        required: [true, "Severity is required"],
    },
}, {
    _id: false
});

const preparationPlanSchema = new mongoose.Schema(
    {
        day: {
            type: Number,
            required: [true, "Day is required"],
        },
        focus: {
            type: String,
            required: [true, "Focus is required"],
        },
        tasks: {
            type: [String],
            required: [true, "Tasks are required"],
        },
    },
    { _id: false }
);

const interviewReportSchema = new mongoose.Schema(
    {
        jobDescription: {
            type: String,
            required: true,
        },
        resume: {
            type: String,
            required: false,
            default: "",
        },
        selfDescription: {
            type: String,
            required: false,
        },
        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            required: false,
        },
        technicalQuestions: [technicalQuestionSchema],
        behaviorQuestions: [brhaviourQuestionSchema],
        skillGaps: [skillGapSchema],
        preparationPlan: [preparationPlanSchema],
        title: {
            type: String,
            default: "Interview Analysis & Resume",
        },
        resumeHtml: {
            type: String,
            default: "",
        },
        resumeData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

const InterviewReport = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = InterviewReport;