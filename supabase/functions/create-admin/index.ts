import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
};

// Simple in-memory rate limiting (resets on function restart)
// In production, consider using Redis or a database for persistent rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }
  
  entry.count++;
  return false;
}

function getClientIdentifier(req: Request): string {
  // Use X-Forwarded-For header or fall back to a generic identifier
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown-client';
}

// Generate a cryptographically secure random password
function generateSecurePassword(length = 20): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (byte) => charset[byte % charset.length]).join("");
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request received for create-admin.");
    return new Response("ok", { headers: corsHeaders });
  }

  const clientId = getClientIdentifier(req);

  try {
    console.log("Received request for create-admin from:", clientId);
    
    // Check rate limit BEFORE validating token to prevent timing attacks
    if (isRateLimited(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again later." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Verify setup token for security
    const setupToken = req.headers.get("X-Setup-Token");
    const expectedToken = Deno.env.get("ADMIN_SETUP_TOKEN");
    
    if (!expectedToken) {
      console.error("ADMIN_SETUP_TOKEN environment variable is not set.");
      return new Response(
        JSON.stringify({ error: "Configuration error: ADMIN_SETUP_TOKEN is not set." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Use constant-time comparison to prevent timing attacks
    const tokenBuffer = new TextEncoder().encode(setupToken || '');
    const expectedBuffer = new TextEncoder().encode(expectedToken);
    
    let tokensMatch = tokenBuffer.length === expectedBuffer.length;
    for (let i = 0; i < Math.max(tokenBuffer.length, expectedBuffer.length); i++) {
      if ((tokenBuffer[i] || 0) !== (expectedBuffer[i] || 0)) {
        tokensMatch = false;
      }
    }

    if (!tokensMatch) {
      console.warn(`Unauthorized admin creation attempt from: ${clientId}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Valid setup token required." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }
    console.log("Setup token validated successfully.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) in Edge Function.");
      return new Response(
        JSON.stringify({ error: "Configuration error: Supabase URL or Service Role Key not found." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    console.log("Supabase environment variables found.");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if admin already exists
    console.log("Checking for existing admin user role...");
    const { data: existingAdmin, error: existingAdminError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (existingAdminError) {
      console.error("Error checking for existing admin role:", existingAdminError.message);
      throw existingAdminError;
    }

    if (existingAdmin) {
      console.log("Admin role already exists for user:", existingAdmin.user_id);
      return new Response(
        JSON.stringify({ 
          message: "Admin user already exists. Use password reset if you need to recover access.",
          exists: true
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    console.log("No existing admin role found. Proceeding to create new admin.");

    // Parse request body for email (password will be generated)
    let adminEmail = "admin@rotasmart.com";
    try {
      const body = await req.json();
      if (body.email && isValidEmail(body.email)) {
        adminEmail = body.email.trim().toLowerCase();
      }
    } catch {
      // Use default email if no body provided
    }

    // Generate a secure random password
    const generatedPassword = generateSecurePassword(24);

    // Create admin user
    console.log("Attempting to create admin user in Supabase Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Administrador",
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError.message);
      throw authError;
    }
    console.log("Admin user created in auth with ID:", authData.user.id);

    // Wait for trigger to complete (profile, user role, credits creation)
    console.log("Waiting for auth trigger to complete...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add admin role (in addition to user role created by trigger)
    console.log("Attempting to add 'admin' role to the new user...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "admin",
      });

    if (roleError) {
      console.error("Error adding admin role:", roleError.message);
      // If role already exists, that's okay
      if (!roleError.message.includes("duplicate") && !roleError.code?.includes("23505")) {
        throw roleError;
      }
    }
    console.log("Admin role added successfully for user:", authData.user.id);

    // IMPORTANT: Password is returned ONLY on initial creation
    // User should immediately change this password after first login
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Admin user created successfully",
        email: adminEmail,
        temporaryPassword: generatedPassword,
        warning: "⚠️ This password is shown ONLY ONCE. Save it immediately and change it after first login!"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Unhandled error in create-admin function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
