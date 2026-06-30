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
            // Inline code: accent-colored text on a very dark background
            // Block code: body-text color, slightly indented dark surface
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code
                  className="rounded bg-black/30 px-1 py-0.5 text-[#2ee6f6]"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="block rounded bg-black/40 p-2 text-sm text-[#cfe2e7]"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Links: accent color with a readable underline
            a: ({ children, ...props }) => (
              <a
                className="text-[#2ee6f6] underline underline-offset-[3px] hover:brightness-125"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
            // Lists: body text color, compact vertical spacing
            ul: ({ children }) => (
              <ul className="my-2 list-inside list-disc space-y-1 marker:text-[#cfe2e7]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2 list-inside list-decimal space-y-1 marker:text-[#cfe2e7]">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-[#cfe2e7]">{children}</li>
            ),
            // Headings: near-white, progressively smaller weights
            h1: ({ children }) => (
              <h1 className="mt-4 mb-2 text-xl font-bold text-[#eafbfe]">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-3 mb-2 text-lg font-bold text-[#eafbfe]">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-2 mb-1 text-base font-bold text-[#eafbfe]">
                {children}
              </h3>
            ),
            // Paragraphs: terminal body text color
            p: ({ children }) => (
              <p className="mb-2 text-[#cfe2e7]">{children}</p>
            ),
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
