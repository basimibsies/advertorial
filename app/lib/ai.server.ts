import Anthropic from "@anthropic-ai/sdk";
import type { Block } from "./blocks";
import { generateBlockId } from "./blocks";

// ─── Style Presets ────────────────────────────────────────────────────────────

const STYLE_PRESETS = {
  A: {
    name: "Clinical Editorial",
    authority: "Dr. Sarah Mitchell, Board-Certified Specialist",
    tone: "medical journal article — authoritative, evidence-based, clean. Cite specific studies and percentages. Use clinical language where appropriate but keep it accessible.",
    headlinePattern: `"The [Adjective] [Category] [Specialists] Are Recommending to Their Own Patients" or "[Number] [Audience] Switched to This After [Doctor/Specialist] Revealed the Truth About [Category]"`,
  },
  B: {
    name: "Lifestyle Magazine",
    authority: "Staff Editor or Beauty/Wellness Contributor",
    tone: "Cosmopolitan/GQ feature article — polished, aspirational, editorial. Reads like a magazine recommendation, not an ad. First-person editorial voice, like 'our team tested this'.",
    headlinePattern: `"[Number] [Audience] Are [Doing Thing] to [Get Result] — And Editors Say It's The Real Deal" or "The [Category] Secret [Target Demo] Are Obsessed With Right Now"`,
  },
  C: {
    name: "News Exposé",
    authority: "Investigative reporter or unnamed industry insider",
    tone: "Viral news investigation — urgent, revealing, slightly confrontational. Uses 'BREAKING', 'REVEALED', 'Industry insiders say...'. Creates information asymmetry — the reader is learning something others don't want them to know.",
    headlinePattern: `"BREAKING: The [Category] Industry Has Been Hiding This From You" or "Doctors Are Calling This 'The Most Important [Category] Discovery in a Decade'"`,
  },
  D: {
    name: "Warm & Trustworthy",
    authority: "Real customer narrator or relatable community member (mom, pet owner, athlete)",
    tone: "Recommendation from a trusted friend — personal, conversational, cozy. First-person story. 'I was skeptical at first...' Feels like a text from a friend who found something amazing.",
    headlinePattern: `"I've Tried Everything for [Pain Point]. Nothing Worked Until I Found This" or "My [Friend/Sister/Doctor] Told Me About This [Product Category] and I Was Skeptical — Until I Tried It"`,
  },
};

// ─── Block Schema ─────────────────────────────────────────────────────────────

const BLOCK_SCHEMA = `
Available block types and their required fields (all blocks must also have a unique "id"):

urgencyBanner: { type, id, text, style?: "breaking"|"limited"|"trending" }
authorByline: { type, id, author, role?: string, date, category?: string, publicationName?: string, viewCount?: string, liveViewers?: string }
headline: { type, id, text, size: "large"|"medium"|"small", align?: "left"|"center", subheadline?: string }
text: { type, id, content: "HTML string — supports <strong>, <em>, <br>", variant?: "default"|"large-intro"|"pull-quote" }
image: { type, id, label: "descriptive label", hint: "what the image should show", height?: "300px", caption?: string }
socialProof: { type, id, rating: "4.9", reviewCount: "2,847 reviews", customerCount: "50,000+ customers" }
stats: { type, id, heading?: string, stats: [{ value: string, label: string }], layout?: "grid"|"horizontal" }
testimonials: { type, id, heading?: string, testimonials: [{ quote: string, name: string, detail: string }], layout?: "grid"|"stacked", showStars?: true }
numberedSection: { type, id, number: "01", label, headline, body, imageLabel?: string, imageHint?: string }
comparison: { type, id, heading?: string, rows: [{ feature: string, ours: string, theirs: string }] }
prosCons: { type, id, pros: string[], cons: string[] }
timeline: { type, id, heading?: string, steps: [{ label: string, headline: string, body: string }] }
guarantee: { type, id, text, badges?: [{ icon: string, label: string }] }
faq: { type, id, heading?: string, items: [{ question: string, answer: string }] }
asSeenIn: { type, id, publications: string[] }
featureList: { type, id, heading?: string, items: string[], icon?: string }
pricingTiers: { type, id, heading?: string, productHandle: string, tiers: [{ name: string, originalPrice: string, salePrice: string, perUnit?: string, tag?: string, features: string[], highlight?: boolean }], ctaText?: string, guarantee?: string }
offerBox: { type, id, headline, subtext, buttonText, discount?: string, guarantee?: string, urgency?: string, layout?: "stacked"|"horizontal" }
comments: { type, id, heading?: string, comments: [{ name, text, likes?: string, timeAgo, isVerified?: true, isReply?: false }] }
disclaimer: { type, id, text }
divider: { type, id }
note: { type, id, text, style: "info"|"warning"|"highlight" }
`;

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBlocksWithAI(params: {
  productTitle: string;
  productHandle: string;
  productDescription?: string;
  // Structured intake fields (preferred)
  targetCustomer?: string;
  mechanism?: string;
  proof?: string;
  stylePreset?: "A" | "B" | "C" | "D";
  imageUrls?: string[];
  // Legacy free-form fallback
  userPrompt?: string;
}): Promise<Block[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file to use AI generation.",
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const preset = STYLE_PRESETS[params.stylePreset || "A"];

  const systemPrompt = `You are an expert direct-response advertorial copywriter. You write presell pages that sit between a Meta ad and a Shopify product page — they look like editorial content but are engineered to sell. Every page you produce should read like a real magazine article or editorial piece while following proven direct-response structure.

${BLOCK_SCHEMA}

MANDATORY DR PAGE STRUCTURE — follow this order exactly, generating one block per section:
1.  urgencyBanner — sticky top bar with a time-sensitive, specific message. NOT generic "hurry" — tie it to something real: a media feature, a production run, a seasonal surge. Example: "TRENDING: 47,283 people discovered this in the last 30 days — stock is running low"
2.  authorByline — realistic author matching the style preset's authority type. Use the publicationName field.
3.  headline (large) — reads like a real article headline, NEVER an ad. Follow this pattern: ${preset.headlinePattern}
4.  socialProof — real numbers from the proof provided (star rating + review count + customer count)
5.  text (large-intro variant) — opening hook: 2nd-person, relatable pain scenario. Reader should think "that's me." End by TEASING the solution without naming the product yet.
6.  text — pain point escalation: take the initial pain and make it worse. Show the cascade of consequences. Make the reader feel this is serious enough to solve NOW.
7.  text — root cause reframe: "Here's what most people don't realize..." — introduce the mechanism/unique angle as the REAL explanation. Position existing solutions as flawed because they don't address the root cause. Create an information gap only this product fills.
8.  image — product hero image
9.  text — product reveal: NOW name it. Frame as the solution to the root cause. Brief origin story ("After X years of research, [brand] developed..."). This is the payoff.
10. featureList — 3–5 key ingredients or differentiators. Every item must have a specific number: "clinically shown to improve X by 47% in 4 weeks", "3× more bioavailable than standard formulas"
11. stats — 3 specific data points from the proof provided. Use real numbers.
12. testimonials (showStars: true) — 3 customer stories. EACH MUST: include full name + age/city, start with hesitation or skepticism, include a specific timeframe, mention a specific observable result. NOT "this product is amazing" — "I almost didn't order because I'd already tried 3 others. After 2 weeks I noticed my [specific symptom] was actually better."
13. timeline — week-by-week expected results (Week 1, Week 4, Week 8). Specific, observable, believable. Sets expectations and creates anticipation.
14. comparison — product vs. competitors/traditional alternatives. Product wins every row. Include price-per-day framing in one row.
15. pricingTiers — 3-tier offer: 1 unit (starter), 3 units (MOST POPULAR, highlight: true), 6 units (BEST VALUE). Use real math for per-unit savings. Include product handle.
16. guarantee — 60-day money-back guarantee. Brief, reassuring. Remove risk.
17. disclaimer — FDA disclaimer or results disclaimer appropriate for the product category.

COPY RULES — these separate a converting advertorial from generic AI slop:
- Write like a JOURNALIST, not a marketer. The reader should be 80% through the page before they realize they're being sold to. Every paragraph earns the next scroll.
- SPECIFIC > GENERIC: "47,382 women" beats "thousands of women". "In 14 days" beats "quickly". "$3.27/day" beats "affordable". Never round numbers.
- One idea per paragraph. Short paragraphs. Lots of white space. Scannable.
- BANNED WORDS — never use: delve, landscape, testament, showcase, foster, underscore, pivotal, crucial, realm, myriad, tapestry, multifaceted, commendable, intricate, comprehensive, game-changer, revolutionize, holistic, synergy, seamless, cutting-edge, robust, streamline
- No hype adjectives without proof. Don't call it "amazing" — show a 4.8-star rating from 12,400 reviews and let the reader decide.
- The mechanism is the STAR. Devote real space to explaining it. Use analogies. Make the reader feel smarter for understanding it. This is what separates your page from every other advertorial.
- Urgency must feel REAL — never just "limited time". Tie it to: a seasonal sale, a media feature driving demand, a specific production batch size.
- NEVER use placeholder text like [Author Name], [X]%, [City], [Product Name]. Write real, specific copy.
- EVERY block must feel earned — if it doesn't push the reader toward the next block or the purchase, cut it.

Style preset: ${preset.name}
Tone: ${preset.tone}
Authority figure: ${preset.authority}

OUTPUT RULES:
1. Return ONLY a valid JSON array — no markdown code fences, no explanation, nothing else.
2. Generate exactly 15–18 blocks following the DR structure above. Do not exceed 18.
3. Every block MUST have a unique "id" in format "blk_" + 8 random alphanumeric chars.`;

  // Build the user message from structured intake or legacy prompt
  const parts: string[] = [`Product: ${params.productTitle}`];
  if (params.productDescription) parts.push(`Description: ${params.productDescription}`);
  if (params.targetCustomer) parts.push(`Target customer: ${params.targetCustomer}`);
  if (params.mechanism) parts.push(`Mechanism / unique angle: ${params.mechanism}`);
  if (params.proof) parts.push(`Proof: ${params.proof}`);
  if (params.stylePreset) parts.push(`Style preset: ${params.stylePreset} — ${preset.name}`);
  if (params.imageUrls?.length) parts.push(`Product image URLs:\n${params.imageUrls.join("\n")}`);
  if (params.userPrompt) parts.push(`Additional instructions: ${params.userPrompt}`);
  parts.push(`Product handle (use in pricingTiers.productHandle): ${params.productHandle}`);
  parts.push(`\nGenerate a complete advertorial following the 17-section DR structure. Return only a JSON array of blocks.`);

  const userMessage = parts.join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("AI returned no text content. Please try again.");
  }

  let jsonText = textContent.text.trim();
  // Strip markdown code fences if Claude wraps the output anyway
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let blocks: Block[];
  try {
    blocks = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      `AI returned invalid JSON. Please try again. (${e instanceof Error ? e.message : String(e)})`,
    );
  }

  if (!Array.isArray(blocks)) {
    throw new Error("AI returned unexpected data format. Please try again.");
  }

  // Ensure every block has a valid id
  return blocks.map((block) => ({
    ...block,
    id: block.id && typeof block.id === "string" ? block.id : generateBlockId(),
  })) as Block[];
}
