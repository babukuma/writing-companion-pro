import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScripts, createScript, deleteScript, setLoggedIn } from '@/lib/storage';
import { Script } from '@/lib/types';
import { Plus, LogOut, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setScripts(getScripts());
  }, []);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const script = createScript(newTitle.trim());
    setShowNewDialog(false);
    setNewTitle('');
    navigate(`/editor/${script.id}`);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteScript(deleteId);
    setScripts(getScripts());
    setDeleteId(null);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    navigate('/');
  };

  const countPages = (s: Script) => Math.max(1, Math.ceil(
    s.elements.reduce((lines, el) => {
      const contentLines = el.content ? Math.max(1, Math.ceil(el.content.length / 60)) : 1;
      const spacing = el.type === 'scene-heading' ? 2 : 1;
      return lines + contentLines + spacing;
    }, 0) / 56
  ));

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
            onClick={() => setShowNewDialog(true)}
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
            {scripts.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/editor/${s.id}`)}
                className="bg-card rounded-xl px-5 py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] group"
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
                    onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
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

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 px-6" onClick={() => setShowNewDialog(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">New Project</h3>
              <button onClick={() => setShowNewDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Project name"
              className="w-full border rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-3 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 px-6" onClick={() => setDeleteId(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete Script?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border rounded-lg py-2.5 font-medium active:scale-95 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-2.5 font-medium active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
