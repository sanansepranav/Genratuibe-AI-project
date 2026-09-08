const { createClient } = require("@supabase/supabase-js");

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseKey = serviceRoleKey && !serviceRoleKey.startsWith("your_")
        ? serviceRoleKey
        : anonKey;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
    }

    if (supabaseUrl.includes("your-project-ref")) {
        throw new Error("SUPABASE_URL is still a placeholder. Copy the Project URL from Supabase Dashboard > Settings > API.");
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(supabaseUrl);
    } catch {
        throw new Error("SUPABASE_URL must be a valid URL such as https://your-project-ref.supabase.co.");
    }

    if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co") || parsedUrl.hostname.startsWith("sb_")) {
        throw new Error("SUPABASE_URL must be your Supabase project URL, for example https://your-project.supabase.co.");
    }

    if (supabaseKey.startsWith("your_")) {
        throw new Error("Supabase key is still a placeholder. Set SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
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