import { FilePlus, Save, Download, FileText, Settings, User, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Script } from '@/lib/types';
import { exportScreenplayPdf, exportCharacterDialoguePdf, getCharacterNames } from '@/lib/exportPdf';
import { exportScreenplayFdx } from '@/lib/exportFdx';
import { useNavigate } from 'react-router-dom';
import { createScript } from '@/lib/storage';
import { saveScriptOfflineAware } from '@/lib/syncService';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditorSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: Script;
  onSave: () => void;
  onOpenSettings: () => void;
}

export default function EditorSidebar({ open, onOpenChange, script, onSave, onOpenSettings }: EditorSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleNewProject = () => {
    if (!newTitle.trim()) return;
    const s = createScript(newTitle.trim(), user?.id);
    saveScriptOfflineAware(s, isOnline, user?.id);
    setShowNewDialog(false);
    setNewTitle('');
    onOpenChange(false);
    navigate(`/editor/${s.id}`);
  };

  const menuItems = [
    {
      label: 'New Project',
      icon: FilePlus,
      action: () => { setShowNewDialog(true); },
    },
    {
      label: 'Save',
      icon: Save,
      action: () => { onSave(); onOpenChange(false); },
    },
    { divider: true },
    {
      label: 'Export Full Script PDF',
      icon: Download,
      action: () => { exportScreenplayPdf(script); onOpenChange(false); },
    },
    {
      label: 'Export Character Dialogue PDF',
      icon: User,
      action: () => { setShowCharPicker(true); },
    },
    {
      label: 'Export as FDX (Final Draft)',
      icon: FileText,
      action: () => { exportScreenplayFdx(script); onOpenChange(false); },
    },
    { divider: true },
    {
      label: 'Settings',
      icon: Settings,
      action: () => { onOpenSettings(); onOpenChange(false); },
    },
  ];

  const characters = getCharacterNames(script);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle className="text-base">File Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col py-2">
            {menuItems.map((item, i) => {
              if ('divider' in item) {
                return <div key={`div-${i}`} className="h-px bg-border mx-3 my-1" />;
              }
              const Icon = item.icon!;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors text-foreground"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Character picker dialog */}
      <Dialog open={showCharPicker} onOpenChange={setShowCharPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DTitle>Export Character Dialogue</DTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select a character:</p>
          <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No characters found.</p>
            ) : (
              characters.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    exportCharacterDialoguePdf(script, name);
                    setShowCharPicker(false);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors font-medium text-sm"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  {name}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Project dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DTitle>New Project</DTitle>
          </DialogHeader>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNewProject()}
            placeholder="Project title"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleNewProject} disabled={!newTitle.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
