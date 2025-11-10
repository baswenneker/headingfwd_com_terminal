import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <div>
        <ReactMarkdown
          components={{
            // Style code blocks
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code
                  className="rounded bg-cyan-900/30 px-1 py-0.5 text-cyan-300"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="block rounded bg-black/40 p-2 text-sm text-gray-300"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Style links
            a: ({ children, ...props }) => (
              <a
                className="text-cyan-400 underline hover:text-cyan-300"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
            // Style lists - minimal padding for terminal alignment
            ul: ({ children }) => (
              <ul className="my-2 list-inside list-disc space-y-1 marker:text-gray-400">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2 list-inside list-decimal space-y-1 marker:text-gray-400">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-gray-300">{children}</li>,
            // Style headings
            h1: ({ children }) => (
              <h1 className="mt-4 mb-2 text-xl font-bold text-gray-100">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-3 mb-2 text-lg font-bold text-gray-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-2 mb-1 text-base font-bold text-gray-100">
                {children}
              </h3>
            ),
            // Style paragraphs
            p: ({ children }) => <p className="mb-2">{children}</p>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
        ))}
      </>
    );
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
