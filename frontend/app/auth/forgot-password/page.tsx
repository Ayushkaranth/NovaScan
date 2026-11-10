'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'We could not process that request. Please try again.');
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
        {submitted ? (
          <div className="text-center">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">If an account exists for <span className="font-medium text-foreground">{email}</span>, we’ve sent a password reset link. It expires in 30 minutes.</p>
            <p className="mt-2 text-xs text-muted-foreground">Don’t see it? Check your spam folder or request another link.</p>
            <Button asChild variant="outline" className="mt-7 w-full"><Link href="/auth"><ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in</Link></Button>
          </div>
        ) : (
          <>
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-6 w-6" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the email address on your NovaScan account. We’ll send you a link to choose a new password.</p>
            {error && <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium">Email address</label>
                <Input id="reset-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320} disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send reset link
              </Button>
            </form>
            <Link href="/auth" className="mt-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in</Link>
          </>
        )}
      </section>
      <p className="mt-8 text-center text-xs text-muted-foreground">Your account security is important to us.</p>
    </main>
  );
}
