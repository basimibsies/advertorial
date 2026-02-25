// ═══════════════════════════════════════════════════════════════════════════════
// Premade Advertorial Templates
// Beautiful, ready-to-edit advertorial templates. Each template is a complete
// page layout that users customize by editing the placeholder text.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Block } from "./blocks";
import { generateBlockId } from "./blocks";

export type AngleType = "Pain" | "Desire" | "Comparison";

interface PremadeTemplateParams {
  productTitle: string;
  productHandle: string;
  productDescription?: string;
  productImage?: string;
  angle?: AngleType;
}

export interface PremadeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  generate: (params: PremadeTemplateParams) => Block[];
}

function esc(text: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ─── Template 1: Editorial Article ────────────────────────────────────────────

function generateEditorialTemplate(params: PremadeTemplateParams): Block[] {
  const pt = esc(params.productTitle);
  const desc = params.productDescription ? esc(params.productDescription) : "";
  const angle = params.angle || "Desire";
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headlines: Record<AngleType, string> = {
    Pain: `Tired of Products That Don't Deliver? Here's Why ${pt} Is Different`,
    Desire: `Why ${pt} Is Becoming the Go-To Choice for Smart Shoppers`,
    Comparison: `${pt} vs. The Competition: An Honest Side-by-Side Look`,
  };

  const angleIntros: Record<AngleType, (p: string) => string> = {
    Pain: (p) => `You've tried the popular options. Spent the money. Read the reviews. And still ended up disappointed. If that sounds familiar, you're not alone — and <strong>${p}</strong> was built specifically for people like you.`,
    Desire: (p) => `In a market flooded with options that overpromise and underdeliver, <strong>${p}</strong> has quietly built a loyal following. Not through flashy campaigns — but through real results that customers can feel from day one.`,
    Comparison: (p) => `With so many options on the market, it's hard to know which one is actually worth your money. We did a straightforward comparison of <strong>${p}</strong> against the most popular alternatives — here's what we found.`,
  };

  const angleSectionHeadings: Record<AngleType, [string, string, string]> = {
    Pain: ["Why Most Alternatives Fall Short", "How It Actually Solves the Problem", "Is It Worth Trying?"],
    Desire: ["What Makes It Different", "Real Results, Not Just Marketing Claims", "Is It Worth It?"],
    Comparison: ["Where It Outperforms the Competition", "What Real Customers Say After Switching", "The Verdict"],
  };

  const angleSectionBodies: Record<AngleType, [(p: string) => string, (p: string) => string, (p: string) => string]> = {
    Pain: [
      (p) => `Most products in this space are designed for the average person with the average problem. They look great in ads but fall apart in real life. <strong>${p}</strong> was built differently — engineered to address the specific frustrations that other solutions ignore.<br><br>Every detail, from materials to design, was chosen to deliver results you can actually feel. No more settling for "good enough."`,
      (p) => `Here's what customers consistently report after using <strong>${p}</strong>:<br><br>• <strong>Noticeable improvement within the first week</strong> — most users say they can feel the difference almost immediately.<br><br>• <strong>Replaces multiple products</strong> — instead of juggling several mediocre options, one solution handles it all.<br><br>• <strong>Better value over time</strong> — while the upfront price may be comparable, customers spend less in the long run.<br><br>• <strong>Genuinely enjoyable to use</strong> — this isn't a chore. People actually look forward to using it daily.`,
      (p) => `If you're tired of products that look great in ads but disappoint in real life, <strong>${p}</strong> is worth a serious look. The combination of quality, thoughtful design, and genuine customer satisfaction is hard to find — and even harder to fake.<br><br>Plus, with a money-back guarantee, there's no risk in trying it for yourself.`,
    ],
    Desire: [
      (p) => `The first thing customers notice about <strong>${p}</strong> is the quality. While most competitors cut corners to keep costs down, every detail here has been carefully considered — from the materials used to the overall design and performance.<br><br>But quality alone doesn't explain the loyalty. What sets ${p} apart is how it fits naturally into your daily routine. It's not something you have to force yourself to use — it's something you genuinely look forward to.`,
      (p) => `Here's what customers consistently report after using <strong>${p}</strong>:<br><br>• <strong>Noticeable improvement within the first week</strong> — most users say they can feel the difference almost immediately.<br><br>• <strong>Replaces multiple products</strong> — instead of juggling several mediocre options, one solution handles it all.<br><br>• <strong>Better value over time</strong> — while the upfront price may be comparable, customers spend less in the long run.<br><br>• <strong>Genuinely enjoyable to use</strong> — this isn't a chore. People actually look forward to using it daily.`,
      (p) => `If you're tired of products that look great in ads but disappoint in real life, <strong>${p}</strong> is worth a serious look. The combination of quality, thoughtful design, and genuine customer satisfaction is hard to find — and even harder to fake.<br><br>Plus, with a money-back guarantee, there's no risk in trying it for yourself.`,
    ],
    Comparison: [
      (p) => `We compared <strong>${p}</strong> against the top alternatives across the factors that matter most: quality, effectiveness, value, and customer satisfaction.<br><br>The differences weren't subtle. While competitors cut corners to maximize margins, ${p} invests where it matters — better materials, more thoughtful design, and a relentless focus on real-world results rather than marketing claims.`,
      (p) => `Here's what customers who switched to <strong>${p}</strong> consistently report:<br><br>• <strong>Noticeably better quality</strong> — the difference is obvious from the first use.<br><br>• <strong>Better results at a comparable price</strong> — when you factor in longevity and performance, ${p} wins on value.<br><br>• <strong>Simpler routine</strong> — replaces multiple products with one that actually works.<br><br>• <strong>No looking back</strong> — the vast majority of switchers say they'll never go back to their old solution.`,
      (p) => `After comparing everything that matters — quality, price, results, and customer satisfaction — <strong>${p}</strong> comes out ahead in every category. It's not the cheapest option, but it's the best value when you factor in what you actually get.<br><br>With a money-back guarantee, there's zero risk in seeing the difference for yourself.`,
      ],
  };

  const blocks: Block[] = [
    {
      type: "headline",
      id: generateBlockId(),
      text: headlines[angle],
      size: "large",
    },
    {
      type: "authorByline",
      id: generateBlockId(),
      author: "Dr. Marcus",
      role: "Contributing Writer",
      date,
      publicationName: "Gemadvertorial",
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert hero image — lifestyle or product shot that sets the tone",
      hint: "High-quality product or lifestyle photo",
      src: params.productImage || undefined,
      height: "400px",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: desc
        ? `${desc}<br><br>${angleIntros[angle](pt)}`
        : `${angleIntros[angle](pt)}<br><br>We took a closer look at what makes this product different — and why thousands of customers are making the switch.`,
    },
    {
      type: "headline",
      id: generateBlockId(),
      text: angleSectionHeadings[angle][0],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: angleSectionBodies[angle][0](pt),
    },
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert product detail or lifestyle image",
      hint: "Show the product in use or highlight a key feature",
      height: "320px",
    },
    {
      type: "headline",
      id: generateBlockId(),
      text: angleSectionHeadings[angle][1],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: angleSectionBodies[angle][1](pt),
    },
    {
      type: "testimonials",
      id: generateBlockId(),
      heading: "What Customers Are Saying",
      testimonials: [
        {
          quote: `I was skeptical at first, but ${pt} genuinely delivered. I've already recommended it to three friends.`,
          name: "[Customer Name]",
          detail: "Verified Buyer",
        },
        {
          quote: `This replaced two products I was already buying. Better results, simpler routine, and I'm saving money.`,
          name: "[Customer Name]",
          detail: "Verified Buyer",
        },
        {
          quote: `The quality is immediately obvious. You can tell this was made by people who actually care.`,
          name: "[Customer Name]",
          detail: "Verified Buyer",
        },
      ],
    },
    {
      type: "headline",
      id: generateBlockId(),
      text: angleSectionHeadings[angle][2],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: angleSectionBodies[angle][2](pt),
    },
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Special Offer",
      subtext: `Try ${pt} today and see why thousands of customers are making the switch.`,
      buttonText: "CHECK AVAILABILITY",
      guarantee: "30-Day Money-Back Guarantee",
    },
    {
      type: "faq",
      id: generateBlockId(),
      heading: "Frequently Asked Questions",
      items: [
        {
          question: `How does ${pt} work?`,
          answer: `${pt} is designed to deliver results through consistent daily use. Simply follow the included instructions and you'll begin noticing improvements within the first week.`,
        },
        {
          question: "How long until I see results?",
          answer: "Most customers report noticeable improvements within 7–14 days of regular use. Full results typically develop over 4–6 weeks.",
        },
        {
          question: "Is there a money-back guarantee?",
          answer: "Yes. Every purchase is backed by a 30-day money-back guarantee. If you're not satisfied for any reason, contact support for a full refund.",
        },
        {
          question: "Where should I buy it?",
          answer: "We recommend purchasing directly from the official product page to ensure you receive a genuine product with full warranty coverage and the best available pricing.",
        },
      ],
    },
    {
      type: "disclaimer",
      id: generateBlockId(),
      text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. THE STORY DEPICTED ON THIS SITE AND THE PERSON DEPICTED IN THE STORY ARE NOT ACTUAL NEWS. RATHER, THIS STORY IS BASED ON THE RESULTS THAT SOME PEOPLE WHO HAVE USED THESE PRODUCTS HAVE ACHIEVED. THE RESULTS PORTRAYED IN THE STORY AND IN THE COMMENTS ARE ILLUSTRATIVE, AND MAY NOT BE THE RESULTS THAT YOU ACHIEVE WITH THESE PRODUCTS. THIS PAGE COULD RECEIVE COMPENSATION FOR CLICKS ON OR PURCHASE OF PRODUCTS FEATURED ON THIS SITE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on this site.",
    },
  ];

  return blocks;
}

// ─── Template 2: Personal Story (eskiin-style long-form native ad) ────────────

function generatePersonalStoryTemplate(params: PremadeTemplateParams): Block[] {
  const pt = esc(params.productTitle);
  const angle = params.angle || "Pain";
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const headlines: Record<AngleType, string> = {
    Pain: `It's Time To <mark>Stop Settling for Less</mark>! How My Frustrating Experience Led Me to Discover ${pt}`,
    Desire: `I Finally Found <mark>The Secret to Real Results</mark>! Why ${pt} Is Changing Everything`,
    Comparison: `I Tested <mark>Every Option on the Market</mark>. Here's The One That Actually Works`,
  };

  const hookIntros: Record<AngleType, string> = {
    Pain: `I never thought I'd be writing this story…<br><br>But when you've spent <strong>years dealing with the same frustrating problem</strong> and nothing seems to work… you'll do anything to find a real solution.<br><br>I tried <strong>EVERYTHING</strong> money could buy. Expensive alternatives. Popular brands. Recommended solutions. Special treatments.<br><br>You name it, I bought it. My shelves were filled with products that didn't deliver, leaving me with an empty wallet and the same old frustrations.<br><br>Until everything changed with one shocking discovery…<br><br>And it had absolutely nothing to do with what I'd been trying before.`,
    Desire: `I still remember the exact moment everything changed…<br><br>After years of searching for something that actually <strong>delivers on its promises</strong>, I'd almost given up hope. The market is flooded with products that look amazing in ads but fall apart in real life.<br><br>Then a friend told me about <strong>${pt}</strong>. I was skeptical — I'd heard it all before. But what happened next completely changed my perspective.<br><br>Within the first week, I noticed a difference. By the end of the month, I was telling everyone I knew.`,
    Comparison: `Let me save you months of research and hundreds of dollars in wasted purchases…<br><br>I've spent the last year <strong>testing every major option on the market</strong>. Side by side. No sponsorships. No bias. Just honest results.<br><br>Some were decent. Most were disappointing. A few were outright terrible.<br><br>But one stood out so far above the rest that I had to write about it. That product is <strong>${pt}</strong>.`,
  };

  const problemHeadings: Record<AngleType, string> = {
    Pain: "The Hidden Problem Nobody Talks About",
    Desire: "Why Most Solutions Fall Short (And What's Different Here)",
    Comparison: "What I Found When I Tested the Top Competitors",
  };

  const problemBodies: Record<AngleType, string> = {
    Pain: `Here's what most people don't realize…<br><br>The reason your current solution isn't working has nothing to do with <strong>how much you're spending</strong> or how hard you're trying. The real problem runs deeper than that.<br><br>Most products in this space are designed for the <strong>average case</strong>. They look great in marketing but are built on outdated approaches that simply don't address the root cause.<br><br>The statistics are alarming:<br><br>• <strong>Over 80% of people</strong> report being unsatisfied with their current solution<br>• <strong>The average person wastes hundreds of dollars</strong> trying different products before finding one that works<br>• <strong>Most alternatives only treat symptoms</strong> — they never address the underlying issue<br><br>And the worst part? <strong>You've been blaming yourself</strong> when the products were the problem all along.`,
    Desire: `Here's the thing most brands won't tell you…<br><br>The industry is built on <strong>repeat purchases</strong>. Products are designed to provide temporary relief — just enough to keep you coming back, but never enough to truly solve the problem.<br><br><strong>${pt}</strong> was built on a completely different philosophy. Instead of masking the issue, it addresses the <strong>root cause</strong>. That's why the results are so dramatic — and why customers rarely go back to their old routine.<br><br>The numbers speak for themselves:<br><br>• <strong>97% of users report noticeable improvement</strong> within the first week<br>• <strong>4.8 out of 5 stars</strong> across thousands of verified reviews<br>• <strong>Over 89% of customers</strong> say it's the best product they've ever tried in this category`,
    Comparison: `I evaluated each product across five criteria: <strong>effectiveness, quality, value, ease of use, and customer satisfaction</strong>.<br><br>Here's what stood out about the competition:<br><br>• <strong>Brand A</strong> — Looks premium but underdelivers. Most customers report minimal improvement after weeks of use. Overpriced for what you get.<br><br>• <strong>Brand B</strong> — Decent results but terrible quality. Falls apart quickly and ends up costing more in replacements.<br><br>• <strong>Brand C</strong> — The budget option. You get what you pay for — which isn't much.<br><br>Then there's <strong>${pt}</strong>. It outperformed every single competitor in <strong>all five categories</strong>. And it wasn't even close.`,
  };

  const consequenceHeadings: Record<AngleType, string> = {
    Pain: "What Happens If You Don't Act Now",
    Desire: "What Makes This Different From Everything Else",
    Comparison: "The Clear Winner — By Every Measure",
  };

  const consequenceBodies: Record<AngleType, string> = {
    Pain: `If you keep using what you're using now, here's what you can expect:<br><br><strong>The problem will only get worse.</strong> Most solutions provide diminishing returns over time. What worked "okay" six months ago is probably working less now — and it'll be even worse six months from now. The underlying issue compounds when it's not properly addressed.<br><br><strong>You'll keep wasting money.</strong> The average person spends a small fortune cycling through products that don't work. Every purchase that disappoints is money you'll never get back — money that could have gone toward something that actually delivers.<br><br><strong>The frustration will continue.</strong> That feeling of "maybe this one will be different" followed by inevitable disappointment? It doesn't have to be your reality. There IS something that actually works.`,
    Desire: `What sets <strong>${pt}</strong> apart comes down to three things:<br><br><strong>1. It addresses the root cause.</strong> Instead of providing a temporary fix, it solves the actual underlying problem. That's why results come fast and last long.<br><br><strong>2. Premium quality at every level.</strong> From the materials to the design to the packaging — you can feel the difference the moment you hold it. This isn't a product that cuts corners.<br><br><strong>3. Real people, real results.</strong> The customer stories aren't fabricated. The reviews aren't bought. When you see thousands of people saying the same thing, it's because the product genuinely delivers.`,
    Comparison: `After months of testing, the results were unambiguous:<br><br><strong>${pt} outperformed in effectiveness</strong> — Results were noticeably better, faster, and longer-lasting than any competitor. Most people feel the difference within days, not weeks.<br><br><strong>${pt} outperformed in quality</strong> — The build quality, materials, and attention to detail are in a completely different league. This is a product built to last.<br><br><strong>${pt} outperformed in value</strong> — When you factor in how long it lasts and how well it works, the cost per use is actually lower than most "budget" alternatives.`,
  };

  const solutionHeadings: Record<AngleType, string> = {
    Pain: `How ${pt} Was Born — And Why It Actually Works`,
    Desire: `Meet ${pt}: The Product Thousands Are Calling a "Game Changer"`,
    Comparison: `Why ${pt} Beats Everything Else — The Full Breakdown`,
  };

  const solutionBodies: Record<AngleType, string> = {
    Pain: `When the founders discovered the truth about why existing solutions fail, building something better became their <strong>obsession</strong>.<br><br>They tried every product on the market. The cheap options were worthless. The expensive brands were overpriced and underwhelming.<br><br>So they decided to build what the market couldn't provide. <strong>${pt}</strong> was designed from the ground up to solve the specific problems that other products ignore.<br><br>Every detail — from the core technology to the materials to the user experience — was carefully engineered to deliver <strong>real, lasting results</strong>.<br><br>Today, <strong>thousands of customers</strong> across the country have made the switch. And the feedback has been overwhelming.`,
    Desire: `<strong>${pt}</strong> isn't just another product in a crowded market. It represents a fundamentally different approach to solving this problem.<br><br>Where other brands focus on marketing, the team behind ${pt} focused on <strong>engineering</strong>. Where competitors cut corners, they invested in <strong>quality</strong>. Where the industry accepts "good enough," they demanded <strong>exceptional</strong>.<br><br>The result is a product that doesn't just meet expectations — it <strong>exceeds them dramatically</strong>.<br><br>And the numbers prove it: <strong>over 250,000 satisfied customers</strong> and counting.`,
    Comparison: `Here's the full comparison breakdown:<br><br>• <strong>Effectiveness:</strong> ${pt} delivered noticeable results in days. The closest competitor took weeks — and the results were less dramatic.<br><br>• <strong>Quality:</strong> Premium materials and construction that's clearly built to last. Competitors felt cheap by comparison.<br><br>• <strong>Value:</strong> While not the cheapest upfront, the per-use cost and longevity make it the best value by far.<br><br>• <strong>Customer Satisfaction:</strong> 4.8/5 average across thousands of reviews. No competitor came close to this level of consistent positive feedback.<br><br>• <strong>Ease of Use:</strong> Simple, intuitive, and works exactly as described. No complicated setup or confusing instructions.`,
  };

  const blocks: Block[] = [
    // Breadcrumb
    {
      type: "text",
      id: generateBlockId(),
      content: `<div class="adv-breadcrumb">Home &gt; [Your Category] &gt; ${pt}</div>`,
    },
    // Headline with highlight
    {
      type: "headline",
      id: generateBlockId(),
      text: headlines[angle],
      size: "large",
    },
    // Author byline with view count
    {
      type: "authorByline",
      id: generateBlockId(),
      author: "[Author Name]",
      date,
      viewCount: "[XXX,XXX] views",
      liveViewers: "[XXX]",
    },
    // Hero image
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert hero image — eye-catching product or lifestyle shot",
      hint: "High-impact visual that draws readers in",
      src: params.productImage || undefined,
      height: "400px",
    },
    // Hook / Opening story
    {
      type: "text",
      id: generateBlockId(),
      content: hookIntros[angle],
    },
    // Section: The Problem
    {
      type: "headline",
      id: generateBlockId(),
      text: problemHeadings[angle],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: problemBodies[angle],
    },
    // Section: Consequences / Differentiator
    {
      type: "headline",
      id: generateBlockId(),
      text: consequenceHeadings[angle],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: consequenceBodies[angle],
    },
    // Section: The Solution / Origin Story
    {
      type: "headline",
      id: generateBlockId(),
      text: solutionHeadings[angle],
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: solutionBodies[angle],
    },
    // Product image
    {
      type: "image",
      id: generateBlockId(),
      label: "Insert product detail or in-use photo",
      hint: "Show the product up close or being used in real life",
      height: "320px",
    },
    // First CTA
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Special Offer",
      subtext: `Try ${pt} today and experience the difference for yourself.`,
      buttonText: "GET YOURS NOW",
      guarantee: "60-Day Money-Back Guarantee",
    },
    {
      type: "guarantee",
      id: generateBlockId(),
      text: "🔬 Recommended by Experts · 🛡️ 60 Day Money-Back Guarantee · 🚚 Free Shipping",
    },
    // Testimonials
    {
      type: "testimonials",
      id: generateBlockId(),
      heading: `Thousands Have Already Transformed Their Lives With ${pt}`,
      testimonials: [
        {
          quote: `After years of trying everything without success, ${pt} changed everything. Within weeks I noticed a dramatic difference. I finally feel confident again. I've already told all my friends about it!`,
          name: "[Customer Name], [Age], [Location]",
          detail: "Verified Buyer",
        },
        {
          quote: `I was skeptical at first — I've been burned by so many products before. But ${pt} actually delivered on its promises. The quality is obvious from day one. I wish I'd found this years ago!`,
          name: "[Customer Name], [Age], [Location]",
          detail: "Verified Buyer",
        },
        {
          quote: `I noticed results after my FIRST USE. By week two, the improvement was dramatic. The unexpected bonus? It simplified my entire routine. I could never go back to what I was using before.`,
          name: "[Customer Name], [Age], [Location]",
          detail: "Verified Buyer",
        },
      ],
    },
    // Second CTA
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Limited Time Offer",
      subtext: `Join the thousands who have already made the switch to ${pt}.`,
      buttonText: "GET YOURS NOW",
      guarantee: "60-Day Money-Back Guarantee",
    },
    {
      type: "guarantee",
      id: generateBlockId(),
      text: "🔬 Recommended by Experts · 🛡️ 60 Day Money-Back Guarantee · 🚚 Free Shipping",
    },
    // Risk reversal section
    {
      type: "headline",
      id: generateBlockId(),
      text: "Your Only Risk Is Missing Out ✨",
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `Ask yourself honestly:<br><br>…Do you want to keep dealing with the same frustrating problem? ❌<br><br>…Do you want to continue wasting money on products that don't work? ❌<br><br>…Do you want to keep wondering "what if" while others enjoy real results? ❌<br><br>…Do you want to look back in 6 months wishing you'd started today? ❌<br><br>Or are you ready to finally experience what a <strong>real solution</strong> feels like?<br><br>The choice is simple. <strong>${pt} starts working from day one.</strong><br><br>Within days, you'll wonder how you ever lived without it.`,
    },
    // Third CTA
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Try It Risk-Free",
      subtext: `Experience ${pt} with zero risk. Love it or get a full refund.`,
      buttonText: "GET YOURS NOW",
      guarantee: "60-Day Money-Back Guarantee",
    },
    {
      type: "guarantee",
      id: generateBlockId(),
      text: "🔬 Recommended by Experts · 🛡️ 60 Day Money-Back Guarantee · 🚚 Free Shipping",
    },
    // Guarantee section
    {
      type: "headline",
      id: generateBlockId(),
      text: "You've Got 60 Days To Try It On Us…",
      size: "medium",
    },
    {
      type: "text",
      id: generateBlockId(),
      content: `That's right — you can try <strong>${pt}</strong> with absolutely zero risk.<br><br>We're so confident in what it will do for you that we'll <strong>personally refund every penny</strong> if you're not absolutely thrilled.<br><br>We're <strong>real people</strong>, not some faceless corporation. Have questions? Our support team answers every message personally within hours.<br><br>Your payment is <strong>100% safe and secure</strong> through our encrypted checkout system. We ship directly from our warehouse within 24 hours.<br><br>Because 60 days from now, you'll either be enjoying incredible results…<br><br><strong>Or wishing you had started today.</strong>`,
    },
    // Fourth CTA
    {
      type: "offerBox",
      id: generateBlockId(),
      headline: "Best Deal of the Year",
      subtext: `Order ${pt} today and save. Free shipping included.`,
      buttonText: "GET YOURS NOW",
      guarantee: "60-Day Money-Back Guarantee",
      urgency: "Limited time offer — while supplies last",
    },
    {
      type: "guarantee",
      id: generateBlockId(),
      text: "🔬 Recommended by Experts · 🛡️ 60 Day Money-Back Guarantee · 🚚 Free Shipping",
    },
    // Urgency update note
    {
      type: "note",
      id: generateBlockId(),
      text: `<strong>Update</strong><br><br><strong>As of ${date}</strong>, due to popular demand, ${pt} has been in and out of stock. We recommend you order as soon as possible because stock moves fast and there's often a waiting list.<br><br><strong>To see if they are still available and in stock, click the button above.</strong>`,
      style: "warning",
    },
    // Comments section
    {
      type: "comments",
      id: generateBlockId(),
      heading: "Comments (18)",
      comments: [
        {
          name: "[Customer Name]",
          text: `I was super skeptical at first but a friend actually recommended ${pt}. After using it for 2 months, the results have been incredible! It actually delivers on what it promises. Worth every penny!`,
          likes: "47",
          timeAgo: "2 hours ago",
        },
        {
          name: "[Customer Name]",
          text: `Got this as a gift and wasn't expecting much. Within 3 weeks I was completely converted. I've already bought one for my parents and sister because everyone deserves this!`,
          likes: "31",
          timeAgo: "5 hours ago",
        },
        {
          name: "[Brand] Team",
          text: `Thanks for sharing your experience! We love hearing success stories. Keep us updated on your continued results! 💚`,
          timeAgo: "4 hours ago",
        },
        {
          name: "[Customer Name]",
          text: `Been using ${pt} for 3 months now. The difference is NIGHT AND DAY. Already bought a second one. This is the real deal.`,
          likes: "28",
          timeAgo: "1 day ago",
        },
        {
          name: "[Customer Name]",
          text: `ATTENTION: This isn't just hype! I've tried everything in this category for years. Nothing has come close to ${pt}. Game changer.`,
          likes: "52",
          timeAgo: "2 days ago",
        },
        {
          name: "[Customer Name]",
          text: `Mine arrived yesterday and I noticed a difference immediately! Will update with more results soon. So far, very impressed.`,
          likes: "19",
          timeAgo: "3 days ago",
        },
      ],
    },
    // Disclaimer
    {
      type: "disclaimer",
      id: generateBlockId(),
      text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. THE STORY DEPICTED ON THIS SITE AND THE PERSON DEPICTED IN THE STORY ARE NOT ACTUAL NEWS. RATHER, THIS STORY IS BASED ON THE RESULTS THAT SOME PEOPLE WHO HAVE USED THESE PRODUCTS HAVE ACHIEVED. THE RESULTS PORTRAYED IN THE STORY AND IN THE COMMENTS ARE ILLUSTRATIVE, AND MAY NOT BE THE RESULTS THAT YOU ACHIEVE WITH THESE PRODUCTS. THIS PAGE COULD RECEIVE COMPENSATION FOR CLICKS ON OR PURCHASE OF PRODUCTS FEATURED ON THIS SITE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on this site.",
    },
  ];

  return blocks;
}

// ─── Template Registry ────────────────────────────────────────────────────────

// ─── Template 3: Listicle ─────────────────────────────────────────────────────

function generateListicleTemplate(params: PremadeTemplateParams): Block[] {
  const pt = esc(params.productTitle);
  const angle = params.angle || "Desire";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const headlines: Record<AngleType, string> = {
    Pain: `5 Reasons ${pt} Is Finally Solving the Problem Others Ignore`,
    Desire: `5 Reasons Everyone Is Switching to ${pt} Right Now`,
    Comparison: `5 Reasons ${pt} Beats Every Alternative on the Market`,
  };

  const intros: Record<AngleType, (p: string) => string> = {
    Pain: (p) => `If you've been searching for something that actually works, you know how frustrating it is. Most options are either overpriced, ineffective, or both. After thousands of customer experiences, here's why <strong>${p}</strong> consistently rises to the top.`,
    Desire: (p) => `The best products don't just solve problems — they improve your life in ways you didn't expect. <strong>${p}</strong> has earned a loyal following by doing exactly that. Here's why it's earning five-star reviews across the board.`,
    Comparison: (p) => `We put <strong>${p}</strong> head-to-head against the market's leading alternatives. The results were clear. Here's exactly how it stacks up — and why so many customers are making the switch.`,
  };

  const reasons: Record<AngleType, [string, string][]> = {
    Pain: [
      ["Built for Real Problems", `Most products promise solutions but were designed by people who've never experienced the problem firsthand. <strong>${pt}</strong> was engineered from real customer feedback — which is why it actually delivers.`],
      ["Results You Feel Fast", `Within the first week, most users notice a meaningful difference. Not a subtle "maybe" — a real, tangible change that makes you wonder why you waited this long.`],
      ["No Complicated Routines", `Forget the six-step systems that nobody sticks to. <strong>${pt}</strong> integrates seamlessly into your existing routine. Simple, effective, and sustainable.`],
      ["Better Value Over Time", `While cheaper alternatives seem appealing upfront, they end up costing more — in repeat purchases, wasted time, and continued frustration. <strong>${pt}</strong> is the last investment you'll need to make.`],
      ["Backed by a Real Guarantee", `When a company stands behind its product with a no-questions-asked money-back guarantee, that tells you everything. They're confident it works. You can be too.`],
    ],
    Desire: [
      ["Exceptional Quality You Can Feel", `From the first moment you use <strong>${pt}</strong>, the quality is unmistakable. Every detail has been thoughtfully designed — not just to look good, but to perform brilliantly.`],
      ["Results That Exceed Expectations", `Customers consistently say the same thing: they expected improvement, but not this much, this fast. <strong>${pt}</strong> delivers beyond what most products even claim.`],
      ["Designed for Your Lifestyle", `The best products fit your life — not the other way around. <strong>${pt}</strong> was built to integrate naturally into your daily routine, making it easy to stay consistent.`],
      ["A Community That Loves It", `With thousands of five-star reviews and a passionate customer base, <strong>${pt}</strong> isn't just a product — it's a decision other people are thrilled they made.`],
      ["Zero-Risk to Try", `A genuine money-back guarantee means there's nothing to lose and everything to gain. The only regret most customers have is not trying it sooner.`],
    ],
    Comparison: [
      ["Superior Quality at Every Level", `Side-by-side, the quality difference is obvious. While competitors cut corners on materials and design, <strong>${pt}</strong> invests where it matters — delivering a noticeably premium experience.`],
      ["Better Results, Proven by Customers", `When customers switch to <strong>${pt}</strong> from alternatives, the feedback is consistent: better outcomes, faster. Not marginal improvement — a clear step up.`],
      ["Simpler, More Effective Solution", `Alternatives often require complicated systems or multiple add-ons. <strong>${pt}</strong> handles everything in one clean, simple solution that actually works the way it's supposed to.`],
      ["More Transparent and Trustworthy", `Real ingredients, honest claims, and a company that answers questions. In a category full of vague promises, <strong>${pt}</strong> stands out for saying exactly what it does — and delivering it.`],
      ["Unbeatable Value and Guarantee", `When you factor in quality, longevity, and results, <strong>${pt}</strong> wins on value — and the money-back guarantee removes any remaining risk.`],
    ],
  };

  const id = () => generateBlockId();
  const selectedReasons = reasons[angle];

  return [
    {
      type: "authorByline", id: id(), author: "Editorial Team", role: "Product Review Desk",
      date, category: "Product Reviews", publicationName: "The Insider Review",
      viewCount: "28,419 views", liveViewers: "183 reading now",
    },
    {
      type: "headline", id: id(), text: headlines[angle], size: "large", align: "left",
      subheadline: `Updated ${date} · Verified customer ratings included`,
    },
    { type: "socialProof", id: id(), rating: "4.9", reviewCount: "3,847 reviews", customerCount: "75,000+ customers" },
    { type: "text", id: id(), content: intros[angle](pt), variant: "large-intro" },
    {
      type: "cta", id: id(), style: "inline", variant: "solid",
      headline: "", subtext: "", buttonText: `Check Availability →`,
    },
    {
      type: "numberedSection", id: id(), number: "01", label: "Reason One",
      headline: selectedReasons[0][0], body: selectedReasons[0][1],
    },
    {
      type: "numberedSection", id: id(), number: "02", label: "Reason Two",
      headline: selectedReasons[1][0], body: selectedReasons[1][1],
    },
    {
      type: "numberedSection", id: id(), number: "03", label: "Reason Three",
      headline: selectedReasons[2][0], body: selectedReasons[2][1],
    },
    {
      type: "numberedSection", id: id(), number: "04", label: "Reason Four",
      headline: selectedReasons[3][0], body: selectedReasons[3][1],
    },
    {
      type: "numberedSection", id: id(), number: "05", label: "Reason Five",
      headline: selectedReasons[4][0], body: selectedReasons[4][1],
    },
    {
      type: "testimonials", id: id(), heading: "What Customers Are Saying",
      layout: "grid", showStars: true,
      testimonials: [
        { quote: "I was skeptical at first, but the results speak for themselves. Exactly what I needed.", name: "Sarah M.", detail: "Verified Buyer · 3 weeks ago" },
        { quote: "Tried everything else first. Wish I'd found this sooner — it's the only one that actually works.", name: "James T.", detail: "Verified Buyer · 1 month ago" },
        { quote: "Five stars without hesitation. My whole family uses it now.", name: "Priya K.", detail: "Verified Buyer · 2 weeks ago" },
      ],
    },
    {
      type: "offerBox", id: id(),
      headline: `Try ${pt} Risk-Free Today`,
      subtext: `Join over 75,000 satisfied customers and experience the difference for yourself. Limited stock available.`,
      buttonText: `Get ${pt} Now`,
      discount: "🎁 SPECIAL OFFER — Save 20%",
      guarantee: "60-Day Money-Back Guarantee",
      urgency: "Only 47 units left at this price",
    },
    {
      type: "featureList", id: id(), heading: `What's Included with ${pt}`,
      items: [
        `Premium-quality ${pt}`,
        "Free express shipping on all orders",
        "60-day no-questions-asked refund policy",
        "Access to exclusive customer community",
        "Dedicated customer support team",
      ],
    },
    {
      type: "disclaimer", id: id(),
      text: `This article is sponsored content. Individual results may vary. The statements on this page have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease. Always consult with a qualified healthcare professional before starting any new regimen.`,
    },
  ];
}

// ─── Template 4: Research Report ─────────────────────────────────────────────

function generateResearchTemplate(params: PremadeTemplateParams): Block[] {
  const pt = esc(params.productTitle);
  const angle = params.angle || "Desire";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const headlines: Record<AngleType, string> = {
    Pain: `New Research Reveals Why Most Solutions Fail — And How ${pt} Breaks the Pattern`,
    Desire: `Clinical Evidence Confirms: ${pt} Delivers the Results People Have Been Searching For`,
    Comparison: `Independent Analysis: ${pt} Outperforms Leading Alternatives in Every Key Metric`,
  };

  const intros: Record<AngleType, (p: string) => string> = {
    Pain: (p) => `For years, customers have been told that their frustration was simply something to manage — not solve. Recent independent research challenges that assumption entirely. <strong>${p}</strong> was developed in response to this gap, and the clinical data is compelling.`,
    Desire: (p) => `A growing body of research confirms what early adopters have known for years: <strong>${p}</strong> consistently outperforms alternative approaches. Here's what the evidence actually shows — and why the scientific community is taking notice.`,
    Comparison: (p) => `An independent analysis of the leading products in this category produced a clear frontrunner. <strong>${p}</strong> scored significantly higher across every measured dimension — quality, efficacy, customer satisfaction, and long-term value.`,
  };

  const id = () => generateBlockId();

  return [
    {
      type: "authorByline", id: id(), author: "Dr. A. Richardson", role: "Senior Research Editor",
      date, category: "Independent Analysis", publicationName: "Consumer Research Weekly",
      viewCount: "52,847 views",
    },
    {
      type: "headline", id: id(), text: headlines[angle], size: "large",
      subheadline: `Independent analysis · Peer-reviewed data · Updated ${date}`,
    },
    {
      type: "asSeenIn", id: id(),
      publications: ["Forbes", "Healthline", "WebMD", "The Guardian", "Reuters"],
    },
    {
      type: "stats", id: id(), heading: "By the Numbers", layout: "grid",
      stats: [
        { value: "94%", label: "of users reported measurable improvement" },
        { value: "4.9★", label: "average rating across 3,800+ reviews" },
        { value: "72h", label: "average time to first noticeable results" },
        { value: "2×", label: "more effective than leading alternatives" },
      ],
    },
    { type: "text", id: id(), content: intros[angle](pt), variant: "large-intro" },
    {
      type: "cta", id: id(), style: "inline", variant: "solid",
      headline: "", subtext: "", buttonText: `View Research & Check Availability`,
    },
    {
      type: "comparison", id: id(), heading: `${pt} vs. Leading Alternatives`,
      rows: [
        { feature: "Clinically Validated Formula", ours: "✓", theirs: "✗" },
        { feature: "Results Within 72 Hours", ours: "✓", theirs: "✗" },
        { feature: "No Harmful Additives", ours: "✓", theirs: "✗" },
        { feature: "60-Day Money-Back Guarantee", ours: "✓", theirs: "✗" },
        { feature: "Third-Party Tested", ours: "✓", theirs: "✗" },
        { feature: "Customer Satisfaction Rate", ours: "94%", theirs: "61%" },
      ],
    },
    {
      type: "numberedSection", id: id(), number: "01", label: "Finding One",
      headline: "The Evidence for Rapid Results",
      body: `In a monitored study of 300 participants, <strong>${pt}</strong> showed statistically significant results within 72 hours of first use. Comparable products in the same study produced measurable improvement in just 38% of participants over the same period — a difference too large to attribute to chance.`,
    },
    {
      type: "numberedSection", id: id(), number: "02", label: "Finding Two",
      headline: "Long-Term Efficacy That Compounds Over Time",
      body: `Unlike many alternatives that show diminishing returns after initial use, <strong>${pt}</strong> users reported sustained and often increasing benefits at the 30-day and 90-day marks. This compounding effect is consistent with the product's mechanism of action and distinguishes it from short-term solutions.`,
    },
    {
      type: "numberedSection", id: id(), number: "03", label: "Finding Three",
      headline: "Safety Profile and Quality Standards",
      body: `Independent third-party testing found <strong>${pt}</strong> free from the most common contaminants and adulterants identified in competing products. All ingredients are disclosed, and the formula adheres to the highest industry standards — a level of transparency that is unfortunately rare in this category.`,
    },
    {
      type: "testimonials", id: id(), heading: "Verified Customer Outcomes",
      layout: "grid", showStars: true,
      testimonials: [
        { quote: "I've tried the 'research-backed' alternatives. None of them delivered what this does. The difference is night and day.", name: "Michael P.", detail: "Verified Buyer · Physician" },
        { quote: "As someone who reads the actual studies, I appreciated that the claims are honest. And the results matched.", name: "Dr. L. Chen", detail: "Verified Buyer · Researcher" },
        { quote: "Three months in and I'm still seeing improvement. That's not something you can say about most products.", name: "Amanda R.", detail: "Verified Buyer · 3 months" },
      ],
    },
    {
      type: "featureList", id: id(), heading: `What Makes ${pt} Different`,
      items: [
        "Clinically validated formula with published efficacy data",
        "Third-party tested for purity and potency",
        "No proprietary blends — full ingredient transparency",
        "Manufactured in certified, audited facilities",
        "Backed by a 60-day satisfaction guarantee",
      ],
    },
    {
      type: "faq", id: id(), heading: "Frequently Asked Questions",
      items: [
        { question: `How quickly will I notice results from ${pt}?`, answer: "Most users report noticing a meaningful difference within 48–72 hours of first use. Optimal results are typically experienced at the 30-day mark, with continued improvement thereafter." },
        { question: "Is this product third-party tested?", answer: `Yes. Every batch of ${pt} undergoes independent third-party testing for purity, potency, and the absence of contaminants. Certificates of analysis are available on request.` },
        { question: "What if it doesn't work for me?", answer: `${pt} comes with a 60-day money-back guarantee. If you're not completely satisfied for any reason, contact our team for a full refund — no questions asked.` },
      ],
    },
    {
      type: "offerBox", id: id(),
      headline: `Start Your Evidence-Based Experience`,
      subtext: `Join over 75,000 customers who've made the evidence-based choice. Free shipping included.`,
      buttonText: `Order ${pt} Today`,
      discount: "FREE SHIPPING — Limited Time",
      guarantee: "60-Day Money-Back Guarantee",
    },
    {
      type: "disclaimer", id: id(),
      text: `This article contains independent research summaries and is provided for informational purposes. Individual results may vary. The statements made have not been evaluated by the FDA and are not intended to diagnose, treat, cure, or prevent any disease. Please consult a qualified healthcare provider before beginning any new supplement or health regimen.`,
    },
  ];
}

// ─── Template 5: Before & After ───────────────────────────────────────────────

function generateBeforeAfterTemplate(params: PremadeTemplateParams): Block[] {
  const pt = esc(params.productTitle);
  const angle = params.angle || "Pain";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const headlines: Record<AngleType, string> = {
    Pain: `"I Was Ready to Give Up. Then I Found ${pt} — and Everything Changed."`,
    Desire: `How I Finally Achieved What I Always Wanted — With a Little Help From ${pt}`,
    Comparison: `I Tried Everything First. Here's Why I Stopped Looking After Finding ${pt}`,
  };

  const hooks: Record<AngleType, string> = {
    Pain: `Eighteen months. That's how long I spent trying to solve a problem that seemed unsolvable. I bought the supplements. I tried the routines. I followed the advice. And every time, I ended up right back where I started — frustrated, exhausted, and quietly wondering if this was just my life now.`,
    Desire: `I'd always imagined what it would feel like to actually achieve the result I was after. Not just "improvement" — but the real thing. The kind of outcome you see in before-and-after photos and think, "that could never be me." I was wrong about that.`,
    Comparison: `I'm not impulsive. Before I spend money on anything, I research it thoroughly. I read every review, every study, every forum post I can find. So when I say I tried every major option in this space before landing on something that actually worked — I mean it.`,
  };

  const discoveries: Record<AngleType, (p: string) => string> = {
    Pain: (p) => `I almost didn't try <strong>${p}</strong>. By that point, I'd been burned too many times. But a friend — someone I trusted, someone who had struggled with the same thing — wouldn't stop recommending it. I finally caved. And within the first week, something was different.`,
    Desire: (p) => `A close friend had been quietly using <strong>${p}</strong> for a few months. I noticed the change in her before she told me what she was doing. When she finally shared it, I was immediately interested. I ordered the same day.`,
    Comparison: (p) => `I kept coming back to <strong>${p}</strong> in my research. The reviews were more specific than usual. The claims were more honest. The company was more transparent. After eliminating everything that didn't hold up under scrutiny, it was the clear choice.`,
  };

  const id = () => generateBlockId();

  return [
    {
      type: "authorByline", id: id(), author: "Jamie L.", role: "Contributing Writer",
      date, category: "Personal Experience", publicationName: "Real Life Reviews",
      viewCount: "41,293 views", liveViewers: "312 reading now",
    },
    {
      type: "headline", id: id(), text: headlines[angle], size: "large",
    },
    {
      type: "text", id: id(),
      content: hooks[angle],
      variant: "large-intro",
    },
    {
      type: "note", id: id(),
      text: "If any of this sounds familiar, keep reading. This is for you.",
      style: "highlight",
    },
    {
      type: "text", id: id(),
      content: discoveries[angle](pt),
    },
    {
      type: "image", id: id(),
      label: `${pt} — Product Image`,
      hint: "Clean product photo on neutral background",
      height: "340px",
      rounded: true,
    },
    {
      type: "timeline", id: id(), heading: "My Journey with ${pt}",
      steps: [
        { label: "Week 1", headline: "The First Signs", body: "Subtle but unmistakable. I noticed changes I'd been chasing for over a year starting to appear. I told myself not to get excited — but it was hard not to." },
        { label: "Week 2", headline: "Something Real", body: "By now I was certain this wasn't placebo. The results were building on each other. I started telling people around me what I was doing." },
        { label: "Month 1", headline: "A New Normal", body: `What I'd always hoped for had become my everyday reality. ${pt} didn't just deliver — it changed what I thought was possible for me.` },
      ],
    },
    { type: "socialProof", id: id(), rating: "4.9", reviewCount: "4,128 reviews", customerCount: "80,000+ users" },
    {
      type: "testimonials", id: id(), heading: "Others Who Made the Same Journey",
      layout: "stacked", showStars: true,
      testimonials: [
        { quote: `I had nearly identical results. The timeline was almost exactly the same. It works, and I'll be a customer for life.`, name: "Rachel D.", detail: "Verified Buyer · 2 months in" },
        { quote: "The difference between before and after is something I show people when they ask what changed. The photos say it all.", name: "Tom W.", detail: "Verified Buyer · 6 weeks in" },
      ],
    },
    {
      type: "stats", id: id(), layout: "horizontal",
      stats: [
        { value: "92%", label: "reported meaningful improvement in week 1" },
        { value: "4.9★", label: "average from 4,100+ verified reviews" },
        { value: "60 days", label: "money-back guarantee" },
      ],
    },
    {
      type: "offerBox", id: id(),
      headline: `Your Before-and-After Story Starts Here`,
      subtext: `${pt} comes with a 60-day money-back guarantee. If you don't see and feel the difference, you pay nothing.`,
      buttonText: `Start My Transformation`,
      discount: "★ Most Popular — Free Shipping Included",
      guarantee: "60-Day Money-Back Guarantee",
      urgency: "High demand — stock is limited",
    },
    {
      type: "guarantee", id: id(),
      text: `60-Day Money-Back Guarantee — If you're not completely satisfied with your results, we'll refund your full purchase price. No forms, no hassle.`,
      badges: [
        { icon: "🛡️", label: "60-Day\nGuarantee" },
        { icon: "🔒", label: "Secure\nCheckout" },
        { icon: "🚚", label: "Free\nShipping" },
        { icon: "⭐", label: "4.9 Star\nRating" },
      ],
    },
    {
      type: "faq", id: id(), heading: "Your Questions, Answered",
      items: [
        { question: `How soon will I see results with ${pt}?`, answer: "Most people notice a meaningful difference within the first 7–10 days. By the end of week two, the improvement is typically significant enough to notice without looking for it." },
        { question: "What if it doesn't work for me?", answer: `You're covered by a 60-day money-back guarantee. If ${pt} doesn't deliver the results you're looking for, contact us for a full refund — no questions, no hassle.` },
        { question: "Is this backed by research?", answer: `Yes. ${pt} is formulated based on peer-reviewed research and tested independently for quality and purity. We stand behind both the science and the results.` },
      ],
    },
    {
      type: "comments", id: id(), heading: "Recent Comments",
      comments: [
        { name: "Sarah K.", text: `I started ${pt} three weeks ago and the difference is real. I keep catching myself thinking "wait, this is what normal feels like?" — and that's the best way I can describe it.`, timeAgo: "3 days ago", isVerified: true, likes: "47" },
        { name: "Marcus T.", text: "Been using it for six weeks. The before-and-after isn't even close. Wish I'd found this a year ago.", timeAgo: "1 week ago", isVerified: true, likes: "38" },
        { name: "Nadia R.", text: "Skeptic turned believer. That's all I'll say. The results are undeniable.", timeAgo: "5 days ago", isVerified: false, likes: "29" },
      ],
    },
    {
      type: "disclaimer", id: id(),
      text: `This is a sponsored personal account. Individual results will vary. The experiences described are not typical and are presented for illustrative purposes only. This content is not intended to constitute medical advice. Please consult a qualified healthcare professional before beginning any new supplement or health program.`,
    },
  ];
}

export const PREMADE_TEMPLATES: PremadeTemplate[] = [
  {
    id: "editorial",
    name: "Editorial Article",
    description: "Clean article-style layout with heading, byline, body sections, testimonials, and CTA. Looks like a real editorial piece.",
    thumbnail: "editorial",
    generate: generateEditorialTemplate,
  },
  {
    id: "personal-story",
    name: "Personal Story",
    description: "Long-form native ad with personal narrative, emotional hooks, multiple CTAs, trust badges, testimonials, and a realistic comments section.",
    thumbnail: "personal-story",
    generate: generatePersonalStoryTemplate,
  },
  {
    id: "listicle",
    name: "Listicle",
    description: "Numbered \"5 Reasons\" format. Easy to scan, compelling on mobile. Perfect for showcasing key benefits or differentiators.",
    thumbnail: "listicle",
    generate: generateListicleTemplate,
  },
  {
    id: "research-report",
    name: "Research Report",
    description: "Clinical, data-driven style with stats, comparisons, and expert framing. Builds authority and trust for health, wellness, or tech products.",
    thumbnail: "research-report",
    generate: generateResearchTemplate,
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Emotional transformation story. Hooks with a relatable struggle, takes readers on a journey, and converts with authentic testimonials.",
    thumbnail: "before-after",
    generate: generateBeforeAfterTemplate,
  },
];

export function generateFromPremadeTemplate(
  templateId: string,
  params: PremadeTemplateParams,
): { title: string; blocks: Block[] } {
  const template = PREMADE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }

  const blocks = template.generate(params);
  const title = `${params.productTitle} Advertorial`;

  return { title, blocks };
}
