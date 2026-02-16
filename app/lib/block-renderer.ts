// ═══════════════════════════════════════════════════════════════════════════════
// Block Renderer
// Converts an ordered array of blocks into clean HTML for Shopify pages.
// Each block renders independently — the order of blocks IS the page layout.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Block } from "./blocks";

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ─── Individual Block Renderers ───────────────────────────────────────────────

function renderHeadline(block: Extract<Block, { type: "headline" }>, _primaryColor: string): string {
  const sizes = { large: "2rem", medium: "1.5rem", small: "1.25rem" };
  const tags = { large: "h1", medium: "h2", small: "h3" };
  const tag = tags[block.size];
  return `<${tag} style="font-size: ${sizes[block.size]}; font-weight: 800; margin: 0 0 16px 0; font-family: inherit; line-height: 1.3;">${block.text}</${tag}>`;
}

function renderText(block: Extract<Block, { type: "text" }>): string {
  // Content can include basic HTML (bold, italic, br) — render as-is
  return `<div style="margin: 24px 0;">
    <p style="font-size: 1.05rem; line-height: 1.8; margin: 0 0 16px 0;">${block.content}</p>
  </div>`;
}

function renderImage(block: Extract<Block, { type: "image" }>, primaryColor: string): string {
  if (block.src) {
    return `<div style="margin: 32px 0;">
      <img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.label)}" style="width: 100%; height: auto; border-radius: 12px; display: block;" />
    </div>`;
  }
  // Placeholder
  const height = block.height || "280px";
  return `<div style="
    width: 100%; height: ${height};
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px dashed #ced4da; border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    margin: 32px 0; position: relative; overflow: hidden;
  ">
    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${primaryColor}15; display: flex; align-items: center; justify-content: center; font-size: 24px;">🖼️</div>
    <div style="font-weight: 600; font-size: 14px; color: #495057; text-align: center; padding: 0 20px;">${block.label}</div>
    <div style="font-size: 12px; color: #868e96; text-align: center; padding: 0 20px; max-width: 320px;">${block.hint}</div>
    <div style="position: absolute; top: 8px; right: 12px; background: ${primaryColor}; color: #fff; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Image Block</div>
  </div>`;
}

function renderCta(block: Extract<Block, { type: "cta" }>, primaryColor: string, productHandle: string): string {
  const href = `/products/${productHandle}`;
  if (block.style === "inline") {
    return `<div style="text-align: center; margin: 36px 0;">
      <a href="${href}" style="display: inline-block; padding: 14px 32px; background-color: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem;">${block.buttonText}</a>
    </div>`;
  }
  // Primary (big gradient)
  return `<section style="text-align: center; margin: 48px 0; padding: 48px 24px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); border-radius: 16px;">
    <h2 style="font-size: 1.8rem; margin: 0 0 12px 0; color: #fff; font-weight: 800; font-family: inherit; line-height: 1.3;">${block.headline}</h2>
    <p style="font-size: 1.05rem; color: #fff; margin-bottom: 28px; opacity: 0.92; max-width: 500px; margin-left: auto; margin-right: auto;">${block.subtext}</p>
    <a href="${href}" style="display: inline-block; padding: 16px 40px; background-color: #fff; color: ${primaryColor}; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.05rem; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">${block.buttonText}</a>
  </section>`;
}

function renderSocialProof(block: Extract<Block, { type: "socialProof" }>, _primaryColor: string): string {
  return `<div style="display: flex; align-items: center; justify-content: center; gap: 24px; padding: 16px 0; margin: 24px 0; flex-wrap: wrap; font-size: 14px; color: #495057;">
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="color: #f5a623; font-size: 16px;">★★★★★</span>
      <strong>${block.rating} stars</strong>
    </div>
    <span style="color: #ced4da;">•</span>
    <div><strong>${block.reviewCount}</strong> reviews</div>
    <span style="color: #ced4da;">•</span>
    <div><strong>${block.customerCount}</strong> happy customers</div>
  </div>`;
}

function renderStats(block: Extract<Block, { type: "stats" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 8px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  const cols = Math.min(block.stats.length, 4);
  return `${heading}
  <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 24px; padding: 40px 24px; margin: 24px 0; background: linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}15 100%); border-radius: 16px; text-align: center;">
    ${block.stats.map((s) => `<div>
      <div style="font-size: 2.5rem; font-weight: 800; color: ${primaryColor}; line-height: 1; margin-bottom: 8px;">${s.value}</div>
      <div style="font-size: 0.85rem; color: #495057; line-height: 1.4;">${s.label}</div>
    </div>`).join("")}
  </div>`;
}

function renderTestimonials(block: Extract<Block, { type: "testimonials" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 16px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  const cols = Math.min(block.testimonials.length, 3);
  return `${heading}
  <div style="margin: 24px 0;">
    <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 20px;">
      ${block.testimonials.map((t) => `<div style="background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 24px;">
        <div style="color: ${primaryColor}; font-size: 16px; margin-bottom: 8px;">★★★★★</div>
        <p style="font-size: 0.95rem; line-height: 1.6; margin: 0 0 16px 0; color: #333;">"${t.quote}"</p>
        <div style="font-weight: 600; font-size: 0.85rem; color: #212529;">${t.name}</div>
        <div style="font-size: 0.8rem; color: #868e96;">${t.detail}</div>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderNumberedSection(block: Extract<Block, { type: "numberedSection" }>, primaryColor: string): string {
  const imageHtml = block.imageLabel
    ? renderImage({
        type: "image",
        id: block.id + "_img",
        label: block.imageLabel,
        hint: block.imageHint || "Add a relevant visual here",
        height: "220px",
      }, primaryColor)
    : "";
  return `<div style="margin-bottom: 48px; padding-bottom: 40px; border-bottom: 1px solid rgba(0,0,0,0.06);">
    <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${primaryColor}; opacity: 0.8; margin-bottom: 8px;">${block.label}</div>
    <div style="font-size: 3rem; font-weight: 900; color: ${primaryColor}; opacity: 0.15; line-height: 1; margin-bottom: -12px;">${block.number}</div>
    <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 12px 0; font-family: inherit; line-height: 1.3;">${block.headline}</h3>
    <p style="font-size: 1.05rem; line-height: 1.7; color: #495057; margin: 0;">${block.body}</p>
    ${imageHtml}
  </div>`;
}

function renderComparison(block: Extract<Block, { type: "comparison" }>, primaryColor: string, productTitle: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 16px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  return `${heading}
  <div style="margin: 24px 0; overflow: hidden; border-radius: 12px; border: 1px solid #e9ecef;">
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <thead>
        <tr style="background: ${primaryColor}; color: #fff;">
          <th style="padding: 16px 20px; text-align: left; font-weight: 600;"></th>
          <th style="padding: 16px 20px; text-align: center; font-weight: 700;">${productTitle}</th>
          <th style="padding: 16px 20px; text-align: center; font-weight: 600; opacity: 0.8;">Others</th>
        </tr>
      </thead>
      <tbody>
        ${block.rows.map((r, i) => `<tr style="background: ${i % 2 === 0 ? "#fff" : "#f8f9fa"};">
          <td style="padding: 14px 20px; font-weight: 500; border-bottom: 1px solid #f1f3f5;">${r.feature}</td>
          <td style="padding: 14px 20px; text-align: center; border-bottom: 1px solid #f1f3f5; color: #2b8a3e; font-weight: 600;">${r.ours}</td>
          <td style="padding: 14px 20px; text-align: center; border-bottom: 1px solid #f1f3f5; color: #c92a2a;">${r.theirs}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function renderProsCons(block: Extract<Block, { type: "prosCons" }>): string {
  return `<div style="margin: 32px 0;">
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem; font-weight: 700; color: #2b8a3e; margin: 0 0 12px 0;">Pros:</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${block.pros.map((p) => `<li style="padding: 8px 0; padding-left: 24px; position: relative; font-size: 1rem;">
          <span style="position: absolute; left: 0; color: #2b8a3e; font-weight: 700;">✓</span> ${p}
        </li>`).join("")}
      </ul>
    </div>
    <div>
      <h3 style="font-size: 1.1rem; font-weight: 700; color: #c92a2a; margin: 0 0 12px 0;">Cons:</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${block.cons.map((c) => `<li style="padding: 8px 0; padding-left: 24px; position: relative; font-size: 1rem;">
          <span style="position: absolute; left: 0; color: #c92a2a; font-weight: 700;">✗</span> ${c}
        </li>`).join("")}
      </ul>
    </div>
  </div>`;
}

function renderTimeline(block: Extract<Block, { type: "timeline" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 24px 0; text-align: center; font-family: inherit;">${block.heading}</h2>`
    : "";
  const cols = Math.min(block.steps.length, 4);
  return `<div style="margin: 48px 0; padding: 32px; background: #f8f9fa; border-radius: 16px;">
    ${heading}
    <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 24px;">
      ${block.steps.map((s) => `<div style="text-align: center;">
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: ${primaryColor}; font-weight: 700; margin-bottom: 6px;">${s.label}</div>
        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">${s.headline}</div>
        <div style="font-size: 0.85rem; color: #868e96;">${s.body}</div>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderGuarantee(block: Extract<Block, { type: "guarantee" }>): string {
  return `<div style="text-align: center; padding: 24px 0; margin: 12px 0;">
    <p style="font-size: 0.9rem; color: #868e96;">🛡️ <strong>${block.text}</strong></p>
  </div>`;
}

function renderDivider(): string {
  return `<hr style="border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0;" />`;
}

function renderNote(block: Extract<Block, { type: "note" }>, primaryColor: string): string {
  const styles = {
    info: { bg: "#e7f5ff", border: "#339af0", color: "#1864ab" },
    warning: { bg: "#fff9db", border: "#fcc419", color: "#e67700" },
    highlight: { bg: `${primaryColor}10`, border: primaryColor, color: "#212529" },
  };
  const s = styles[block.style];
  return `<div style="margin: 24px 0; padding: 20px 24px; background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 4px;">
    <p style="margin: 0; font-size: 1rem; font-weight: 500; color: ${s.color}; line-height: 1.6;">${block.text}</p>
  </div>`;
}

// ─── New Block Renderers ──────────────────────────────────────────────────────

function renderFaq(block: Extract<Block, { type: "faq" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 20px 0; font-family: inherit; text-align: center;">${block.heading}</h2>`
    : "";
  return `<div style="margin: 40px 0;">
    ${heading}
    ${block.items.map((item) => `
      <details style="margin-bottom: 8px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
        <summary style="padding: 16px 20px; font-weight: 600; font-size: 1rem; cursor: pointer; background: #fafbfc; list-style: none; display: flex; justify-content: space-between; align-items: center;">
          ${item.question}
          <span style="font-size: 18px; color: #868e96; transition: transform 0.2s;">+</span>
        </summary>
        <div style="padding: 0 20px 16px; font-size: 0.95rem; color: #495057; line-height: 1.7;">
          ${item.answer}
        </div>
      </details>
    `).join("")}
  </div>`;
}

function renderAsSeenIn(block: Extract<Block, { type: "asSeenIn" }>, primaryColor: string): string {
  return `<div style="text-align: center; margin: 32px 0; padding: 20px 0; border-top: 1px solid #e9ecef; border-bottom: 1px solid #e9ecef;">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #868e96; margin-bottom: 12px; font-weight: 600;">As Seen In</div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;">
      ${block.publications.map((pub) => `
        <span style="font-size: 1.1rem; font-weight: 700; color: #495057; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7;">${pub}</span>
      `).join("")}
    </div>
  </div>`;
}

function renderAuthorByline(block: Extract<Block, { type: "authorByline" }>): string {
  return `<div style="margin: 16px 0 24px; padding: 16px 0; border-bottom: 1px solid #e9ecef;">
    ${block.category ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #c92a2a; font-weight: 700; margin-bottom: 8px;">${block.category}</div>` : ""}
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #e9ecef 0%, #ced4da 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #495057;">
        ${block.author.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight: 600; font-size: 0.9rem; color: #212529;">
          ${block.author}${block.role ? ` · <span style="font-weight: 400; color: #868e96;">${block.role}</span>` : ""}
        </div>
        <div style="font-size: 0.8rem; color: #868e96;">${block.date}${block.publicationName ? ` · ${block.publicationName}` : ""}</div>
      </div>
    </div>
  </div>`;
}

function renderFeatureList(block: Extract<Block, { type: "featureList" }>, primaryColor: string): string {
  const icon = block.icon || "✓";
  const heading = block.heading
    ? `<h3 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 16px 0; font-family: inherit;">${block.heading}</h3>`
    : "";
  return `<div style="margin: 24px 0;">
    ${heading}
    <ul style="list-style: none; padding: 0; margin: 0;">
      ${block.items.map((item) => `
        <li style="padding: 10px 0; padding-left: 28px; position: relative; font-size: 1rem; border-bottom: 1px solid #f1f3f5;">
          <span style="position: absolute; left: 0; color: ${primaryColor}; font-weight: 700;">${icon}</span> ${item}
        </li>
      `).join("")}
    </ul>
  </div>`;
}

function renderOfferBox(block: Extract<Block, { type: "offerBox" }>, primaryColor: string, productHandle: string): string {
  return `<div style="margin: 40px 0; border: 2px solid ${primaryColor}; border-radius: 16px; overflow: hidden;">
    ${block.discount ? `<div style="background: ${primaryColor}; color: #fff; text-align: center; padding: 8px; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px;">${block.discount}</div>` : ""}
    <div style="padding: 32px 24px; text-align: center;">
      <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 8px 0; font-family: inherit;">${block.headline}</h3>
      <p style="font-size: 1rem; color: #495057; margin: 0 0 24px 0;">${block.subtext}</p>
      <a href="/products/${escapeAttr(productHandle)}" style="display: inline-block; padding: 16px 48px; background: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">${block.buttonText}</a>
      ${block.guarantee ? `<div style="margin-top: 16px; font-size: 0.85rem; color: #2b8a3e;">✔️ ${block.guarantee}</div>` : ""}
      ${block.urgency ? `<div style="margin-top: 8px; font-size: 0.8rem; color: #868e96; font-style: italic;">${block.urgency}</div>` : ""}
    </div>
  </div>`;
}

function renderComments(block: Extract<Block, { type: "comments" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h3 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 16px 0;">${block.heading}</h3>`
    : "";
  return `<div style="margin: 40px 0;">
    ${heading}
    ${block.comments.map((c) => `
      <div style="padding: 16px 0; border-bottom: 1px solid #f1f3f5;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: ${primaryColor};">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span style="font-weight: 600; font-size: 0.9rem;">${c.name}</span>
            <span style="font-size: 0.8rem; color: #868e96; margin-left: 8px;">${c.timeAgo}</span>
          </div>
        </div>
        <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #333;">${c.text}</p>
        ${c.likes ? `<div style="margin-top: 8px; font-size: 0.8rem; color: #868e96;">👍 ${c.likes} · Reply</div>` : ""}
      </div>
    `).join("")}
  </div>`;
}

function renderDisclaimer(block: Extract<Block, { type: "disclaimer" }>): string {
  return `<div style="margin: 48px 0 16px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
    <p style="margin: 0; font-size: 0.75rem; color: #868e96; line-height: 1.6; text-align: center;">${block.text}</p>
  </div>`;
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export interface RenderOptions {
  primaryColor: string;
  productTitle: string;
  productHandle: string;
}

export function renderBlocksToHtml(blocks: Block[], options: RenderOptions): string {
  const { primaryColor, productTitle, productHandle } = options;

  const inner = blocks
    .map((block) => {
      switch (block.type) {
        case "headline":
          return renderHeadline(block, primaryColor);
        case "text":
          return renderText(block);
        case "image":
          return renderImage(block, primaryColor);
        case "cta":
          return renderCta(block, primaryColor, productHandle);
        case "socialProof":
          return renderSocialProof(block, primaryColor);
        case "stats":
          return renderStats(block, primaryColor);
        case "testimonials":
          return renderTestimonials(block, primaryColor);
        case "numberedSection":
          return renderNumberedSection(block, primaryColor);
        case "comparison":
          return renderComparison(block, primaryColor, productTitle);
        case "prosCons":
          return renderProsCons(block);
        case "timeline":
          return renderTimeline(block, primaryColor);
        case "guarantee":
          return renderGuarantee(block);
        case "divider":
          return renderDivider();
        case "note":
          return renderNote(block, primaryColor);
        case "faq":
          return renderFaq(block, primaryColor);
        case "asSeenIn":
          return renderAsSeenIn(block, primaryColor);
        case "authorByline":
          return renderAuthorByline(block);
        case "featureList":
          return renderFeatureList(block, primaryColor);
        case "offerBox":
          return renderOfferBox(block, primaryColor, productHandle);
        case "comments":
          return renderComments(block, primaryColor);
        case "disclaimer":
          return renderDisclaimer(block);
        default:
          return "";
      }
    })
    .join("\n");

  return `<div style="max-width: 800px; margin: 0 auto; padding: 20px 0; font-family: inherit; line-height: 1.8; color: inherit;">
${inner}
</div>`;
}

/** Render a single block to HTML (used by the visual editor canvas). */
export function renderSingleBlockToHtml(block: Block, options: RenderOptions): string {
  const { primaryColor, productTitle, productHandle } = options;
  switch (block.type) {
    case "headline": return renderHeadline(block, primaryColor);
    case "text": return renderText(block);
    case "image": return renderImage(block, primaryColor);
    case "cta": return renderCta(block, primaryColor, productHandle);
    case "socialProof": return renderSocialProof(block, primaryColor);
    case "stats": return renderStats(block, primaryColor);
    case "testimonials": return renderTestimonials(block, primaryColor);
    case "numberedSection": return renderNumberedSection(block, primaryColor);
    case "comparison": return renderComparison(block, primaryColor, productTitle);
    case "prosCons": return renderProsCons(block);
    case "timeline": return renderTimeline(block, primaryColor);
    case "guarantee": return renderGuarantee(block);
    case "divider": return renderDivider();
    case "note": return renderNote(block, primaryColor);
    case "faq": return renderFaq(block, primaryColor);
    case "asSeenIn": return renderAsSeenIn(block, primaryColor);
    case "authorByline": return renderAuthorByline(block);
    case "featureList": return renderFeatureList(block, primaryColor);
    case "offerBox": return renderOfferBox(block, primaryColor, productHandle);
    case "comments": return renderComments(block, primaryColor);
    case "disclaimer": return renderDisclaimer(block);
    default: return "";
  }
}
