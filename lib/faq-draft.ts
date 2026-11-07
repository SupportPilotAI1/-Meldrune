// FAQ-grounded draft builder, used when no OPENAI_API_KEY is configured.
// Matches the customer's latest message against the workspace FAQs by
// keyword overlap and composes the draft from the best-matching answer.
// Returns null when nothing matches confidently, so the caller can fall
// back to the generic "play it safe" sentence.

export type FaqLike = { question: string; answer: string };
export type ChatMessageLike = { role: string; body: string };

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "so", "to", "of", "in",
  "on", "at", "by", "for", "with", "from", "as", "is", "are", "was", "were",
  "be", "been", "am", "do", "does", "did", "have", "has", "had", "can",
  "could", "will", "would", "should", "may", "might", "i", "you", "he", "she",
  "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
  "its", "our", "their", "mine", "yours", "this", "that", "these", "those",
  "what", "when", "where", "who", "whom", "why", "how", "which", "there",
  "here", "hey", "hi", "hello", "please", "thanks", "thank", "just", "get",
  "got", "re", "ll", "ve", "d", "s", "t", "m", "pm",
]);

function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  return w;
}

function contentTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || STOPWORDS.has(raw)) continue;
    const w = stem(raw);
    if (w.length < 2 || STOPWORDS.has(w)) continue;
    out.add(w);
  }
  return out;
}

function scoreFaq(customer: Set<string>, faq: FaqLike): { score: number; matched: number; coverage: number } {
  const qTokens = contentTokens(faq.question);
  const aTokens = contentTokens(faq.answer);
  let matched = 0;
  let score = 0;
  for (const token of customer) {
    if (qTokens.has(token)) {
      matched += 1;
      score += 2;
    } else if (aTokens.has(token)) {
      matched += 1;
      score += 1;
    }
  }
  const coverage = customer.size > 0 ? matched / customer.size : 0;
  return { score, matched, coverage };
}

export function buildFaqDraft(messages: ChatMessageLike[], faqs: FaqLike[]): string | null {
  if (!faqs.length) return null;

  let customerText = "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "customer") {
      customerText = messages[i].body;
      break;
    }
  }
  if (!customerText) return null;

  const customer = contentTokens(customerText);
  if (customer.size === 0) return null;

  let best: { faq: FaqLike; score: number; matched: number; coverage: number } | null = null;
  for (const faq of faqs) {
    const result = scoreFaq(customer, faq);
    if (!best || result.score > best.score) best = { faq, ...result };
  }
  if (!best || best.matched < 2 || best.coverage < 0.3) return null;

  const answer = best.faq.answer.trim();
  const body = /[.!?]$/.test(answer) ? answer : `${answer}.`;
  return `Hi there! ${body} Let me know if there's anything else I can help with.`;
}
