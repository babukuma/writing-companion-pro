import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScripts, createScript, deleteScript, setLoggedIn } from '@/lib/storage';
import { Script } from '@/lib/types';
import { Plus, LogOut, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    setScripts(getScripts());
  }, []);

  const handleNew = () => {
    const title = prompt('Project name:');
    if (!title?.trim()) return;
    const script = createScript(title.trim());
    navigate(`/editor/${script.id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this script?')) return;
    deleteScript(id);
    setScripts(getScripts());
  };

  const handleLogout = () => {
    setLoggedIn(false);
    navigate('/');
  };

  const countPages = (s: Script) => Math.max(1, Math.ceil(s.elements.length / 56));

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-5 py-4 bg-card border-b">
        <h1 className="text-xl font-bold tracking-tight">ScriptCraft</h1>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground active:scale-95 transition-all">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Scripts</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Unlimited projects</p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {scripts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No scripts yet</p>
            <p className="text-sm mt-1">Tap "+ New Project" to start writing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scripts.map((s, i) => (
              <div
                key={s.id}
                onClick={() => navigate(`/editor/${s.id}`)}
                className="bg-card rounded-xl px-5 py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(s.updatedAt), 'd MMM yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">{countPages(s)} page{countPages(s) !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
