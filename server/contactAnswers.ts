// Reading a contact's assessment answers back out of the places they live:
// saved reports (JSON), progress rows (JSON text) and old lead messages
// ("key: value | key: value"). Shared by the dashboard and the follow up model.
import { QUESTIONS, calculateScores } from "../shared/assessment";

export const QUESTION_BY_ID = new Map(QUESTIONS.map(q => [q.id, q]));

// Leads come from four places. The source column says which.
export function leadKind(source: string | null | undefined): "assessment" | "application" | "purchase" | "enquiry" {
  const s = (source || "").toLowerCase();
  if (s.startsWith("performance-assessment")) return "assessment";
  if (s === "coaching-application") return "application";
  if (s === "stripe-purchase") return "purchase";
  return "enquiry";
}

export function parseAnswers(text: string | null): Record<string, unknown> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Old assessment leads (before saved reports existed) carry their answers in
 * the message column as "key: value | key: value". Turn that back into answers.
 */
export function answersFromMessage(message: string | null | undefined): Record<string, unknown> {
  if (!message || !message.includes(" | ") || !message.includes(": ")) return {};
  const out: Record<string, unknown> = {};
  for (const part of message.split(" | ")) {
    const idx = part.indexOf(": ");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 2).trim();
    if (!key || key === "name" || key === "email") continue;
    out[key] = value.includes(", ") && QUESTION_BY_ID.get(key)?.type === "multi" ? value.split(", ") : value;
  }
  return out;
}

export function labelAnswer(questionId: string, value: unknown): { question: string; answer: string; section: string } {
  const q = QUESTION_BY_ID.get(questionId);
  const values = Array.isArray(value) ? value : [value];
  const answer = values
    .map(v => {
      const opt = q?.options?.find(o => o.value === v);
      return opt ? opt.label : String(v ?? "");
    })
    .filter(Boolean)
    .join(", ");
  return { question: q?.text ?? questionId, answer, section: q?.section ?? "other" };
}

/** The label of one answer, or null when it was not answered. */
export function answerLabel(answers: Record<string, unknown>, questionId: string): string | null {
  const v = answers[questionId];
  if (v === undefined || v === null || v === "") return null;
  return labelAnswer(questionId, v).answer || null;
}

/** Overall score and the weakest and strongest areas, when the answers score at all. */
export function summariseScores(answers: Record<string, unknown>): { score: number; weakest: string; strongest: string } | null {
  if (!Object.keys(answers).length) return null;
  const s = calculateScores(answers);
  const cats = s.categories.filter(c => c.max > 0);
  if (!cats.length) return null;
  const byPct = cats.slice().sort((a, b) => a.percentage - b.percentage);
  return { score: s.overallPct, weakest: byPct[0].name, strongest: byPct[byPct.length - 1].name };
}
