'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';

// Dynamically import Jodit with no SSR
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full border rounded-md bg-muted/10" />
});

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
      backgroundColor: '#fff',
      color: '#000'
    },
    list: {
      style: {
        'list-style-type': 'inherit'
      }
    },
    iframe: true,
    iframeStyle: `
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
        onChange={newContent => {}}
      />
    </div>
  );
} 