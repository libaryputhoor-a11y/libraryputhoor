import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: adminCheckError } = await adminClient.rpc("is_admin", { _user_id: user.id });
    
    if (adminCheckError || !isAdmin) {
      console.error("User is not an admin:", adminCheckError);
      return new Response(
        JSON.stringify({ error: "Only admins can invite new users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email }: InviteRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Inviting user:", email);

    // Create the user invite using Supabase Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || supabaseUrl}/login`,
    });

    if (inviteError) {
      console.error("Failed to create invite:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add admin role for the invited user
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: inviteData.user.id,
      role: "admin",
    });

    if (roleError) {
      console.error("Failed to assign admin role:", roleError);
      // Don't fail the invite, just log the error
    }

    // Send custom invite email via Resend
    const appUrl = req.headers.get("origin") || "https://library.app";
    
    const emailResponse = await resend.emails.send({
      from: "A.P. Ramakrishnan Library <onboarding@resend.dev>",
      to: [email],
      subject: "You're invited to join A.P. Ramakrishnan Public Library Admin",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background: #1e40af; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 28px;">📚</span>
              </div>
              <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Admin Invitation</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You've been invited to join the <strong>A.P. Ramakrishnan Public Library</strong> admin team.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Please check your email for a confirmation link from the authentication system to set up your account.
            </p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${appUrl}/login" style="background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Go to Login
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px;">
              A.P. Ramakrishnan Public Library
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in invite-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
