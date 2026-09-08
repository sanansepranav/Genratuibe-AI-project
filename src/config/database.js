const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function getSupabaseClient() {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
    const supabaseKey = serviceRoleKey && !serviceRoleKey.startsWith("your_")
        ? serviceRoleKey
        : anonKey;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Database not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables.");
    }

    if (supabaseUrl.startsWith("sb_") || supabaseUrl.startsWith("eyJ")) {
        throw new Error("SUPABASE_URL was set to an API key instead of a URL. SUPABASE_URL must be your Project URL (https://<project-ref>.supabase.co) from Supabase Dashboard > Project Settings > API.");
    }

    if (supabaseUrl.includes("your-project-ref")) {
        throw new Error("SUPABASE_URL is still a placeholder. Please set your Supabase Project URL (https://<project-ref>.supabase.co) in Vercel Environment Variables.");
    }

    if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
        supabaseUrl = `https://${supabaseUrl}`;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(supabaseUrl);
    } catch {
        throw new Error("SUPABASE_URL must be a valid URL such as https://<project-ref>.supabase.co.");
    }

    if (supabaseKey.startsWith("your_")) {
        throw new Error("Supabase API key is still a placeholder. Please set SUPABASE_ANON_KEY in Vercel Environment Variables.");
    }

    if (!cachedClient) {
        cachedClient = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return cachedClient;
}

async function connectDB() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
        throw new Error(`Supabase database check failed: ${error.message}`);
    }

    console.log("Connected to Supabase database");
    return supabase;
}

module.exports = connectDB;
module.exports.getSupabaseClient = getSupabaseClient;