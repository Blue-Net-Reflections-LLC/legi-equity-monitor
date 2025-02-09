'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';

// Create a named component for the fallback
const EditorFallback = () => (
  <div className="h-[500px] w-full border rounded-md bg-muted/10 flex items-center justify-center text-muted-foreground">
    Failed to load editor
  </div>
);
EditorFallback.displayName = 'EditorFallback';

// Create a named component for the loading state
const EditorLoading = () => (
  <div className="h-[500px] w-full border rounded-md bg-muted/10 flex items-center justify-center">
    <div className="animate-pulse">Loading editor...</div>
  </div>
);
EditorLoading.displayName = 'EditorLoading';

// Dynamically import Jodit with no SSR and proper error handling
const JoditEditor = dynamic(
  () => import('jodit-react').catch(err => {
    console.error('Failed to load Jodit editor:', err);
    return EditorFallback;
  }),
  {
    ssr: false,
    loading: EditorLoading
  }
);

// Add display name to the dynamic component
JoditEditor.displayName = 'DynamicJoditEditor';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  const editor = useRef(null);

  const config = useMemo(() => ({
    readonly: false,
    height: '500px',
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'h2', 'h3', 'h4', 'h5', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'fullsize'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    removeButtons: ['about'],
    showXPathInStatusbar: false,
    showCharsCounter: false,
    showWordsCounter: false,
    toolbarAdaptive: false,
    defaultMode: 1,
    style: {
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)'
    },
    list: {
      style: {
        'list-style-type': 'inherit'
      }
    },
    iframe: true,
    iframeStyle: `
      html {
        background: var(--background);
        color: var(--foreground);
      }
      body {
        padding: 10px;
        color: inherit;
        background: inherit;
      }
      ul { list-style-type: disc !important; padding-left: 2em !important; }
      ol { list-style-type: decimal !important; padding-left: 2em !important; }
      ul ul { list-style-type: circle !important; }
      ol ol { list-style-type: lower-alpha !important; }
      ul ul ul { list-style-type: square !important; }
      ol ol ol { list-style-type: lower-roman !important; }
    `
  }), []);

  return (
    <div className="border border-input rounded-md overflow-hidden">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={onChange}
        onChange={() => {}}
      />
    </div>
  );
} 