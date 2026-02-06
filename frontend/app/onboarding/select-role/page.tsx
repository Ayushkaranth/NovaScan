"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Briefcase, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const roles = [
    { id: "hr", title: "HR / Admin", desc: "Manage projects and assign teams", icon: <ShieldCheck className="w-6 h-6" /> },
    { id: "manager", title: "Project Manager", desc: "Oversee risks and engineering metrics", icon: <Briefcase className="w-6 h-6" /> },
    { id: "employee", title: "Developer", desc: "View your personal risk insights", icon: <Users className="w-6 h-6" /> },
  ];

  const handleRoleSelection = async (role: string) => {
    setLoading(role);
    try {
      // 1. Update role in Backend
      const res = await api.put("/auth/update-role", { role });
      
      // 2. Refresh the local token with the new role
      localStorage.setItem("token", res.data.access_token);
      
      // 3. Move to Dashboard
      router.push("/dashboard");
    } catch (err) {
      alert("Failed to save role. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">How will you use NovaScan?</h1>
          <p className="text-slate-500">Select your role to personalize your workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <motion.div 
              key={r.id} 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-indigo-500 shadow-xl transition-all cursor-pointer flex flex-col items-center text-center"
              onClick={() => handleRoleSelection(r.id)}
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                {r.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{r.title}</h3>
              <p className="text-sm text-slate-500 mb-8">{r.desc}</p>
              <Button 
                disabled={!!loading}
                className={r.id === 'hr' ? 'bg-slate-900' : r.id === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600'}
              >
                {loading === r.id ? <Loader2 className="animate-spin" /> : `Join as ${r.id.toUpperCase()}`}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}