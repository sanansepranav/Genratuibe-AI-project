const { getSupabaseClient } = require("../config/database");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const FALLBACK_REPORTS_FILE = path.join(os.tmpdir(), "interview_ai_reports_fallback.json");

function loadFallbackReports() {
    try {
        if (fs.existsSync(FALLBACK_REPORTS_FILE)) {
            const data = JSON.parse(fs.readFileSync(FALLBACK_REPORTS_FILE, "utf8"));
            if (Array.isArray(data)) return data;
        }
    } catch {}
    return [];
}

function saveFallbackReports(reports) {
    try {
        fs.writeFileSync(FALLBACK_REPORTS_FILE, JSON.stringify(reports, null, 2), "utf8");
    } catch {}
}

let fallbackReports = loadFallbackReports();

function normalizeReport(report) {
    if (!report) return null;

    return {
        ...report,
        _id: report.id,
        user: report.user_id || report.user,
        jobDescription: report.job_description || report.jobDescription,
        selfDescription: report.self_description || report.selfDescription,
        matchScore: report.match_score || report.matchScore,
        technicalQuestions: report.technical_questions || report.technicalQuestions,
        behaviorQuestions: report.behavior_questions || report.behaviorQuestions,
        skillGaps: report.skill_gaps || report.skillGaps,
        preparationPlan: report.preparation_plan || report.preparationPlan,
        resumeHtml: report.resume_html || report.resumeHtml,
        resumeData: report.resume_data || report.resumeData,
        createdAt: report.created_at || report.createdAt,
        updatedAt: report.updated_at || report.updatedAt,
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
        user: "user_id",
    };

    return Object.fromEntries(Object.entries(report).map(([key, value]) => [fieldMap[key] || key, value]));
}

function isTableMissing(err) {
    if (!err) return false;
    const msg = (err.message || "").toLowerCase();
    const code = err.code || "";
    return msg.includes("could not find the table") || msg.includes("does not exist") || code === "42P01" || code === "PGRST205";
}

module.exports = {
    async create(report) {
        try {
            const { data, error } = await getSupabaseClient()
                .from("interview_reports")
                .insert(toDatabaseFields(report))
                .select()
                .single();
            if (error) {
                if (isTableMissing(error)) return this.fallbackCreate(report);
                throw error;
            }
            return normalizeReport(data);
        } catch (err) {
            if (isTableMissing(err) || (err.message && err.message.includes("Database not configured"))) {
                return this.fallbackCreate(report);
            }
            throw err;
        }
    },

    fallbackCreate(report) {
        fallbackReports = loadFallbackReports();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newReport = {
            ...report,
            id,
            user_id: report.user || report.user_id,
            created_at: now,
            updated_at: now,
        };
        fallbackReports.push(newReport);
        saveFallbackReports(fallbackReports);
        return normalizeReport(newReport);
    },

    async findById(id) {
        try {
            const { data, error } = await getSupabaseClient()
                .from("interview_reports")
                .select("*")
                .eq("id", id)
                .maybeSingle();
            if (error) {
                if (isTableMissing(error)) return this.fallbackFindById(id);
                throw error;
            }
            if (data) return normalizeReport(data);
            return this.fallbackFindById(id);
        } catch {
            return this.fallbackFindById(id);
        }
    },

    fallbackFindById(id) {
        fallbackReports = loadFallbackReports();
        const found = fallbackReports.find(r => r.id === id || r._id === id);
        return normalizeReport(found);
    },

    find(query) {
        const builder = {
            sort() {
                return builder;
            },
            select(fields) {
                return (async () => {
                    try {
                        const { data, error } = await getSupabaseClient()
                            .from("interview_reports")
                            .select(selectFields(fields))
                            .eq("user_id", query.user)
                            .order("created_at", { ascending: false });
                        if (error) {
                            if (isTableMissing(error)) return module.exports.fallbackFindByUser(query.user);
                            throw error;
                        }
                        if (data && data.length > 0) return data.map(normalizeReport);
                        return module.exports.fallbackFindByUser(query.user);
                    } catch {
                        return module.exports.fallbackFindByUser(query.user);
                    }
                })();
            },
        };
        return builder;
    },

    fallbackFindByUser(userId) {
        fallbackReports = loadFallbackReports();
        return fallbackReports
            .filter(r => (r.user_id || r.user) === userId)
            .reverse()
            .map(normalizeReport);
    },

    async findByIdAndUpdate(id, updates) {
        try {
            const { data, error } = await getSupabaseClient()
                .from("interview_reports")
                .update(toDatabaseFields(updates))
                .eq("id", id)
                .select()
                .maybeSingle();
            if (error) {
                if (isTableMissing(error)) return this.fallbackUpdate(id, updates);
                throw error;
            }
            return normalizeReport(data);
        } catch {
            return this.fallbackUpdate(id, updates);
        }
    },

    fallbackUpdate(id, updates) {
        fallbackReports = loadFallbackReports();
        const idx = fallbackReports.findIndex(r => r.id === id || r._id === id);
        if (idx !== -1) {
            fallbackReports[idx] = {
                ...fallbackReports[idx],
                ...updates,
                updated_at: new Date().toISOString()
            };
            saveFallbackReports(fallbackReports);
            return normalizeReport(fallbackReports[idx]);
        }
        return null;
    },

    async findAll(options = {}) {
        try {
            const client = getSupabaseClient();
            let query = client
                .from("interview_reports")
                .select("id, user_id, title, match_score, job_description, created_at, updated_at")
                .order("created_at", { ascending: false });
            if (options.limit) query = query.limit(options.limit);
            const { data, error } = await query;
            if (error) {
                if (isTableMissing(error)) return this.fallbackFindAll(options);
                throw error;
            }
            if (data && data.length > 0) return data.map(normalizeReport);
            return this.fallbackFindAll(options);
        } catch {
            return this.fallbackFindAll(options);
        }
    },

    fallbackFindAll(options = {}) {
        fallbackReports = loadFallbackReports();
        let list = [...fallbackReports].reverse();
        if (options.limit) list = list.slice(0, options.limit);
        return list.map(normalizeReport);
    },

    async count() {
        try {
            const client = getSupabaseClient();
            const { count, error } = await client
                .from("interview_reports")
                .select("id", { count: "exact", head: true });
            if (error) {
                if (isTableMissing(error)) return fallbackReports.length;
                throw error;
            }
            return count || fallbackReports.length;
        } catch {
            return fallbackReports.length;
        }
    },

    async delete(id) {
        try {
            const client = getSupabaseClient();
            await client.from("interview_reports").delete().eq("id", id);
        } catch {}

        fallbackReports = loadFallbackReports().filter(r => r.id !== id && r._id !== id);
        saveFallbackReports(fallbackReports);
        return true;
    },
};