const { getSupabaseClient } = require("../config/database");

function normalizeReport(report) {
    if (!report) return null;

    return {
        ...report,
        _id: report.id,
        user: report.user_id,
        jobDescription: report.job_description,
        selfDescription: report.self_description,
        matchScore: report.match_score,
        technicalQuestions: report.technical_questions,
        behaviorQuestions: report.behavior_questions,
        skillGaps: report.skill_gaps,
        preparationPlan: report.preparation_plan,
        resumeHtml: report.resume_html,
        resumeData: report.resume_data,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
    };
}

function selectFields(fields) {
    if (!fields) return "*";

    const fieldMap = {
        title: "title",
        jobDescription: "job_description",
        user: "user_id",
        matchScore: "match_score",
        createdAt: "created_at",
    };

    return fields.split(" ").map(field => fieldMap[field] || field).join(",");
}

function toDatabaseFields(report) {
    const fieldMap = {
        jobDescription: "job_description",
        selfDescription: "self_description",
        matchScore: "match_score",
        technicalQuestions: "technical_questions",
        behaviorQuestions: "behavior_questions",
        skillGaps: "skill_gaps",
        preparationPlan: "preparation_plan",
        resumeHtml: "resume_html",
        resumeData: "resume_data",
    };

    return Object.fromEntries(Object.entries(report).map(([key, value]) => [fieldMap[key] || key, value]));
}

module.exports = {
    async create(report) {
        const { data, error } = await getSupabaseClient()
            .from("interview_reports")
            .insert(toDatabaseFields(report))
            .select()
            .single();
        if (error) throw error;
        return normalizeReport(data);
    },

    async findById(id) {
        const { data, error } = await getSupabaseClient()
            .from("interview_reports")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return normalizeReport(data);
    },

    find(query) {
        const builder = {
            sort() {
                return builder;
            },
            select(fields) {
                return (async () => {
                    const { data, error } = await getSupabaseClient()
                        .from("interview_reports")
                        .select(selectFields(fields))
                        .eq("user_id", query.user)
                        .order("created_at", { ascending: false });
                    if (error) throw error;
                    return data.map(normalizeReport);
                })();
            },
        };
        return builder;
    },

    async findByIdAndUpdate(id, updates) {
        const { data, error } = await getSupabaseClient()
            .from("interview_reports")
            .update(toDatabaseFields(updates))
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error) throw error;
        return normalizeReport(data);
    },

    async findAll(options = {}) {
        const client = getSupabaseClient();
        let query = client
            .from("interview_reports")
            .select("id, user_id, title, match_score, job_description, created_at, updated_at")
            .order("created_at", { ascending: false });
        if (options.limit) query = query.limit(options.limit);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(normalizeReport);
    },

    async count() {
        const client = getSupabaseClient();
        const { count, error } = await client
            .from("interview_reports")
            .select("id", { count: "exact", head: true });
        if (error) throw error;
        return count || 0;
    },

    async delete(id) {
        const client = getSupabaseClient();
        const { error } = await client
            .from("interview_reports")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    },
};