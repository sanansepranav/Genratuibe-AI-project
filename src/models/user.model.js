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

const PROJECT_DATA_DIR = path.join(__dirname, "../../data");
const PERSISTENT_FILE = path.join(PROJECT_DATA_DIR, "users_fallback.json");
const TMP_FILE = path.join(os.tmpdir(), "interview_ai_users_fallback.json");

function getStorageFile() {
    try {
        if (!fs.existsSync(PROJECT_DATA_DIR)) {
            fs.mkdirSync(PROJECT_DATA_DIR, { recursive: true });
        }
        return PERSISTENT_FILE;
    } catch {
        return TMP_FILE;
    }
}

function loadFallbackUsers() {
    const file = getStorageFile();
    try {
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            if (Array.isArray(data) && data.length > 0) {
                const hasAdmin = data.some(u => u.role === "admin" || u.username === "admin" || (u.email && u.email.startsWith("admin@")));
                if (!hasAdmin) {
                    data.unshift(DEFAULT_ADMIN);
                }
                return data;
            }
        } else if (fs.existsSync(TMP_FILE)) {
            const data = JSON.parse(fs.readFileSync(TMP_FILE, "utf8"));
            if (Array.isArray(data) && data.length > 0) {
                saveFallbackUsers(data);
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
        const file = getStorageFile();
        fs.writeFileSync(file, JSON.stringify(users, null, 2), "utf8");
    } catch (err) {
        try {
            fs.writeFileSync(TMP_FILE, JSON.stringify(users, null, 2), "utf8");
        } catch {}
    }
}

let fallbackUsers = loadFallbackUsers();

function extractOrConditions(queryOr) {
    let targetUsername = "";
    let targetEmail = "";
    if (Array.isArray(queryOr)) {
        for (const item of queryOr) {
            if (item && item.username) targetUsername = item.username;
            if (item && item.email) targetEmail = item.email;
        }
    }
    return { targetUsername, targetEmail };
}

function normalizeUser(user) {
    if (!user) return null;
    return {
        ...user,
        _id: user.id,
        role: user.role || (user.username === "admin" || (user.email && user.email.startsWith("admin@")) ? "admin" : "user")
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
                const { targetUsername, targetEmail } = extractOrConditions(query.$or);
                const orParts = [];
                if (targetUsername) orParts.push(`username.ilike.${targetUsername}`);
                if (targetEmail) orParts.push(`email.ilike.${targetEmail}`);
                if (orParts.length > 0) {
                    request = request.or(orParts.join(","));
                }
            } else if (query.email) {
                request = request.ilike("email", query.email);
            } else if (query.username) {
                request = request.ilike("username", query.username);
            }

            const { data, error } = await request.maybeSingle();
            if (error) {
                if (isTableMissingError(error)) {
                    return this.fallbackFindOne(query);
                }
                throw error;
            }

            if (data) {
                return normalizeUser(data);
            }

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
            const { targetUsername, targetEmail } = extractOrConditions(query.$or);
            match = fallbackUsers.find((u) => {
                const uName = (u.username || "").toLowerCase();
                const uEmail = (u.email || "").toLowerCase();
                const matchU = targetUsername && uName === targetUsername.toLowerCase();
                const matchE = targetEmail && uEmail === targetEmail.toLowerCase();
                return matchU || matchE;
            });
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
            // If existing is the placeholder DEFAULT_ADMIN, allow user to claim it
            if (
                existing.username.toLowerCase() === "admin" &&
                existing.email.toLowerCase() === "admin@interviewai.com"
            ) {
                existing.username = user.username || "admin";
                existing.email = user.email;
                existing.password = user.password;
                existing.role = "admin";
                saveFallbackUsers(fallbackUsers);
                return normalizeUser(existing);
            }

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