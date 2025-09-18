"use client";

interface QuillRendererProps {
  content: string;
  className?: string;
}

export function QuillRenderer({ content, className = "" }: QuillRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div
      className={`prose prose-gray max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        // Override prose styles to match Quill output
        lineHeight: "1.6",
      }}
    />
  );
}
