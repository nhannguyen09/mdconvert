'use client';

// components/MarkdownPreview.tsx
// Render markdown bằng react-markdown + remark-gfm

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export default function MarkdownPreview({ content }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[300px]">
      <div className="prose prose-sm max-w-none
        prose-headings:text-[#1A428A] prose-headings:font-heading
        prose-a:text-[#3CABD2]
        prose-blockquote:border-l-[#3CABD2] prose-blockquote:bg-teal-50/50 prose-blockquote:py-1
        prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:rounded
        prose-table:text-sm
        prose-img:rounded-lg prose-img:border prose-img:border-gray-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
