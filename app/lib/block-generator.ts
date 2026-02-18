// ═══════════════════════════════════════════════════════════════════════════════
// Block Generator
// Generates an initial ordered array of blocks based on template, angle, and
// product data. This is what the AI "writes" — users can then edit in the
// block editor.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Block } from "./blocks";
import { generateBlockId } from "./blocks";
import type { TemplateType, AngleType, TemplateVariantType } from "./templates.server";

interface GenerateBlocksParams {
  productTitle: string;
  productHandle: string;
  productDescription?: string;
  template: TemplateType;
  templateVariant?: TemplateVariantType;
  angle: AngleType;
}

function esc(text: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ─── Story Template Blocks ────────────────────────────────────────────────────

function generateStoryBlocks(
  productTitle: string,
  _productHandle: string,
  productDescription: string,
  angle: AngleType,
): Block[] {
  const pt = esc(productTitle);

  const angleConfigs = {
    Pain: {
      hookParagraphs: [
        `You've tried everything. Spent the money, read the reviews, ordered the "top-rated" options — and <strong>still ended up disappointed</strong>.`,
        `It's not your fault. Most products in this space are built on hype, not substance. They look great in ads but fall apart in real life.`,
        `That's why when ${pt} started gaining real traction, people were skeptical. Another one? Really?`,
        `But the results kept coming in. And they weren't just good — they were <strong>undeniable</strong>.`,
      ],
      benefits: [
        { label: "THE PROBLEM", headline: "You Were Never the Problem", body: `Most products fail because they're designed for the masses, not for you. ${pt} was built differently — engineered to address the specific frustrations that other solutions ignore. No more settling for "good enough."`, imgLabel: "Insert lifestyle image: frustrated customer with generic products", imgHint: "Before photo or problem visualization — show the pain point" },
        { label: "THE SOLUTION", headline: `Why ${pt} Actually Works`, body: `${productDescription ? esc(productDescription) + " " : ""}What separates ${pt} from everything else? It starts with the fundamentals — quality materials, thoughtful design, and a relentless focus on real-world results rather than marketing claims.`, imgLabel: "Insert product hero shot or unboxing image", imgHint: "Clean product photography — show quality and detail" },
        { label: "THE RESULTS", headline: "Real Results from Real People", body: `Customers aren't just satisfied — they're genuinely surprised by the difference. When you use ${pt}, you feel it. And once you feel it, you understand why people don't go back.`, imgLabel: "Insert before/after or results graphic", imgHint: "Transformation visual, results comparison, or customer photos" },
      ],
      testimonials: [
        { quote: `I was SO skeptical. I've been burned before. But ${pt} actually delivered. I'm genuinely impressed and have already told all my friends.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `This replaced [X] products I was using before. Simpler, better results, and I'm actually saving money. Why didn't I switch sooner?`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `I never write reviews. But this deserved one. ${pt} is the real deal. If you're on the fence — just do it.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]%", label: "of customers report noticeable improvement" },
        { value: "[X]%", label: "say it outperforms their previous solution" },
        { value: "[X]%", label: "would recommend to a friend" },
        { value: "[X]x", label: "better value vs. leading competitors" },
      ],
      ctaHeadline: "Ready to Stop Settling?",
      ctaSubtext: "Join thousands who finally found a solution that works. Try it risk-free today.",
      ctaButton: `Try ${pt} Now`,
      noteText: `<strong>Note:</strong> "I ditched my old solution INSTANTLY after trying ${pt}!"`,
    },
    Desire: {
      hookParagraphs: [
        `Something is happening. Quietly, without much fanfare, <strong>thousands of people are transforming their daily experience</strong> — and they all point to the same thing.`,
        `It's not a hack. It's not a trend. It's ${pt}.`,
        `What started as a word-of-mouth recommendation has turned into a movement. And once you understand why, you'll see why people can't stop talking about it.`,
        `Here's the story behind the product that's redefining what "quality" actually means.`,
      ],
      benefits: [
        { label: "ELEVATE", headline: "A New Standard for Your Daily Routine", body: `Imagine starting each day knowing you have the best. Not the most expensive — the best. ${pt} was designed for people who refuse to compromise, who know the difference between marketing and genuine quality.`, imgLabel: "Insert aspirational lifestyle image", imgHint: "Show the elevated lifestyle — premium, aspirational feel" },
        { label: "TRANSFORM", headline: `What Makes ${pt} Different`, body: `${productDescription ? esc(productDescription) + " " : ""}Every detail has been considered. From design to performance, ${pt} delivers an experience that compounds — it gets better the more you use it. That's not an accident. It's by design.`, imgLabel: "Insert product detail or feature breakdown graphic", imgHint: "Highlight key features, ingredients, or craftsmanship details" },
        { label: "THRIVE", headline: "Join a Community That Gets It", body: `When you choose ${pt}, you're joining a growing community of people who have raised their standards. People who share results, tips, and genuine enthusiasm — because the product earns it.`, imgLabel: "Insert community / social proof collage", imgHint: "UGC grid, customer photos, or community moments" },
      ],
      testimonials: [
        { quote: `I didn't think a product could actually live up to the hype. ${pt} proved me wrong. It's genuinely elevated my routine.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `The quality is unreal. You can feel the difference the first time you use it. I've told everyone I know.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `I was paying more for worse results with my old solution. ${pt} is better AND more affordable. No-brainer.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]K+", label: "happy customers and counting" },
        { value: "[X]%", label: "say it exceeded expectations" },
        { value: "[X]%", label: "repurchase within 60 days" },
        { value: "#1", label: "rated in its category" },
      ],
      ctaHeadline: "Your Upgrade Is Waiting",
      ctaSubtext: "Experience what thousands already have. Start your transformation today.",
      ctaButton: `Get ${pt} Now`,
      noteText: `<strong>Trending:</strong> Over [X]K customers have made the switch to ${pt} this month alone.`,
    },
    Comparison: {
      hookParagraphs: [
        `Let's be honest: you have options. Lots of them. And most of them will tell you they're "the best."`,
        `So how do you actually tell? <strong>You look at what real customers say after they've tried both sides.</strong>`,
        `That's exactly what we did. We talked to people who switched to ${pt} from the leading alternatives — and the consensus was clear.`,
        `Here's what the data (and the customers) reveal.`,
      ],
      benefits: [
        { label: "QUALITY", headline: "Superior Quality, No Compromises", body: `While competitors cut corners to maximize margins, ${pt} invests where it matters. Every material, every feature, every detail — designed to deliver results you can actually feel. The difference isn't subtle.`, imgLabel: "Insert side-by-side comparison image", imgHint: "Our product vs. competitor — visual quality comparison" },
        { label: "VALUE", headline: "Better Results at a Better Price", body: `${productDescription ? esc(productDescription) + " " : ""}When you factor in performance, longevity, and actual results, ${pt} delivers significantly more value. Customers report spending less over time while getting better outcomes.`, imgLabel: "Insert value comparison or cost breakdown graphic", imgHint: "Price/value comparison chart or savings visualization" },
        { label: "TRUST", headline: "Backed by Customers, Not Just Marketing", body: `Anyone can run ads. Not everyone can earn genuine loyalty. ${pt} has built its reputation on real results from real people — and once you try it, you'll understand the difference between a marketed brand and an earned one.`, imgLabel: "Insert trust signals graphic", imgHint: "Review screenshots, ratings badges, or press mentions" },
      ],
      testimonials: [
        { quote: `I was using [Competitor] for a year before switching. The difference was night and day. ${pt} is simply better.`, name: "[Customer Name]", detail: "Verified Buyer · Switched from [Competitor]" },
        { quote: `Why did I wait so long? ${pt} outperforms my old solution at half the hassle. I feel like I was settling before.`, name: "[Customer Name]", detail: "Verified Buyer · Switched from [Competitor]" },
        { quote: `After comparing everything on the market, ${pt} won in every category that mattered to me.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]%", label: "of switchers say they'll never go back" },
        { value: "[X]x", label: "better value vs. leading competitor" },
        { value: "[X]%", label: "higher satisfaction rating" },
        { value: "[X]%", label: "recommend over alternatives" },
      ],
      ctaHeadline: "See the Difference Yourself",
      ctaSubtext: "Join the thousands who compared — and chose us. Try it risk-free today.",
      ctaButton: `Try ${pt} Now`,
      noteText: `<strong>EXPOSING</strong> the truth about ${pt}'s competitors, once and for all...`,
    },
  };

  const c = angleConfigs[angle];
  const blocks: Block[] = [];

  // ── ABOVE THE FOLD ──────────────────────────────────────────────────
  // Author byline (magazine feel — like StoryClicks/Earth Breeze)
  blocks.push({ type: "authorByline", id: generateBlockId(), author: "[Author Name]", role: "Contributing Writer", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), category: angle === "Comparison" ? "REVIEW" : "FEATURE", publicationName: "[Publication Name]" });

  // Hero image
  blocks.push({ type: "image", id: generateBlockId(), label: "Insert hero image", hint: "Product hero shot, lifestyle image, or brand visual — sets the tone for the entire page", height: "340px" });

  // As Seen In bar
  blocks.push({ type: "asSeenIn", id: generateBlockId(), publications: ["VOGUE", "ELLE", "Forbes", "Health Magazine"] });

  // ── THE HOOK / LEAD ─────────────────────────────────────────────────
  blocks.push({ type: "text", id: generateBlockId(), content: c.hookParagraphs.join("<br><br>") });

  // Social proof bar
  blocks.push({ type: "socialProof", id: generateBlockId(), rating: "4.8", reviewCount: "[X]K+", customerCount: "[X]K+" });

  // Inline CTA
  blocks.push({ type: "cta", id: generateBlockId(), headline: "", subtext: "", buttonText: `Discover ${pt} →`, style: "inline" });

  // ── NUMBERED BENEFIT SECTIONS ───────────────────────────────────────
  c.benefits.forEach((b, i) => {
    blocks.push({
      type: "numberedSection", id: generateBlockId(),
      number: String(i + 1).padStart(2, "0"), label: b.label,
      headline: b.headline, body: b.body,
      imageLabel: b.imgLabel, imageHint: b.imgHint,
    });
  });

  // ── FIRST OFFER BOX ─────────────────────────────────────────────────
  blocks.push({ type: "offerBox", id: generateBlockId(), headline: `Try ${pt} Today`, subtext: "See why thousands are making the switch.", buttonText: "Check Availability", discount: "[X]% OFF — Limited Time", guarantee: "[X]-Day Money-Back Guarantee", urgency: "Limited time offer — only available while supplies last" });

  // ── FEATURE CHECKLIST ───────────────────────────────────────────────
  blocks.push({ type: "featureList", id: generateBlockId(), heading: `Why ${pt} Stands Out`, items: [
    "Stays in place through a full day without readjusting",
    "Delivers visible, measurable results",
    "Replaces multiple products you're already buying",
    "Comfortable enough to forget you're using it",
    "Looks intentional, not purely functional",
    "Backed by [X]K+ verified customer reviews",
  ], icon: "✓" });

  // ── COMPARISON TABLE (comparison angle) ─────────────────────────────
  if (angle === "Comparison") {
    blocks.push({
      type: "comparison", id: generateBlockId(),
      heading: `${pt} vs. The Competition`,
      rows: [
        { feature: "Quality", ours: "✓ Premium", theirs: "✗ Standard" },
        { feature: "Effectiveness", ours: "✓ Clinically backed", theirs: "✗ Unverified" },
        { feature: "Value for Money", ours: "✓ Better long-term", theirs: "✗ Hidden costs" },
        { feature: "Customer Satisfaction", ours: "✓ [X]% positive", theirs: "✗ Mixed reviews" },
        { feature: "Transparency", ours: "✓ Full ingredient list", theirs: "✗ Proprietary blends" },
      ],
    });
  }

  // ── STATISTICS ──────────────────────────────────────────────────────
  blocks.push({ type: "stats", id: generateBlockId(), heading: "Real Customers, Real Results", stats: c.stats });

  // ── TESTIMONIALS ────────────────────────────────────────────────────
  blocks.push({ type: "testimonials", id: generateBlockId(), heading: "What Customers Are Saying", testimonials: c.testimonials });

  // Inline CTA
  blocks.push({ type: "cta", id: generateBlockId(), headline: "", subtext: "", buttonText: `Shop ${pt} Now →`, style: "inline" });

  // ── TIMELINE ────────────────────────────────────────────────────────
  blocks.push({
    type: "timeline", id: generateBlockId(), heading: "What to Expect",
    steps: [
      { label: "Day 1", headline: "Immediate Impression", body: "Notice the quality difference right away." },
      { label: "Week 1", headline: "Building the Habit", body: "It becomes part of your routine — and you start seeing why." },
      { label: "Month 1", headline: "Real Results", body: "You'll wonder how you ever went without it." },
    ],
  });

  // ── FAQ / OBJECTIONS ────────────────────────────────────────────────
  blocks.push({ type: "faq", id: generateBlockId(), heading: "Frequently Asked Questions", items: [
    { question: `How does ${pt} work?`, answer: `${pt} is designed to [describe mechanism]. Simply [describe usage] and you'll begin to see results within [timeframe].` },
    { question: "How long does it take to see results?", answer: "Most customers report noticeable improvements within [X] days of consistent use. Full results typically appear within [X] weeks." },
    { question: "Is there a money-back guarantee?", answer: "Yes! We offer a full [X]-day money-back guarantee. If you're not completely satisfied, simply contact us for a full refund — no questions asked." },
    { question: "How is this different from [competitor/alternative]?", answer: `Unlike other solutions that [describe shortcoming], ${pt} [describe advantage]. That's why [X]% of customers who switch never go back.` },
    { question: "What are the ingredients / materials?", answer: `${pt} is made with [describe key ingredients/materials]. We're fully transparent about what goes into every product — no proprietary blends or hidden fillers.` },
  ] });

  // ── COMMENTS SECTION ────────────────────────────────────────────────
  blocks.push({ type: "comments", id: generateBlockId(), heading: "Comments", comments: [
    { name: "[Customer Name]", text: `OK so I was super skeptical about ${pt} but WOW. I've been using it for 3 weeks now and the results are actually incredible. I used to struggle with [pain point] every single day and now it's completely different. Plus it's so easy to use — I actually look forward to it 😍`, likes: "143", timeAgo: "2 days ago" },
    { name: "[Customer Name]", text: `Same!! The quality is what sold me honestly. I've tried so many alternatives that just didn't work.`, likes: "28", timeAgo: "1 day ago" },
    { name: "[Customer Name]", text: `Been using ${pt} for about 2 months now and honestly it's the only solution I've ever stuck with. My [friend/partner] even noticed the difference. Worth every penny.`, likes: "87", timeAgo: "5 hours ago" },
    { name: "[Customer Name]", text: `Just got my second order! I stopped buying [alternatives] because ${pt} has everything I need. Saves me so much money 🙌`, likes: "156", timeAgo: "1 week ago" },
    { name: "[Customer Name]", text: `Switched from [Competitor] to ${pt} and honestly don't miss it at all. Saving money and getting better results. No more [pain point]!`, likes: "167", timeAgo: "1 day ago" },
  ] });

  // ── FINAL OFFER BOX ─────────────────────────────────────────────────
  blocks.push({ type: "offerBox", id: generateBlockId(), headline: c.ctaHeadline, subtext: c.ctaSubtext, buttonText: c.ctaButton, discount: "[X]% OFF", guarantee: "[X]-Day Money-Back Guarantee", urgency: "Special offer — this discount ends soon" });

  // ── DISCLAIMER ──────────────────────────────────────────────────────
  blocks.push({ type: "disclaimer", id: generateBlockId(), text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. THE STORY DEPICTED ON THIS SITE AND THE PERSON DEPICTED IN THE STORY ARE NOT ACTUAL NEWS. RATHER, THIS STORY IS BASED ON THE RESULTS THAT SOME PEOPLE WHO HAVE USED THESE PRODUCTS HAVE ACHIEVED. THE RESULTS PORTRAYED IN THE STORY AND IN THE COMMENTS ARE ILLUSTRATIVE, AND MAY NOT BE THE RESULTS THAT YOU ACHIEVE WITH THESE PRODUCTS. THIS PAGE COULD RECEIVE COMPENSATION FOR CLICKS ON OR PURCHASE OF PRODUCTS FEATURED ON THIS SITE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on the site." });

  return blocks;
}

// ─── Listicle Template Blocks ─────────────────────────────────────────────────

function generateListicleBlocks(
  productTitle: string,
  _productHandle: string,
  productDescription: string,
  angle: AngleType,
): Block[] {
  const pt = esc(productTitle);

  const angleConfigs = {
    Pain: {
      intro: `If you've been let down by one too many products that didn't deliver — you're not alone. Here's why <strong>${pt}</strong> is different, and why people who've tried everything else are calling it a game-changer.`,
      reasons: [
        { headline: "It Was Built for the Problem You Actually Have", body: `Most products are designed for the average person with the average problem. ${pt} was designed for people who've already tried the obvious solutions and need something that actually works.`, imgLabel: "Insert problem illustration", imgHint: "Visual showing the common frustration or pain point" },
        { headline: "The Results Speak for Themselves", body: `We don't need to oversell it. Customer after customer reports the same thing: "Why didn't I try this sooner?" When the product works, the proof shows up in real life — not just marketing.`, imgLabel: "Insert results or before/after graphic", imgHint: "Before/after, data visualization, or customer result photos" },
        { headline: "No More Wasting Money on Half-Solutions", body: `How much have you spent on products that ended up collecting dust? ${pt} is designed to replace multiple inferior solutions with one that actually delivers.`, imgLabel: "Insert value comparison graphic", imgHint: "Cost comparison showing savings vs. alternatives" },
        { headline: "Backed by a Community, Not Just a Company", body: `Join [X]K+ customers who've made the switch. Real people sharing real results, tips, and honest reviews. When this many people agree — it's not marketing, it's momentum.`, imgLabel: "Insert social proof collage", imgHint: "Customer review screenshots, UGC photos, or community highlights" },
        { headline: "Risk-Free: Because We're That Confident", body: `We stand behind ${pt} with a full [X]-day money-back guarantee. Try it, use it, test it. If it doesn't deliver — you get your money back. No fine print, no hassle.`, imgLabel: "Insert guarantee / trust badge graphic", imgHint: "Money-back guarantee seal, trust badges, or secure checkout icons" },
      ],
      testimonials: [
        { quote: `After years of trying everything, I was ready to give up. ${pt} was genuinely the first thing that worked. I'm still shocked.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `I've told my whole family about this. It's rare that something actually lives up to the hype — this exceeded it.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `The quality is immediately obvious. You can tell this was made by people who care. 10/10.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]%", label: "report noticeable improvement" },
        { value: "[X]%", label: "replaced a more expensive solution" },
        { value: "[X]%", label: "would recommend to a friend" },
      ],
      ctaHeadline: "Stop Wasting Money on Things That Don't Work",
      ctaSubtext: `Try ${pt} risk-free today and finally experience the difference.`,
      ctaButton: `Get ${pt} Now`,
      noteText: `<strong>Note:</strong> "I ditched my old solution INSTANTLY after finding out about ${pt}!"`,
    },
    Desire: {
      intro: `There's a reason <strong>${pt}</strong> keeps showing up in your feed. It's not just hype — it's what happens when a product actually delivers on its promises. Here's why people can't stop talking about it.`,
      reasons: [
        { headline: "It Makes Your Daily Routine Actually Enjoyable", body: `The best products aren't just effective — they're a joy to use. ${pt} was designed to feel like an upgrade every single time. No chores, no compromises.`, imgLabel: "Insert lifestyle / routine image", imgHint: "Aspirational daily routine photo — premium feel" },
        { headline: "The Quality Is Immediately Obvious", body: `From the moment you unbox it, you can feel the difference. Every detail — from materials to design to performance — was crafted for people who know the difference between "fine" and "exceptional."`, imgLabel: "Insert premium product detail shot", imgHint: "Close-up product photography showing quality and craftsmanship" },
        { headline: "People Can't Stop Recommending It", body: `Our highest-converting channel? Word of mouth. When [X]% of customers actively recommend something to friends, that says more than any ad campaign ever could.`, imgLabel: "Insert customer review screenshots", imgHint: "Grid of real customer reviews and ratings" },
        { headline: "It Replaces Multiple Products You're Already Buying", body: `${productDescription ? esc(productDescription) + " " : ""}Why use three mediocre solutions when one great one does the job? ${pt} simplifies your life while delivering better results.`, imgLabel: "Insert product comparison graphic", imgHint: "Visual showing how one product replaces many" },
        { headline: "It Keeps Getting Better", body: `We don't launch and forget. ${pt} is continuously refined based on customer feedback, new research, and our obsession with making the best product in its category.`, imgLabel: "Insert innovation graphic", imgHint: "Product evolution, new features, or improvement timeline" },
        { headline: "It's an Investment That Pays for Itself", body: `When you factor in the quality, longevity, and results — ${pt} doesn't cost more. It saves you money. Customers report spending less overall after making the switch.`, imgLabel: "Insert savings visualization", imgHint: "Cost savings comparison chart or value breakdown" },
      ],
      testimonials: [
        { quote: `I don't get obsessed with products easily. But ${pt}? Obsessed. It's genuinely transformed my routine.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `The hype is real. I was skeptical, bought it anyway, and now I understand. This is the real deal.`, name: "[Customer Name]", detail: "Verified Buyer" },
        { quote: `If you're reading reviews trying to decide — just get it. I wish I hadn't waited as long as I did.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]K+", label: "happy customers worldwide" },
        { value: "[X]%", label: "repurchase rate" },
        { value: "[X]%", label: "say it exceeded expectations" },
      ],
      ctaHeadline: "Ready to See What the Hype Is About?",
      ctaSubtext: `Join [X]K+ customers who upgraded to ${pt}. Your future self will thank you.`,
      ctaButton: `Shop ${pt} Now`,
      noteText: `<strong>Trending:</strong> ${pt} is the #1 most-recommended product in its category this month.`,
    },
    Comparison: {
      intro: `You've seen the ads from every brand claiming to be "#1." So we did the work for you. Here's an <strong>honest, side-by-side comparison</strong> of ${pt} vs. the most popular alternatives — and why customers keep choosing us.`,
      reasons: [
        { headline: "Premium Ingredients / Materials (Where Others Cut Corners)", body: `We publish exactly what goes into ${pt} — no proprietary blends, no hidden fillers. Compare that to competitors who hide behind vague labels. When you see what's inside, the choice is obvious.`, imgLabel: "Insert ingredient/material comparison", imgHint: "Side-by-side ingredient list or materials breakdown vs. competitor" },
        { headline: "Honest Pricing (No Tricks, No Markup Games)", body: `Some competitors charge 2-3x for the same (or worse) results. ${pt} delivers premium quality at a price that makes sense. No inflated "retail prices" and fake discounts.`, imgLabel: "Insert price comparison chart", imgHint: "Price per unit/serving comparison table showing value" },
        { headline: "Real Customer Reviews (Not Cherry-Picked)", body: `We don't hide our 1-star reviews. We learn from them. That transparency is why our average rating is [X] stars across [X]K+ reviews — earned, not manufactured.`, imgLabel: "Insert review distribution graphic", imgHint: "Review histogram or authentic review screenshots" },
        { headline: "Better Customer Experience (Before and After Purchase)", body: `Fast shipping, responsive support, and a no-questions-asked return policy. Many competitors make returns a nightmare. We make them effortless.`, imgLabel: "Insert customer experience comparison", imgHint: "Service comparison: shipping times, support quality, return policy" },
        { headline: "Results That Actually Hold Up Over Time", body: `Quick fixes fade. ${pt} is built for sustained results. Our customers don't just like us at first — they become more loyal over time.`, imgLabel: "Insert retention data graphic", imgHint: "Customer retention chart, long-term results data, or timeline" },
      ],
      testimonials: [
        { quote: `I compared everything on the market. Price, quality, reviews — ${pt} won in every category. Not even close.`, name: "[Customer Name]", detail: "Verified Buyer · Switched from [Competitor]" },
        { quote: `Was using [Competitor] for years. Made the switch and honestly can't believe the difference. ${pt} is leagues ahead.`, name: "[Customer Name]", detail: "Verified Buyer · Switched from [Competitor]" },
        { quote: `The transparency alone won me over. Every ingredient listed, real reviews shown, honest pricing. Refreshing.`, name: "[Customer Name]", detail: "Verified Buyer" },
      ],
      stats: [
        { value: "[X]%", label: "of switchers never go back" },
        { value: "[X]x", label: "better value per dollar" },
        { value: "[X]★", label: "average rating across all reviews" },
      ],
      ctaHeadline: "The Comparison Is Clear",
      ctaSubtext: `Try ${pt} risk-free and see why customers switch — and stay.`,
      ctaButton: `Try ${pt} Now`,
      noteText: `<strong>EXPOSING</strong> the truth about ${pt}'s competitors, once and for all...`,
    },
  };

  const c = angleConfigs[angle];
  const blocks: Block[] = [];

  // ── ABOVE THE FOLD ──────────────────────────────────────────────────
  blocks.push({ type: "authorByline", id: generateBlockId(), author: "[Author Name]", role: angle === "Comparison" ? "Product Reviewer" : "Contributing Writer", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), category: angle === "Comparison" ? "HONEST REVIEW" : angle === "Pain" ? "HEALTH TIP" : "TRENDING NOW", publicationName: "[Publication Name]" });

  // Hero image
  blocks.push({ type: "image", id: generateBlockId(), label: "Insert hero image", hint: "Product hero shot or lifestyle banner — make it thumb-stopping for ads", height: "340px" });

  // As Seen In
  blocks.push({ type: "asSeenIn", id: generateBlockId(), publications: ["Forbes", "Health Magazine", "Glamour", "The New York Times"] });

  // ── INTRODUCTION ────────────────────────────────────────────────────
  blocks.push({ type: "text", id: generateBlockId(), content: c.intro });

  // Social proof
  blocks.push({ type: "socialProof", id: generateBlockId(), rating: "4.8", reviewCount: "[X]K+", customerCount: "[X]K+" });

  // Inline CTA
  blocks.push({ type: "cta", id: generateBlockId(), headline: "", subtext: "", buttonText: `Discover ${pt} →`, style: "inline" });

  // ── NUMBERED REASONS ────────────────────────────────────────────────
  c.reasons.forEach((r, i) => {
    blocks.push({
      type: "numberedSection", id: generateBlockId(),
      number: String(i + 1).padStart(2, "0"), label: `REASON ${i + 1}`,
      headline: r.headline, body: r.body,
      imageLabel: r.imgLabel, imageHint: r.imgHint,
    });
    // Add inline CTA after the middle reason
    if (i === Math.floor(c.reasons.length / 2) - 1) {
      blocks.push({ type: "offerBox", id: generateBlockId(), headline: `Special Offer for ${pt}`, subtext: `Get started with [X]% OFF today! This discount ends soon. Over [X]K+ reviews. Stock is running low.`, buttonText: "Claim Your Discount", discount: "[X]% OFF", guarantee: "[X]-Day Money-Back Guarantee", urgency: "Limited time offer — only available while supplies last" });
    }
  });

  // ── COMPARISON TABLE (comparison angle) ─────────────────────────────
  if (angle === "Comparison") {
    blocks.push({
      type: "comparison", id: generateBlockId(),
      heading: `${pt} vs. The Competition`,
      rows: [
        { feature: "Quality / Ingredients", ours: "✓ Transparent & premium", theirs: "✗ Hidden / proprietary" },
        { feature: "Price Fairness", ours: "✓ Honest pricing", theirs: "✗ Inflated MSRP" },
        { feature: "Customer Reviews", ours: "✓ [X]★ ([X]K+ reviews)", theirs: "✗ Limited / filtered" },
        { feature: "Money-Back Guarantee", ours: "✓ [X] days, no hassle", theirs: "✗ Strict / unclear" },
        { feature: "Customer Support", ours: "✓ Fast, human support", theirs: "✗ Slow / outsourced" },
      ],
    });
  }

  // ── STATS ───────────────────────────────────────────────────────────
  blocks.push({ type: "stats", id: generateBlockId(), heading: "The Numbers Don't Lie", stats: c.stats });

  // ── TESTIMONIALS ────────────────────────────────────────────────────
  blocks.push({ type: "testimonials", id: generateBlockId(), heading: "Hear It from Real Customers", testimonials: c.testimonials });

  // ── PROS / CONS ─────────────────────────────────────────────────────
  blocks.push({
    type: "prosCons", id: generateBlockId(),
    pros: [
      "Delivers real, noticeable results",
      "Premium quality at a fair price",
      "Replaces multiple products you're already buying",
      "Backed by [X]K+ genuine customer reviews",
      "[X]-day money-back guarantee",
      "Fast & free shipping",
    ],
    cons: [`Best pricing only available on the official ${pt} website`],
  });

  // Inline CTA
  blocks.push({ type: "cta", id: generateBlockId(), headline: "", subtext: "", buttonText: `Shop ${pt} Now →`, style: "inline" });

  // ── FAQ / OBJECTIONS ────────────────────────────────────────────────
  blocks.push({ type: "faq", id: generateBlockId(), heading: "Frequently Asked Questions", items: [
    { question: `How does ${pt} work?`, answer: `${pt} is designed to [describe mechanism]. Simply [describe usage] and you'll begin to see results within [timeframe].` },
    { question: "How long does it take to see results?", answer: "Most customers report noticeable improvements within [X] days. Full results typically appear within [X] weeks." },
    { question: "Is there a money-back guarantee?", answer: "Yes! We offer a full [X]-day money-back guarantee. If you're not satisfied, contact us for a full refund — no questions asked." },
    { question: `How is ${pt} different from alternatives?`, answer: `Unlike other options that [describe shortcoming], ${pt} [describe advantage]. That's why [X]% of customers who switch never go back.` },
  ] });

  // ── COMMENTS ────────────────────────────────────────────────────────
  blocks.push({ type: "comments", id: generateBlockId(), heading: "Comments", comments: [
    { name: "[Customer Name]", text: `Ok so I was super skeptical about ${pt} but WOW. I've been using it for 3 weeks now and the results are actually insane. I used to struggle with [pain point] every day and now I'm completely different. Plus it's so easy — I actually look forward to it 😍`, likes: "143", timeAgo: "2 days ago" },
    { name: "[Customer Name]", text: `Same!! The quality is what sold me honestly. I've tried so many alternatives that just didn't work.`, likes: "28", timeAgo: "1 day ago" },
    { name: "[Customer Name]", text: `Been using ${pt} for about 2 months now and it's the only solution I've ever stuck with consistently. My friends even noticed the difference lol. Worth every penny.`, likes: "87", timeAgo: "5 hours ago" },
    { name: "[Customer Name]", text: `Switched from [Competitor] to ${pt} and honestly don't miss it at all. Saving money too and getting basically the same or better results. Game changer!`, likes: "167", timeAgo: "1 day ago" },
    { name: "[Customer Name]", text: `Just got my second order delivered! I stopped buying [alternatives] because ${pt} has everything I need. Saves me so much money and hassle 🙌`, likes: "156", timeAgo: "1 week ago" },
  ] });

  // ── FINAL OFFER BOX ─────────────────────────────────────────────────
  blocks.push({ type: "offerBox", id: generateBlockId(), headline: c.ctaHeadline, subtext: c.ctaSubtext, buttonText: c.ctaButton, discount: "[X]% OFF", guarantee: "[X]-Day Money-Back Guarantee", urgency: "Special offer — this discount ends soon" });

  // ── DISCLAIMER ──────────────────────────────────────────────────────
  blocks.push({ type: "disclaimer", id: generateBlockId(), text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. THE STORY DEPICTED ON THIS SITE AND THE PERSON DEPICTED IN THE STORY ARE NOT ACTUAL NEWS. RATHER, THIS STORY IS BASED ON THE RESULTS THAT SOME PEOPLE WHO HAVE USED THESE PRODUCTS HAVE ACHIEVED. THE RESULTS PORTRAYED IN THE STORY AND IN THE COMMENTS ARE ILLUSTRATIVE, AND MAY NOT BE THE RESULTS THAT YOU ACHIEVE WITH THESE PRODUCTS. THIS PAGE COULD RECEIVE COMPENSATION FOR CLICKS ON OR PURCHASE OF PRODUCTS FEATURED ON THIS SITE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on the site." });

  return blocks;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

function generateBasicStoryVariantBlocks(
  productTitle: string,
  productDescription: string,
  angle: AngleType,
  variant: Exclude<TemplateVariantType, "listicle-comparison">,
): Block[] {
  const pt = esc(productTitle);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const introByAngle = {
    Pain: `Many shoppers dealing with the same issue say they felt stuck: they tried popular options, spent money, and still didn't get consistent results. This guide breaks down why that happens and how <strong>${pt}</strong> is designed to solve that exact gap.`,
    Desire: `People looking to upgrade their daily routine are increasingly choosing <strong>${pt}</strong> for one simple reason: it combines practical performance with an experience that feels premium. Here's a clear breakdown of what makes it stand out.`,
    Comparison: `With so many lookalike options on the market, it is hard to see which one is actually better. We reviewed what matters most in this category and compared common alternatives with <strong>${pt}</strong> in a straightforward way.`,
  };

  const headingTwoByAngle = {
    Pain: "[Heading 2] Why most alternatives fail to solve the real problem",
    Desire: "[Heading 2] What makes this option feel like a real upgrade",
    Comparison: "[Heading 2] Side-by-side: where the differences actually matter",
  };

  const headingThreeByAngle = {
    Pain: "[Heading 3] What to expect after consistent use",
    Desire: "[Heading 3] Results customers report after making the switch",
    Comparison: "[Heading 3] Is it worth it for long-term value?",
  };

  const blocks: Block[] = [
    {
      type: "headline",
      id: generateBlockId(),
      text: "[Heading 1] Describe the needs of users who are interested in the product.",
      size: "large",
    },
    {
      type: "authorByline",
      id: generateBlockId(),
      author: "Dr. Marcus",
      role: "Contributor",
      date,
      publicationName: "Gemadvertorial",
    },
    {
      type: "featureList",
      id: generateBlockId(),
      heading: "Unique Value Proposition",
      items: [
        "Product benefit 1",
        "Product benefit 2",
        "Product benefit 3",
        "Product benefit 4",
      ],
      icon: "✓",
    },
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Official Offer",
      subtext: "Check current pricing, availability, and guarantee terms.",
      buttonText: "CHECK AVAILABILITY",
      guarantee: "30-Day Money-Back Guarantee",
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert product image",
      hint: "Product shot for sidebar — clean product photography",
      height: "180px",
      placement: "sidebar",
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert primary lifestyle image",
      hint: "Use a contextual image that reflects the reader's problem or desired outcome",
      height: "380px",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `${introByAngle[angle]} ${productDescription ? `<br><br>${esc(productDescription)}` : ""}`,
    },
    {
      type: "headline",
      id: generateBlockId(),
      text: headingTwoByAngle[angle],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `Use this section to explain the key mechanism behind <strong>${pt}</strong>. Keep the copy simple, specific, and benefit-led. Include concrete points the reader can verify, such as materials, usage process, or expected timeline.`,
    },
    {
      type: "headline",
      id: generateBlockId(),
      text: headingThreeByAngle[angle],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `Close with realistic expectations and a direct next step. Reinforce risk-reversal with the guarantee and remind readers to purchase only from the official source to secure the latest pricing and support.`,
    },
    {
      type: "faq",
      id: generateBlockId(),
      heading: "Frequently Asked Questions",
      items: [
        { question: `How does ${pt} work?`, answer: `${pt} is designed to address the core problem in this category through a repeatable daily use approach.` },
        { question: "How long until users typically notice results?", answer: "Many users report early changes in the first 1-2 weeks, with stronger outcomes over consistent use." },
        { question: "Is there a money-back guarantee?", answer: "Yes. Orders are covered by a 30-day money-back guarantee when purchased from official channels." },
      ],
    },
    {
      type: "disclaimer",
      id: generateBlockId(),
      text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on this site.",
    },
  ];

  if (variant === "story-problem-solution") {
    blocks.splice(6, 0, {
      type: "note",
      id: generateBlockId(),
      style: "highlight",
      text: `Problem: readers need a dependable solution they can stick with. Solution: ${pt} focuses on practical daily use and measurable benefits rather than hype.`,
    });
  }

  return blocks;
}

function generateBasicListicleComparisonBlocks(
  productTitle: string,
  productDescription: string,
): Block[] {
  const pt = esc(productTitle);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return [
    {
      type: "headline",
      id: generateBlockId(),
      text: `5 Reasons People Choose ${pt} Over Alternatives`,
      size: "large",
    },
    {
      type: "authorByline",
      id: generateBlockId(),
      author: "Editorial Team",
      role: "Product Research",
      date,
      publicationName: "Gemadvertorial",
    },
    {
      type: "featureList",
      id: generateBlockId(),
      heading: "Unique Value Proposition",
      items: ["Reason 1 summary", "Reason 2 summary", "Reason 3 summary", "Reason 4 summary"],
      icon: "✓",
    },
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Official Offer",
      subtext: "Check current pricing, availability, and guarantee terms.",
      buttonText: "CHECK AVAILABILITY",
      guarantee: "30-Day Money-Back Guarantee",
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert product image",
      hint: "Product shot for sidebar",
      height: "180px",
      placement: "sidebar",
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert hero image",
      hint: "Primary lifestyle or product hero — sets the tone for the page",
      height: "340px",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `${productDescription ? esc(productDescription) + "<br><br>" : ""}This breakdown focuses on practical factors: quality, performance, long-term value, and customer trust signals.`,
    },
    {
      type: "numberedSection",
      id: generateBlockId(),
      number: "01",
      label: "QUALITY",
      headline: "Higher build quality and consistency",
      body: `${pt} is designed for repeatable results with fewer compromises in materials and finish.`,
      imageLabel: "Insert quality comparison visual",
      imageHint: "Side-by-side close-up or materials comparison",
    },
    {
      type: "numberedSection",
      id: generateBlockId(),
      number: "02",
      label: "EFFECTIVENESS",
      headline: "Performance users can feel quickly",
      body: "Most buyers prioritize practical outcomes. This section should show realistic timelines and outcomes.",
      imageLabel: "Insert results-focused visual",
      imageHint: "Lifestyle result photo or progress graphic",
    },
    {
      type: "numberedSection",
      id: generateBlockId(),
      number: "03",
      label: "VALUE",
      headline: "Stronger long-term value per dollar",
      body: "Compare total cost and longevity, not just the first checkout price.",
      imageLabel: "Insert value chart",
      imageHint: "Cost-per-use or long-term savings chart",
    },
    {
      type: "comparison",
      id: generateBlockId(),
      heading: `${pt} vs. Typical Alternatives`,
      rows: [
        { feature: "Quality", ours: "✓ Higher", theirs: "✗ Mixed" },
        { feature: "Consistency", ours: "✓ Reliable", theirs: "✗ Inconsistent" },
        { feature: "Guarantee", ours: "✓ 30 days", theirs: "✗ Limited" },
        { feature: "Overall Value", ours: "✓ Better long-term", theirs: "✗ Short-term only" },
      ],
    },
    {
      type: "faq",
      id: generateBlockId(),
      heading: "Common Questions",
      items: [
        { question: `Is ${pt} suitable for first-time buyers?`, answer: "Yes. The setup and use are straightforward, and support is typically available through official channels." },
        { question: "Where should I buy it?", answer: "Use the official product page to ensure authenticity, warranty coverage, and current promotions." },
      ],
    },
    {
      type: "disclaimer",
      id: generateBlockId(),
      text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on this site.",
    },
  ];
}

export function generateBlocks(params: GenerateBlocksParams): Block[] {
  const { productTitle, productHandle, productDescription = "", template, templateVariant, angle } = params;

  if (templateVariant === "story-classic" || templateVariant === "story-uvp-sidebar" || templateVariant === "story-problem-solution") {
    return generateBasicStoryVariantBlocks(productTitle, productDescription, angle, templateVariant);
  }
  if (templateVariant === "listicle-comparison") {
    return generateBasicListicleComparisonBlocks(productTitle, productDescription);
  }

  if (template === "Story") {
    return generateStoryBlocks(productTitle, productHandle, productDescription, angle);
  }
  return generateListicleBlocks(productTitle, productHandle, productDescription, angle);
}

/** Generate a title for the advertorial. */
export function generateTitle(productTitle: string, template: TemplateType, angle: AngleType): string {
  const titles = {
    Story: {
      Pain: `${productTitle}: The Solution Thousands Were Waiting For`,
      Desire: `How ${productTitle} Is Changing the Game`,
      Comparison: `${productTitle} vs. The Rest: Why Customers Are Switching`,
    },
    Listicle: {
      Pain: `5 Reasons ${productTitle} Is the Fix You've Been Looking For`,
      Desire: `6 Reasons Everyone's Obsessed with ${productTitle}`,
      Comparison: `${productTitle} vs. The Competition: An Honest Breakdown`,
    },
  };
  return titles[template][angle];
}
