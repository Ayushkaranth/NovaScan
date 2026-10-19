"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all fields." });
      return;
    }
    setLoginLoading(true);
    try {
      const res = await api.post("/auth/login", { email: loginEmail, password: loginPassword });
      localStorage.setItem("token", res.data.access_token);
      if (res.data.is_new_user) {
        toast({ title: "Welcome!", description: "Please select your professional role." });
        router.push("/onboarding/select-role");
      } else {
        toast({ title: "Welcome Back", description: "Redirecting to dashboard..." });
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Login failed. Please check your credentials.";
      toast({ variant: "destructive", title: "Login Failed", description: msg });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Full name is required." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid email address." });
      return;
    }
    if (regPassword.length < 8) {
      toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 8 characters." });
      return;
    }
    if (regPassword !== regConfirm) {
      toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
      return;
    }
    setRegLoading(true);
    try {
      const res = await api.post("/auth/register", { email: regEmail, password: regPassword, full_name: regName });
      localStorage.setItem("token", res.data.access_token);
      toast({ title: "Account Created!", description: "Please select your professional role." });
      router.push("/onboarding/select-role");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Registration failed. Please try again.";
      toast({ variant: "destructive", title: "Registration Failed", description: msg });
    } finally {
      setRegLoading(false);
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

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleEmailLogin} className="flex flex-col gap-3 text-left">
                <Input
                  type="email"
                  placeholder="Work email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loginLoading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                />
                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loginLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  Sign In with Email
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Register Content */}
          <TabsContent value="register">
            <div className="bg-card rounded-3xl border border-border p-10 shadow-2xl text-center">
              <UserPlus className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2 text-foreground">Create Account</h1>
              <p className="text-muted-foreground text-sm mb-8">Join NovaScan with your work Google account or email</p>

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

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleEmailRegister} className="flex flex-col gap-3 text-left">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  disabled={regLoading}
                />
                <Input
                  type="email"
                  placeholder="Work email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  disabled={regLoading}
                />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={regLoading}
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  disabled={regLoading}
                />
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {regLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  Create Account
                </button>
              </form>

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
