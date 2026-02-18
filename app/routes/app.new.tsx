import { useState, useEffect, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect, useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
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

  if (step === "publish") {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productHandle = formData.get("productHandle") as string;
    const title = formData.get("title") as string;
    const blocksJson = formData.get("blocks") as string;
    const primaryColor = (formData.get("primaryColor") as string) || "#22c55e";

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

  return (
    <div>
      <div style={styles.heading}>
        <Text variant="headingLg" as="h2">Choose a template</Text>
      </div>
      <p style={styles.subtext}>
        Each template is a complete advertorial design. Pick one to get started — you can customize everything in the editor.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
        {PREMADE_TEMPLATES.map((t) => (
          <div
            key={t.id}
            style={{
              ...styles.card(selected === t.id),
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={() => onSelect(t.id)}
            role="button"
            tabIndex={0}
          >
            <div style={{
              fontSize: "40px",
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected === t.id ? "#e0ecff" : "#f6f6f7",
            }}>
              {t.id === "editorial" ? "📰" : t.id === "personal-story" ? "📖" : "📄"}
            </div>
            <div>
              <Text variant="headingMd" as="h3">{t.name}</Text>
              <div style={{ marginTop: "6px" }}>
                <Text variant="bodySm" as="p" tone="subdued">{t.description}</Text>
              </div>
            </div>
            <div style={{ marginTop: "4px" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewingId(t.id); }}
                style={{
                  background: "none",
                  border: "1px solid #c9cccf",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#2C6ECB",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff"; (e.currentTarget as HTMLElement).style.borderColor = "#2C6ECB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#c9cccf"; }}
              >Preview Template</button>
            </div>
            {selected === t.id && (
              <div style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#2C6ECB",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
              }}>✓</div>
            )}
          </div>
        ))}
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
}: {
  title: string;
  blocks: Block[];
  productTitle: string;
  productHandle: string;
  primaryColor: string;
  isSubmitting: boolean;
  error?: string;
  previewData: any;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"blocks" | "settings">("blocks");

  const renderOpts = { primaryColor, productTitle, productHandle };

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
      setSidebarTab("blocks");
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
    setSidebarTab("settings");
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)));
  };

  const selectBlock = (id: string) => {
    setSelectedBlockId(id);
    setSidebarTab("settings");
  };

  return (
    <div>
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
            <input type="hidden" name="primaryColor" value={primaryColor} />
            <Button submit variant="primary" loading={isSubmitting}>
              Publish to Shopify
            </Button>
          </Form>
        </div>
      </div>

      {/* Two-column editor */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "0", minHeight: "700px" }}>

        {/* LEFT SIDEBAR */}
        <div style={{
          borderRight: "1px solid #e1e3e5",
          backgroundColor: "#fafbfc",
          borderRadius: "12px 0 0 12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e1e3e5" }}>
            <button
              onClick={() => setSidebarTab("blocks")}
              style={{
                flex: 1, padding: "12px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: sidebarTab === "blocks" ? 600 : 400,
                backgroundColor: sidebarTab === "blocks" ? "#fff" : "transparent",
                color: sidebarTab === "blocks" ? "#202223" : "#6d7175",
                borderBottom: sidebarTab === "blocks" ? "2px solid #2C6ECB" : "2px solid transparent",
              }}
            >Add Blocks</button>
            <button
              onClick={() => setSidebarTab("settings")}
              style={{
                flex: 1, padding: "12px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: sidebarTab === "settings" ? 600 : 400,
                backgroundColor: sidebarTab === "settings" ? "#fff" : "transparent",
                color: sidebarTab === "settings" ? "#202223" : "#6d7175",
                borderBottom: sidebarTab === "settings" ? "2px solid #2C6ECB" : "2px solid transparent",
              }}
            >Settings</button>
          </div>

          <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
            {sidebarTab === "blocks" && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6d7175", marginBottom: "8px" }}>
                  Click to add
                </div>
                {BLOCK_CATALOG.map((entry) => (
                  <div
                    key={entry.type}
                    onClick={() => addBlock(entry.type, selectedIndex >= 0 ? selectedIndex : undefined)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                      marginBottom: "4px", backgroundColor: "#fff",
                      border: "1px solid #e9ecef",
                      transition: "all 0.1s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2C6ECB"; (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e9ecef"; (e.currentTarget as HTMLElement).style.backgroundColor = "#fff"; }}
                  >
                    <span style={{ fontSize: "20px", width: "28px", textAlign: "center" }}>{entry.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#202223" }}>{entry.label}</div>
                      <div style={{ fontSize: "11px", color: "#868e96", lineHeight: 1.3 }}>{entry.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === "settings" && selectedBlock && (
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
            )}

            {sidebarTab === "settings" && !selectedBlock && (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#868e96" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>👆</div>
                <div style={{ fontSize: "13px" }}>Click a block in the canvas to edit it</div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div style={{
          backgroundColor: "#f1f2f4",
          borderRadius: "0 12px 12px 0",
          padding: "24px",
          overflowY: "auto",
          maxHeight: "700px",
        }}>
          <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}>
            {/* Rendered blocks */}
            <div style={{ padding: "24px 32px" }}>
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
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#2C6ECB20"; (e.currentTarget as HTMLElement).style.height = "28px"; }}
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
  const isSubmitting = navigation.state === "submitting";

  const [currentStep, setCurrentStep] = useState(0);
  const [templateId, setTemplateId] = useState("");
  const [productId, setProductId] = useState("");
  const [angle, setAngle] = useState<AngleType | "">("");
  const [primaryColor, setPrimaryColor] = useState(brandSettings.primaryColor === "#000000" ? "#22c55e" : brandSettings.primaryColor);
  const [showingPreview, setShowingPreview] = useState(false);

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
    if (actionData?.step === "preview" && actionData.html && actionData.blocks) {
      setPreviewData({
        productId: actionData.productId,
        productTitle: actionData.productTitle,
        productHandle: actionData.productHandle,
        title: actionData.title,
        html: actionData.html,
        blocks: actionData.blocks,
        primaryColor: actionData.primaryColor || "#22c55e",
        angle: actionData.angle || "Desire",
        templateName: actionData.templateName || "Template",
      });
      setShowingPreview(true);
      setCurrentStep(4);
    }
  }, [actionData]);

  const canContinue = () => {
    switch (currentStep) {
      case 0: return !!templateId;
      case 1: return !!productId;
      case 2: return !!angle;
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
    if (currentStep === 4) {
      setShowingPreview(false);
      setCurrentStep(3);
    } else {
      setCurrentStep((s) => Math.max(s - 1, 0));
    }
  };

  if (showingPreview && previewData) {
    const publishError = actionData?.step === "publish" && actionData?.error ? actionData.error : undefined;

    return (
      <Page>
        <TitleBar title="Create Advertorial" />
        <div style={styles.wizard}>
          <ProgressBar currentStep={4} />

          <BlockEditorStep
            title={previewData.title}
            blocks={previewData.blocks}
            productTitle={previewData.productTitle}
            productHandle={previewData.productHandle}
            primaryColor={previewData.primaryColor}
            isSubmitting={isSubmitting}
            error={publishError}
            previewData={previewData}
          />

          <div style={styles.navBar}>
            <Button onClick={handleBack}>Back</Button>
            <div />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Create Advertorial" />
      <div style={styles.wizard}>
        <ProgressBar currentStep={currentStep} />

        {actionData?.error && actionData?.step === "generate" && (
          <div style={{ marginBottom: "16px" }}>
            <Banner tone="critical" title="Error">{actionData.error}</Banner>
          </div>
        )}

        {/* Step 1: Template */}
        {currentStep === 0 && (
          <TemplateStep
            selected={templateId}
            onSelect={(id) => setTemplateId(id)}
          />
        )}

        {/* Step 2: Product */}
        {currentStep === 1 && (
          <ProductStep
            products={products}
            selected={productId}
            onSelect={(id) => setProductId(id)}
          />
        )}

        {/* Step 3: Angle */}
        {currentStep === 2 && (
          <AngleStep
            selected={angle}
            onSelect={(a) => setAngle(a)}
          />
        )}

        {/* Step 4: Brand */}
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
            ) : (
              <Button url="/app" variant="plain">Cancel</Button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Text variant="bodySm" tone="subdued">
              Step {currentStep + 1} of {STEPS.length}
            </Text>

            {currentStep < 3 ? (
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
      </div>
    </Page>
  );
}
