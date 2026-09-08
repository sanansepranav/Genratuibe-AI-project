const { getSupabaseClient } = require("../config/database");

const inMemoryBlacklist = new Set();

module.exports = {
    async findOne({ token }) {
        try {
            const { data, error } = await getSupabaseClient()
                .from("blacklist_tokens")
                .select("id")
                .eq("token", token)
                .maybeSingle();
            if (error) {
                return inMemoryBlacklist.has(token) ? { id: 1, token } : null;
            }
            return data;
        } catch {
            return inMemoryBlacklist.has(token) ? { id: 1, token } : null;
        }
    },

    async create({ token }) {
        inMemoryBlacklist.add(token);
        try {
            const { data, error } = await getSupabaseClient()
                .from("blacklist_tokens")
                .insert({ token })
                .select()
                .single();
            if (error) return { id: Date.now(), token };
            return data;
        } catch {
            return { id: Date.now(), token };
        }
    },
};