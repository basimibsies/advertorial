import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect, useActionData, useLoaderData, useNavigation, useSearchParams, Form } from "@remix-run/react";
import {
  Page,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getProducts, getBrandSettings, type Product } from "../lib/shopify.server";
import { renderBlocks } from "../lib/templates.server";
import { createShopifyPage } from "../lib/shopify.server";
import type { Block, BlockType } from "../lib/blocks";
import { BLOCK_CATALOG, createEmptyBlock } from "../lib/blocks";
import { generateFromPremadeTemplate, PREMADE_TEMPLATES, type AngleType } from "../lib/premade-templates";
import { generateBlocksWithAI } from "../lib/ai.server";
import prisma from "../db.server";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: "template", label: "Template" },
  { id: "product", label: "Product" },
  { id: "angle", label: "Angle" },
  { id: "brand", label: "Brand" },
  { id: "preview", label: "Edit & Publish" },
] as const;

const ANGLES: {
  id: AngleType;
  label: string;
  emoji: string;
  description: string;
  example: string;
}[] = [
  {
    id: "Pain",
    label: "Pain Point",
    emoji: "🎯",
    description: "Leads with the problem your customer faces, then positions your product as the solution.",
    example: '"Tired of products that don\'t deliver?"',
  },
  {
    id: "Desire",
    label: "Aspiration",
    emoji: "✨",
    description: "Paints a picture of the ideal outcome, making readers envision a better version of their life.",
    example: '"Imagine waking up feeling confident..."',
  },
  {
    id: "Comparison",
    label: "Comparison",
    emoji: "⚖️",
    description: "Positions your product against alternatives, highlighting what makes it the better choice.",
    example: '"Why smart customers are switching..."',
  },
];

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const [products, brandSettings] = await Promise.all([
    getProducts(admin),
    getBrandSettings(admin),
  ]);
  return json({ products, brandSettings, shop: session.shop });
};

// ─── Action ──────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const step = formData.get("step") as string;

  if (step === "generate") {
    const productId = formData.get("productId") as string;
    const angle = (formData.get("angle") as AngleType) || "Desire";
    const primaryColor = (formData.get("primaryColor") as string) || "#22c55e";
    const templateId = (formData.get("templateId") as string) || "editorial";

    if (!productId) {
      return json({ error: "Please select a product", step: "generate" }, { status: 400 });
    }

    const products = await getProducts(admin);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return json({ error: "Product not found", step: "generate" }, { status: 400 });
    }

    try {
      const { title, blocks } = generateFromPremadeTemplate(templateId, {
        productTitle: product.title,
        productHandle: product.handle,
        productDescription: product.description,
        productImage: product.featuredImage || undefined,
        angle,
      });

      const html = renderBlocks(blocks, {
        primaryColor,
        productTitle: product.title,
        productHandle: product.handle,
      });

      const templateName = PREMADE_TEMPLATES.find((t) => t.id === templateId)?.name || "Template";
      return json({
        step: "preview",
        productId,
        productTitle: product.title,
        productHandle: product.handle,
        title,
        html,
        blocks,
        primaryColor,
        angle,
        templateId,
        templateName,
      });
    } catch (error) {
      console.error("Generation error:", error);
      return json(
        { error: error instanceof Error ? error.message : "Failed to generate content", step: "generate" },
        { status: 500 },
      );
    }
  }

  if (step === "ai-generate") {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productHandle = formData.get("productHandle") as string;
    const productDescription = (formData.get("productDescription") as string) || "";
    const primaryColor = (formData.get("primaryColor") as string) || "#22c55e";
    // Structured intake fields
    const targetCustomer = (formData.get("targetCustomer") as string) || "";
    const mechanism = (formData.get("mechanism") as string) || "";
    const proof = (formData.get("proof") as string) || "";
    const stylePreset = ((formData.get("stylePreset") as string) || "A") as "A" | "B" | "C" | "D";
    const imageUrlsRaw = (formData.get("imageUrls") as string) || "";
    const imageUrls = imageUrlsRaw.split("\n").map((u) => u.trim()).filter(Boolean);

    if (!productId || (!targetCustomer.trim() && !mechanism.trim())) {
      return json({ error: "Please select a product and fill in the required fields.", step: "ai-generate" }, { status: 400 });
    }

    try {
      const blocks = await generateBlocksWithAI({
        productTitle,
        productHandle,
        productDescription,
        targetCustomer,
        mechanism,
        proof,
        stylePreset,
        imageUrls,
      });

      const html = renderBlocks(blocks, { primaryColor, productTitle, productHandle });
      const title = `${productTitle} — AI Generated`;

      return json({
        step: "preview",
        productId,
        productTitle,
        productHandle,
        title,
        html,
        blocks,
        primaryColor,
        angle: "AI",
        templateId: "ai-generate",
        templateName: "AI Generated",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      return json(
        { error: error instanceof Error ? error.message : "AI generation failed. Please try again.", step: "ai-generate" },
        { status: 500 },
      );
    }
  }

  if (step === "publish") {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productHandle = formData.get("productHandle") as string;
    const title = formData.get("title") as string;
    const blocksJson = formData.get("blocks") as string;
    const primaryColor = (formData.get("primaryColor") as string) || "#22c55e";
    const isModal = formData.get("modal") === "true";

    if (!productId || !title || !blocksJson) {
      return json({ error: "Missing required fields", step: "publish" }, { status: 400 });
    }

    try {
      const blocks = JSON.parse(blocksJson) as Block[];
      const html = renderBlocks(blocks, { primaryColor, productTitle, productHandle });

      const { id: shopifyPageId, url: shopifyPageUrl } = await createShopifyPage(admin, session.shop, title, html);

      const advertorial = await prisma.advertorial.create({
        data: {
          shop: session.shop,
          productId,
          productTitle,
          productHandle,
          template: (formData.get("templateId") as string) || "Editorial",
          angle: (formData.get("angle") as string) || "General",
          title,
          content: html,
          blocks: blocksJson,
          shopifyPageId,
          shopifyPageUrl,
        },
      });

      if (isModal) {
        return json({ step: "wizardDone", advertorialId: advertorial.id });
      }
      return redirect(`/app/${advertorial.id}`);
    } catch (error) {
      console.error("Publish error:", error);
      return json(
        { error: error instanceof Error ? error.message : "Failed to publish page", step: "publish" },
        { status: 500 },
      );
    }
  }

  return json({ error: "Invalid step" }, { status: 400 });
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  wizard: {
    maxWidth: "960px",
    margin: "0 auto",
  } as React.CSSProperties,

  editorWizard: {
    width: "100%",
    maxWidth: "1680px",
    margin: "0 auto",
    padding: "0 12px",
  } as React.CSSProperties,

  progressBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 0 40px",
    gap: "0",
  } as React.CSSProperties,
  stepCircle: (state: "completed" | "current" | "upcoming") => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 600,
    flexShrink: 0,
    transition: "all 0.2s ease",
    ...(state === "completed"
      ? { backgroundColor: "#008060", color: "#fff" }
      : state === "current"
        ? { backgroundColor: "#2C6ECB", color: "#fff", boxShadow: "0 0 0 4px rgba(44, 110, 203, 0.2)" }
        : { backgroundColor: "#f1f1f1", color: "#8c9196", border: "2px solid #d2d5d8" }),
  }) as React.CSSProperties,
  stepLine: (completed: boolean) => ({
    width: "80px",
    height: "2px",
    backgroundColor: completed ? "#008060" : "#d2d5d8",
    transition: "background-color 0.2s ease",
  }) as React.CSSProperties,
  stepLabel: (active: boolean) => ({
    fontSize: "12px",
    fontWeight: active ? 600 : 400,
    color: active ? "#202223" : "#8c9196",
    textAlign: "center" as const,
    marginTop: "8px",
    width: "80px",
  }) as React.CSSProperties,
  stepGroup: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  } as React.CSSProperties,

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  } as React.CSSProperties,
  card: (selected: boolean) => ({
    border: selected ? "2px solid #2C6ECB" : "2px solid #e1e3e5",
    borderRadius: "12px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    backgroundColor: selected ? "#f0f6ff" : "#fff",
    position: "relative" as const,
    ...(selected ? { boxShadow: "0 0 0 1px #2C6ECB" } : {}),
  }) as React.CSSProperties,

  productImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover" as const,
    borderRadius: "8px",
    marginBottom: "12px",
    backgroundColor: "#f6f6f7",
  } as React.CSSProperties,
  productPlaceholder: {
    width: "100%",
    height: "120px",
    borderRadius: "8px",
    marginBottom: "12px",
    backgroundColor: "#f6f6f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8c9196",
    fontSize: "32px",
  } as React.CSSProperties,

  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "32px",
    marginTop: "32px",
    borderTop: "1px solid #e1e3e5",
  } as React.CSSProperties,

  heading: {
    marginBottom: "8px",
  } as React.CSSProperties,
  subtext: {
    color: "#6d7175",
    marginBottom: "28px",
    fontSize: "14px",
    lineHeight: "20px",
  } as React.CSSProperties,
};

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div style={styles.progressBar}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
          <div style={styles.stepGroup}>
            <div
              style={styles.stepCircle(
                i < currentStep ? "completed" : i === currentStep ? "current" : "upcoming",
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <div style={styles.stepLabel(i <= currentStep)}>{s.label}</div>
          </div>
          {i < STEPS.length - 1 && <div style={{ ...styles.stepLine(i < currentStep), marginBottom: "28px" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Template Preview Modal ─────────────────────────────────────────────────

function TemplatePreviewModal({
  templateId,
  onClose,
}: {
  templateId: string;
  onClose: () => void;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [templates, renderer] = await Promise.all([
        import("../lib/premade-templates"),
        import("../lib/block-renderer"),
      ]);
      if (cancelled) return;
      try {
        const { blocks } = templates.generateFromPremadeTemplate(templateId, {
          productTitle: "Your Product Name",
          productHandle: "your-product",
          productDescription: "This is a preview with sample content. Your actual product details will replace this text when you create your advertorial.",
        });
        const rendered = renderer.renderBlocksToHtml(blocks, {
          primaryColor: "#22c55e",
          productTitle: "Your Product Name",
          productHandle: "your-product",
        });
        if (!cancelled) setHtml(rendered);
      } catch (e) {
        console.error("Preview generation error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [templateId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #e1e3e5",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Text variant="headingMd" as="h2">
              {PREMADE_TEMPLATES.find((t) => t.id === templateId)?.name || "Template"} Preview
            </Text>
            <Badge tone="info">Sample Data</Badge>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#f1f1f1",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6d7175",
            }}
          >✕</button>
        </div>

        {/* Preview body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#f6f6f7",
          padding: "24px",
        }}>
          {html ? (
            <div style={{
              maxWidth: "800px",
              margin: "0 auto",
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              <div
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ pointerEvents: "none" }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#6d7175" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>Loading preview...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px",
          borderTop: "1px solid #e1e3e5",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          flexShrink: 0,
        }}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Template Selection ──────────────────────────────────────────────

function TemplateStep({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("top");
  const [industryFilter, setIndustryFilter] = useState("industry");
  const [seasonFilter, setSeasonFilter] = useState("season");

  const getTemplateTheme = (templateId: string) => {
    const themes: Record<string, {
      frameBg: string; paperBg: string; heading: string; body: string;
      accent: string; byline: string; hero: string;
      typeLabel: string; smallHeadline: string; bigHeadline: string; ctaTextColor: string;
    }> = {
      "editorial": {
        frameBg: "#ebe7dd",
        paperBg: "linear-gradient(145deg, #f8f5ec 0%, #f0ead8 72%, #e6dcc6 100%)",
        heading: "#1f2937", body: "#4b5563", accent: "#d9a514", byline: "#6b7280",
        hero: "linear-gradient(125deg, #e7d5a4 0%, #cfb173 52%, #a67c2e 100%)",
        typeLabel: "Editorial Article",
        smallHeadline: "Why This Product Is Trending",
        bigHeadline: "The Product Review Everyone Is Sharing",
        ctaTextColor: "#111827",
      },
      "personal-story": {
        frameBg: "#0f172a",
        paperBg: "linear-gradient(145deg, #111827 0%, #374151 70%, #4b5563 100%)",
        heading: "#f9fafb", body: "#d1d5db", accent: "#ff2b5f", byline: "#9ca3af",
        hero: "linear-gradient(125deg, #1f2937 0%, #374151 50%, #6b7280 100%)",
        typeLabel: "Personal Story",
        smallHeadline: "I Finally Found What Works",
        bigHeadline: "How I Solved My Biggest Problem",
        ctaTextColor: "#ffffff",
      },
      "listicle": {
        frameBg: "#431407",
        paperBg: "linear-gradient(145deg, #fff7ed 0%, #ffedd5 70%, #fed7aa 100%)",
        heading: "#7c2d12", body: "#c2410c", accent: "#f97316", byline: "#ea580c",
        hero: "linear-gradient(125deg, #fb923c 0%, #f97316 52%, #ea580c 100%)",
        typeLabel: "Listicle Format",
        smallHeadline: "5 Reasons To Switch Today",
        bigHeadline: "5 Reasons Thousands Are Making The Switch",
        ctaTextColor: "#ffffff",
      },
      "research-report": {
        frameBg: "#0c1445",
        paperBg: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 72%, #bfdbfe 100%)",
        heading: "#1e3a5f", body: "#1e40af", accent: "#2563eb", byline: "#3b82f6",
        hero: "linear-gradient(125deg, #60a5fa 0%, #2563eb 52%, #1d4ed8 100%)",
        typeLabel: "Research Report",
        smallHeadline: "Clinical Study Reveals Results",
        bigHeadline: "The Science-Backed Breakthrough You've Been Waiting For",
        ctaTextColor: "#ffffff",
      },
      "before-after": {
        frameBg: "#240a2e",
        paperBg: "linear-gradient(145deg, #fdf4ff 0%, #fae8ff 72%, #f0abfc 100%)",
        heading: "#581c87", body: "#7e22ce", accent: "#a855f7", byline: "#c084fc",
        hero: "linear-gradient(125deg, #e879f9 0%, #a855f7 52%, #7e22ce 100%)",
        typeLabel: "Transformation Story",
        smallHeadline: "My Life Before & After",
        bigHeadline: "How I Transformed My Life in Just 30 Days",
        ctaTextColor: "#ffffff",
      },
    };
    return themes[templateId] || themes["editorial"];
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <Text variant="headingLg" as="h2">Choose a template</Text>
          <p style={{ ...styles.subtext, marginBottom: 0 }}>
            A template is just a starting point. You'll be able to customize every detail in the editor.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setActiveFilter("top")}
            style={{
              border: activeFilter === "top" ? "1px solid #bfc3c7" : "1px solid #d2d5d8",
              borderRadius: "8px",
              backgroundColor: activeFilter === "top" ? "#f3f4f6" : "#fff",
              color: "#202223",
              fontSize: "13px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Top performers
          </button>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={{
              border: "1px solid #d2d5d8",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#6d7175",
              fontSize: "13px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <option value="industry">Industry</option>
          </select>
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            style={{
              border: "1px solid #d2d5d8",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#6d7175",
              fontSize: "13px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <option value="season">Season</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setActiveFilter("top");
              setIndustryFilter("industry");
              setSeasonFilter("season");
            }}
            style={{
              border: "none",
              background: "none",
              color: "#202223",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 6px",
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* AI Generate option */}
        <div>
          <div
            style={{
              border: selected === "ai-generate" ? "2px solid #7c3aed" : "1.5px dashed #c4b5fd",
              borderRadius: "12px",
              backgroundColor: selected === "ai-generate" ? "#f5f3ff" : "#faf9ff",
              padding: "14px",
              cursor: "pointer",
              boxShadow: selected === "ai-generate" ? "0 0 0 2px rgba(124, 58, 237, 0.15)" : "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => onSelect("ai-generate")}
            role="button"
            tabIndex={0}
          >
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="headingMd" as="h3">Generate with AI</Text>
                <Badge tone="attention">New</Badge>
              </InlineStack>
            </InlineStack>

            <div style={{ display: "grid", gridTemplateColumns: "132px 1fr", gap: "14px", marginTop: "12px" }}>
              {/* Mini thumbnail */}
              <div style={{
                borderRadius: "8px",
                minHeight: "238px",
                padding: "8px",
                background: "linear-gradient(145deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}>
                <div style={{ fontSize: "36px" }}>✨</div>
                <div style={{ fontSize: "7px", color: "#e9d5ff", textAlign: "center", fontWeight: 600, letterSpacing: "0.5px" }}>AI POWERED</div>
                <div style={{ display: "grid", gap: "4px", width: "100%", padding: "0 4px" }}>
                  {[90, 70, 85, 60, 75].map((w, i) => (
                    <div key={i} style={{ height: "3px", borderRadius: "99px", width: `${w}%`, backgroundColor: "rgba(233,213,255,0.5)" }} />
                  ))}
                </div>
              </div>

              {/* Description panel */}
              <div style={{
                borderRadius: "8px",
                minHeight: "238px",
                padding: "14px",
                background: "linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "10px",
              }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#4c1d95", lineHeight: 1.1 }}>
                  Describe it.<br />We'll build it.
                </div>
                <div style={{ fontSize: "11px", color: "#6d28d9", lineHeight: 1.5 }}>
                  Tell the AI your audience, tone, and angle — it writes the full page with real copy.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {["Custom audience targeting", "Real copy, no placeholders", "Any angle or structure"].map((f) => (
                    <div key={f} style={{ fontSize: "10px", color: "#5b21b6", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ color: "#7c3aed" }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <Text variant="bodySm" as="p" tone="subdued">
                Describe your target audience, tone, and what you want to highlight — the AI writes a complete, ready-to-publish page.
              </Text>
            </div>
          </div>
        </div>

        {PREMADE_TEMPLATES.map((t) => {
          const theme = getTemplateTheme(t.id);
          return (
          <div key={t.id}>
            <div
              style={{
                border: selected === t.id ? "2px solid #2C6ECB" : "1px solid #d2d5d8",
                borderRadius: "12px",
                backgroundColor: "#fff",
                padding: "14px",
                cursor: "pointer",
                boxShadow: selected === t.id ? "0 0 0 2px rgba(44, 110, 203, 0.12)" : "none",
              }}
              onClick={() => onSelect(t.id)}
              role="button"
              tabIndex={0}
            >
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Text variant="headingMd" as="h3">{t.name}</Text>
                  <Badge tone="info">Top Performer</Badge>
                </InlineStack>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewingId(t.id);
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #c9cccf",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    color: "#202223",
                    cursor: "pointer",
                  }}
                >
                  Preview
                </button>
              </InlineStack>

              <div style={{ display: "grid", gridTemplateColumns: "132px 1fr", gap: "14px", marginTop: "12px" }}>
                {/* Small thumbnail */}
                <div style={{
                  borderRadius: "8px",
                  minHeight: "238px",
                  padding: "8px",
                  backgroundColor: theme.frameBg,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ borderRadius: "6px", background: theme.paperBg, padding: "8px" }}>
                    <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: "0.6px", color: theme.byline, textTransform: "uppercase" }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: 1.1, fontWeight: 800, marginTop: "6px", color: theme.heading }}>
                      {theme.smallHeadline}
                    </div>
                    <div style={{ fontSize: "6.5px", marginTop: "5px", color: theme.byline }}>
                      By Editor Team • Today
                    </div>
                    {t.id === "listicle" ? (
                      <div style={{ height: "48px", borderRadius: "5px", marginTop: "7px", background: theme.hero, padding: "5px 6px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                        {["01", "02", "03"].map((n) => (
                          <div key={n} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "5px", fontWeight: 900, color: "#fff", background: "rgba(0,0,0,0.25)", borderRadius: "2px", padding: "1px 3px", minWidth: "10px", textAlign: "center" }}>{n}</span>
                            <div style={{ flex: 1, height: "3px", borderRadius: "99px", background: "rgba(255,255,255,0.45)" }} />
                          </div>
                        ))}
                      </div>
                    ) : t.id === "research-report" ? (
                      <div style={{ height: "48px", borderRadius: "5px", marginTop: "7px", background: theme.hero, padding: "4px 6px", display: "flex", alignItems: "flex-end", gap: "3px", justifyContent: "center" }}>
                        {[40, 62, 78, 92, 55].map((h, i) => (
                          <div key={i} style={{ flex: 1, height: `${Math.round(h * 0.35)}px`, borderRadius: "2px 2px 0 0", background: "rgba(255,255,255,0.6)" }} />
                        ))}
                      </div>
                    ) : t.id === "before-after" ? (
                      <div style={{ height: "48px", borderRadius: "5px", marginTop: "7px", background: theme.hero, padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "3px", padding: "2px 4px", fontSize: "5px", fontWeight: 800, color: "#fff" }}>BEFORE</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>→</div>
                        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "3px", padding: "2px 4px", fontSize: "5px", fontWeight: 800, color: "#fff" }}>AFTER</div>
                      </div>
                    ) : (
                      <div style={{ height: "48px", borderRadius: "5px", marginTop: "7px", background: theme.hero }} />
                    )}
                    <div style={{ marginTop: "7px", display: "grid", gap: "4px" }}>
                      <div style={{ height: "4px", borderRadius: "99px", width: "94%", backgroundColor: theme.body, opacity: 0.38 }} />
                      <div style={{ height: "4px", borderRadius: "99px", width: "100%", backgroundColor: theme.body, opacity: 0.38 }} />
                      <div style={{ height: "4px", borderRadius: "99px", width: "78%", backgroundColor: theme.body, opacity: 0.38 }} />
                    </div>
                    <div style={{ fontSize: "6px", fontWeight: 700, borderRadius: "4px", marginTop: "7px", textAlign: "center", padding: "5px 0", backgroundColor: theme.accent, color: theme.ctaTextColor }}>
                      CHECK AVAILABILITY
                    </div>
                  </div>
                </div>

                {/* Large thumbnail */}
                <div style={{
                  borderRadius: "8px",
                  minHeight: "238px",
                  padding: "8px",
                  backgroundColor: theme.frameBg,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ borderRadius: "6px", background: theme.paperBg, padding: "14px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", color: theme.byline, textTransform: "uppercase" }}>
                      {theme.typeLabel}
                    </div>
                    <div style={{ fontSize: "28px", lineHeight: 1.02, fontWeight: 800, marginTop: "9px", color: theme.heading }}>
                      {theme.bigHeadline}
                    </div>
                    <div style={{ fontSize: "10px", marginTop: "7px", color: theme.byline }}>
                      By Sarah M. • Updated today
                    </div>
                    {t.id === "listicle" ? (
                      <div style={{ height: "88px", borderRadius: "6px", marginTop: "10px", background: theme.hero, padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                        {["01", "02", "03", "04", "05"].map((n) => (
                          <div key={n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "7px", fontWeight: 900, color: "#fff", background: "rgba(0,0,0,0.22)", borderRadius: "3px", padding: "1px 4px", minWidth: "14px", textAlign: "center" }}>{n}</span>
                            <div style={{ flex: 1, height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.45)" }} />
                          </div>
                        ))}
                      </div>
                    ) : t.id === "research-report" ? (
                      <div style={{ height: "88px", borderRadius: "6px", marginTop: "10px", background: theme.hero, padding: "10px 10px 8px", display: "flex", alignItems: "flex-end", gap: "5px", justifyContent: "center" }}>
                        {[45, 65, 80, 92, 58, 75].map((h, i) => (
                          <div key={i} style={{ flex: 1, height: `${Math.round(h * 0.56)}px`, borderRadius: "2px 2px 0 0", background: "rgba(255,255,255,0.55)" }} />
                        ))}
                      </div>
                    ) : t.id === "before-after" ? (
                      <div style={{ height: "88px", borderRadius: "6px", marginTop: "10px", background: theme.hero, padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ flex: 1, background: "rgba(0,0,0,0.22)", borderRadius: "5px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>BEFORE</span>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                          <div style={{ height: "3px", borderRadius: "99px", width: "65%", background: "rgba(255,255,255,0.3)" }} />
                          <div style={{ height: "3px", borderRadius: "99px", width: "55%", background: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", flexShrink: 0 }}>→</div>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.18)", borderRadius: "5px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span style={{ fontSize: "7px", fontWeight: 700, color: "#fff" }}>AFTER</span>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                          <div style={{ height: "3px", borderRadius: "99px", width: "80%", background: "rgba(255,255,255,0.6)" }} />
                          <div style={{ height: "3px", borderRadius: "99px", width: "70%", background: "rgba(255,255,255,0.6)" }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: "88px", borderRadius: "6px", marginTop: "10px", background: theme.hero }} />
                    )}
                    <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
                      <div style={{ height: "6px", borderRadius: "99px", width: "100%", backgroundColor: theme.body, opacity: 0.36 }} />
                      <div style={{ height: "6px", borderRadius: "99px", width: "94%", backgroundColor: theme.body, opacity: 0.36 }} />
                      <div style={{ height: "6px", borderRadius: "99px", width: "98%", backgroundColor: theme.body, opacity: 0.36 }} />
                      <div style={{ height: "6px", borderRadius: "99px", width: "78%", backgroundColor: theme.body, opacity: 0.36 }} />
                    </div>
                    <div style={{ display: "inline-block", fontSize: "9px", fontWeight: 800, borderRadius: "5px", marginTop: "10px", padding: "7px 12px", backgroundColor: theme.accent, color: theme.ctaTextColor }}>
                      SHOP NOW
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "10px" }}>
                <Text variant="bodySm" as="p" tone="subdued">{t.description}</Text>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {previewingId && (
        <TemplatePreviewModal
          templateId={previewingId}
          onClose={() => setPreviewingId(null)}
        />
      )}
    </div>
  );
}

// ─── Step 2: Product Selection ───────────────────────────────────────────────

function ProductStep({
  products,
  selected,
  onSelect,
}: {
  products: Product[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div style={styles.heading}>
        <Text variant="headingLg" as="h2">Select a product</Text>
      </div>
      <p style={styles.subtext}>
        Choose the product you want to create an advertorial for. We'll generate a beautiful template pre-filled with your product info.
      </p>

      <div style={styles.cardGrid}>
        {products.map((p) => (
          <div
            key={p.id}
            style={styles.card(selected === p.id)}
            onClick={() => onSelect(p.id)}
            role="button"
            tabIndex={0}
          >
            {p.featuredImage ? (
              <img
                src={p.featuredImage}
                alt={p.title}
                style={styles.productImage}
              />
            ) : (
              <div style={styles.productPlaceholder}>📦</div>
            )}
            <Text variant="headingSm" as="h4">{p.title}</Text>
            {p.description && (
              <div style={{ marginTop: "4px" }}>
                <Text variant="bodySm" tone="subdued">
                  {p.description.length > 80 ? p.description.slice(0, 80) + "..." : p.description}
                </Text>
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <Banner tone="warning" title="No products found">
          <p>Add products to your Shopify store first, then come back to create an advertorial.</p>
        </Banner>
      )}
    </div>
  );
}

// ─── Step 2: Angle Selection ─────────────────────────────────────────────────

function AngleStep({
  selected,
  onSelect,
}: {
  selected: AngleType | "";
  onSelect: (a: AngleType) => void;
}) {
  return (
    <div>
      <div style={styles.heading}>
        <Text variant="headingLg" as="h2">Choose your angle</Text>
      </div>
      <p style={styles.subtext}>
        The angle determines the psychological approach of your advertorial. Each one appeals to different motivations.
      </p>

      <div style={styles.cardGrid}>
        {ANGLES.map((a) => (
          <div
            key={a.id}
            style={styles.card(selected === a.id)}
            onClick={() => onSelect(a.id)}
            role="button"
            tabIndex={0}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{a.emoji}</div>
            <Text variant="headingMd" as="h3">{a.label}</Text>
            <div style={{ margin: "8px 0" }}>
              <Text variant="bodySm" tone="subdued">{a.description}</Text>
            </div>
            <div style={{ padding: "8px 12px", backgroundColor: "#f6f6f7", borderRadius: "6px", marginTop: "8px" }}>
              <Text variant="bodySm" tone="subdued" fontWeight="medium">
                {a.example}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Brand Customization ─────────────────────────────────────────────

function BrandStep({
  primaryColor,
  onPrimaryChange,
}: {
  primaryColor: string;
  onPrimaryChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={styles.heading}>
        <Text variant="headingLg" as="h2">Customize your brand</Text>
      </div>
      <p style={styles.subtext}>
        Set the primary accent color used for CTAs, highlights, and key elements.
      </p>

      <div style={{ maxWidth: "400px" }}>
        <BlockStack gap="400">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryChange(e.target.value)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                border: "2px solid #e1e3e5",
                padding: 0,
                cursor: "pointer",
                backgroundColor: primaryColor,
              }}
            />
            <div>
              <Text variant="bodyMd" fontWeight="medium">Primary / Accent Color</Text>
              <Text variant="bodySm" tone="subdued">Used for buttons, links, and highlights</Text>
            </div>
          </div>

          {/* Preview swatch row */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {["#22c55e", "#2C6ECB", "#e03131", "#f59f00", "#7c3aed", "#000000"].map((c) => (
              <div
                key={c}
                onClick={() => onPrimaryChange(c)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: c,
                  cursor: "pointer",
                  border: primaryColor === c ? "3px solid #212529" : "2px solid #e1e3e5",
                  transition: "all 0.1s ease",
                }}
              />
            ))}
          </div>

          {/* Mini button preview */}
          <div style={{ marginTop: "20px", padding: "20px", border: "1px solid #e1e3e5", borderRadius: "12px", backgroundColor: "#fafafa" }}>
            <Text variant="bodySm" tone="subdued">Preview</Text>
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ padding: "10px 24px", backgroundColor: primaryColor, color: "#fff", borderRadius: "8px", fontWeight: 700, fontSize: "14px" }}>
                CHECK AVAILABILITY
              </div>
              <div style={{ fontSize: "13px", color: primaryColor, fontWeight: 600 }}>✔ 30-Day Money-Back Guarantee</div>
            </div>
          </div>
        </BlockStack>
      </div>
    </div>
  );
}

// ─── Step: AI Intake ──────────────────────────────────────────────────────────

interface AIIntake {
  targetCustomer: string;
  mechanism: string;
  proof: string;
  stylePreset: "A" | "B" | "C" | "D" | "";
  imageUrls: string;
}

const AI_STYLE_PRESETS = [
  {
    id: "A" as const,
    name: "Clinical Editorial",
    description: "Medical authority. Doctor/specialist framing. Best for supplements, health, skincare.",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    example: '"The Supplement Dermatologists Are Recommending to Their Own Patients"',
  },
  {
    id: "B" as const,
    name: "Lifestyle Magazine",
    description: "Cosmopolitan/GQ editorial feel. Polished, aspirational. Best for beauty, fashion, home.",
    accent: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    example: '"5 Women Over 40 Are Using This Every Morning — Editors Tested It"',
  },
  {
    id: "C" as const,
    name: "News Exposé",
    description: "Urgent, revealing, investigative. 'Industry insiders say…' Best for weight loss, hidden truth angles.",
    accent: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    example: '"BREAKING: The Weight Loss Industry Has Been Hiding This Simple Fix"',
  },
  {
    id: "D" as const,
    name: "Warm & Trustworthy",
    description: "Like a text from a trusted friend. Personal, conversational. Best for pet, family, food.",
    accent: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    example: '"I Tried Everything for My Dog\'s Joint Pain. Nothing Worked Until This."',
  },
];

function AIIntakeField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  rows = 3,
  required = true,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ marginBottom: "4px", display: "flex", alignItems: "baseline", gap: "6px" }}>
        <label style={{ fontSize: "14px", fontWeight: 600, color: "#202223" }}>
          {label}
          {required && <span style={{ color: "#e03131", marginLeft: "2px" }}>*</span>}
        </label>
        <span style={{ fontSize: "12px", color: "#8c9196" }}>—</span>
        <span style={{ fontSize: "12px", color: "#6d7175" }}>{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: "14px",
          lineHeight: "1.55",
          border: "1.5px solid #d2d5d8",
          borderRadius: "8px",
          resize: "vertical",
          fontFamily: "inherit",
          color: "#202223",
          backgroundColor: "#fff",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#2C6ECB"; }}
        onBlur={(e) => { e.target.style.borderColor = "#d2d5d8"; }}
      />
    </div>
  );
}

function AIIntakeStep({
  selectedProductTitle,
  aiIntake,
  onChange,
}: {
  selectedProductTitle: string;
  aiIntake: AIIntake;
  onChange: (updates: Partial<AIIntake>) => void;
}) {
  return (
    <div>
      <div style={styles.heading}>
        <Text variant="headingLg" as="h2">Tell us about your advertorial</Text>
      </div>
      <p style={styles.subtext}>
        The more specific you are, the better the AI copy.
        {selectedProductTitle && <> Generating for: <strong>{selectedProductTitle}</strong>.</>}
      </p>

      <div style={{ maxWidth: "720px" }}>
        <AIIntakeField
          label="Who is this for?"
          hint="Your target customer"
          placeholder="e.g. Women 35–55 who struggle with joint pain after exercise, frustrated with products that wear off quickly"
          value={aiIntake.targetCustomer}
          onChange={(v) => onChange({ targetCustomer: v })}
          rows={3}
        />

        <AIIntakeField
          label="What makes this product different?"
          hint="The mechanism or unique angle"
          placeholder="e.g. Liposomal delivery system that reaches joint tissue 3× faster than standard glucosamine — this is why it works when others don't"
          value={aiIntake.mechanism}
          onChange={(v) => onChange({ mechanism: v })}
          rows={3}
        />

        <AIIntakeField
          label="What proof do you have?"
          hint="Reviews, ratings, press, endorsements"
          placeholder="e.g. 4.8 stars from 12,400+ verified reviews, featured in Men's Health, endorsed by Dr. James Carter, 60,000+ customers"
          value={aiIntake.proof}
          onChange={(v) => onChange({ proof: v })}
          rows={2}
        />

        {/* Style Preset */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#202223", marginBottom: "4px" }}>
            Page style <span style={{ color: "#e03131" }}>*</span>
            <span style={{ fontSize: "12px", fontWeight: 400, color: "#6d7175", marginLeft: "8px" }}>— Sets tone, authority figure, and headline pattern</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {AI_STYLE_PRESETS.map((preset) => {
              const sel = aiIntake.stylePreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onChange({ stylePreset: preset.id })}
                  role="button"
                  tabIndex={0}
                  style={{
                    border: sel ? `2px solid ${preset.accent}` : `1.5px solid ${preset.border}`,
                    borderRadius: "10px",
                    padding: "14px",
                    cursor: "pointer",
                    backgroundColor: sel ? preset.bg : "#fafafa",
                    boxShadow: sel ? `0 0 0 1px ${preset.accent}30` : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${sel ? preset.accent : "#d2d5d8"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {sel && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: preset.accent }} />}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: sel ? preset.accent : "#202223" }}>{preset.name}</span>
                  </div>
                  <p style={{ margin: "0 0 6px 28px", fontSize: "12px", color: "#6d7175", lineHeight: 1.45 }}>{preset.description}</p>
                  <p style={{ margin: "0 0 0 28px", fontSize: "11px", color: sel ? preset.accent : "#9ca3af", fontStyle: "italic", lineHeight: 1.4 }}>{preset.example}</p>
                </div>
              );
            })}
          </div>
        </div>

        <AIIntakeField
          label="Product image URLs"
          hint="optional — one per line"
          placeholder={"https://cdn.shopify.com/...\nhttps://cdn.shopify.com/..."}
          value={aiIntake.imageUrls}
          onChange={(v) => onChange({ imageUrls: v })}
          rows={2}
          required={false}
        />
      </div>
    </div>
  );
}

// ─── Block Label Helper ──────────────────────────────────────────────────────

function getBlockMeta(block: Block): { icon: string; label: string } {
  const entry = BLOCK_CATALOG.find((c) => c.type === block.type);
  return { icon: entry?.icon || "📦", label: entry?.label || block.type };
}

// ─── Step 2: Block Editor ────────────────────────────────────────────────────

function BlockEditorStep({
  title,
  blocks: initialBlocks,
  productTitle,
  productHandle,
  primaryColor,
  isSubmitting,
  error,
  previewData,
  onClose,
  isModal,
  brandFonts,
}: {
  title: string;
  blocks: Block[];
  productTitle: string;
  productHandle: string;
  primaryColor: string;
  isSubmitting: boolean;
  error?: string;
  previewData: any;
  onClose?: () => void;
  isModal?: boolean;
  brandFonts?: {
    headerFont?: string;
    bodyFont?: string;
  };
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");
  const [editorPrimaryColor, setEditorPrimaryColor] = useState(primaryColor);
  const [textColor, setTextColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [accentForegroundColor, setAccentForegroundColor] = useState("#ffffff");
  const [displayFont, setDisplayFont] = useState(
    brandFonts?.headerFont || "system-ui, -apple-system, sans-serif",
  );
  const [bodyFont, setBodyFont] = useState(
    brandFonts?.bodyFont || "system-ui, -apple-system, sans-serif",
  );
  const [heading1Size, setHeading1Size] = useState(52);
  const [heading2Size, setHeading2Size] = useState(36);
  const [body1Size, setBody1Size] = useState(20);
  const [body2Size, setBody2Size] = useState(16);

  const renderOpts = { primaryColor: editorPrimaryColor, productTitle, productHandle };

  const ensureFontStack = (font: string) => {
    const lower = font.toLowerCase();
    if (
      lower.includes("sans-serif") ||
      lower.includes("serif") ||
      lower.includes("monospace")
    ) {
      return font;
    }
    return `${font}, system-ui, -apple-system, sans-serif`;
  };
  const resolvedBodyFont = ensureFontStack(bodyFont);

  const [renderFn, setRenderFn] = useState<((b: Block, opts: any) => string) | null>(null);
  useEffect(() => {
    import("../lib/block-renderer").then((mod) => {
      setRenderFn(() => mod.renderSingleBlockToHtml);
    });
  }, []);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;
  const selectedIndex = blocks.findIndex((b) => b.id === selectedBlockId);

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const duplicateBlock = (index: number) => {
    const original = blocks[index];
    const dupe = { ...JSON.parse(JSON.stringify(original)), id: `blk_${Date.now().toString(36)}_dup` };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, dupe);
    setBlocks(newBlocks);
  };

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const newBlock = createEmptyBlock(type);
    const newBlocks = [...blocks];
    if (afterIndex !== undefined) {
      newBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)));
  };

  const selectBlock = (id: string) => {
    setSelectedBlockId(id);
  };

  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        border: "1px solid #d2d5d8",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          height: "46px",
          borderBottom: "1px solid #e1e3e5",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
        }}
      >
        <InlineStack gap="200" blockAlign="center">
          <span style={{ fontSize: "14px" }}>✏️</span>
          <Text variant="bodyMd" as="span" fontWeight="semibold">
            Advertorial
          </Text>
        </InlineStack>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            fontSize: "22px",
            lineHeight: 1,
            color: "#6d7175",
            cursor: "pointer",
            padding: "0 4px",
          }}
          aria-label="Close editor"
        >
          ×
        </button>
      </div>

      <div style={{ padding: "14px" }}>
      {error && (
        <div style={{ marginBottom: "16px" }}>
          <Banner tone="critical" title="Error">{error}</Banner>
        </div>
      )}

      {/* Editor toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 0", marginBottom: "16px", borderBottom: "1px solid #e1e3e5",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Text variant="headingMd" as="h2">{title}</Text>
          <Badge tone="info">{previewData?.templateName || "Template"}</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#6d7175" }}>{blocks.length} blocks</span>
          <Form method="post" style={{ display: "inline" }}>
            <input type="hidden" name="step" value="publish" />
            <input type="hidden" name="templateId" value={previewData?.templateName || "Editorial"} />
            <input type="hidden" name="productId" value={previewData?.productId} />
            <input type="hidden" name="productTitle" value={previewData?.productTitle} />
            <input type="hidden" name="productHandle" value={previewData?.productHandle} />
            <input type="hidden" name="title" value={previewData?.title} />
            <input type="hidden" name="angle" value={previewData?.angle || "Desire"} />
            <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
            <input type="hidden" name="primaryColor" value={editorPrimaryColor} />
            {isModal && <input type="hidden" name="modal" value="true" />}
            <Button submit variant="primary" loading={isSubmitting}>
              Publish to Shopify
            </Button>
          </Form>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(0,1fr) 320px",
        gap: "16px",
        minHeight: "760px",
      }}>
        <div style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e1e3e5",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "760px",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e1e3e5", backgroundColor: "#fff" }}>
            <Text variant="headingSm" as="h3">Blocks</Text>
            <Text as="p" variant="bodySm" tone="subdued">Insert after selected block</Text>
          </div>
          <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
            {BLOCK_CATALOG.map((entry) => (
              <button
                key={entry.type}
                type="button"
                onClick={() => addBlock(entry.type, selectedIndex >= 0 ? selectedIndex : undefined)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e1e3e5",
                  cursor: "pointer",
                  marginBottom: "6px",
                  backgroundColor: "#fff",
                }}
              >
                <span style={{ fontSize: "20px", width: "24px", textAlign: "center" }}>{entry.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#202223" }}>{entry.label}</div>
                  <div style={{ fontSize: "11px", color: "#6d7175", lineHeight: 1.35 }}>{entry.description}</div>
                </div>
              </button>
            ))}

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e1e3e5" }}>
              <Text variant="headingXs" as="h4">Page structure</Text>
              <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                {blocks.map((block) => {
                  const { icon, label } = getBlockMeta(block);
                  const active = block.id === selectedBlockId;
                  return (
                    <button
                      key={`nav-${block.id}`}
                      type="button"
                      onClick={() => selectBlock(block.id)}
                      style={{
                        border: active ? "1px solid #2C6ECB" : "1px solid #e1e3e5",
                        backgroundColor: active ? "#eef4ff" : "#fff",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>{icon}</span> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e1e3e5" }}>
              <Text variant="headingXs" as="h4">Colors</Text>
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                {[
                  { label: "Text", value: textColor, setValue: setTextColor },
                  { label: "Background", value: backgroundColor, setValue: setBackgroundColor },
                  { label: "Accent", value: editorPrimaryColor, setValue: setEditorPrimaryColor },
                  { label: "Accent foreground", value: accentForegroundColor, setValue: setAccentForegroundColor },
                ].map((color) => (
                  <div key={color.label} style={{ display: "grid", gridTemplateColumns: "1fr 42px", gap: "8px", alignItems: "center" }}>
                    <input
                      value={color.value}
                      onChange={(e) => color.setValue(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 9px",
                        border: "1px solid #d2d5d8",
                        borderRadius: "7px",
                        fontSize: "12px",
                      }}
                      aria-label={color.label}
                    />
                    <input
                      type="color"
                      value={color.value}
                      onChange={(e) => color.setValue(e.target.value)}
                      style={{
                        width: "42px",
                        height: "32px",
                        border: "1px solid #d2d5d8",
                        borderRadius: "7px",
                        padding: 0,
                        background: "none",
                        cursor: "pointer",
                      }}
                      aria-label={`${color.label} picker`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e1e3e5" }}>
              <Text variant="headingXs" as="h4">Fonts</Text>
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <select
                  value={displayFont}
                  onChange={(e) => setDisplayFont(e.target.value)}
                  style={{ width: "100%", padding: "7px 9px", border: "1px solid #d2d5d8", borderRadius: "7px", fontSize: "12px" }}
                >
                  <option value={brandFonts?.headerFont || "system-ui, -apple-system, sans-serif"}>Brand default (Display)</option>
                  <option value="Inter, system-ui, -apple-system, sans-serif">Inter (Display)</option>
                  <option value="Poppins, system-ui, -apple-system, sans-serif">Poppins (Display)</option>
                  <option value="Montserrat, system-ui, -apple-system, sans-serif">Montserrat (Display)</option>
                </select>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  style={{ width: "100%", padding: "7px 9px", border: "1px solid #d2d5d8", borderRadius: "7px", fontSize: "12px" }}
                >
                  <option value={brandFonts?.bodyFont || "system-ui, -apple-system, sans-serif"}>Brand default (Body)</option>
                  <option value="Inter, system-ui, -apple-system, sans-serif">Inter (Body)</option>
                  <option value="Lato, system-ui, -apple-system, sans-serif">Lato (Body)</option>
                  <option value="'Open Sans', system-ui, -apple-system, sans-serif">Open Sans (Body)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e1e3e5" }}>
              <Text variant="headingXs" as="h4">Text styles</Text>
              <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Heading 1", value: heading1Size, setValue: setHeading1Size },
                  { label: "Heading 2", value: heading2Size, setValue: setHeading2Size },
                  { label: "Body 1", value: body1Size, setValue: setBody1Size },
                  { label: "Body 2", value: body2Size, setValue: setBody2Size },
                ].map((sizeField) => (
                  <label key={sizeField.label} style={{ fontSize: "11px", color: "#6d7175" }}>
                    {sizeField.label}
                    <input
                      type="number"
                      value={sizeField.value}
                      min={10}
                      max={80}
                      onChange={(e) => sizeField.setValue(Number(e.target.value))}
                      style={{
                        marginTop: "4px",
                        width: "100%",
                        padding: "7px 9px",
                        border: "1px solid #d2d5d8",
                        borderRadius: "7px",
                        fontSize: "12px",
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "#eff1f3",
          border: "1px solid #d9dcdf",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: "760px",
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderBottom: "1px solid #e1e3e5",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <InlineStack gap="200" blockAlign="center">
              <div style={{ display: "inline-flex", padding: "2px", backgroundColor: "#f1f2f4", borderRadius: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  style={{
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    backgroundColor: previewDevice === "mobile" ? "#111827" : "transparent",
                    color: previewDevice === "mobile" ? "#fff" : "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  style={{
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    backgroundColor: previewDevice === "desktop" ? "#111827" : "transparent",
                    color: previewDevice === "desktop" ? "#fff" : "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Desktop
                </button>
              </div>
              <Badge tone="info">{previewDevice === "mobile" ? "iPhone 15" : "Desktop 1440px"}</Badge>
            </InlineStack>
            <Text variant="bodySm" as="span" tone="subdued">
              Click blocks to edit
            </Text>
          </div>

          <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
            <div style={{
              maxWidth: previewDevice === "mobile" ? "390px" : "920px",
              margin: "0 auto",
              backgroundColor,
              color: textColor,
              fontFamily: resolvedBodyFont,
              borderRadius: "10px",
              border: "1px solid #d8dadd",
              boxShadow: "0 10px 28px rgba(17, 24, 39, 0.12)",
              overflow: "hidden",
            }}>
              <div style={{ padding: previewDevice === "mobile" ? "16px" : "24px 32px", fontSize: `${body2Size}px` }}>
                {blocks.map((block, index) => {
                  const { icon, label } = getBlockMeta(block);
                  const isSelected = selectedBlockId === block.id;
                  const isHovered = hoveredBlockId === block.id;
                  const blockHtml = renderFn ? renderFn(block, renderOpts) : "<div style='padding:16px;color:#868e96;'>Loading...</div>";

                  return (
                    <div key={block.id}>
                      <div
                        onClick={(e) => { e.stopPropagation(); addBlock("text", index - 1); }}
                        style={{
                          height: "4px",
                          margin: "0 -8px",
                          borderRadius: "2px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#2C6ECB20"; (e.currentTarget as HTMLElement).style.height = "24px"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.height = "4px"; }}
                        title="Click to insert block here"
                      />

                      <div
                        onClick={() => selectBlock(block.id)}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        style={{
                          position: "relative",
                          margin: "0 -8px",
                          padding: "0 8px",
                          borderRadius: "4px",
                          outline: isSelected
                            ? "2px solid #2C6ECB"
                            : isHovered
                              ? "2px solid #2C6ECB40"
                              : "2px solid transparent",
                          cursor: "pointer",
                          transition: "outline 0.1s ease",
                        }}
                      >
                        {(isSelected || isHovered) && (
                          <div style={{
                            position: "absolute",
                            top: "-1px",
                            left: "8px",
                            transform: "translateY(-100%)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: isSelected ? "#2C6ECB" : "#2C6ECB99",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "4px 4px 0 0",
                            fontSize: "11px",
                            fontWeight: 600,
                            zIndex: 10,
                            whiteSpace: "nowrap",
                          }}>
                            <span>{icon}</span> {label}
                          </div>
                        )}

                        {isSelected && (
                          <div style={{
                            position: "absolute",
                            top: "-1px",
                            right: "8px",
                            transform: "translateY(-100%)",
                            display: "flex",
                            gap: "2px",
                            zIndex: 10,
                          }}>
                            {[
                              { label: "↑", action: () => moveBlock(index, "up"), disabled: index === 0 },
                              { label: "↓", action: () => moveBlock(index, "down"), disabled: index === blocks.length - 1 },
                              { label: "⧉", action: () => duplicateBlock(index), disabled: false },
                              { label: "✕", action: () => deleteBlock(block.id), disabled: false },
                            ].map((btn, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                disabled={btn.disabled}
                                style={{
                                  padding: "3px 8px",
                                  border: "none",
                                  borderRadius: i === 0 ? "4px 0 0 0" : i === 3 ? "0 4px 0 0" : "0",
                                  cursor: btn.disabled ? "default" : "pointer",
                                  fontSize: "12px",
                                  backgroundColor: btn.label === "✕" ? "#e03131" : "#2C6ECB",
                                  color: "#fff",
                                  opacity: btn.disabled ? 0.4 : 1,
                                }}
                              >{btn.label}</button>
                            ))}
                          </div>
                        )}

                        <div
                          dangerouslySetInnerHTML={{ __html: blockHtml }}
                          style={{ pointerEvents: "none" }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  onClick={() => addBlock("text")}
                  style={{
                    margin: "16px 0 24px",
                    padding: "20px",
                    border: "2px dashed #d2d5d8",
                    borderRadius: "8px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: "#2C6ECB",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2C6ECB"; (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#d2d5d8"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  + Add Block
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e1e3e5",
          borderRadius: "12px",
          overflow: "hidden",
          minHeight: "760px",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e1e3e5" }}>
            <Text variant="headingSm" as="h3">Block settings</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {selectedBlock ? "Customize the selected block" : "Select a block from the canvas"}
            </Text>
          </div>
          <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
            {selectedBlock ? (
              <BlockSettings
                block={selectedBlock}
                onChange={(updates) => updateBlock(selectedBlock.id, updates)}
                onDelete={() => deleteBlock(selectedBlock.id)}
                onMoveUp={() => moveBlock(selectedIndex, "up")}
                onMoveDown={() => moveBlock(selectedIndex, "down")}
                onDuplicate={() => duplicateBlock(selectedIndex)}
                isFirst={selectedIndex === 0}
                isLast={selectedIndex === blocks.length - 1}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#868e96" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>👆</div>
                <div style={{ fontSize: "13px" }}>Click a block in the canvas to edit it</div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Block Settings Panel ────────────────────────────────────────────────────

function BlockSettings({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
}: {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { icon, label } = getBlockMeta(block);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #d2d5d8", borderRadius: "6px",
    fontSize: "13px", fontFamily: "inherit", resize: "vertical" as const,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "12px", fontWeight: 600, color: "#495057", marginBottom: "4px", display: "block",
  };
  const fieldStyle: React.CSSProperties = { marginBottom: "12px" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>{label}</span>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ ...inputStyle, width: "auto", padding: "6px 10px", cursor: isFirst ? "default" : "pointer", opacity: isFirst ? 0.4 : 1 }}>↑ Up</button>
        <button onClick={onMoveDown} disabled={isLast} style={{ ...inputStyle, width: "auto", padding: "6px 10px", cursor: isLast ? "default" : "pointer", opacity: isLast ? 0.4 : 1 }}>↓ Down</button>
        <button onClick={onDuplicate} style={{ ...inputStyle, width: "auto", padding: "6px 10px", cursor: "pointer" }}>⧉ Duplicate</button>
        <button onClick={onDelete} style={{ ...inputStyle, width: "auto", padding: "6px 10px", cursor: "pointer", color: "#c92a2a", borderColor: "#c92a2a" }}>✕ Delete</button>
      </div>

      <div style={{ borderTop: "1px solid #e9ecef", paddingTop: "12px" }}>
        {block.type === "headline" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Text</label>
              <textarea rows={2} value={block.text} onChange={(e) => onChange({ text: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Subheadline (optional)</label>
              <input value={block.subheadline || ""} onChange={(e) => onChange({ subheadline: e.target.value || undefined })} style={inputStyle} placeholder="Supporting text below headline" />
            </div>
            <div style={{ display: "flex", gap: "6px", ...fieldStyle }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Size</label>
                <select value={block.size} onChange={(e) => onChange({ size: e.target.value as "large" | "medium" | "small" })} style={inputStyle}>
                  <option value="large">Large</option>
                  <option value="medium">Medium</option>
                  <option value="small">Small</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Alignment</label>
                <select value={block.align || "left"} onChange={(e) => onChange({ align: e.target.value as "left" | "center" })} style={inputStyle}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                </select>
              </div>
            </div>
          </>
        )}

        {block.type === "text" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Content (HTML supported)</label>
              <textarea rows={6} value={block.content} onChange={(e) => onChange({ content: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Variant</label>
              <select value={block.variant || "default"} onChange={(e) => onChange({ variant: e.target.value as "default" | "large-intro" | "pull-quote" })} style={inputStyle}>
                <option value="default">Default</option>
                <option value="large-intro">Large Intro</option>
                <option value="pull-quote">Pull Quote</option>
              </select>
            </div>
          </>
        )}

        {block.type === "image" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Label</label>
              <input value={block.label} onChange={(e) => onChange({ label: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Hint</label>
              <input value={block.hint} onChange={(e) => onChange({ hint: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Image URL (optional)</label>
              <input value={block.src || ""} onChange={(e) => onChange({ src: e.target.value || undefined })} style={inputStyle} placeholder="https://..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Caption (optional)</label>
              <input value={block.caption || ""} onChange={(e) => onChange({ caption: e.target.value || undefined })} style={inputStyle} placeholder="Photo credit or description" />
            </div>
          </>
        )}

        {block.type === "cta" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Button Text</label>
              <input value={block.buttonText} onChange={(e) => onChange({ buttonText: e.target.value })} style={inputStyle} />
            </div>
            {block.style === "primary" && (
              <>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Headline</label>
                  <input value={block.headline} onChange={(e) => onChange({ headline: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Subtext</label>
                  <input value={block.subtext} onChange={(e) => onChange({ subtext: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Variant</label>
                  <select value={block.variant || "gradient"} onChange={(e) => onChange({ variant: e.target.value as "gradient" | "solid" | "outline" })} style={inputStyle}>
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
              </>
            )}
            <div style={fieldStyle}>
              <label style={labelStyle}>Style</label>
              <select value={block.style} onChange={(e) => onChange({ style: e.target.value as "primary" | "inline" })} style={inputStyle}>
                <option value="primary">Primary (large section)</option>
                <option value="inline">Inline (simple button)</option>
              </select>
            </div>
          </>
        )}

        {block.type === "socialProof" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Rating</label>
              <input value={block.rating} onChange={(e) => onChange({ rating: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Review Count</label>
              <input value={block.reviewCount} onChange={(e) => onChange({ reviewCount: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Customer Count</label>
              <input value={block.customerCount} onChange={(e) => onChange({ customerCount: e.target.value })} style={inputStyle} />
            </div>
          </>
        )}

        {block.type === "numberedSection" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Number</label>
              <input value={block.number} onChange={(e) => onChange({ number: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Label</label>
              <input value={block.label} onChange={(e) => onChange({ label: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Headline</label>
              <input value={block.headline} onChange={(e) => onChange({ headline: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Body</label>
              <textarea rows={4} value={block.body} onChange={(e) => onChange({ body: e.target.value })} style={inputStyle} />
            </div>
          </>
        )}

        {block.type === "note" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Text (HTML supported)</label>
              <textarea rows={3} value={block.text} onChange={(e) => onChange({ text: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Style</label>
              <select value={block.style} onChange={(e) => onChange({ style: e.target.value as "info" | "warning" | "highlight" })} style={inputStyle}>
                <option value="highlight">Highlight</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </>
        )}

        {block.type === "guarantee" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Text (fallback if no badges)</label>
              <input value={block.text} onChange={(e) => onChange({ text: e.target.value })} style={inputStyle} />
            </div>
            {(block.badges || []).map((badge, i) => (
              <div key={i} style={{ ...fieldStyle, display: "flex", gap: "6px" }}>
                <div style={{ width: "60px" }}>
                  <label style={labelStyle}>Icon</label>
                  <input value={badge.icon} onChange={(e) => {
                    const updated = [...(block.badges || [])];
                    updated[i] = { ...updated[i], icon: e.target.value };
                    onChange({ badges: updated });
                  }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Label</label>
                  <input value={badge.label} onChange={(e) => {
                    const updated = [...(block.badges || [])];
                    updated[i] = { ...updated[i], label: e.target.value };
                    onChange({ badges: updated });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "stats" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Layout</label>
              <select value={block.layout || "grid"} onChange={(e) => onChange({ layout: e.target.value as "grid" | "horizontal" })} style={inputStyle}>
                <option value="grid">Grid (cards)</option>
                <option value="horizontal">Horizontal (inline)</option>
              </select>
            </div>
            {block.stats.map((stat, i) => (
              <div key={i} style={{ ...fieldStyle, display: "flex", gap: "6px" }}>
                <div style={{ width: "80px" }}>
                  <label style={labelStyle}>Value</label>
                  <input value={stat.value} onChange={(e) => {
                    const newStats = [...block.stats];
                    newStats[i] = { ...newStats[i], value: e.target.value };
                    onChange({ stats: newStats });
                  }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Label</label>
                  <input value={stat.label} onChange={(e) => {
                    const newStats = [...block.stats];
                    newStats[i] = { ...newStats[i], label: e.target.value };
                    onChange({ stats: newStats });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "testimonials" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: "6px", ...fieldStyle }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Layout</label>
                <select value={block.layout || "grid"} onChange={(e) => onChange({ layout: e.target.value as "grid" | "stacked" })} style={inputStyle}>
                  <option value="grid">Grid (columns)</option>
                  <option value="stacked">Stacked (full width)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Stars</label>
                <select value={block.showStars !== false ? "yes" : "no"} onChange={(e) => onChange({ showStars: e.target.value === "yes" })} style={inputStyle}>
                  <option value="yes">Show stars</option>
                  <option value="no">Hide stars</option>
                </select>
              </div>
            </div>
            {block.testimonials.map((t, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid #e9ecef", borderRadius: "6px", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#868e96", marginBottom: "4px" }}>Testimonial {i + 1}</div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Quote</label>
                  <textarea rows={2} value={t.quote} onChange={(e) => {
                    const updated = [...block.testimonials];
                    updated[i] = { ...updated[i], quote: e.target.value };
                    onChange({ testimonials: updated });
                  }} style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>Name</label>
                    <input value={t.name} onChange={(e) => {
                      const updated = [...block.testimonials];
                      updated[i] = { ...updated[i], name: e.target.value };
                      onChange({ testimonials: updated });
                    }} style={inputStyle} />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>Detail</label>
                    <input value={t.detail} onChange={(e) => {
                      const updated = [...block.testimonials];
                      updated[i] = { ...updated[i], detail: e.target.value };
                      onChange({ testimonials: updated });
                    }} style={inputStyle} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "divider" && (
          <div style={{ fontSize: "13px", color: "#868e96" }}>No settings for divider blocks.</div>
        )}

        {block.type === "faq" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            {block.items.map((item, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid #e9ecef", borderRadius: "6px", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#868e96", marginBottom: "4px" }}>Question {i + 1}</div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Question</label>
                  <input value={item.question} onChange={(e) => {
                    const updated = [...block.items];
                    updated[i] = { ...updated[i], question: e.target.value };
                    onChange({ items: updated });
                  }} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Answer</label>
                  <textarea rows={2} value={item.answer} onChange={(e) => {
                    const updated = [...block.items];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    onChange({ items: updated });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "asSeenIn" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Publications (comma-separated)</label>
            <input value={block.publications.join(", ")} onChange={(e) => onChange({ publications: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} style={inputStyle} />
          </div>
        )}

        {block.type === "authorByline" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Author</label>
              <input value={block.author} onChange={(e) => onChange({ author: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Role</label>
              <input value={block.role || ""} onChange={(e) => onChange({ role: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date</label>
              <input value={block.date} onChange={(e) => onChange({ date: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Publication Name</label>
              <input value={block.publicationName || ""} onChange={(e) => onChange({ publicationName: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>View Count (optional)</label>
              <input value={block.viewCount || ""} onChange={(e) => onChange({ viewCount: e.target.value || undefined })} style={inputStyle} placeholder="e.g. 290,153 views" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Live Viewers (optional)</label>
              <input value={block.liveViewers || ""} onChange={(e) => onChange({ liveViewers: e.target.value || undefined })} style={inputStyle} placeholder="e.g. 693" />
            </div>
          </>
        )}

        {block.type === "featureList" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Icon</label>
              <input value={block.icon || "✓"} onChange={(e) => onChange({ icon: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Items (one per line)</label>
              <textarea rows={6} value={block.items.join("\n")} onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })} style={inputStyle} />
            </div>
          </>
        )}

        {block.type === "offerBox" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Headline</label>
              <input value={block.headline} onChange={(e) => onChange({ headline: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Subtext</label>
              <textarea rows={2} value={block.subtext} onChange={(e) => onChange({ subtext: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Button Text</label>
              <input value={block.buttonText} onChange={(e) => onChange({ buttonText: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Discount Badge</label>
              <input value={block.discount || ""} onChange={(e) => onChange({ discount: e.target.value || undefined })} style={inputStyle} placeholder="e.g. 40% OFF" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Guarantee</label>
              <input value={block.guarantee || ""} onChange={(e) => onChange({ guarantee: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Urgency text</label>
              <input value={block.urgency || ""} onChange={(e) => onChange({ urgency: e.target.value || undefined })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Layout</label>
              <select value={block.layout || "stacked"} onChange={(e) => onChange({ layout: e.target.value as "stacked" | "horizontal" })} style={inputStyle}>
                <option value="stacked">Stacked (centered)</option>
                <option value="horizontal">Horizontal (side by side)</option>
              </select>
            </div>
          </>
        )}

        {block.type === "comments" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            {block.comments.map((c, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid #e9ecef", borderRadius: "6px", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#868e96", marginBottom: "4px" }}>Comment {i + 1}</div>
                <div style={{ display: "flex", gap: "6px", ...fieldStyle }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Name</label>
                    <input value={c.name} onChange={(e) => {
                      const updated = [...block.comments];
                      updated[i] = { ...updated[i], name: e.target.value };
                      onChange({ comments: updated });
                    }} style={inputStyle} />
                  </div>
                  <div style={{ width: "80px" }}>
                    <label style={labelStyle}>Time</label>
                    <input value={c.timeAgo} onChange={(e) => {
                      const updated = [...block.comments];
                      updated[i] = { ...updated[i], timeAgo: e.target.value };
                      onChange({ comments: updated });
                    }} style={inputStyle} />
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Comment</label>
                  <textarea rows={2} value={c.text} onChange={(e) => {
                    const updated = [...block.comments];
                    updated[i] = { ...updated[i], text: e.target.value };
                    onChange({ comments: updated });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "disclaimer" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Disclaimer Text</label>
            <textarea rows={6} value={block.text} onChange={(e) => onChange({ text: e.target.value })} style={inputStyle} />
          </div>
        )}

        {block.type === "comparison" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            {block.rows.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: "4px", ...fieldStyle }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Feature</label>
                  <input value={row.feature} onChange={(e) => {
                    const updated = [...block.rows];
                    updated[i] = { ...updated[i], feature: e.target.value };
                    onChange({ rows: updated });
                  }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Ours</label>
                  <input value={row.ours} onChange={(e) => {
                    const updated = [...block.rows];
                    updated[i] = { ...updated[i], ours: e.target.value };
                    onChange({ rows: updated });
                  }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Theirs</label>
                  <input value={row.theirs} onChange={(e) => {
                    const updated = [...block.rows];
                    updated[i] = { ...updated[i], theirs: e.target.value };
                    onChange({ rows: updated });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}

        {block.type === "prosCons" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Pros (one per line)</label>
              <textarea rows={4} value={block.pros.join("\n")} onChange={(e) => onChange({ pros: e.target.value.split("\n").filter(Boolean) })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Cons (one per line)</label>
              <textarea rows={3} value={block.cons.join("\n")} onChange={(e) => onChange({ cons: e.target.value.split("\n").filter(Boolean) })} style={inputStyle} />
            </div>
          </>
        )}

        {block.type === "timeline" && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Heading (optional)</label>
              <input value={block.heading || ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} style={inputStyle} />
            </div>
            {block.steps.map((step, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid #e9ecef", borderRadius: "6px", marginBottom: "8px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Label</label>
                  <input value={step.label} onChange={(e) => {
                    const updated = [...block.steps];
                    updated[i] = { ...updated[i], label: e.target.value };
                    onChange({ steps: updated });
                  }} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Headline</label>
                  <input value={step.headline} onChange={(e) => {
                    const updated = [...block.steps];
                    updated[i] = { ...updated[i], headline: e.target.value };
                    onChange({ steps: updated });
                  }} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Body</label>
                  <input value={step.body} onChange={(e) => {
                    const updated = [...block.steps];
                    updated[i] = { ...updated[i], body: e.target.value };
                    onChange({ steps: updated });
                  }} style={inputStyle} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NewAdvertorial() {
  const { products, brandSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const isModal = searchParams.get("modal") === "true";

  const [currentStep, setCurrentStep] = useState(0);
  const [templateId, setTemplateId] = useState("");
  const [isAiPath, setIsAiPath] = useState(false);
  const [aiIntake, setAiIntake] = useState<AIIntake>({ targetCustomer: "", mechanism: "", proof: "", stylePreset: "", imageUrls: "" });
  const [productId, setProductId] = useState("");
  const [angle, setAngle] = useState<AngleType | "">("");
  const [primaryColor, setPrimaryColor] = useState(brandSettings.primaryColor === "#000000" ? "#22c55e" : brandSettings.primaryColor);
  const [showingPreview, setShowingPreview] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  const [previewData, setPreviewData] = useState<{
    productId: string;
    productTitle: string;
    productHandle: string;
    title: string;
    html: string;
    blocks: Block[];
    primaryColor: string;
    angle: string;
    templateName: string;
  } | null>(null);

  useEffect(() => {
    const data = actionData as any;
    if (data?.step === "preview" && data.html && data.blocks) {
      setPreviewData({
        productId: data.productId,
        productTitle: data.productTitle,
        productHandle: data.productHandle,
        title: data.title,
        html: data.html,
        blocks: data.blocks,
        primaryColor: data.primaryColor || "#22c55e",
        angle: data.angle || "Desire",
        templateName: data.templateName || "Template",
      });
      setShowingPreview(true);
      setCurrentStep(4);
    }
  }, [actionData]);

  useEffect(() => {
    const data = actionData as any;
    if (data?.step === "wizardDone" && data.advertorialId) {
      window.opener?.postMessage(
        { type: "WIZARD_DONE", id: data.advertorialId },
        window.location.origin,
      );
    }
  }, [actionData]);

  const canContinue = () => {
    switch (currentStep) {
      case 0: return !!templateId;
      case 1: return !!productId;
      case 2: return isAiPath ? (!!aiIntake.targetCustomer.trim() && !!aiIntake.mechanism.trim() && !!aiIntake.proof.trim() && !!aiIntake.stylePreset) : !!angle;
      case 3: return true;
      default: return false;
    }
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (showingPreview) {
      setShowingPreview(false);
      setCurrentStep(isAiPath ? 2 : 3);
    } else {
      setCurrentStep((s) => Math.max(s - 1, 0));
    }
  };

  const wizardContent = (
    <div style={showingPreview ? styles.editorWizard : styles.wizard}>
      <ProgressBar currentStep={showingPreview ? 4 : currentStep} />

      {(actionData as any)?.error && ((actionData as any)?.step === "generate" || (actionData as any)?.step === "ai-generate" || (actionData as any)?.step === "publish") && (
        <div style={{ marginBottom: "16px" }}>
          <Banner tone="critical" title="Error">{(actionData as any).error}</Banner>
        </div>
      )}

      {isSubmitting && isAiPath && currentStep === 2 && (
        <div style={{ marginBottom: "16px", padding: "14px 18px", backgroundColor: "#f0f6ff", border: "1px solid #c8deff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "18px" }}>✨</div>
          <div>
            <Text variant="bodyMd" fontWeight="semibold" as="p">AI is writing your advertorial…</Text>
            <Text variant="bodySm" tone="subdued" as="p">Writing the full 17-section DR page. Usually takes 20–40 seconds.</Text>
          </div>
        </div>
      )}

      {showingPreview && previewData ? (
        <>
          <BlockEditorStep
            title={previewData.title}
            blocks={previewData.blocks}
            productTitle={previewData.productTitle}
            productHandle={previewData.productHandle}
            primaryColor={previewData.primaryColor}
            isSubmitting={isSubmitting}
            error={undefined}
            previewData={previewData}
            onClose={handleBack}
            isModal={isModal}
            brandFonts={{
              headerFont: brandSettings.headerFont,
              bodyFont: brandSettings.bodyFont,
            }}
          />
          <div style={styles.navBar}>
            <Button onClick={handleBack}>Back</Button>
            <div />
          </div>
        </>
      ) : (
        <>
          {currentStep === 0 && (
            <TemplateStep
              selected={templateId}
              onSelect={(id) => {
                setTemplateId(id);
                setIsAiPath(id === "ai-generate");
              }}
            />
          )}
          {currentStep === 1 && (
            <ProductStep
              products={products}
              selected={productId}
              onSelect={(id) => setProductId(id)}
            />
          )}
          {currentStep === 2 && !isAiPath && (
            <AngleStep
              selected={angle}
              onSelect={(a) => setAngle(a)}
            />
          )}
          {currentStep === 2 && isAiPath && (
            <AIIntakeStep
              selectedProductTitle={selectedProduct?.title || ""}
              aiIntake={aiIntake}
              onChange={(updates) => setAiIntake((prev) => ({ ...prev, ...updates }))}
            />
          )}
          {currentStep === 3 && (
            <BrandStep
              primaryColor={primaryColor}
              onPrimaryChange={setPrimaryColor}
            />
          )}

          <div style={styles.navBar}>
            <div>
              {currentStep > 0 ? (
                <Button onClick={handleBack}>Back</Button>
              ) : isModal ? (
                <Button
                  variant="plain"
                  onClick={() =>
                    window.opener?.postMessage(
                      { type: "WIZARD_CLOSE" },
                      window.location.origin,
                    )
                  }
                >
                  Cancel
                </Button>
              ) : (
                <Button url="/app" variant="plain">Cancel</Button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Text variant="bodySm" tone="subdued" as="span">
                Step {currentStep + 1} of {STEPS.length}
              </Text>

              {isAiPath && currentStep === 2 ? (
                <Form method="post">
                  <input type="hidden" name="step" value="ai-generate" />
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="productTitle" value={selectedProduct?.title || ""} />
                  <input type="hidden" name="productHandle" value={selectedProduct?.handle || ""} />
                  <input type="hidden" name="productDescription" value={selectedProduct?.description || ""} />
                  <input type="hidden" name="primaryColor" value={primaryColor} />
                  <input type="hidden" name="targetCustomer" value={aiIntake.targetCustomer} />
                  <input type="hidden" name="mechanism" value={aiIntake.mechanism} />
                  <input type="hidden" name="proof" value={aiIntake.proof} />
                  <input type="hidden" name="stylePreset" value={aiIntake.stylePreset} />
                  <input type="hidden" name="imageUrls" value={aiIntake.imageUrls} />
                  {isModal && <input type="hidden" name="modal" value="true" />}
                  <Button
                    submit
                    variant="primary"
                    loading={isSubmitting}
                    disabled={!canContinue()}
                  >
                    Generate with AI ✨
                  </Button>
                </Form>
              ) : currentStep < 3 ? (
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!canContinue()}
                >
                  Continue
                </Button>
              ) : (
                <Form method="post">
                  <input type="hidden" name="step" value="generate" />
                  <input type="hidden" name="templateId" value={templateId} />
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="angle" value={angle} />
                  <input type="hidden" name="primaryColor" value={primaryColor} />
                  {isModal && <input type="hidden" name="modal" value="true" />}
                  <Button
                    submit
                    variant="primary"
                    loading={isSubmitting}
                    disabled={!productId || !angle || !templateId}
                  >
                    Create Advertorial
                  </Button>
                </Form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <>
        <TitleBar title="Create Advertorial" />
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#f6f6f7",
          padding: "24px 24px 48px",
        }}>
          {wizardContent}
        </div>
      </>
    );
  }

  if (showingPreview && previewData) {
    return (
      <Page fullWidth>
        <TitleBar title="Create Advertorial" />
        {wizardContent}
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Create Advertorial" />
      {wizardContent}
    </Page>
  );
}
