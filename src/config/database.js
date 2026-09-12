const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function isSupabaseConfigured() {
    const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
    const supabaseKey = serviceRoleKey && !serviceRoleKey.startsWith("your_")
        ? serviceRoleKey
        : anonKey;

    if (!supabaseUrl || !supabaseKey) return false;
    if (supabaseUrl.includes("your-project-ref") || supabaseKey.startsWith("your_")) return false;
    if (supabaseUrl.startsWith("sb_") || supabaseUrl.startsWith("eyJ")) return false;

    try {
        new URL(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`);
        return true;
    } catch {
        return false;
    }
}

function getSupabaseClient() {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
    const supabaseKey = serviceRoleKey && !serviceRoleKey.startsWith("your_")
        ? serviceRoleKey
        : anonKey;

    if (!isSupabaseConfigured()) {
        throw new Error("Database not configured. Supabase credentials are missing or placeholder. Using fallback store.");
    }

    if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
        supabaseUrl = `https://${supabaseUrl}`;
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
    if (!isSupabaseConfigured()) {
        console.log("ℹ️  Supabase URL/Key is not configured or using placeholders. Running with local persistent fallback store.");
        return null;
    }

    try {
        const supabase = getSupabaseClient();
        // Use Promise.race with a 4-second timeout to prevent hanging on unreachable hosts
        const checkPromise = supabase.from("users").select("id").limit(1);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Supabase connection timed out after 4 seconds")), 4000)
        );

        const { error } = await Promise.race([checkPromise, timeoutPromise]);

        if (error) {
            console.warn(`⚠️  Supabase database check failed: ${error.message}. Running with local persistent fallback store.`);
            return null;
        }

        console.log("Connected to Supabase database");
        return supabase;
    } catch (err) {
        console.warn(`⚠️  Supabase connection issue: ${err.message}. Running with local persistent fallback store.`);
        return null;
    }
}

module.exports = connectDB;
module.exports.getSupabaseClient = getSupabaseClient;
module.exports.isSupabaseConfigured = isSupabaseConfigured;