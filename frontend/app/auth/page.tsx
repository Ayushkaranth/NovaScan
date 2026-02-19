"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // ... (logic remains same)
    setLoading(true);
    try {
      const res = await api.post("/auth/google-login", {
        token: credentialResponse.credential
      });

      localStorage.setItem("token", res.data.access_token);

      if (res.data.is_new_user) {
        toast({ title: "Welcome!", description: "Please select your professional role." });
        router.push("/onboarding/select-role");
      } else {
        toast({ title: "Welcome Back", description: "Redirecting to dashboard..." });
        router.push("/dashboard");
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Auth Failed", description: "Google login rejected." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

      {/* Absolute Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-2xl text-foreground">NovaScan</span>
      </div>

      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          {/* Tab Selection */}
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Log In
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Content */}
          <TabsContent value="login">
            <div className="bg-card rounded-3xl border border-border p-10 shadow-2xl text-center">
              <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2 text-foreground">Welcome Back</h1>
              <p className="text-muted-foreground text-sm mb-8">Securely sign in to your workspace</p>

              <div className="flex justify-center flex-col items-center gap-4">
                {loading ? (
                  <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
                    theme="filled_blue"
                    shape="pill"
                    text="signin_with"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Register Content */}
          <TabsContent value="register">
            <div className="bg-card rounded-3xl border border-border p-10 shadow-2xl text-center">
              <UserPlus className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2 text-foreground">Create Account</h1>
              <p className="text-muted-foreground text-sm mb-8">Join NovaScan with your work Google account</p>

              <div className="flex justify-center flex-col items-center gap-4">
                {loading ? (
                  <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Registration Failed')}
                    theme="outline"
                    shape="pill"
                    text="signup_with"
                  />
                )}
              </div>
              <p className="mt-6 text-[11px] text-muted-foreground">
                By signing up, you agree to our Terms of Service.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Protected by Google Identity Services
        </p>
      </div>
    </div>
  );
}