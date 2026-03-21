import { useNavigate } from 'react-router-dom';
import { setLoggedIn } from '@/lib/storage';
import { PenLine, LayoutGrid, Sparkles } from 'lucide-react';

const features = [
  { icon: LayoutGrid, label: 'Industry-standard formatting' },
  { icon: Sparkles, label: 'Auto-save & cloud sync' },
  { icon: PenLine, label: 'Scene, character & dialogue tools' },
];

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    setLoggedIn(true);
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

        <button
          onClick={handleLogin}
          className="w-full mt-8 flex items-center justify-center gap-3 bg-foreground text-background font-semibold rounded-xl py-3.5 active:scale-[0.97] transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
          By continuing, you accept our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
