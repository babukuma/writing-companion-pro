export type ScriptElementType = 
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'shot'
  | 'text'
  | 'note'
  | 'outline';

export interface ScriptElement {
  id: string;
  type: ScriptElementType;
  content: string;
}

export interface Script {
  id: string;
  title: string;
  authorName?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
  elements: ScriptElement[];
}

export const ELEMENT_LABELS: Record<ScriptElementType, { short: string; full: string }> = {
  'scene-heading': { short: 'SCN', full: 'Scene Heading' },
  'action': { short: 'ACT', full: 'Action' },
  'character': { short: 'CHR', full: 'Character' },
  'parenthetical': { short: 'PRN', full: 'Parenthetical' },
  'dialogue': { short: 'DLG', full: 'Dialogue' },
  'transition': { short: 'TRN', full: 'Transition' },
  'shot': { short: 'SHT', full: 'Shot' },
  'text': { short: 'TXT', full: 'Text' },
  'note': { short: 'NTE', full: 'Note' },
  'outline': { short: 'OUT', full: 'Outline' },
};

export const SCENE_HEADING_OPTIONS = ['INT.', 'EXT.', 'INT./EXT.'];
export const TRANSITION_OPTIONS = [
  'CUT TO:', 'FADE IN:', 'FADE OUT:', 'FADE TO BLACK:', 'FADE FROM BLACK:',
  'DISSOLVE TO:', 'SMASH CUT TO:', 'MATCH CUT TO:', 'WIPE TO:',
  'IRIS IN:', 'IRIS OUT:', 'PUSH IN:', 'PULL BACK TO:',
  'ZOOM IN:', 'ZOOM OUT:', 'JUMP CUT TO:', 'CROSSFADE:',
  'TIME CUT:', 'FLASH CUT:', 'SLOW FADE TO:', 'QUICK CUT TO:',
  'SOUND BRIDGE TO:', 'AUDIO CUT TO:', 'PRE-LAP:',
  'L-CUT:', 'J-CUT:', 'HARD CUT TO:', 'SOFT CUT TO:',
  'GLITCH CUT TO:', 'DREAM CUT TO:', 'MEMORY CUT TO:', 'FANTASY CUT TO:',
];
