'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is missing its token. Request a new link and try again.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setComplete(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'This reset link is invalid or expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Link href="/auth" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20"><Activity className="h-5 w-5 text-primary-foreground" /></span>
        <span className="text-2xl font-bold">NovaScan</span>
      </Link>

      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl sm:p-10">
        {complete ? (
          <div className="text-center">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Your new password is ready. Sign in to continue to NovaScan.</p>
            <Button asChild className="mt-7 w-full"><Link href="/auth">Back to sign in</Link></Button>
          </div>
        ) : (
          <>
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="h-6 w-6" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Use at least 8 characters. Your reset link can only be used once.</p>
            {error && <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">New password</label>
                <Input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirm new password</label>
                <Input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={loading} />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((shown) => !shown)}>
                {showPassword ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </Button>
              <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Reset password
              </Button>
            </form>
            <Link href="/auth/forgot-password" className="mt-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Request another link</Link>
          </>
        )}
      </section>
      <p className="mt-8 text-center text-xs text-muted-foreground">Reset links expire after 30 minutes.</p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></main>}><ResetPasswordForm /></Suspense>;
}
