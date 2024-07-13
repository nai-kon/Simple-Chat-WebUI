import React from 'react';
import Markdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface MarkdownRendererProps {
  markdown: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown }) => {
  return (
    <Markdown
      children={markdown}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              children={String(children).replace(/\n$/, '')}
              style={vs2015}
              language={match[1]}
              PreTag="div"
              {...props}
            />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    />
  );
};

export default MarkdownRenderer;