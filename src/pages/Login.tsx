import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { PenLine, LayoutGrid, Sparkles, WifiOff } from 'lucide-react';

const features = [
  { icon: LayoutGrid, label: 'Industry-standard formatting' },
  { icon: Sparkles, label: 'Auto-save & cloud sync' },
  { icon: WifiOff, label: 'Write offline, sync when back' },
  { icon: PenLine, label: 'Scene, character & dialogue tools' },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (isSignUp) {
      setError('Check your email to verify your account, then sign in.');
      setIsSignUp(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      setError(result.error instanceof Error ? result.error.message : 'Google sign-in failed');
      setLoading(false);
      return;
    }

    if (result.redirected) {
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center opacity-0 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <PenLine className="w-8 h-8 text-primary-foreground" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ScriptCraft</h1>
        <p className="text-muted-foreground mt-2 text-center">Professional screenwriting, simplified.</p>

        <div className="w-full mt-8 space-y-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 shadow-sm">
              <f.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-8 flex items-center justify-center gap-3 bg-card border border-border font-semibold rounded-xl py-3.5 active:scale-[0.97] transition-transform disabled:opacity-50 text-foreground"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Please wait...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email/Password */}
        <form onSubmit={handleSubmit} className="w-full mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-semibold rounded-xl py-3.5 active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>

        <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
          By continuing, you accept our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
