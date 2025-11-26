import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request received for create-admin.");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Received request for create-admin.");
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

    if (setupToken !== expectedToken) {
      console.warn("Unauthorized admin creation attempt: Invalid setup token provided.");
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
          message: "Admin user already exists",
          email: "admin@deliveryflow.com",
          password: "admin@123",
          note: "Use these credentials to login"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    console.log("No existing admin role found. Proceeding to create new admin.");

    // Create admin user
    console.log("Attempting to create admin user in Supabase Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@deliveryflow.com",
      password: "admin@123",
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

    // Add admin role
    console.log("Attempting to add 'admin' role to the new user...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "admin",
      });

    if (roleError && !roleError.message.includes("duplicate")) { // Check for duplicate error specifically
      console.error("Error adding admin role:", roleError.message);
      throw roleError;
    }
    console.log("Admin role added successfully for user:", authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Admin user created successfully",
        credentials: {
          email: "admin@deliveryflow.com",
          password: "admin@123"
        },
        warning: "⚠️ CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!"
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