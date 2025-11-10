"use client";

import { useEffect, useState } from "react";

const codeLines = [
  { text: "while(team.needs_help()) {", indent: 0 },
  { text: "understand();", indent: 1 },
  { text: "var poc = develop_prototype();", indent: 1 },
  { text: "", indent: 1 },
  { text: "if(poc.evaluate() == SUCCESS) {", indent: 1 },
  { text: "return poc.final();", indent: 2 },
  { text: "}", indent: 1 },
  { text: "}", indent: 0 },
];

const getIndentClass = (indent: number): string => {
  switch (indent) {
    case 0:
      return "";
    case 1:
      return "ml-4";
    case 2:
      return "ml-8";
    default:
      return "";
  }
};

export function CodeBlock() {
  const [displayedLines, setDisplayedLines] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);

  useEffect(() => {
    if (displayedLines >= codeLines.length) return;

    const currentLine = codeLines[displayedLines];
    if (!currentLine) return;

    if (currentCharIndex < currentLine.text.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex(currentCharIndex + 1);
      }, 60); // Speed of typing per character
      return () => clearTimeout(timeout);
    } else {
      // Move to next line
      const timeout = setTimeout(() => {
        setDisplayedLines(displayedLines + 1);
        setCurrentCharIndex(0);
      }, 800); // Pause before next line
      return () => clearTimeout(timeout);
    }
  }, [displayedLines, currentCharIndex]);

  return (
    <div className="space-y-0 text-sm leading-relaxed">
      <style>{`
        @keyframes fadeToGray {
          0% {
            color: rgb(243 244 246);
          }
          100% {
            color: rgb(156 163 175);
          }
        }
        .char-fade {
          animation: fadeToGray 0.5s ease-out forwards;
        }
      `}</style>
      {codeLines.map((line, index) => {
        if (index < displayedLines) {
          // Fully displayed line
          return (
            <div key={index} className={getIndentClass(line.indent)}>
              {line.text || "\u00A0"}
            </div>
          );
        } else if (index === displayedLines) {
          // Currently typing line
          return (
            <div key={index} className={getIndentClass(line.indent)}>
              {line.text.split("").map((char, charIdx) => {
                if (charIdx < currentCharIndex) {
                  return (
                    <span key={charIdx} className="char-fade">
                      {char}
                    </span>
                  );
                }
                return null;
              })}
              <span className="inline-block h-[1em] w-[0.6em] animate-pulse bg-gray-400"></span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
