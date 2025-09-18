"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4">
      <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
    </div>
  ),
});

interface QuillEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function QuillEditor({
  content,
  onChange,
  placeholder,
}: QuillEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align",
    "script",
    "code-block",
  ];

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Start writing..."}
        style={{
          height: "400px",
          marginBottom: "42px", // Account for toolbar height
        }}
      />

      <style jsx global>{`
        .quill-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-top: none;
        }

        .quill-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-bottom: none;
        }

        .quill-editor-wrapper .ql-editor {
          min-height: 350px;
          font-size: 14px;
          line-height: 1.6;
        }

        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .quill-editor-wrapper .ql-snow .ql-tooltip {
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}
