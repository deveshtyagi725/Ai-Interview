const pdfParseLib = require("pdf-parse")

const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")

const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        // Validate inputs
        const { selfDescription, jobDescription } = req.body;
        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ message: 'Job description is required.' });
        }
        if (!req.file && (!selfDescription || selfDescription.trim().length === 0)) {
            return res.status(400).json({ message: 'Either resume file or self-description is required.' });
        }

        let resumeText = '';
        if (req.file) {
            try {
                const dataBuffer = req.file.buffer;
                const data = await pdfParseLib(dataBuffer);
                resumeText = data.text.trim();

            } catch (pdfError) {


                console.error('PDF parsing error:', pdfError);
                return res.status(400).json({ message: 'Invalid PDF file. Please upload a valid PDF resume.' });
            }
        } else {
            resumeText = selfDescription.trim();
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || '',
            jobDescription
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || '',
            jobDescription,
            ...interViewReportByAi
        });

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });
    } catch (error) {
        console.error('Error generating interview report:', error);
        res.status(500).json({ message: 'Failed to generate interview report.', error: error.message });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }
        res.status(200).json({ message: "Interview report fetched successfully.", interviewReport })
    } catch (error) {
        console.error("Error fetching interview report:", error)
        res.status(500).json({ message: "Failed to fetch interview report.", error: error.message })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
        res.status(200).json({ message: "Interview reports fetched successfully.", interviewReports })
    } catch (error) {
        console.error("Error fetching interview reports:", error)
        res.status(500).json({ message: "Failed to fetch interview reports.", error: error.message })
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or access denied."
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating resume PDF:', error);
        res.status(500).json({ message: 'Failed to generate resume PDF.', error: error.message });
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }