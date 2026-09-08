const { getSupabaseClient } = require("../config/database");

function normalizeUser(user) {
    return user ? { ...user, _id: user.id } : null;
}

module.exports = {
    async findOne(query) {
        const client = getSupabaseClient();
        let request = client.from("users").select("*").limit(1);

        if (query.$or) {
            const [{ username }, { email }] = query.$or;
            request = request.or(`username.eq.${username},email.eq.${email}`);
        } else if (query.email) {
            request = request.eq("email", query.email);
        }

        const { data, error } = await request.maybeSingle();
        if (error) throw error;
        return normalizeUser(data);
    },

    async create(user) {
        const { data, error } = await getSupabaseClient()
            .from("users")
            .insert(user)
            .select()
            .single();
        if (error) {
            if (error.code === "23505") {
                const isEmail = (error.message || "").toLowerCase().includes("email") || (error.details || "").toLowerCase().includes("email");
                throw new Error(isEmail ? "An account with this email already exists." : "An account with this username or email already exists.");
            }
            throw error;
        }
        return normalizeUser(data);
    },

    findById(id) {
        return {
            async select() {
                const { data, error } = await getSupabaseClient()
                    .from("users")
                    .select("id, username, email, role, created_at")
                    .eq("id", id)
                    .maybeSingle();
                if (error) throw error;
                return normalizeUser(data);
            },
        };
    },

    async find(options = {}) {
        const client = getSupabaseClient();
        let query = client.from("users").select("id, username, email, role, created_at").order("created_at", { ascending: false });
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(normalizeUser);
    },

    async count() {
        const client = getSupabaseClient();
        const { count, error } = await client
            .from("users")
            .select("id", { count: "exact", head: true });
        if (error) throw error;
        return count || 0;
    },

    async update(id, updates) {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from("users")
            .update(updates)
            .eq("id", id)
            .select("id, username, email, role, created_at")
            .single();
        if (error) throw error;
        return normalizeUser(data);
    },

    async delete(id) {
        const client = getSupabaseClient();
        const { error } = await client
            .from("users")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    },
};