import { useState, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'underline':
        insertText('<u>', '</u>');
        break;
      case 'link':
        const url = prompt('Digite a URL:');
        if (url) insertText(`[`, `](${url})`);
        break;
      case 'image':
        const imageUrl = prompt('Digite a URL da imagem:');
        if (imageUrl) insertText(`![Imagem](${imageUrl})`);
        break;
      case 'code':
        insertText('`', '`');
        break;
      case 'quote':
        insertText('> ');
        break;
      case 'list':
        insertText('- ');
        break;
    }
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
      .replace(/> (.*?)$/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 italic">$1</blockquote>')
      .replace(/- (.*?)$/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-500 hover:underline" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="border border-border rounded-lg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-muted flex-wrap">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Itálico"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Sublinhado"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          type="button"
          onClick={() => formatText('link')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => formatText('image')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Imagem"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => formatText('code')}
          className="px-2 py-1 hover:bg-background rounded text-sm font-mono"
          title="Código"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={() => formatText('quote')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Citação"
        >
          💬
        </button>
        <button
          type="button"
          onClick={() => formatText('list')}
          className="px-2 py-1 hover:bg-background rounded text-sm"
          title="Lista"
        >
          📋
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 rounded text-sm ${
            isPreview ? 'bg-purple-500 text-white' : 'hover:bg-background'
          }`}
          title="Visualizar"
        >
          {isPreview ? 'Editar' : 'Visualizar'}
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[200px]">
        {isPreview ? (
          <div
            className="p-3 prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[200px] p-3 bg-transparent border-0 resize-none focus:outline-none text-foreground"
            data-testid="textarea-content"
          />
        )}
      </div>

      {/* Help Text */}
      <div className="p-2 border-t border-border bg-muted text-xs text-muted-foreground">
        <strong>Dicas:</strong> **negrito**, *itálico*, `código`, &gt; citação, - lista, [link](url), ![imagem](url)
      </div>
    </div>
  );
}
