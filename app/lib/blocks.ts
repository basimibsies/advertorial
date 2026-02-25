// ═══════════════════════════════════════════════════════════════════════════════
// Block Type System
// Every advertorial page is an ordered array of blocks.
// AI generates the initial blocks; users can reorder, edit, delete, and add.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Block Definitions (discriminated union) ──────────────────────────────────

export interface HeadlineBlock {
  type: "headline";
  id: string;
  text: string;
  size: "large" | "medium" | "small";
  align?: "left" | "center";
  subheadline?: string;
}

export interface TextBlock {
  type: "text";
  id: string;
  content: string; // supports basic HTML: <strong>, <em>, <br>
  variant?: "default" | "large-intro" | "pull-quote";
}

export interface ImageBlock {
  type: "image";
  id: string;
  label: string;
  hint: string;
  src?: string;
  height?: string;
  placement?: "main" | "sidebar";
  caption?: string;
  rounded?: boolean;
}

export interface CtaBlock {
  type: "cta";
  id: string;
  headline: string;
  subtext: string;
  buttonText: string;
  style: "primary" | "inline";
  variant?: "gradient" | "solid" | "outline";
}

export interface SocialProofBlock {
  type: "socialProof";
  id: string;
  rating: string;
  reviewCount: string;
  customerCount: string;
}

export interface StatsBlock {
  type: "stats";
  id: string;
  heading?: string;
  stats: { value: string; label: string }[];
  layout?: "grid" | "horizontal";
}

export interface TestimonialsBlock {
  type: "testimonials";
  id: string;
  heading?: string;
  testimonials: { quote: string; name: string; detail: string }[];
  layout?: "grid" | "stacked";
  showStars?: boolean;
}

export interface NumberedSectionBlock {
  type: "numberedSection";
  id: string;
  number: string;
  label: string;
  headline: string;
  body: string;
  imageLabel?: string;
  imageHint?: string;
}

export interface ComparisonBlock {
  type: "comparison";
  id: string;
  heading?: string;
  rows: { feature: string; ours: string; theirs: string }[];
}

export interface ProsConsBlock {
  type: "prosCons";
  id: string;
  pros: string[];
  cons: string[];
}

export interface TimelineBlock {
  type: "timeline";
  id: string;
  heading?: string;
  steps: { label: string; headline: string; body: string }[];
}

export interface GuaranteeBlock {
  type: "guarantee";
  id: string;
  text: string;
  badges?: { icon: string; label: string }[];
}

export interface DividerBlock {
  type: "divider";
  id: string;
}

export interface NoteBlock {
  type: "note";
  id: string;
  text: string;
  style: "info" | "warning" | "highlight";
}

export interface FaqBlock {
  type: "faq";
  id: string;
  heading?: string;
  items: { question: string; answer: string }[];
}

export interface AsSeenInBlock {
  type: "asSeenIn";
  id: string;
  publications: string[];
}

export interface AuthorBylineBlock {
  type: "authorByline";
  id: string;
  author: string;
  role?: string;
  date: string;
  category?: string;
  publicationName?: string;
  viewCount?: string;
  liveViewers?: string;
}

export interface FeatureListBlock {
  type: "featureList";
  id: string;
  heading?: string;
  items: string[];
  icon?: string;
}

export interface OfferBoxBlock {
  type: "offerBox";
  id: string;
  headline: string;
  subtext: string;
  buttonText: string;
  discount?: string;
  guarantee?: string;
  urgency?: string;
  layout?: "stacked" | "horizontal";
}

export interface CommentsBlock {
  type: "comments";
  id: string;
  heading?: string;
  comments: {
    name: string;
    text: string;
    likes?: string;
    timeAgo: string;
    isVerified?: boolean;
    isReply?: boolean;
  }[];
}

export interface DisclaimerBlock {
  type: "disclaimer";
  id: string;
  text: string;
}

export interface UrgencyBannerBlock {
  type: "urgencyBanner";
  id: string;
  text: string;
  style?: "breaking" | "limited" | "trending";
}

export interface PricingTiersBlock {
  type: "pricingTiers";
  id: string;
  heading?: string;
  productHandle: string;
  tiers: {
    name: string;
    originalPrice: string;
    salePrice: string;
    perUnit?: string;
    tag?: string;
    features: string[];
    highlight?: boolean;
  }[];
  ctaText?: string;
  guarantee?: string;
}

// ─── Union Type ───────────────────────────────────────────────────────────────

export type Block =
  | HeadlineBlock
  | TextBlock
  | ImageBlock
  | CtaBlock
  | SocialProofBlock
  | StatsBlock
  | TestimonialsBlock
  | NumberedSectionBlock
  | ComparisonBlock
  | ProsConsBlock
  | TimelineBlock
  | GuaranteeBlock
  | DividerBlock
  | NoteBlock
  | FaqBlock
  | AsSeenInBlock
  | AuthorBylineBlock
  | FeatureListBlock
  | OfferBoxBlock
  | CommentsBlock
  | DisclaimerBlock
  | UrgencyBannerBlock
  | PricingTiersBlock;

export type BlockType = Block["type"];

// ─── Block Catalog (for the "Add Block" palette) ─────────────────────────────

export interface BlockCatalogEntry {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

export const BLOCK_CATALOG: BlockCatalogEntry[] = [
  { type: "headline", label: "Headline", description: "Large heading text", icon: "📰" },
  { type: "text", label: "Text", description: "Narrative paragraph(s)", icon: "📝" },
  { type: "image", label: "Image", description: "Image placeholder or uploaded image", icon: "🖼️" },
  { type: "cta", label: "Call to Action", description: "Button with headline and subtext", icon: "🔘" },
  { type: "socialProof", label: "Social Proof", description: "Star rating + review counts", icon: "⭐" },
  { type: "stats", label: "Statistics", description: "Grid of big numbers", icon: "📊" },
  { type: "testimonials", label: "Testimonials", description: "Customer review cards", icon: "💬" },
  { type: "numberedSection", label: "Numbered Section", description: "Numbered benefit block", icon: "🔢" },
  { type: "comparison", label: "Comparison Table", description: "Us vs. them comparison", icon: "⚖️" },
  { type: "prosCons", label: "Pros & Cons", description: "Pros and cons list", icon: "✅" },
  { type: "timeline", label: "Timeline", description: "Step-by-step progression", icon: "📅" },
  { type: "guarantee", label: "Guarantee", description: "Trust badges & guarantee bar", icon: "🛡️" },
  { type: "divider", label: "Divider", description: "Visual separator", icon: "➖" },
  { type: "note", label: "Callout Note", description: "Highlighted callout box", icon: "📌" },
  { type: "faq", label: "FAQ", description: "Frequently asked questions accordion", icon: "❓" },
  { type: "asSeenIn", label: "As Seen In", description: "Press & media logos bar", icon: "📰" },
  { type: "authorByline", label: "Author Byline", description: "Author name, date & category", icon: "✍️" },
  { type: "featureList", label: "Feature List", description: "Checkmark bullet list", icon: "☑️" },
  { type: "offerBox", label: "Offer Box", description: "Product offer with discount & guarantee", icon: "🎁" },
  { type: "comments", label: "Comments", description: "Social proof comment thread", icon: "💬" },
  { type: "disclaimer", label: "Disclaimer", description: "Advertorial disclosure footer", icon: "⚖️" },
  { type: "urgencyBanner", label: "Urgency Banner", description: "Sticky top bar with time-sensitive message", icon: "🔴" },
  { type: "pricingTiers", label: "Pricing Tiers", description: "3-tier product pricing (Single / Bundle / Best Value)", icon: "💰" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _blockIdCounter = 0;

export function generateBlockId(): string {
  _blockIdCounter++;
  return `blk_${Date.now().toString(36)}_${_blockIdCounter}`;
}

/** Creates a new empty block of the given type with sensible defaults. */
export function createEmptyBlock(type: BlockType): Block {
  const id = generateBlockId();

  switch (type) {
    case "headline":
      return { type, id, text: "Your Headline Here", size: "large", align: "left" };
    case "text":
      return { type, id, content: "Write your content here...", variant: "default" };
    case "image":
      return { type, id, label: "Insert image here", hint: "Describe what image should go here", height: "280px", rounded: true };
    case "cta":
      return { type, id, headline: "Ready to Get Started?", subtext: "Try it risk-free today.", buttonText: "Shop Now", style: "primary", variant: "gradient" };
    case "socialProof":
      return { type, id, rating: "4.8", reviewCount: "[X]K+", customerCount: "[X]K+" };
    case "stats":
      return { type, id, stats: [{ value: "[X]%", label: "Describe this stat" }, { value: "[X]%", label: "Describe this stat" }], layout: "grid" };
    case "testimonials":
      return { type, id, testimonials: [{ quote: "Customer quote here...", name: "[Customer Name]", detail: "Verified Buyer" }], layout: "grid", showStars: true };
    case "numberedSection":
      return { type, id, number: "01", label: "SECTION", headline: "Section Headline", body: "Section content here..." };
    case "comparison":
      return { type, id, rows: [{ feature: "Feature", ours: "✓ Yes", theirs: "✗ No" }] };
    case "prosCons":
      return { type, id, pros: ["Pro item here"], cons: ["Con item here"] };
    case "timeline":
      return { type, id, steps: [{ label: "Step 1", headline: "Headline", body: "Description" }] };
    case "guarantee":
      return { type, id, text: "30-Day Money Back Guarantee · Free Shipping · Secure Checkout", badges: [{ icon: "🛡️", label: "Money-Back Guarantee" }, { icon: "🚚", label: "Free Shipping" }, { icon: "🔒", label: "Secure Checkout" }] };
    case "divider":
      return { type, id };
    case "note":
      return { type, id, text: "Important note here...", style: "highlight" };
    case "faq":
      return { type, id, items: [{ question: "Your question here?", answer: "Your answer here." }] };
    case "asSeenIn":
      return { type, id, publications: ["VOGUE", "ELLE", "Forbes", "Glamour"] };
    case "authorByline":
      return { type, id, author: "Author Name", role: "Health Editor", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), category: "HEALTH", publicationName: "Wellness Daily" };
    case "featureList":
      return { type, id, items: ["Feature one", "Feature two", "Feature three"], icon: "✓" };
    case "offerBox":
      return { type, id, headline: "Special Offer", subtext: "Try it risk-free today.", buttonText: "Check Availability", discount: "[X]% OFF", guarantee: "30-Day Money-Back Guarantee", urgency: "Limited time offer — while supplies last", layout: "stacked" };
    case "comments":
      return { type, id, comments: [{ name: "Customer Name", text: "Great product! Really made a difference.", likes: "43", timeAgo: "2 days ago", isVerified: true }] };
    case "disclaimer":
      return { type, id, text: "THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE. MARKETING DISCLOSURE: This website is a marketplace. The owner has a monetary connection to the products and services advertised on the site." };
    case "urgencyBanner":
      return { type, id, text: "TRENDING: Thousands of customers discovered this week — stock is running low", style: "trending" };
    case "pricingTiers":
      return {
        type, id,
        heading: "Choose Your Package",
        productHandle: "product",
        tiers: [
          { name: "Starter", originalPrice: "$79", salePrice: "$49", perUnit: "$49 per unit", tag: undefined, features: ["Free shipping", "30-day guarantee"], highlight: false },
          { name: "Most Popular", originalPrice: "$177", salePrice: "$99", perUnit: "$33/unit — Save $78", tag: "MOST POPULAR", features: ["Free shipping", "60-day guarantee", "Best seller"], highlight: true },
          { name: "Best Value", originalPrice: "$294", salePrice: "$147", perUnit: "$24.50/unit — Save $147", tag: "BEST VALUE", features: ["Free shipping", "90-day guarantee", "Lowest price per unit"], highlight: false },
        ],
        ctaText: "Get My Order",
        guarantee: "60-Day Money-Back Guarantee — No Questions Asked",
      };
  }
}
