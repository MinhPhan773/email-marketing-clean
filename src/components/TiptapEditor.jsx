// src/components/TiptapEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';      // Giữ lại vì cần cấu hình
import Image from '@tiptap/extension-image';    // Giữ lại vì StarterKit không có Image
import { Bold, Italic, List, ListOrdered, Link2, Image as ImageIcon, Undo, Redo } from 'lucide-react';

const TiptapEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Loại bỏ link khỏi StarterKit để tránh duplicate
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-96 p-6',
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-300 p-4 flex gap-3 flex-wrap items-center">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-3 rounded-lg hover:bg-white transition ${editor.isActive('bold') ? 'bg-white shadow-md' : ''}`}>
          <Bold size={22} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-3 rounded-lg hover:bg-white transition ${editor.isActive('italic') ? 'bg-white shadow-md' : ''}`}>
          <Italic size={22} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-3 rounded-lg hover:bg-white transition ${editor.isActive('bulletList') ? 'bg-white shadow-md' : ''}`}>
          <List size={22} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-3 rounded-lg hover:bg-white transition ${editor.isActive('orderedList') ? 'bg-white shadow-md' : ''}`}>
          <ListOrdered size={22} />
        </button>
        <button onClick={() => {
          const url = window.prompt('Nhập URL liên kết:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} className={`p-3 rounded-lg hover:bg-white transition ${editor.isActive('link') ? 'bg-white shadow-md' : ''}`}>
          <Link2 size={22} />
        </button>
        <button onClick={addImage} className="p-3 rounded-lg hover:bg-white transition">
          <ImageIcon size={22} />
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-3 rounded-lg hover:bg-white transition disabled:opacity-50">
            <Undo size={22} />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-3 rounded-lg hover:bg-white transition disabled:opacity-50">
            <Redo size={22} />
          </button>
        </div>
      </div>
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};

export default TiptapEditor;