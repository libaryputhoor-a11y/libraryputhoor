import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc("is_admin", {
      _user_id: user.id,
    });

    if (!isAdmin) {
      throw new Error("Only admins can invite users");
    }

    const { email }: InviteRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Use service role to invite the user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate invite link using Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || Deno.env.get("SUPABASE_URL")}/login`,
    });

    if (inviteError) {
      console.error("Supabase invite error:", inviteError);
      throw new Error(inviteError.message);
    }

    console.log("User invited successfully:", email);

    // Send a custom welcome email via Resend
    const emailResponse = await resend.emails.send({
      from: "A.P. Ramakrishnan Library <onboarding@resend.dev>",
      to: [email],
      subject: "You've been invited as a Library Admin!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e40af;">Welcome to A.P. Ramakrishnan Public Library</h1>
          <p>You've been invited to join as an administrator.</p>
          <p>Please check your email for the login link from Supabase Auth to set up your password and access the admin portal.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    // Add the user to user_roles as admin once they confirm
    // Note: This will be handled when the user confirms their email

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        userId: inviteData.user?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
