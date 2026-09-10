"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|>\s+[^\n]+|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-[#F8F4F6]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith(">")) {
      nodes.push(
        <span key={key++} className="block border-l-2 border-[#E8336D]/60 pl-3 text-[#D8D0D4]">
          {token.replace(/^>\s+/, "")}
        </span>,
      );
    } else {
      nodes.push(
        <code key={key++} className="rounded bg-white/5 px-1 text-[0.9em] text-[#FF7A99]">
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ReportMarkdown({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="space-y-3 text-[0.95rem] leading-7 text-[#D8D0D4]">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={i} className="pt-1 text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-1 text-lg font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {trimmed.slice(3)}
            </h3>
          );
        }
        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- ") || l.trim() === "")) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines
                .filter((l) => l.trim().startsWith("- "))
                .map((l, j) => (
                  <li key={j}>{renderInline(l.trim().slice(2))}</li>
                ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
