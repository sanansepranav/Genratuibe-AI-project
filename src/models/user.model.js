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
                    .select("id, username, email")
                    .eq("id", id)
                    .maybeSingle();
                if (error) throw error;
                return normalizeUser(data);
            },
        };
    },
};