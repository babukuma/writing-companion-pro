import jsPDF from 'jspdf';
import { Script, ScriptElement, ScriptElementType } from './types';

const PAGE_WIDTH = 8.5; // inches
const PAGE_HEIGHT = 11;
const MARGIN_TOP = 1;
const MARGIN_BOTTOM = 1;
const MARGIN_LEFT = 1.5;
const MARGIN_RIGHT = 1;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINES_PER_PAGE = 56;
const LINE_HEIGHT = (PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) / LINES_PER_PAGE;
const FONT_SIZE = 12;
const CHARS_PER_LINE = 60;

// Courier is the industry standard for screenplays
function setupFont(doc: jsPDF) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT_SIZE);
}

function getElementFormatting(type: ScriptElementType) {
  switch (type) {
    case 'scene-heading':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: true, bold: true, spaceBefore: 2 };
    case 'action':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: false, bold: false, spaceBefore: 1 };
    case 'character':
      return { leftIndent: 2.2, maxWidth: 3.5, uppercase: true, bold: false, spaceBefore: 1 };
    case 'parenthetical':
      return { leftIndent: 1.6, maxWidth: 2.5, uppercase: false, bold: false, spaceBefore: 0 };
    case 'dialogue':
      return { leftIndent: 1, maxWidth: 3.5, uppercase: false, bold: false, spaceBefore: 0 };
    case 'transition':
      return { leftIndent: 4, maxWidth: 2, uppercase: true, bold: false, spaceBefore: 1 };
    case 'shot':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: true, bold: true, spaceBefore: 1 };
    case 'text':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: false, bold: false, spaceBefore: 1 };
    case 'note':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: false, bold: false, spaceBefore: 1 };
    case 'outline':
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: false, bold: false, spaceBefore: 1 };
    default:
      return { leftIndent: 0, maxWidth: USABLE_WIDTH, uppercase: false, bold: false, spaceBefore: 1 };
  }
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
}

export function getCharacterNames(script: Script): string[] {
  const names = new Set<string>();
  for (const el of script.elements) {
    if (el.type === 'character' && el.content.trim()) {
      names.add(el.content.trim().toUpperCase());
    }
  }
  return Array.from(names).sort();
}

export function exportCharacterDialoguePdf(script: Script, characterName: string) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  setupFont(doc);

  const upperChar = characterName.toUpperCase();

  // Title page
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.text(`${upperChar} — DIALOGUE`, PAGE_WIDTH / 2, 3, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.text(`from "${script.title}"`, PAGE_WIDTH / 2, 3.6, { align: 'center' });
  if (script.authorName) {
    doc.text(`by ${script.authorName}`, PAGE_WIDTH / 2, 4.0, { align: 'center' });
  }

  doc.addPage();
  setupFont(doc);
  let currentLine = 0;
  let pageNum = 1;

  const toY = (line: number) => MARGIN_TOP + line * LINE_HEIGHT;

  function newPage() {
    doc.addPage();
    pageNum++;
    currentLine = 0;
    setupFont(doc);
    // page number
    doc.text(`${pageNum}.`, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP - 0.3, { align: 'right' });
  }

  // Walk elements, find character + following dialogue/parenthetical
  for (let i = 0; i < script.elements.length; i++) {
    const el = script.elements[i];
    if (el.type === 'character' && el.content.trim().toUpperCase() === upperChar) {
      // Print character name
      if (currentLine + 2 > LINES_PER_PAGE) newPage();
      currentLine += 1; // space before
      doc.setFont('courier', 'bold');
      doc.text(upperChar, MARGIN_LEFT + 2.2, toY(currentLine));
      currentLine++;
      doc.setFont('courier', 'normal');

      // Print following dialogue/parenthetical lines
      let j = i + 1;
      while (j < script.elements.length && (script.elements[j].type === 'dialogue' || script.elements[j].type === 'parenthetical')) {
        const dlg = script.elements[j];
        const text = dlg.content || '';
        const lines = wrapText(text, 40);
        for (const line of lines) {
          if (currentLine >= LINES_PER_PAGE) newPage();
          const indent = dlg.type === 'parenthetical' ? 1.6 : 1;
          const printLine = dlg.type === 'parenthetical' ? `(${line})` : line;
          doc.text(printLine, MARGIN_LEFT + indent, toY(currentLine));
          currentLine++;
        }
        j++;
      }
    }
  }

  doc.save(`${script.title.replace(/[^a-zA-Z0-9]/g, '_')}_${upperChar}.pdf`);
}

export function exportScreenplayPdf(script: Script) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  setupFont(doc);

  let currentLine = 0;
  let pageNum = 1;

  const toX = (indent: number) => MARGIN_LEFT + indent;
  const toY = (line: number) => MARGIN_TOP + line * LINE_HEIGHT;

  function addPageNumber() {
    if (pageNum > 1) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(FONT_SIZE);
      const numStr = `${pageNum}.`;
      doc.text(numStr, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP - 0.3, { align: 'right' });
    }
  }

  function newPage() {
    doc.addPage();
    pageNum++;
    currentLine = 0;
    addPageNumber();
    setupFont(doc);
  }

  // Title page
  doc.setFont('courier', 'bold');
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(script.title.toUpperCase(), USABLE_WIDTH);
  const titleY = PAGE_HEIGHT / 2 - 1;
  doc.text(titleLines, PAGE_WIDTH / 2, titleY, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.text('written by', PAGE_WIDTH / 2, titleY + 0.8, { align: 'center' });
  doc.text(script.authorName || 'Author', PAGE_WIDTH / 2, titleY + 1.2, { align: 'center' });

  if (script.contactInfo) {
    doc.setFontSize(10);
    const contactLines = script.contactInfo.split('\n');
    contactLines.forEach((line, i) => {
      doc.text(line, MARGIN_LEFT, PAGE_HEIGHT - MARGIN_BOTTOM - (contactLines.length - i) * 0.25);
    });
  }

  // Start screenplay content on page 2
  doc.addPage();
  pageNum++;
  addPageNumber();
  setupFont(doc);

  for (const element of script.elements) {
    if (!element.content && element.type !== 'scene-heading') continue;

    const fmt = getElementFormatting(element.type);
    let text = element.content || '';
    if (fmt.uppercase) text = text.toUpperCase();

    const maxCharsForWidth = Math.floor((fmt.maxWidth / USABLE_WIDTH) * CHARS_PER_LINE);
    const wrappedLines = wrapText(text, maxCharsForWidth);

    // Check if we need space before
    const totalLines = wrappedLines.length + fmt.spaceBefore;
    if (currentLine + totalLines > LINES_PER_PAGE) {
      newPage();
    }

    // Add spacing before
    currentLine += fmt.spaceBefore;

    // Set font style
    doc.setFont('courier', fmt.bold ? 'bold' : 'normal');

    for (const line of wrappedLines) {
      if (currentLine >= LINES_PER_PAGE) {
        newPage();
        doc.setFont('courier', fmt.bold ? 'bold' : 'normal');
      }

      const x = toX(fmt.leftIndent);
      const y = toY(currentLine);
      doc.text(line, x, y);
      currentLine++;
    }
  }

  // Save
  doc.save(`${script.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
