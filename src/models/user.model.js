const { getSupabaseClient } = require("../config/database");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

// Default Administrator Account
// Username: admin
// Email: admin@interviewai.com
// Password: AdminPassword@2026
const DEFAULT_ADMIN = {
    id: "00000000-0000-0000-0000-000000000001",
    username: "admin",
    email: "admin@interviewai.com",
    password: "$2b$10$9HtgJlXVUE.3v9eT7Djh4OT4qFUIepFi7dhXI1zR2eTT.nBjvUhre",
    role: "admin",
    created_at: new Date().toISOString(),
};

const FALLBACK_FILE = path.join(os.tmpdir(), "interview_ai_users_fallback.json");

function loadFallbackUsers() {
    try {
        if (fs.existsSync(FALLBACK_FILE)) {
            const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
            if (Array.isArray(data) && data.length > 0) {
                // Ensure admin is always present
                if (!data.some(u => u.username === "admin" || u.email === "admin@interviewai.com")) {
                    data.unshift(DEFAULT_ADMIN);
                }
                return data;
            }
        }
    } catch (err) {
        console.warn("Could not read fallback users file:", err.message);
    }
    return [DEFAULT_ADMIN];
}

function saveFallbackUsers(users) {
    try {
        fs.writeFileSync(FALLBACK_FILE, JSON.stringify(users, null, 2), "utf8");
    } catch (err) {
        console.warn("Could not write fallback users file:", err.message);
    }
}

let fallbackUsers = loadFallbackUsers();

function normalizeUser(user) {
    if (!user) return null;
    return {
        ...user,
        _id: user.id,
        role: user.role || (user.username === "admin" || user.email === "admin@interviewai.com" ? "admin" : "user")
    };
}

function isTableMissingError(error) {
    if (!error) return false;
    const msg = (error.message || "").toLowerCase();
    const code = error.code || "";
    return (
        msg.includes("could not find the table") ||
        msg.includes("relation") && msg.includes("does not exist") ||
        code === "42P01" ||
        code === "PGRST204" ||
        code === "PGRST205"
    );
}

module.exports = {
    async findOne(query) {
        try {
            const client = getSupabaseClient();
            let request = client.from("users").select("*").limit(1);

            if (query.$or) {
                const [{ username }, { email }] = query.$or;
                request = request.or(`username.ilike.${username || ""},email.ilike.${email || ""}`);
            } else if (query.email) {
                request = request.ilike("email", query.email);
            } else if (query.username) {
                request = request.ilike("username", query.username);
            }

            const { data, error } = await request.maybeSingle();
            if (error) {
                if (isTableMissingError(error)) {
                    // Fall back to local persistent store
                    return this.fallbackFindOne(query);
                }
                throw error;
            }

            if (data) {
                return normalizeUser(data);
            }

            // If Supabase table exists but has no admin yet and query is for admin:
            if (query.username === "admin" || query.email === "admin@interviewai.com") {
                return this.fallbackFindOne(query);
            }

            return null;
        } catch (err) {
            if (isTableMissingError(err) || (err.message && err.message.includes("Database not configured"))) {
                return this.fallbackFindOne(query);
            }
            throw err;
        }
    },

    fallbackFindOne(query) {
        fallbackUsers = loadFallbackUsers();
        let match = null;

        if (query.$or) {
            const [{ username }, { email }] = query.$or;
            match = fallbackUsers.find((u) =>
                (username && u.username && u.username.toLowerCase() === username.toLowerCase()) ||
                (email && u.email && u.email.toLowerCase() === email.toLowerCase())
            );
        } else if (query.email) {
            match = fallbackUsers.find((u) => u.email && u.email.toLowerCase() === query.email.toLowerCase());
        } else if (query.username) {
            match = fallbackUsers.find((u) => u.username && u.username.toLowerCase() === query.username.toLowerCase());
        }

        return normalizeUser(match);
    },

    async create(user) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from("users")
                .insert(user)
                .select()
                .single();

            if (error) {
                if (isTableMissingError(error)) {
                    return this.fallbackCreate(user);
                }
                if (error.code === "23505") {
                    const isEmail = (error.message || "").toLowerCase().includes("email") || (error.details || "").toLowerCase().includes("email");
                    throw new Error(isEmail ? "An account with this email already exists." : "An account with this username or email already exists.");
                }
                throw error;
            }

            return normalizeUser(data);
        } catch (err) {
            if (isTableMissingError(err) || (err.message && err.message.includes("Database not configured"))) {
                return this.fallbackCreate(user);
            }
            throw err;
        }
    },

    fallbackCreate(user) {
        fallbackUsers = loadFallbackUsers();
        const existing = fallbackUsers.find((u) =>
            u.username.toLowerCase() === (user.username || "").toLowerCase() ||
            u.email.toLowerCase() === (user.email || "").toLowerCase()
        );

        if (existing) {
            const isEmail = existing.email.toLowerCase() === (user.email || "").toLowerCase();
            throw new Error(isEmail ? "An account with this email already exists." : "This username is already taken.");
        }

        const newUser = {
            id: crypto.randomUUID(),
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role || "user",
            created_at: new Date().toISOString(),
        };

        fallbackUsers.push(newUser);
        saveFallbackUsers(fallbackUsers);
        return normalizeUser(newUser);
    },

    findById(id) {
        return {
            async select() {
                try {
                    const client = getSupabaseClient();
                    const { data, error } = await client
                        .from("users")
                        .select("id, username, email, role, created_at")
                        .eq("id", id)
                        .maybeSingle();

                    if (error) {
                        if (isTableMissingError(error)) {
                            return module.exports.fallbackFindById(id);
                        }
                        throw error;
                    }

                    if (data) return normalizeUser(data);
                    return module.exports.fallbackFindById(id);
                } catch (err) {
                    return module.exports.fallbackFindById(id);
                }
            },
        };
    },

    fallbackFindById(id) {
        fallbackUsers = loadFallbackUsers();
        const user = fallbackUsers.find((u) => u.id === id);
        return normalizeUser(user);
    },

    async find(options = {}) {
        try {
            const client = getSupabaseClient();
            let query = client.from("users").select("id, username, email, role, created_at").order("created_at", { ascending: false });
            if (options.limit) query = query.limit(options.limit);
            const { data, error } = await query;

            if (error) {
                if (isTableMissingError(error)) return this.fallbackFind(options);
                throw error;
            }

            if (!data || data.length === 0) return this.fallbackFind(options);
            return data.map(normalizeUser);
        } catch (err) {
            return this.fallbackFind(options);
        }
    },

    fallbackFind(options = {}) {
        fallbackUsers = loadFallbackUsers();
        let list = [...fallbackUsers].reverse();
        if (options.limit) list = list.slice(0, options.limit);
        return list.map(normalizeUser);
    },

    async count() {
        try {
            const client = getSupabaseClient();
            const { count, error } = await client
                .from("users")
                .select("id", { count: "exact", head: true });
            if (error) {
                if (isTableMissingError(error)) return fallbackUsers.length;
                throw error;
            }
            return count || fallbackUsers.length;
        } catch (err) {
            return fallbackUsers.length;
        }
    },

    async update(id, updates) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from("users")
                .update(updates)
                .eq("id", id)
                .select("id, username, email, role, created_at")
                .single();

            if (error) {
                if (isTableMissingError(error)) return this.fallbackUpdate(id, updates);
                throw error;
            }
            return normalizeUser(data);
        } catch (err) {
            return this.fallbackUpdate(id, updates);
        }
    },

    fallbackUpdate(id, updates) {
        fallbackUsers = loadFallbackUsers();
        const idx = fallbackUsers.findIndex((u) => u.id === id);
        if (idx !== -1) {
            fallbackUsers[idx] = { ...fallbackUsers[idx], ...updates };
            saveFallbackUsers(fallbackUsers);
            return normalizeUser(fallbackUsers[idx]);
        }
        return null;
    },

    async delete(id) {
        try {
            const client = getSupabaseClient();
            const { error } = await client
                .from("users")
                .delete()
                .eq("id", id);
            if (error && !isTableMissingError(error)) throw error;
        } catch {}

        fallbackUsers = loadFallbackUsers().filter((u) => u.id !== id);
        saveFallbackUsers(fallbackUsers);
        return true;
    },
};