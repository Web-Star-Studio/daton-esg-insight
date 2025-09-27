import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote', 'code-block'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'blockquote', 
    'code-block', 'align'
  ];

  useEffect(() => {
    // Custom styles for the editor
    const style = document.createElement('style');
    style.textContent = `
      .quill .ql-editor {
        min-height: 300px;
        font-size: 14px;
        line-height: 1.6;
      }
      .quill .ql-toolbar {
        border-top: 1px solid hsl(var(--border));
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
        border-bottom: none;
        background: hsl(var(--background));
      }
      .quill .ql-container {
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
        border-bottom: 1px solid hsl(var(--border));
        border-top: none;
        background: hsl(var(--background));
      }
      .quill .ql-editor.ql-blank::before {
        color: hsl(var(--muted-foreground));
        font-style: normal;
      }
      .ql-snow .ql-stroke {
        stroke: hsl(var(--foreground));
      }
      .ql-snow .ql-fill {
        fill: hsl(var(--foreground));
      }
      .ql-snow .ql-picker {
        color: hsl(var(--foreground));
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}