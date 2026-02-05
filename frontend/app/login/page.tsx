// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast"; // Correct path
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Activity, Loader2, Lock, Mail } from "lucide-react";

// export default function AuthPage() {
//   const router = useRouter();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);

//   // Login State
//   const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  
//   // Register State
//   const [registerForm, setRegisterForm] = useState({ email: "", password: "" });

//   // --- LOGIN LOGIC ---
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
//       toast({ title: "Welcome back!", description: "Access granted." });
//       router.push("/dashboard"); 

//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Login Failed",
//         description: "Invalid email or password.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- REGISTER LOGIC ---
//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await api.post("/auth/register", registerForm);
//       toast({
//         title: "Account created!",
//         description: "Please log in with your new credentials.",
//       });
//       // Switch to login tab automatically? 
//       // For now, user can just click the tab, or we can force reload.
//       // Let's just clear the form or show success.
//       setRegisterForm({ email: "", password: "" });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Registration Failed",
//         description: error.response?.data?.detail || "Something went wrong.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      
//       {/* --- BACKGROUND DECORATION --- */}
//       <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

//       {/* --- LOGO --- */}
//       <div className="mb-8 flex items-center gap-2 relative z-10">
//         <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/20">
//           <Activity className="w-5 h-5 text-white" />
//         </div>
//         <span className="font-bold text-2xl text-slate-900 tracking-tight">Loop AI</span>
//       </div>

//       {/* --- AUTH CARD --- */}
//       <div className="w-full max-w-md relative z-10">
//         <Tabs defaultValue="login" className="w-full">
          
//           <TabsList className="grid w-full grid-cols-2 mb-4 h-12 bg-slate-200/50 p-1 rounded-xl">
//             <TabsTrigger 
//               value="login" 
//               className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-medium transition-all"
//             >
//               Log In
//             </TabsTrigger>
//             <TabsTrigger 
//               value="register"
//               className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-medium transition-all"
//             >
//               Sign Up
//             </TabsTrigger>
//           </TabsList>

//           {/* --- LOGIN TAB --- */}
//           <TabsContent value="login">
//             <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
//               <div className="text-center mb-8">
//                 <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
//                 <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the console.</p>
//               </div>

//               <form onSubmit={handleLogin} className="space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
//                     <Input 
//                       type="email" 
//                       placeholder="you@company.com" 
//                       required
//                       className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                       value={loginForm.username}
//                       onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
//                     <span className="text-xs text-indigo-600 hover:underline cursor-pointer">Forgot?</span>
//                   </div>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
//                     <Input 
//                       type="password" 
//                       placeholder="••••••••" 
//                       required
//                       className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                       value={loginForm.password}
//                       onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
//                     />
//                   </div>
//                 </div>

//                 <Button 
//                   type="submit" 
//                   className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl mt-4 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all"
//                   disabled={loading}
//                 >
//                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log in"}
//                 </Button>
//               </form>
//             </div>
//           </TabsContent>

//           {/* --- REGISTER TAB --- */}
//           <TabsContent value="register">
//             <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
//               <div className="text-center mb-8">
//                 <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
//                 <p className="text-slate-500 text-sm mt-1">Start monitoring risks in seconds.</p>
//               </div>

//               <form onSubmit={handleRegister} className="space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Email</label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
//                     <Input 
//                       type="email" 
//                       placeholder="you@company.com" 
//                       required
//                       className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                       value={registerForm.email}
//                       onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose Password</label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
//                     <Input 
//                       type="password" 
//                       placeholder="Min. 8 characters" 
//                       required
//                       className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                       value={registerForm.password}
//                       onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
//                     />
//                   </div>
//                 </div>

//                 <Button 
//                   type="submit" 
//                   className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl mt-4 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
//                   disabled={loading}
//                 >
//                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
//                 </Button>
//               </form>
//             </div>
//           </TabsContent>

//         </Tabs>
//       </div>
      
//       <p className="mt-8 text-xs text-slate-400">© 2026 Loop AI Inc.</p>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Loader2, Lock, Mail, Users } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    email: "", 
    password: "", 
    role: "employee" // Default role
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", loginForm.username);
      formData.append("password", loginForm.password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("token", response.data.access_token);
      toast({ title: "Access Granted", description: "Directing to dashboard..." });
      router.push("/dashboard"); 
    } catch (error) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials." });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", registerForm);
      toast({ title: "Account created!", description: "Please log in with your new role." });
      setRegisterForm({ email: "", password: "", role: "employee" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.response?.data?.detail || "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg"><Activity className="w-5 h-5 text-white" /></div>
        <span className="font-bold text-2xl text-slate-900">NovaScan</span>
      </div>

      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-12 bg-slate-200/50 p-1 rounded-xl">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="bg-white rounded-2xl border p-8 shadow-xl">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <Input type="email" placeholder="you@company.com" required onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  <Input type="password" placeholder="••••••••" required onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-slate-900 text-white" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Log in"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="bg-white rounded-2xl border p-8 shadow-xl">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Work Email</label>
                  <Input type="email" placeholder="you@company.com" required onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select 
                    className="w-full border rounded-lg p-2 text-sm bg-slate-50"
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                  >
                    <option value="employee">Employee (Developer)</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR (Admin)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  <Input type="password" placeholder="Min 8 characters" required onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 text-white" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}