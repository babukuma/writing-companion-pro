import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { ScriptElement, ScriptElementType } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface AIPromptDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (elements: ScriptElement[]) => void;
}

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi',
  'Thriller', 'Romance', 'Fantasy', 'Mystery', 'Animation',
];

export default function AIPromptDialog({ open, onClose, onGenerated }: AIPromptDialogProps) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Drama');
  const [pageCount, setPageCount] = useState(90);
  const [plotPoints, setPlotPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const parseScreenplayToElements = (text: string): ScriptElement[] => {
    const lines = text.split('\n').filter(l => l.trim());
    const elements: ScriptElement[] = [];

    const typeMap: Record<string, ScriptElementType> = {
      '[SCENE]': 'scene-heading',
      '[ACTION]': 'action',
      '[CHARACTER]': 'character',
      '[PARENTHETICAL]': 'parenthetical',
      '[DIALOGUE]': 'dialogue',
      '[TRANSITION]': 'transition',
    };

    for (const line of lines) {
      let matched = false;
      for (const [marker, type] of Object.entries(typeMap)) {
        if (line.startsWith(marker)) {
          elements.push({
            id: crypto.randomUUID(),
            type,
            content: line.slice(marker.length).trim(),
          });
          matched = true;
          break;
        }
      }
      if (!matched) {
        elements.push({
          id: crypto.randomUUID(),
          type: 'action',
          content: line.trim(),
        });
      }
    }

    return elements;
  };

  const handleGenerate = async () => {
    if (!title.trim() || !plotPoints.trim()) return;
    setLoading(true);
    setStreamedText('');
    setError('');

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-screenplay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ title, genre, pageCount, plotPoints }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        setError(err.error || 'Generation failed');
        setLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setStreamedText(full);
            }
          } catch {}
        }
      }

      const elements = parseScreenplayToElements(full);
      if (elements.length > 0) {
        onGenerated(elements);
        onClose();
      } else {
        setError('Could not parse generated content.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">AI Writing Assistant</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Film Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., The Last Horizon"
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    genre === g
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Page Count */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">
              Target Pages: <span className="text-primary">{pageCount}</span>
            </label>
            <input
              type="range"
              min={10}
              max={120}
              value={pageCount}
              onChange={e => setPageCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Short (10)</span>
              <span>Feature (90-120)</span>
            </div>
          </div>

          {/* Plot Points */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Key Plot Points</label>
            <textarea
              value={plotPoints}
              onChange={e => setPlotPoints(e.target.value)}
              placeholder={"1. A retired detective gets a mysterious letter\n2. She discovers her old partner faked his death\n3. They must team up to stop a conspiracy"}
              rows={4}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Streaming Preview */}
          {streamedText && (
            <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Generating...</p>
              <pre className="text-xs font-screenplay whitespace-pre-wrap">{streamedText.slice(-500)}</pre>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !title.trim() || !plotPoints.trim()}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Screenplay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
