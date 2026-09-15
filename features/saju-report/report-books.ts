import type { SajuProductId, SajuReportSection } from "./types";

/** Foxbunny-style 4권 grouping for long reunion report (15 sections). */
export type ReportBook = {
  id: string;
  label: string;
  /** Short Korean label e.g. 1권 */
  shortLabel: string;
  sectionIndexes: number[];
};

/**
 * Reunion 4-book map aligned to canonical 15 titles:
 * 표지 + 1장… / 2장… / 3장… / 4장…+안내
 */
const REUNION_BOOKS: ReportBook[] = [
  {
    id: "book-1",
    label: "1권 · 끌린 이유",
    shortLabel: "1권",
    sectionIndexes: [0, 1, 2, 3, 4],
  },
  {
    id: "book-2",
    label: "2권 · 남은 마음",
    shortLabel: "2권",
    sectionIndexes: [5, 6],
  },
  {
    id: "book-3",
    label: "3권 · 연락과 시기",
    shortLabel: "3권",
    sectionIndexes: [7, 8, 9, 10],
  },
  {
    id: "book-4",
    label: "4권 · 달라져야 할 것",
    shortLabel: "4권",
    sectionIndexes: [11, 12, 13, 14],
  },
];

/** Fallback: chunk into up to 4 books by section titles containing "N장". */
function booksFromChapterMarkers(sections: SajuReportSection[]): ReportBook[] {
  const starts: number[] = [0];
  for (let i = 1; i < sections.length; i += 1) {
    if (/^[1-4]장/.test(sections[i].title) || /·\s*[1-4]장/.test(sections[i].title)) {
      starts.push(i);
    }
  }
  // Ensure we don't invent more than 4 books
  const uniqueStarts = [...new Set(starts)].slice(0, 4);
  if (uniqueStarts.length < 2) {
    // Even split into 4
    const n = sections.length;
    const size = Math.ceil(n / 4);
    return [0, 1, 2, 3].map((b) => {
      const from = b * size;
      const to = Math.min(n, from + size);
      const indexes = Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
      return {
        id: `book-${b + 1}`,
        label: `${b + 1}권`,
        shortLabel: `${b + 1}권`,
        sectionIndexes: indexes,
      };
    }).filter((b) => b.sectionIndexes.length > 0);
  }

  return uniqueStarts.map((start, bi) => {
    const end = uniqueStarts[bi + 1] ?? sections.length;
    const indexes = Array.from({ length: end - start }, (_, k) => start + k);
    const title = sections[start]?.title ?? `${bi + 1}권`;
    return {
      id: `book-${bi + 1}`,
      label: `${bi + 1}권 · ${title.replace(/^\d+\.\s*/, "")}`,
      shortLabel: `${bi + 1}권`,
      sectionIndexes: indexes,
    };
  });
}

export function getReportBooks(
  productId: SajuProductId,
  sections: SajuReportSection[],
): ReportBook[] {
  if (productId === "reunion-luck" && sections.length === 15) {
    return REUNION_BOOKS;
  }
  return booksFromChapterMarkers(sections);
}
