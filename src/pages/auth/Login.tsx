import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Library, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const lockoutTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Cleanup lockout timer on unmount
  useEffect(() => {
    return () => {
      if (lockoutTimer.current) {
        clearTimeout(lockoutTimer.current);
      }
    };
  }, []);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && !adminLoading) {
      if (isAdmin) {
        navigate("/admin/dashboard");
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is locked
    if (isLocked) {
      const remainingTime = lockoutEndTime ? Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60) : 5;
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const endTime = Date.now() + LOCKOUT_DURATION_MS;
        setIsLocked(true);
        setLockoutEndTime(endTime);
        
        lockoutTimer.current = setTimeout(() => {
          setIsLocked(false);
          setFailedAttempts(0);
          setLockoutEndTime(null);
        }, LOCKOUT_DURATION_MS);

        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Please try again in 5 minutes.",
          variant: "destructive",
        });
      } else {
        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newAttempts;
        let errorMessage = "Invalid email or password.";
        if (attemptsRemaining <= 2) {
          errorMessage += ` ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`;
        }
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      // Reset failed attempts on successful login
      setFailedAttempts(0);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      // The useEffect will handle redirect once isAdmin is confirmed
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Library className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>
            A.P. Ramakrishnan Public Library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@library.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 touch-target"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Library
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
