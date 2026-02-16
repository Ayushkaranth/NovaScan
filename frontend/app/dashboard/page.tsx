// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { HRDashboard } from '@/components/dashboard/HRDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';

export default function Dashboard() {
  const router = useRouter();
  const [orgData, setOrgData] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/organizations/me');

      // If user is not part of an org, redirect to setup
      if (!res.data.organization) {
        router.push('/org/setup');
        return;
      }

      setOrgData(res.data);

      // If Admin, fetch extra stats
      if (res.data.role === 'admin') {
        try {
          const statsRes = await api.get('/dashboard/stats');
          setDashboardStats(statsRes.data);
        } catch (statsErr) {
          console.error("Failed to load extended stats", statsErr);
        }
      }

    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // Optional: Redirect to login if unauthorized
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // Safety check to prevent crashing if data is missing
  if (!orgData || !orgData.organization) return null;

  const { role } = orgData;

  return (
    <div className="animate-in fade-in duration-500">
      {role === 'admin' ? (
        <HRDashboard orgData={orgData} dashboardStats={dashboardStats} />
      ) : (
        <ManagerDashboard orgData={orgData} />
      )}
    </div>
  );
}