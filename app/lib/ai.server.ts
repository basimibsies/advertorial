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

// ─── Template Structures ──────────────────────────────────────────────────────

const TEMPLATE_STRUCTURES: Record<string, string> = {
  editorial: `BLOCK STRUCTURE — follow this order exactly (14–15 blocks):
1.  headline (size: "large") — editorial article headline. Reads like a real article, not an ad.
2.  authorByline — writer name matching the style preset authority. Include publicationName.
3.  image — hero image (height: "400px"). Use a real image URL if provided, otherwise label/hint only.
4.  text (variant: "large-intro") — opening hook paragraph. 2nd-person, draws the reader in.
5.  headline (size: "medium") — first section heading (the problem or angle)
6.  text — first section body (2 short paragraphs). Address the core pain/desire/comparison.
7.  image — supporting image (height: "320px"). Label and hint relevant to the section.
8.  headline (size: "medium") — second section heading (the solution/product reveal)
9.  text — second section body. Name the product, explain what makes it different.
10. testimonials (showStars: true, layout: "grid") — exactly 3 customer quotes with full names.
11. headline (size: "medium") — conclusion/verdict heading
12. text — short conclusion paragraph. Reassure the reader, mention the guarantee.
13. offerBox — CTA. Include headline, subtext, buttonText, guarantee.
14. faq — 3–4 frequently asked questions with real, specific answers.
15. disclaimer — required legal/advertorial disclosure.`,

  "personal-story": `BLOCK STRUCTURE — follow this order exactly (15–16 blocks):
1.  headline (size: "large") — emotional, first-person headline with <mark> highlight on a key phrase.
2.  authorByline — the narrator. Use viewCount and liveViewers for social proof.
3.  image — hero product/lifestyle image (height: "400px").
4.  text (variant: "large-intro") — opening hook in first-person voice. Sets the scene of the struggle.
5.  note (style: "highlight") — short relatable callout: "If any of this sounds familiar, keep reading."
6.  text — problem body. Make it specific and relatable. 3–4 short paragraphs max.
7.  headline (size: "medium") — the turning point / discovery heading
8.  text — the discovery/product reveal in first-person. Skepticism → surprise at results.
9.  image — product detail image (height: "300px").
10. testimonials (showStars: true, layout: "stacked") — exactly 3 quotes. Each starts with skepticism then confirms results.
11. offerBox — first CTA (headline, subtext, buttonText, guarantee).
12. headline (size: "medium") — risk-reversal heading ("Your Only Risk Is Not Trying")
13. text — guarantee + reassurance paragraph. Personal and warm.
14. offerBox — second CTA with urgency field.
15. comments (5–6 comments) — authentic-sounding community comments with likes.
16. disclaimer — required disclosure.`,

  listicle: `BLOCK STRUCTURE — follow this order exactly (13–14 blocks):
1.  authorByline — editorial team, with viewCount and liveViewers.
2.  headline (size: "large") — "5 Reasons..." format, with subheadline showing date.
3.  socialProof — real-feeling rating (4.8 or 4.9), review count, customer count.
4.  text (variant: "large-intro") — 1-sentence intro for the listicle. Angle-specific.
5.  cta (style: "inline") — early "Check Availability →" button.
6.  numberedSection (number: "01") — Reason One. Specific headline + 2-paragraph body.
7.  numberedSection (number: "02") — Reason Two.
8.  numberedSection (number: "03") — Reason Three.
9.  numberedSection (number: "04") — Reason Four.
10. numberedSection (number: "05") — Reason Five.
11. testimonials (showStars: true, layout: "grid") — 3 customer quotes.
12. offerBox — CTA with discount badge and guarantee.
13. featureList — "What's Included" with 4–5 bullet points.
14. disclaimer.`,

  "research-report": `BLOCK STRUCTURE — follow this order exactly (13–14 blocks):
1.  authorByline — researcher/editor with academic authority. Include publicationName.
2.  headline (size: "large") — data-driven headline with subheadline showing date and "Independent analysis".
3.  asSeenIn — 4–5 well-known publications (Forbes, Healthline, etc.).
4.  stats (layout: "grid") — exactly 4 data points with specific numbers.
5.  text (variant: "large-intro") — research framing intro. Clinical but accessible.
6.  cta (style: "inline") — "View Research & Check Availability".
7.  comparison — product vs alternatives table. 5–6 rows. Product wins all.
8.  numberedSection (number: "01", label: "Finding One") — first key finding with study-style data.
9.  numberedSection (number: "02", label: "Finding Two") — second key finding.
10. numberedSection (number: "03", label: "Finding Three") — third key finding.
11. testimonials (showStars: true, layout: "grid") — 3 quotes from credible-sounding people.
12. featureList — what makes it different (science-focused).
13. offerBox — evidence-based CTA.
14. disclaimer.`,

  "before-after": `BLOCK STRUCTURE — follow this order exactly (13–14 blocks):
1.  authorByline — personal narrator (real name, "Contributing Writer"). Include viewCount.
2.  headline (size: "large") — transformation headline in first-person or close 3rd.
3.  text (variant: "large-intro") — opening hook. The struggle before. Vivid, specific.
4.  note (style: "highlight") — empathetic callout for the reader.
5.  image — product hero (height: "340px", rounded: true).
6.  timeline — 3 steps (Week 1, Week 2, Month 1). Specific, observable milestones.
7.  socialProof — high rating, review count, customer count.
8.  testimonials (showStars: true, layout: "stacked") — 2 detailed transformation stories.
9.  stats (layout: "horizontal") — 3 impressive data points.
10. offerBox — transformation-focused CTA with guarantee and urgency.
11. guarantee — money-back badges (4 badges: shield, lock, truck, star).
12. faq — 3 questions addressing hesitations.
13. comments — 3–4 real-feeling comments from the community.
14. disclaimer.`,
};

const ANGLE_GUIDANCE: Record<string, string> = {
  Pain: `ANGLE — Pain Point: The reader is frustrated. They've tried things that didn't work. Lead with the problem — make them feel understood. Then position this product as the solution others missed because they didn't address the root cause.`,
  Desire: `ANGLE — Aspiration: The reader wants an upgrade. They're not broken — they want better. Paint a picture of the ideal outcome, make them feel it's attainable, then present this product as the clear path to get there.`,
  Comparison: `ANGLE — Comparison: The reader is evaluating options. They're research-minded. Show why the alternatives fall short, present clear differentiators, and help them feel confident they're making the smart choice.`,
};

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBlocksWithAI(params: {
  productTitle: string;
  productHandle: string;
  productDescription?: string;
  // Template + angle (for template-aware generation)
  templateId?: string;
  angle?: string;
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

  const templateStructure = params.templateId ? TEMPLATE_STRUCTURES[params.templateId] : null;
  const angleGuidance = params.angle ? (ANGLE_GUIDANCE[params.angle] || "") : "";

  const structureSection = templateStructure
    ? `${templateStructure}\n\n${angleGuidance}`
    : `MANDATORY DR PAGE STRUCTURE — follow this order exactly, generating one block per section:
1.  authorByline — realistic author matching the style preset's authority type. Use the publicationName field.
2.  headline (large) — reads like a real article headline, NEVER an ad. Follow this pattern: ${preset.headlinePattern}
3.  socialProof — real numbers from the proof provided (star rating + review count + customer count)
4.  text (large-intro variant) — opening hook: 2nd-person, relatable scenario. Reader should think "that's me."
5.  text — pain point or desire escalation: deepen the emotional pull. Show what's at stake.
6.  text — root cause reframe: "Here's what most people don't realize..." — introduce the mechanism as the real explanation.
7.  image — product hero image
8.  text — product reveal: NOW name it. Frame as the solution to the root cause.
9.  featureList — 3–5 key differentiators. Every item must have a specific number or claim.
10. testimonials (showStars: true) — 3 customer stories with full name + detail, each starting with skepticism.
11. offerBox — CTA with headline, subtext, buttonText, guarantee, and urgency.
12. faq — 3 questions addressing the most common hesitations.
13. disclaimer — appropriate for the product category.`;

  const systemPrompt = `You are an expert advertorial copywriter. You write presell pages that look like editorial content — real articles that happen to recommend a product. Every page should be readable, credible, and naturally lead the reader toward a purchase decision.

${BLOCK_SCHEMA}

${structureSection}

COPY RULES:
- Write like a JOURNALIST, not a marketer. Every paragraph earns the next scroll.
- SPECIFIC > GENERIC: "47,382 women" beats "thousands of women". "In 14 days" beats "quickly".
- One idea per paragraph. Short paragraphs. Scannable on mobile.
- BANNED WORDS: delve, landscape, testament, showcase, foster, underscore, pivotal, crucial, realm, myriad, tapestry, multifaceted, commendable, intricate, comprehensive, game-changer, revolutionize, holistic, synergy, seamless, cutting-edge, robust, streamline
- No hype without proof. Don't call it "amazing" — show the 4.8-star rating and let the reader decide.
- The mechanism is the STAR. Explain it clearly. Make the reader feel smarter for understanding it.
- NEVER use placeholder text like [Author Name], [X]%, [City], [Product Name]. Write real, specific copy.

Style preset: ${preset.name}
Tone: ${preset.tone}
Authority figure: ${preset.authority}

OUTPUT RULES:
1. Return ONLY a valid JSON array — no markdown code fences, no explanation, nothing else.
2. Follow the block structure above exactly. Do not add extra blocks or skip blocks.
3. Every block MUST have a unique "id" in format "blk_" + 8 random alphanumeric chars.`;

  // Build the user message from structured intake or legacy prompt
  const parts: string[] = [`Product: ${params.productTitle}`];
  if (params.productDescription) parts.push(`Description: ${params.productDescription}`);
  if (params.targetCustomer) parts.push(`Target customer: ${params.targetCustomer}`);
  if (params.mechanism) parts.push(`Mechanism / unique angle: ${params.mechanism}`);
  if (params.proof) parts.push(`Proof / social proof: ${params.proof}`);
  if (params.stylePreset) parts.push(`Style preset: ${params.stylePreset} — ${preset.name}`);
  if (params.imageUrls?.length) parts.push(`Product image URLs (use the first as the hero image src):\n${params.imageUrls.join("\n")}`);
  if (params.userPrompt) parts.push(`Additional instructions: ${params.userPrompt}`);
  parts.push(`Product handle (for CTA links and offerBox): ${params.productHandle}`);
  const blockCount = templateStructure ? "exactly as specified in the block structure" : "13 blocks";
  parts.push(`\nGenerate the advertorial (${blockCount}). Return only a JSON array of blocks.`);

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
