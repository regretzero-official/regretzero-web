"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|>\s+[^\n]+|`[^`]+`|\*[^*]+\*)/g;
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
    } else if (token.startsWith("*") && token.endsWith("*") && !token.startsWith("**")) {
      nodes.push(
        <em key={key++} className="italic text-[#E8E0E4]">
          {token.slice(1, -1)}
        </em>,
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

function isTableSeparator(line: string) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function tryParseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  const hasPipe = lines.filter((l) => l.includes("|")).length >= 2;
  if (!hasPipe) return null;
  const sepIdx = lines.findIndex(isTableSeparator);
  if (sepIdx < 1) return null;
  const headers = parseTableRow(lines[sepIdx - 1]);
  const rows = lines
    .slice(sepIdx + 1)
    .filter((l) => l.includes("|"))
    .map(parseTableRow)
    .filter((r) => r.some((c) => c.length > 0));
  if (!headers.length || !rows.length) return null;
  return { headers, rows };
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
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-1 text-lg font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        const lines = trimmed.split("\n");
        const table = tryParseTable(lines);
        if (table) {
          return (
            <div key={i} className="overflow-x-auto rounded-[14px] border border-white/10">
              <table className="min-w-full border-collapse text-left text-[13px] leading-5">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    {table.headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="px-3 py-2 font-semibold text-[#F4F0F2] whitespace-nowrap"
                      >
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-white/5 last:border-0">
                      {table.headers.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 align-top text-[#D8D0D4]">
                          {renderInline(row[ci] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
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
