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
  const sizes = { large: "2.75rem", medium: "2.1rem", small: "1.65rem" };
  const tags = { large: "h1", medium: "h2", small: "h3" };
  const tag = tags[block.size];
  const align = block.align || "left";
  const subheadline = block.subheadline
    ? `<p style="font-size: ${block.size === "large" ? "1.2rem" : "1.05rem"}; color: #6b7280; font-weight: 400; margin: 8px 0 0; line-height: 1.5;">${block.subheadline}</p>`
    : "";
  return `<div style="text-align: ${align}; margin-bottom: 20px;">
    <${tag} style="font-size: ${sizes[block.size]}; font-weight: 800; margin: 0; font-family: inherit; line-height: 1.25;">${block.text}</${tag}>
    ${subheadline}
  </div>`;
}

function renderText(block: Extract<Block, { type: "text" }>): string {
  const variant = block.variant || "default";
  if (variant === "large-intro") {
    return `<div style="margin: 28px 0;">
      <p style="font-size: 1.55rem; line-height: 1.75; margin: 0 0 16px 0; color: #374151; font-weight: 400;">${block.content}</p>
    </div>`;
  }
  if (variant === "pull-quote") {
    return `<blockquote style="margin: 40px 0; padding: 24px 32px; border-left: 4px solid #d1d5db; background: #f9fafb; border-radius: 0 12px 12px 0;">
      <p style="font-size: 1.5rem; line-height: 1.7; margin: 0; color: #1f2937; font-style: italic; font-weight: 500;">${block.content}</p>
    </blockquote>`;
  }
  return `<div style="margin: 28px 0;">
    <p style="font-size: 1.4rem; line-height: 1.8; margin: 0 0 16px 0; color: inherit;">${block.content}</p>
  </div>`;
}

function renderImage(block: Extract<Block, { type: "image" }>, primaryColor: string): string {
  const isSidebar = block.placement === "sidebar";
  const margin = isSidebar ? "16px 0" : "32px 0";
  const height = block.height || (isSidebar ? "180px" : "280px");
  const radius = block.rounded === false ? "0" : (isSidebar ? "8px" : "12px");
  const caption = block.caption
    ? `<figcaption style="margin-top: 10px; font-size: 0.9rem; color: #6b7280; text-align: center; font-style: italic;">${block.caption}</figcaption>`
    : "";
  if (block.src) {
    return `<figure style="margin: ${margin}; padding: 0;">
      <img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.label)}" style="width: 100%; height: auto; border-radius: ${radius}; display: block;" />
      ${caption}
    </figure>`;
  }
  return `<figure style="margin: ${margin}; padding: 0;">
    <div class="adv-img-placeholder" style="
      width: 100%; height: ${height};
      background: linear-gradient(135deg, #f0f2f5 0%, #e4e7eb 100%);
      border: 2px dashed #c9cfd6; border-radius: ${radius};
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      overflow: hidden;
    ">
      <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;">🖼️</div>
      <div style="font-weight: 600; font-size: 14px; color: #6b7280;">${block.label}</div>
      <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${block.hint}</div>
    </div>
    ${caption}
  </figure>`;
}

function renderCta(block: Extract<Block, { type: "cta" }>, primaryColor: string, productHandle: string): string {
  const href = `/products/${productHandle}`;
  if (block.style === "inline") {
    return `<div style="text-align: center; margin: 36px 0;">
      <a href="${href}" style="display: inline-block; padding: 16px 36px; background-color: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.15rem; transition: opacity 0.2s;">${block.buttonText}</a>
    </div>`;
  }
  const variant = block.variant || "gradient";
  if (variant === "outline") {
    return `<section class="adv-cta-primary" style="text-align: center; margin: 48px 0; padding: 48px 24px; border: 2px solid ${primaryColor}; border-radius: 16px; background: #fff;">
      <h2 style="font-size: 2rem; margin: 0 0 12px 0; color: ${primaryColor}; font-weight: 800; font-family: inherit; line-height: 1.3;">${block.headline}</h2>
      <p style="font-size: 1.2rem; color: #6b7280; margin-bottom: 28px; max-width: 500px; margin-left: auto; margin-right: auto;">${block.subtext}</p>
      <a href="${href}" style="display: inline-block; padding: 16px 40px; background-color: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(0,0,0,0.1);">${block.buttonText}</a>
    </section>`;
  }
  if (variant === "solid") {
    return `<section class="adv-cta-primary" style="text-align: center; margin: 48px 0; padding: 48px 24px; background: ${primaryColor}; border-radius: 16px;">
      <h2 style="font-size: 2rem; margin: 0 0 12px 0; color: #fff; font-weight: 800; font-family: inherit; line-height: 1.3;">${block.headline}</h2>
      <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); margin-bottom: 28px; max-width: 500px; margin-left: auto; margin-right: auto;">${block.subtext}</p>
      <a href="${href}" style="display: inline-block; padding: 16px 40px; background-color: #fff; color: ${primaryColor}; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(0,0,0,0.1);">${block.buttonText}</a>
    </section>`;
  }
  return `<section class="adv-cta-primary" style="text-align: center; margin: 48px 0; padding: 48px 24px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%); border-radius: 16px; box-shadow: 0 8px 32px ${primaryColor}20;">
    <h2 style="font-size: 2rem; margin: 0 0 12px 0; color: #fff; font-weight: 800; font-family: inherit; line-height: 1.3;">${block.headline}</h2>
    <p style="font-size: 1.2rem; color: rgba(255,255,255,0.92); margin-bottom: 28px; max-width: 500px; margin-left: auto; margin-right: auto;">${block.subtext}</p>
    <a href="${href}" style="display: inline-block; padding: 16px 40px; background-color: #fff; color: ${primaryColor}; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">${block.buttonText}</a>
  </section>`;
}

function renderSocialProof(block: Extract<Block, { type: "socialProof" }>, _primaryColor: string): string {
  return `<div class="adv-social-proof" style="display: flex; align-items: center; justify-content: center; gap: 24px; padding: 20px 0; margin: 24px 0; flex-wrap: wrap; font-size: 16px; color: #495057; background: #f9fafb; border-radius: 12px;">
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="color: #f59e0b; font-size: 18px;">★★★★★</span>
      <strong>${block.rating} stars</strong>
    </div>
    <span style="color: #d1d5db;">|</span>
    <div><strong>${block.reviewCount}</strong> reviews</div>
    <span style="color: #d1d5db;">|</span>
    <div><strong>${block.customerCount}</strong> happy customers</div>
  </div>`;
}

function renderStats(block: Extract<Block, { type: "stats" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 12px;">
        <h2 style="font-size: 1.75rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  const cols = Math.min(block.stats.length, 4);
  const layout = block.layout || "grid";
  if (layout === "horizontal") {
    return `${heading}
    <div class="adv-stats-grid" style="display: flex; justify-content: center; gap: 48px; padding: 32px 24px; margin: 24px 0; flex-wrap: wrap;">
      ${block.stats.map((s) => `<div style="text-align: center;">
        <div style="font-size: 2.75rem; font-weight: 800; color: ${primaryColor}; line-height: 1; margin-bottom: 6px;">${s.value}</div>
        <div style="font-size: 1rem; color: #6b7280; line-height: 1.4;">${s.label}</div>
      </div>`).join("")}
    </div>`;
  }
  return `${heading}
  <div class="adv-stats-grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 20px; padding: 36px 24px; margin: 24px 0; background: linear-gradient(135deg, ${primaryColor}06 0%, ${primaryColor}12 100%); border-radius: 16px; border: 1px solid ${primaryColor}15; text-align: center;">
    ${block.stats.map((s) => `<div style="padding: 12px;">
      <div style="font-size: 2.75rem; font-weight: 800; color: ${primaryColor}; line-height: 1; margin-bottom: 8px;">${s.value}</div>
      <div style="font-size: 1rem; color: #6b7280; line-height: 1.4;">${s.label}</div>
    </div>`).join("")}
  </div>`;
}

function renderTestimonials(block: Extract<Block, { type: "testimonials" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.75rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  const showStars = block.showStars !== false;
  const layout = block.layout || "grid";
  if (layout === "stacked") {
    return `${heading}
    <div style="margin: 24px 0;">
      ${block.testimonials.map((t) => `<div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        ${showStars ? `<div style="color: #f59e0b; font-size: 16px; margin-bottom: 10px;">★★★★★</div>` : ""}
        <p style="font-size: 1.15rem; line-height: 1.7; margin: 0 0 16px 0; color: #374151;">"${t.quote}"</p>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: ${primaryColor}; flex-shrink: 0;">${t.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 1rem; color: #1f2937;">${t.name}</div>
            <div style="font-size: 0.9rem; color: #9ca3af;">${t.detail}</div>
          </div>
        </div>
      </div>`).join("")}
    </div>`;
  }
  const cols = Math.min(block.testimonials.length, 3);
  return `${heading}
  <div style="margin: 24px 0;">
    <div class="adv-testimonials-grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 20px;">
      ${block.testimonials.map((t) => `<div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column;">
        ${showStars ? `<div style="color: #f59e0b; font-size: 16px; margin-bottom: 10px;">★★★★★</div>` : ""}
        <p style="font-size: 1.1rem; line-height: 1.65; margin: 0 0 auto; color: #374151; padding-bottom: 16px;">"${t.quote}"</p>
        <div style="display: flex; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: ${primaryColor}; flex-shrink: 0;">${t.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #1f2937;">${t.name}</div>
            <div style="font-size: 0.85rem; color: #9ca3af;">${t.detail}</div>
          </div>
        </div>
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
  return `<div class="adv-numbered-section" style="margin-bottom: 48px; padding-bottom: 40px; border-bottom: 1px solid #f3f4f6;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}25); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: ${primaryColor}; flex-shrink: 0;">${block.number}</div>
      <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${primaryColor};">${block.label}</div>
    </div>
    <h3 class="adv-numbered-headline" style="font-size: 1.85rem; font-weight: 700; margin: 0 0 14px 0; font-family: inherit; line-height: 1.3;">${block.headline}</h3>
    <p style="font-size: 1.4rem; line-height: 1.75; color: #374151; margin: 0;">${block.body}</p>
    ${imageHtml}
  </div>`;
}

function renderComparison(block: Extract<Block, { type: "comparison" }>, primaryColor: string, productTitle: string): string {
  const heading = block.heading
    ? `<div style="text-align: center; margin-bottom: 16px;">
        <h2 style="font-size: 1.75rem; font-weight: 700; margin: 0; font-family: inherit;">${block.heading}</h2>
      </div>`
    : "";
  return `${heading}
  <div style="margin: 24px 0; overflow-x: auto; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); -webkit-overflow-scrolling: touch;">
    <table style="width: 100%; border-collapse: collapse; font-size: 1.05rem; min-width: 320px;">
      <thead>
        <tr style="background: ${primaryColor}; color: #fff;">
          <th style="padding: 16px 20px; text-align: left; font-weight: 600;"></th>
          <th style="padding: 16px 20px; text-align: center; font-weight: 700;">${productTitle}</th>
          <th style="padding: 16px 20px; text-align: center; font-weight: 600; opacity: 0.85;">Others</th>
        </tr>
      </thead>
      <tbody>
        ${block.rows.map((r, i) => `<tr style="background: ${i % 2 === 0 ? "#fff" : "#f9fafb"};">
          <td style="padding: 14px 20px; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${r.feature}</td>
          <td style="padding: 14px 20px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #059669; font-weight: 600;">${r.ours}</td>
          <td style="padding: 14px 20px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #dc2626;">${r.theirs}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function renderProsCons(block: Extract<Block, { type: "prosCons" }>): string {
  return `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 32px 0;" class="adv-proscons-grid">
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: #059669; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">👍</span> Pros</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${block.pros.map((p) => `<li style="padding: 8px 0; padding-left: 24px; position: relative; font-size: 1.1rem; color: #374151; line-height: 1.5;">
          <span style="position: absolute; left: 0; color: #059669; font-weight: 700;">✓</span> ${p}
        </li>`).join("")}
      </ul>
    </div>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px;">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: #dc2626; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">👎</span> Cons</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${block.cons.map((c) => `<li style="padding: 8px 0; padding-left: 24px; position: relative; font-size: 1.1rem; color: #374151; line-height: 1.5;">
          <span style="position: absolute; left: 0; color: #dc2626; font-weight: 700;">✗</span> ${c}
        </li>`).join("")}
      </ul>
    </div>
  </div>`;
}

function renderTimeline(block: Extract<Block, { type: "timeline" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 24px 0; text-align: center; font-family: inherit;">${block.heading}</h2>`
    : "";
  const cols = Math.min(block.steps.length, 4);
  return `<div class="adv-timeline-wrapper" style="margin: 48px 0; padding: 32px; background: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
    ${heading}
    <div class="adv-timeline-grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 24px;">
      ${block.steps.map((s, i) => `<div style="text-align: center; position: relative;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: ${primaryColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin: 0 auto 12px;">${i + 1}</div>
        <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: ${primaryColor}; font-weight: 700; margin-bottom: 6px;">${s.label}</div>
        <div style="font-weight: 600; font-size: 1.05rem; margin-bottom: 4px; color: #1f2937;">${s.headline}</div>
        <div style="font-size: 0.95rem; color: #6b7280; line-height: 1.5;">${s.body}</div>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderGuarantee(block: Extract<Block, { type: "guarantee" }>): string {
  if (block.badges && block.badges.length > 0) {
    return `<div class="adv-guarantee-badges" style="display: flex; justify-content: center; gap: 32px; padding: 28px 20px; margin: 20px 0; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; flex-wrap: wrap;">
      ${block.badges.map((b) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;">
        <span style="font-size: 28px;">${b.icon}</span>
        <span style="font-size: 0.85rem; font-weight: 600; color: #374151; line-height: 1.3;">${b.label}</span>
      </div>`).join("")}
    </div>`;
  }
  return `<div style="text-align: center; padding: 24px 20px; margin: 20px 0; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6;">
    <p style="font-size: 1.05rem; color: #6b7280; margin: 0;"><strong>${block.text}</strong></p>
  </div>`;
}

function renderDivider(): string {
  return `<div style="margin: 40px 0; display: flex; align-items: center; gap: 16px;">
    <div style="flex: 1; height: 1px; background: #e5e7eb;"></div>
    <div style="color: #d1d5db; font-size: 12px;">✦</div>
    <div style="flex: 1; height: 1px; background: #e5e7eb;"></div>
  </div>`;
}

function renderNote(block: Extract<Block, { type: "note" }>, primaryColor: string): string {
  const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    info: { bg: "#eff6ff", border: "#3b82f6", color: "#1e40af", icon: "ℹ️" },
    warning: { bg: "#fffbeb", border: "#f59e0b", color: "#92400e", icon: "⚠️" },
    highlight: { bg: `${primaryColor}08`, border: primaryColor, color: "#1f2937", icon: "💡" },
  };
  const s = styles[block.style];
  return `<div style="margin: 28px 0; padding: 20px 24px; background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 0 12px 12px 0; display: flex; gap: 14px; align-items: flex-start;">
    <span style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">${s.icon}</span>
    <p style="margin: 0; font-size: 1.15rem; font-weight: 500; color: ${s.color}; line-height: 1.6;">${block.text}</p>
  </div>`;
}

function renderFaq(block: Extract<Block, { type: "faq" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size: 2rem; font-weight: 700; margin: 0 0 24px 0; font-family: inherit;">${block.heading}</h2>`
    : "";
  return `<div style="margin: 48px 0;">
    ${heading}
    ${block.items.map((item) => `
      <details style="margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
        <summary style="padding: 20px 24px; font-weight: 600; font-size: 1.2rem; cursor: pointer; background: #fff; list-style: none; display: flex; justify-content: space-between; align-items: center; color: #1f2937;">
          ${item.question}
          <span style="font-size: 22px; color: #9ca3af; transition: transform 0.2s; flex-shrink: 0; margin-left: 12px;">+</span>
        </summary>
        <div style="padding: 0 24px 20px; font-size: 1.15rem; color: #4b5563; line-height: 1.7; background: #fff;">
          ${item.answer}
        </div>
      </details>
    `).join("")}
  </div>`;
}

function renderAsSeenIn(block: Extract<Block, { type: "asSeenIn" }>, primaryColor: string): string {
  return `<div style="text-align: center; margin: 36px 0; padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; color: #9ca3af; margin-bottom: 16px; font-weight: 600;">As Seen In</div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 40px; flex-wrap: wrap;">
      ${block.publications.map((pub) => `
        <span style="font-size: 1.15rem; font-weight: 700; color: #374151; letter-spacing: 2px; text-transform: uppercase; opacity: 0.45;">${pub}</span>
      `).join("")}
    </div>
  </div>`;
}

function renderAuthorByline(block: Extract<Block, { type: "authorByline" }>): string {
  const viewLine = block.viewCount || block.liveViewers
    ? `<div style="font-size: 0.95rem; color: #9ca3af; margin-top: 6px; font-style: italic;">
        ${block.viewCount ? `<span>${block.viewCount}</span>` : ""}${block.viewCount && block.liveViewers ? " | " : ""}${block.liveViewers ? `<span style="color: #ef4444; font-style: normal; font-weight: 600;">◉ ${block.liveViewers} Live Viewers</span>` : ""}
      </div>`
    : "";
  return `<div style="margin: 14px 0 28px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
    <p style="font-size: 1.1rem; color: #6b7280; margin: 0; line-height: 1.5;">
      <strong style="color: #1f2937;">Written By: ${block.author}</strong>${block.role ? ` <span style="color: #9ca3af;">·</span> <span style="color: #6b7280;">${block.role}</span>` : ""} <span style="color: #9ca3af;">·</span> ${block.date}${block.publicationName ? ` <span style="color: #9ca3af;">·</span> ${block.publicationName}` : ""}
    </p>
    ${viewLine}
  </div>`;
}

function renderFeatureList(block: Extract<Block, { type: "featureList" }>, primaryColor: string): string {
  const icon = block.icon || "✓";
  const heading = block.heading
    ? `<h3 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 16px 0; font-family: inherit; color: #1f2937;">${block.heading}</h3>`
    : "";
  return `<div style="margin: 28px 0;">
    ${heading}
    <ul style="list-style: none; padding: 0; margin: 0;">
      ${block.items.map((item) => `
        <li style="padding: 12px 0; padding-left: 36px; position: relative; font-size: 1.2rem; color: #374151; line-height: 1.5; border-bottom: 1px solid #f9fafb;">
          <span style="position: absolute; left: 0; width: 24px; height: 24px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; color: #059669; font-weight: 700; font-size: 14px; top: 14px;">${icon}</span> ${item}
        </li>
      `).join("")}
    </ul>
  </div>`;
}

function renderOfferBox(block: Extract<Block, { type: "offerBox" }>, primaryColor: string, productHandle: string): string {
  const buttonText = block.buttonText.replace(/\s*👉\s*$/, "").trim();
  const layout = block.layout || "stacked";
  if (layout === "horizontal") {
    return `<div class="adv-offer-box" style="margin: 36px 0; padding: 28px; border: 2px solid ${primaryColor}20; border-radius: 16px; background: linear-gradient(135deg, ${primaryColor}04, ${primaryColor}08); display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px;">
        ${block.headline ? `<div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${primaryColor}; margin-bottom: 6px;">${block.headline}</div>` : ""}
        ${block.subtext ? `<p style="font-size: 1.15rem; color: #374151; margin: 0; line-height: 1.5;">${block.subtext}</p>` : ""}
        ${block.guarantee ? `<div style="margin-top: 10px; font-size: 0.95rem; color: #059669; font-weight: 500;">✔ ${block.guarantee}</div>` : ""}
      </div>
      <a href="/products/${escapeAttr(productHandle)}" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 32px; background: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.1rem; white-space: nowrap; box-shadow: 0 4px 14px ${primaryColor}30;">
        ${buttonText}
      </a>
    </div>`;
  }
  return `<div class="adv-offer-box" style="margin: 36px 0; padding: 32px; border: 2px solid ${primaryColor}20; border-radius: 16px; background: linear-gradient(135deg, ${primaryColor}04, ${primaryColor}08); text-align: center;">
    ${block.headline ? `<div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${primaryColor}; margin-bottom: 10px;">${block.headline}</div>` : ""}
    ${block.subtext ? `<p style="font-size: 1.2rem; color: #374151; margin: 0 0 20px 0; line-height: 1.5; max-width: 500px; margin-left: auto; margin-right: auto;">${block.subtext}</p>` : ""}
    <a href="/products/${escapeAttr(productHandle)}" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 36px; background: ${primaryColor}; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1.15rem; box-shadow: 0 4px 14px ${primaryColor}30;">
      ${buttonText}
    </a>
    ${block.guarantee ? `<div style="margin-top: 16px; font-size: 1rem; color: #059669; font-weight: 500;">✔ ${block.guarantee}</div>` : ""}
    ${block.urgency ? `<div style="margin-top: 8px; font-size: 0.95rem; color: #6b7280;">${block.urgency}</div>` : ""}
  </div>`;
}

function renderComments(block: Extract<Block, { type: "comments" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h3 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 20px 0; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6;">${block.heading}</h3>`
    : "";
  return `<div style="margin: 40px 0;">
    ${heading}
    ${block.comments.map((c) => `
      <div style="padding: 18px 0; border-bottom: 1px solid #f3f4f6;${c.isReply ? " padding-left: 48px;" : ""}">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: ${primaryColor}; flex-shrink: 0;">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-weight: 600; font-size: 1rem; color: #1f2937;">${c.name}</span>
            ${c.isVerified ? `<span style="font-size: 0.75rem; font-weight: 600; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 4px;">✓ Verified</span>` : ""}
            <span style="font-size: 0.85rem; color: #9ca3af;">${c.timeAgo}</span>
          </div>
        </div>
        <p style="margin: 0; font-size: 1.05rem; line-height: 1.6; color: #374151;${c.isReply ? "" : ""}">${c.text}</p>
        ${c.likes ? `<div style="margin-top: 10px; display: flex; align-items: center; gap: 16px; font-size: 0.9rem; color: #9ca3af;">
          <span style="cursor: pointer;">👍 ${c.likes}</span>
          <span style="cursor: pointer;">Reply</span>
        </div>` : ""}
      </div>
    `).join("")}
  </div>`;
}

function renderDisclaimer(block: Extract<Block, { type: "disclaimer" }>): string {
  return `<div style="margin: 48px 0 16px; padding: 24px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 0.8rem; color: #9ca3af; line-height: 1.7; text-align: center; letter-spacing: 0.01em;">${block.text}</p>
  </div>`;
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export interface RenderOptions {
  primaryColor: string;
  productTitle: string;
  productHandle: string;
}

function renderBlockToHtml(block: Block, options: RenderOptions): string {
  const { primaryColor, productTitle, productHandle } = options;
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
}

export function renderBlocksToHtml(blocks: Block[], options: RenderOptions): string {
  const mainHtml = blocks.map((block) => renderBlockToHtml(block, options)).join("\n");
  return `<style>
  .page-title, .article-template__title,
  h1.page-title, .page-header h1,
  .main-page-title, .template-page h1:first-of-type {
    display: none !important;
  }
  .adv-content { box-sizing: border-box; width: 100%; }
  .adv-content *, .adv-content *::before, .adv-content *::after { box-sizing: border-box; }
  @media (max-width: 600px) {
    .adv-content { padding: 16px 14px !important; font-size: 1.1rem !important; }
    .adv-content h1 { font-size: 1.75rem !important; }
    .adv-content h2 { font-size: 1.45rem !important; }
    .adv-content h3 { font-size: 1.25rem !important; }
    .adv-content p { font-size: 1.1rem !important; }
    .adv-content .adv-testimonials-grid { grid-template-columns: 1fr !important; }
    .adv-content .adv-stats-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 24px 16px !important; }
    .adv-content .adv-timeline-grid { grid-template-columns: 1fr !important; }
    .adv-content .adv-timeline-wrapper { padding: 20px 16px !important; margin: 32px 0 !important; }
    .adv-content .adv-cta-primary { padding: 32px 16px !important; }
    .adv-content .adv-cta-primary h2 { font-size: 1.4rem !important; }
    .adv-content .adv-offer-box { padding: 20px 16px !important; flex-direction: column !important; text-align: center !important; }
    .adv-content table { font-size: 0.85rem !important; }
    .adv-content table th, .adv-content table td { padding: 10px 8px !important; }
    .adv-content .adv-img-placeholder { height: 200px !important; }
    .adv-content details summary { padding: 16px 18px !important; font-size: 1.1rem !important; }
    .adv-content details > div { padding: 0 18px 16px !important; font-size: 1.1rem !important; }
    .adv-content .adv-social-proof { gap: 12px !important; padding: 16px 12px !important; }
    .adv-content .adv-numbered-section { margin-bottom: 32px !important; padding-bottom: 28px !important; }
    .adv-content .adv-numbered-headline { font-size: 1.35rem !important; }
    .adv-content .adv-guarantee-badges { gap: 20px !important; padding: 20px 12px !important; }
    .adv-content .adv-proscons-grid { grid-template-columns: 1fr !important; }
  }
  .adv-content img { max-width: 100%; height: auto; }
  .adv-content { overflow-wrap: break-word; word-wrap: break-word; }
  .adv-content mark { background: #fef08a; color: inherit; padding: 2px 6px; border-radius: 3px; }
  .adv-content .adv-breadcrumb { font-size: 0.85rem; color: #6b7280; margin-bottom: 16px; }
  .adv-content .adv-breadcrumb a { color: #6b7280; text-decoration: none; }
  .adv-content .adv-breadcrumb a:hover { text-decoration: underline; }
  .adv-content details[open] summary span:last-child { transform: rotate(45deg); }
  .adv-content a { transition: opacity 0.15s ease; }
  .adv-content a:hover { opacity: 0.88; }
</style>
<script>
(function(){
  var c = document.querySelector('.adv-content');
  if (!c) return;
  var n = c;
  for (var i = 0; i < 5; i++) {
    n = n.parentElement;
    if (!n || n === document.body) break;
    var h = n.previousElementSibling;
    if (h && h.querySelector && h.querySelector('h1')) { h.style.display = 'none'; break; }
  }
})();
</script>
<div class="adv-content" style="max-width: 960px; margin: 0 auto; padding: 24px 20px; font-family: inherit; line-height: 1.7; color: #1f2937; font-size: 1.25rem;">
${mainHtml}
</div>`;
}

/** Render a single block to HTML (used by the visual editor canvas). */
export function renderSingleBlockToHtml(block: Block, options: RenderOptions): string {
  return renderBlockToHtml(block, options);
}
