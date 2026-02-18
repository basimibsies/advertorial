// ═══════════════════════════════════════════════════════════════════════════════
// Templates Server
// Thin wrapper that ties block generation + rendering together.
// The actual logic lives in block-generator.ts and block-renderer.ts.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Block } from "./blocks";
import { generateBlocks, generateTitle } from "./block-generator";
import { renderBlocksToHtml } from "./block-renderer";

export type TemplateType = "Story" | "Listicle";
export type AngleType = "Pain" | "Desire" | "Comparison";
export type TemplateVariantType =
  | "story-classic"
  | "story-uvp-sidebar"
  | "story-problem-solution"
  | "listicle-comparison";

interface GenerateContentParams {
  productTitle: string;
  productHandle: string;
  productDescription?: string;
  template: TemplateType;
  templateVariant?: TemplateVariantType;
  angle: AngleType;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headerFont?: string;
  bodyFont?: string;
}

export async function generateAdvertorialContent(
  params: GenerateContentParams,
): Promise<{ title: string; html: string; blocks: Block[] }> {
  const {
    productTitle,
    productHandle,
    productDescription = "",
    template,
    templateVariant,
    angle,
    primaryColor = "#000000",
  } = params;

  // 1. Generate the block array
  const blocks = generateBlocks({
    productTitle,
    productHandle,
    productDescription,
    template,
    templateVariant,
    angle,
  });

  // 2. Generate the title
  const title = templateVariant
    ? `${productTitle} Advertorial`
    : generateTitle(productTitle, template, angle);

  // 3. Render blocks to HTML
  const html = renderBlocksToHtml(blocks, {
    primaryColor,
    productTitle,
    productHandle,
  });

  return { title, html, blocks };
}

/** Re-render an existing block array to HTML (used when user edits blocks). */
export function renderBlocks(
  blocks: Block[],
  options: { primaryColor: string; productTitle: string; productHandle: string },
): string {
  return renderBlocksToHtml(blocks, options);
}
