import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScript, saveScript } from '@/lib/storage';
import { Script, ScriptElement, ScriptElementType, ELEMENT_LABELS, SCENE_HEADING_OPTIONS, TRANSITION_OPTIONS } from '@/lib/types';
import { ArrowLeft, Save, Mic, MicOff, Menu, Image, Clapperboard, Users, MessageCircle, ArrowRightLeft, Video, Type, AlertCircle, List, Wrench } from 'lucide-react';

const ELEMENT_TYPES: ScriptElementType[] = [
  'scene-heading', 'action', 'character', 'parenthetical',
  'dialogue', 'transition', 'shot', 'text', 'note', 'outline',
];

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [activeType, setActiveType] = useState<ScriptElementType>('scene-heading');
  const [saved, setSaved] = useState(true);
  const [showDropdown, setShowDropdown] = useState<{ elementId: string; options: string[] } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  useEffect(() => {
    if (!id) return;
    const s = getScript(id);
    if (!s) { navigate('/dashboard'); return; }
    setScript(s);
    if (s.elements.length > 0) setActiveType(s.elements[s.elements.length - 1].type);
  }, [id]);

  const autoSave = useCallback((updated: Script) => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updated.updatedAt = new Date().toISOString();
      saveScript(updated);
      setSaved(true);
    }, 800);
  }, []);

  const updateElement = (elementId: string, content: string) => {
    if (!script) return;
    const updated = {
      ...script,
      elements: script.elements.map(el => el.id === elementId ? { ...el, content } : el),
    };
    setScript(updated);
    autoSave(updated);
  };

  const addElement = (type?: ScriptElementType) => {
    if (!script) return;
    const t = type || activeType;
    const newEl: ScriptElement = { id: crypto.randomUUID(), type: t, content: '' };
    const updated = { ...script, elements: [...script.elements, newEl] };
    setScript(updated);
    setActiveType(t);
    autoSave(updated);
    setTimeout(() => inputRefs.current.get(newEl.id)?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent, element: ScriptElement) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Auto-advance type based on screenplay flow
      const nextType = getNextType(element.type);
      addElement(nextType);
    }
    if (e.key === 'Backspace' && element.content === '' && script && script.elements.length > 1) {
      e.preventDefault();
      const idx = script.elements.findIndex(el => el.id === element.id);
      const updated = { ...script, elements: script.elements.filter(el => el.id !== element.id) };
      setScript(updated);
      autoSave(updated);
      const prevEl = updated.elements[Math.max(0, idx - 1)];
      if (prevEl) setTimeout(() => inputRefs.current.get(prevEl.id)?.focus(), 50);
    }
  };

  const getNextType = (current: ScriptElementType): ScriptElementType => {
    switch (current) {
      case 'scene-heading': return 'action';
      case 'action': return 'character';
      case 'character': return 'dialogue';
      case 'dialogue': return 'action';
      case 'parenthetical': return 'dialogue';
      default: return 'action';
    }
  };

  const handleTypeClick = (type: ScriptElementType) => {
    setActiveType(type);
    if (script && script.elements.length > 0) {
      const lastEl = script.elements[script.elements.length - 1];
      if (lastEl.content === '') {
        const updated = {
          ...script,
          elements: script.elements.map(el => el.id === lastEl.id ? { ...el, type } : el),
        };
        setScript(updated);
        autoSave(updated);
        // Show dropdown for scene headings
        if (type === 'scene-heading') {
          setShowDropdown({ elementId: lastEl.id, options: SCENE_HEADING_OPTIONS });
        } else if (type === 'transition') {
          setShowDropdown({ elementId: lastEl.id, options: TRANSITION_OPTIONS });
        } else {
          setShowDropdown(null);
        }
        return;
      }
    }
    addElement(type);
    // Show dropdown for certain types
    setTimeout(() => {
      if (script) {
        const lastEl = script.elements[script.elements.length]; // will be new
      }
    }, 100);
  };

  const handleDropdownSelect = (elementId: string, value: string) => {
    updateElement(elementId, value + ' ');
    setShowDropdown(null);
    setTimeout(() => {
      const ta = inputRefs.current.get(elementId);
      if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; }
    }, 50);
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (script && script.elements.length > 0) {
        const lastEl = script.elements[script.elements.length - 1];
        updateElement(lastEl.id, lastEl.content + transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const manualSave = () => {
    if (!script) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    script.updatedAt = new Date().toISOString();
    saveScript(script);
    setSaved(true);
  };

  const getElementStyle = (type: ScriptElementType): string => {
    switch (type) {
      case 'scene-heading': return 'uppercase font-bold';
      case 'action': return '';
      case 'character': return 'uppercase text-center';
      case 'parenthetical': return 'italic text-center';
      case 'dialogue': return 'text-center max-w-[65%] mx-auto';
      case 'transition': return 'uppercase text-right';
      case 'shot': return 'uppercase';
      case 'note': return 'italic text-muted-foreground';
      case 'outline': return 'text-muted-foreground';
      default: return '';
    }
  };

  const getPlaceholder = (type: ScriptElementType): string => {
    return ELEMENT_LABELS[type].full.toUpperCase();
  };

  const pageCount = script ? Math.max(1, Math.ceil(
    script.elements.reduce((lines, el) => {
      const contentLines = el.content ? Math.max(1, Math.ceil(el.content.length / 60)) : 1;
      const spacing = el.type === 'scene-heading' ? 2 : 1;
      return lines + contentLines + spacing;
    }, 0) / 56
  )) : 1;

  if (!script) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2.5 bg-card border-b shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 hover:bg-accent rounded-lg active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm truncate max-w-[120px]">{script.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{saved ? '☁ Saved' : 'Saving...'}</span>
          <span>{pageCount} pg</span>
          <button onClick={manualSave} className="flex items-center gap-1 bg-card border rounded-lg px-3 py-1.5 font-medium hover:bg-accent active:scale-95 transition-all">
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center bg-toolbar-bg border-b shrink-0">
        <button className="flex flex-col items-center justify-center px-3 py-2 border-r border-border/30 text-toolbar-foreground/70 hover:text-toolbar-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center overflow-x-auto flex-1">
          {ELEMENT_TYPES.map(type => {
            const icons: Record<ScriptElementType, React.ReactNode> = {
              'scene-heading': <Image className="w-5 h-5" />,
              'action': <Clapperboard className="w-5 h-5" />,
              'character': <Users className="w-5 h-5" />,
              'parenthetical': <span className="text-lg font-bold leading-none">()</span>,
              'dialogue': <MessageCircle className="w-5 h-5" />,
              'transition': <ArrowRightLeft className="w-5 h-5" />,
              'shot': <Video className="w-5 h-5" />,
              'text': <Type className="w-5 h-5" />,
              'note': <AlertCircle className="w-5 h-5" />,
              'outline': <List className="w-5 h-5" />,
            };
            return (
              <button
                key={type}
                onClick={() => handleTypeClick(type)}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${
                  activeType === type
                    ? 'bg-toolbar-active text-primary-foreground'
                    : 'text-toolbar-foreground/70 hover:text-toolbar-foreground'
                }`}
              >
                {icons[type]}
                <span className="text-[10px] mt-0.5 font-medium leading-tight">{ELEMENT_LABELS[type].full.replace(' Heading', '').replace('hetical', 's')}</span>
              </button>
            );
          })}
        </div>
        <button className="flex flex-col items-center justify-center px-3 py-2 border-l border-border/30 text-toolbar-foreground/70 hover:text-toolbar-foreground transition-colors whitespace-nowrap">
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight text-center">Go to<br/>Tools</span>
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto bg-editor-bg min-h-full rounded-lg my-4 mx-3 p-6 shadow-sm font-screenplay text-sm leading-relaxed relative">
          {script.elements.map(el => (
            <div key={el.id} className="relative mb-1">
              <textarea
                ref={(node) => { if (node) inputRefs.current.set(el.id, node); }}
                value={el.content}
                onChange={(e) => updateElement(el.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, el)}
                onFocus={() => {
                  setActiveType(el.type);
                  if (el.content === '' && el.type === 'scene-heading') {
                    setShowDropdown({ elementId: el.id, options: SCENE_HEADING_OPTIONS });
                  } else if (el.content === '' && el.type === 'transition') {
                    setShowDropdown({ elementId: el.id, options: TRANSITION_OPTIONS });
                  } else {
                    setShowDropdown(null);
                  }
                }}
                placeholder={getPlaceholder(el.type)}
                className={`w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground/40 ${getElementStyle(el.type)}`}
                rows={1}
                style={{ minHeight: '1.5em' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              {showDropdown?.elementId === el.id && (
                <div className="absolute left-0 top-full z-10 bg-card border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {showDropdown.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleDropdownSelect(el.id, opt)}
                      className="w-full text-left px-4 py-2 text-sm font-screenplay hover:bg-accent transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice FAB */}
      <button
        onClick={toggleVoice}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all ${
          isListening ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
        }`}
      >
        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
    </div>
  );
}
