const { getSupabaseClient } = require("../config/database");

module.exports = {
    async findOne({ token }) {
        const { data, error } = await getSupabaseClient()
            .from("blacklist_tokens")
            .select("id")
            .eq("token", token)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async create({ token }) {
        const { data, error } = await getSupabaseClient()
            .from("blacklist_tokens")
            .insert({ token })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};