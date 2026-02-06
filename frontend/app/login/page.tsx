// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Activity, Loader2, Lock, Mail, Users } from "lucide-react";

// export default function AuthPage() {
//   const router = useRouter();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);

//   const [loginForm, setLoginForm] = useState({ username: "", password: "" });
//   const [registerForm, setRegisterForm] = useState({ 
//     email: "", 
//     password: "", 
//     role: "employee" // Default role
//   });

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("username", loginForm.username);
//       formData.append("password", loginForm.password);

//       const response = await api.post("/auth/login", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       localStorage.setItem("token", response.data.access_token);
//       toast({ title: "Access Granted", description: "Directing to dashboard..." });
//       router.push("/dashboard"); 
//     } catch (error) {
//       toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await api.post("/auth/register", registerForm);
//       toast({ title: "Account created!", description: "Please log in with your new role." });
//       setRegisterForm({ email: "", password: "", role: "employee" });
//     } catch (error: any) {
//       toast({ variant: "destructive", title: "Failed", description: error.response?.data?.detail || "Error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
//       <div className="mb-8 flex items-center gap-2">
//         <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg"><Activity className="w-5 h-5 text-white" /></div>
//         <span className="font-bold text-2xl text-slate-900">NovaScan</span>
//       </div>

//       <div className="w-full max-w-md">
//         <Tabs defaultValue="login" className="w-full">
//           <TabsList className="grid w-full grid-cols-2 mb-4 h-12 bg-slate-200/50 p-1 rounded-xl">
//             <TabsTrigger value="login">Log In</TabsTrigger>
//             <TabsTrigger value="register">Sign Up</TabsTrigger>
//           </TabsList>

//           <TabsContent value="login">
//             <div className="bg-white rounded-2xl border p-8 shadow-xl">
//               <form onSubmit={handleLogin} className="space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
//                   <Input type="email" placeholder="you@company.com" required onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
//                   <Input type="password" placeholder="••••••••" required onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
//                 </div>
//                 <Button type="submit" className="w-full bg-slate-900 text-white" disabled={loading}>
//                   {loading ? <Loader2 className="animate-spin" /> : "Log in"}
//                 </Button>
//               </form>
//             </div>
//           </TabsContent>

//           <TabsContent value="register">
//             <div className="bg-white rounded-2xl border p-8 shadow-xl">
//               <form onSubmit={handleRegister} className="space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase">Work Email</label>
//                   <Input type="email" placeholder="you@company.com" required onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
//                   <select 
//                     className="w-full border rounded-lg p-2 text-sm bg-slate-50"
//                     value={registerForm.role}
//                     onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
//                   >
//                     <option value="employee">Employee (Developer)</option>
//                     <option value="manager">Manager</option>
//                     <option value="hr">HR (Admin)</option>
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
//                   <Input type="password" placeholder="Min 8 characters" required onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} />
//                 </div>
//                 <Button type="submit" className="w-full bg-indigo-600 text-white" disabled={loading}>
//                   {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
//                 </Button>
//               </form>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }




"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google-login", { 
        token: credentialResponse.credential 
      });

      localStorage.setItem("token", res.data.access_token);

      if (res.data.is_new_user) {
        toast({ title: "Welcome!", description: "Please select your professional role." });
        router.push("/onboarding/select-role"); // NEW PAGE
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-2xl text-slate-900">NovaScan</span>
      </div>

      <div className="bg-white rounded-3xl border p-10 shadow-2xl w-full max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">Secure Engineering Intelligence</h1>
        <p className="text-slate-500 text-sm mb-8">Sign in with your work account to continue</p>
        
        <div className="flex justify-center flex-col items-center gap-4">
          {loading ? (
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          ) : (
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => console.log('Login Failed')}
              useOneTap={false}
              theme="filled_blue"
              shape="pill"
            />
          )}
        </div>
        
        <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Protected by Google Identity Services
        </p>
      </div>
    </div>
  );
}