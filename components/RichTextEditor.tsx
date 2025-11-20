'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bold')
              ? 'bg-gray-300 dark:bg-gray-600'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('italic')
              ? 'bg-gray-300 dark:bg-gray-600'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bulletList')
              ? 'bg-gray-300 dark:bg-gray-600'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('orderedList')
              ? 'bg-gray-300 dark:bg-gray-600'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-gray-300 dark:bg-gray-600'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          H3
        </button>
      </div>
      
      {/* Editor */}
      <div className="bg-white dark:bg-gray-700 dark:text-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
