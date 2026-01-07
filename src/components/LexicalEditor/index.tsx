import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ToolbarPlugin } from './ToolbarPlugin';
import { OnChangeHtmlPlugin } from './OnChangeHtmlPlugin';
import { InitialValuePlugin } from './InitialValuePlugin';
import { editorTheme } from './theme';
import { cn } from '@/lib/utils';

interface LexicalEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

function onError(error: Error) {
  console.error('Lexical Editor Error:', error);
}

export function LexicalEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo...',
  readOnly = false,
  className = '',
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme: editorTheme,
    onError,
    editable: !readOnly,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
    ],
  };

  return (
    <div className={cn('lexical-editor-wrapper', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="border border-border rounded-md overflow-hidden bg-background">
          {!readOnly && <ToolbarPlugin />}
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    'min-h-[300px] p-4 outline-none text-foreground',
                    'prose prose-sm max-w-none',
                    'prose-headings:text-foreground prose-p:text-foreground',
                    'prose-strong:text-foreground prose-em:text-foreground',
                    'prose-ul:text-foreground prose-ol:text-foreground',
                    'prose-li:text-foreground prose-a:text-primary',
                    readOnly && 'bg-muted/50 cursor-default'
                  )}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <InitialValuePlugin initialHtml={value} />
          <OnChangeHtmlPlugin onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}
