import { Script, ScriptElement, ScriptElementType } from './types';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getFdxType(type: ScriptElementType): string {
  switch (type) {
    case 'scene-heading': return 'Scene Heading';
    case 'action': return 'Action';
    case 'character': return 'Character';
    case 'parenthetical': return 'Parenthetical';
    case 'dialogue': return 'Dialogue';
    case 'transition': return 'Transition';
    case 'shot': return 'Shot';
    case 'text': return 'General';
    case 'note': return 'General';
    case 'outline': return 'General';
    default: return 'General';
  }
}

export function exportScreenplayFdx(script: Script) {
  const paragraphs = script.elements
    .filter(el => el.content || el.type === 'scene-heading')
    .map(el => {
      const fdxType = getFdxType(el.type);
      const content = escapeXml(el.content || '');
      return `    <Paragraph Type="${fdxType}">
      <Text>${content}</Text>
    </Paragraph>`;
    })
    .join('\n');

  const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title Page">
        <Text>${escapeXml(script.title)}</Text>
      </Paragraph>
      <Paragraph Type="Title Page">
        <Text>written by</Text>
      </Paragraph>
      <Paragraph Type="Title Page">
        <Text>Author</Text>
      </Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>`;

  const blob = new Blob([fdx], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.title.replace(/[^a-zA-Z0-9]/g, '_')}.fdx`;
  a.click();
  URL.revokeObjectURL(url);
}
