import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

interface InitialValuePluginProps {
  initialHtml: string;
}

export function InitialValuePlugin({ initialHtml }: InitialValuePluginProps) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !initialHtml) return;
    
    hasInitialized.current = true;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      
      const root = $getRoot();
      root.clear();
      
      if (nodes.length > 0) {
        $insertNodes(nodes);
      }
    });
  }, [editor, initialHtml]);

  return null;
}
