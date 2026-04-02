import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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

        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
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
