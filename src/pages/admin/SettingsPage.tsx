import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

const SettingsPage = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = emailSchema.safeParse(inviteEmail);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email: inviteEmail },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation Sent!",
        description: `An invitation email has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
    } catch (error: any) {
      console.error("Invite error:", error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Admin
          </CardTitle>
          <CardDescription>
            Send an invitation email to add a new administrator to the library system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="newadmin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !inviteEmail}
                  className="h-12 px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The invited person will receive an email with instructions to set up their account.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
