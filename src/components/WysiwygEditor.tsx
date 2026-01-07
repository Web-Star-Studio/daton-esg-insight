import { LexicalEditor } from './LexicalEditor';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function WysiwygEditor({ 
  value, 
  onChange, 
  placeholder = "Digite o conteúdo do artigo...",
  readOnly = false,
  className = ""
}: WysiwygEditorProps) {
  return (
    <LexicalEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={className}
    />
  );
}
