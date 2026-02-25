// ═══════════════════════════════════════════════════════════════════════════════
// Block Renderer
// Converts an ordered array of blocks into clean HTML for Shopify pages.
// Each block renders independently — the order of blocks IS the page layout.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Block } from "./blocks";

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/** Convert a hex color + alpha (0–1) to rgba() — safe for all hex formats. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(99,102,241,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const STAR_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;"><path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.12L8 10.5l-3.71 1.95L5 8.42 2 5.5l4.15-.75L8 1z"/></svg>`;
const STARS_HTML = STAR_SVG.repeat(5);

const CHECK_SVG = (color: string) => `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><circle cx="7" cy="7" r="7" fill="${color}"/><path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SHIELD_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;"><path d="M10 2L3 5v5c0 4 3.13 7.74 7 9 3.87-1.26 7-5 7-9V5l-7-3z" fill="#059669" opacity="0.15"/><path d="M10 2L3 5v5c0 4 3.13 7.74 7 9 3.87-1.26 7-5 7-9V5l-7-3z" stroke="#059669" stroke-width="1.5" fill="none"/><path d="M7 10l2 2 4-4" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const IMG_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="6" fill="none"/><path d="M4 24l7-8 5 6 4-4 8 6H4z" fill="#cbd5e1"/><circle cx="22" cy="10" r="3" fill="#cbd5e1"/></svg>`;

// ─── Individual Block Renderers ───────────────────────────────────────────────

function renderHeadline(block: Extract<Block, { type: "headline" }>, _primaryColor: string): string {
  const sizes = { large: "2.6rem", medium: "2rem", small: "1.55rem" };
  const weights = { large: "900", medium: "800", small: "700" };
  const lh = { large: "1.15", medium: "1.2", small: "1.25" };
  const tags = { large: "h1", medium: "h2", small: "h3" };
  const tag = tags[block.size];
  const align = block.align || "left";
  const subheadline = block.subheadline
    ? `<p style="font-size:${block.size === "large" ? "1.15rem" : "1rem"};color:#6b7280;font-weight:400;margin:10px 0 0;line-height:1.55;">${block.subheadline}</p>`
    : "";
  return `<div style="text-align:${align};margin:0 0 24px;">
  <${tag} style="font-size:${sizes[block.size]};font-weight:${weights[block.size]};margin:0;font-family:inherit;line-height:${lh[block.size]};color:#111827;letter-spacing:-0.02em;">${block.text}</${tag}>
  ${subheadline}
</div>`;
}

function renderText(block: Extract<Block, { type: "text" }>, primaryColor: string): string {
  const variant = block.variant || "default";
  if (variant === "large-intro") {
    return `<div style="margin:24px 0;">
  <p style="font-size:1.3rem;line-height:1.8;margin:0;color:#111827;font-weight:400;">${block.content}</p>
</div>`;
  }
  if (variant === "pull-quote") {
    return `<blockquote style="margin:36px 0;padding:20px 28px;border-left:4px solid ${primaryColor};background:${hexToRgba(primaryColor, 0.05)};border-radius:0 10px 10px 0;">
  <p style="font-size:1.35rem;line-height:1.7;margin:0;color:#1f2937;font-style:italic;font-weight:500;">${block.content}</p>
</blockquote>`;
  }
  return `<div style="margin:24px 0;">
  <p style="font-size:1.15rem;line-height:1.85;margin:0;color:#374151;">${block.content}</p>
</div>`;
}

function renderImage(block: Extract<Block, { type: "image" }>, _primaryColor: string): string {
  const isSidebar = block.placement === "sidebar";
  const margin = isSidebar ? "16px 0" : "28px 0";
  const height = block.height || (isSidebar ? "180px" : "300px");
  const radius = block.rounded === false ? "0" : (isSidebar ? "8px" : "12px");
  const caption = block.caption
    ? `<figcaption style="margin-top:10px;font-size:0.875rem;color:#9ca3af;text-align:center;font-style:italic;">${block.caption}</figcaption>`
    : "";
  if (block.src) {
    return `<figure style="margin:${margin};padding:0;">
  <img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.label)}" style="width:100%;height:auto;border-radius:${radius};display:block;" />
  ${caption}
</figure>`;
  }
  return `<figure style="margin:${margin};padding:0;">
  <div class="adv-img-placeholder" style="width:100%;height:${height};background:linear-gradient(150deg,#f1f5f9 0%,#e2e8f0 100%);border-radius:${radius};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
    ${IMG_SVG}
    <span style="font-size:13px;font-weight:600;color:#94a3b8;text-align:center;max-width:80%;line-height:1.4;">${block.label}</span>
    <span style="font-size:11px;color:#cbd5e1;text-align:center;max-width:80%;line-height:1.4;">${block.hint}</span>
  </div>
  ${caption}
</figure>`;
}

function renderCta(block: Extract<Block, { type: "cta" }>, primaryColor: string, productHandle: string): string {
  const href = `/products/${productHandle}`;
  if (block.style === "inline") {
    return `<div style="text-align:center;margin:32px 0;">
  <a href="${href}" style="display:inline-block;padding:15px 40px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:1.1rem;letter-spacing:0.01em;box-shadow:0 4px 16px ${hexToRgba(primaryColor, 0.3)};">${block.buttonText}</a>
</div>`;
  }
  const variant = block.variant || "gradient";
  const bg = variant === "gradient"
    ? `linear-gradient(135deg,${primaryColor} 0%,${hexToRgba(primaryColor, 0.82)} 100%)`
    : variant === "solid" ? primaryColor : "#fff";
  const isLight = variant === "outline";
  const headingColor = isLight ? primaryColor : "#fff";
  const subtextColor = isLight ? "#6b7280" : "rgba(255,255,255,0.88)";
  const btnBg = isLight ? primaryColor : "#fff";
  const btnColor = isLight ? "#fff" : primaryColor;
  const border = isLight ? `border:2px solid ${primaryColor};` : "";
  return `<section class="adv-cta-primary" style="text-align:center;margin:48px 0;padding:48px 28px;background:${bg};border-radius:18px;${border}box-shadow:0 8px 40px ${hexToRgba(primaryColor, 0.18)};">
  <h2 style="font-size:2.1rem;margin:0 0 12px;color:${headingColor};font-weight:800;font-family:inherit;line-height:1.2;letter-spacing:-0.02em;">${block.headline}</h2>
  <p style="font-size:1.15rem;color:${subtextColor};margin:0 auto 28px;max-width:480px;line-height:1.6;">${block.subtext}</p>
  <a href="${href}" style="display:inline-flex;align-items:center;justify-content:center;padding:16px 44px;background:${btnBg};color:${btnColor};text-decoration:none;border-radius:10px;font-weight:700;font-size:1.15rem;box-shadow:0 4px 20px rgba(0,0,0,0.12);">${block.buttonText}</a>
  <div style="margin-top:16px;font-size:0.9rem;color:${isLight ? "#9ca3af" : "rgba(255,255,255,0.7)"};">✓ Secure checkout &nbsp;·&nbsp; 30-day guarantee &nbsp;·&nbsp; Free shipping</div>
</section>`;
}

function renderSocialProof(block: Extract<Block, { type: "socialProof" }>, _primaryColor: string): string {
  return `<div class="adv-social-proof" style="display:flex;align-items:center;justify-content:center;gap:20px;padding:18px 20px;margin:24px 0;flex-wrap:wrap;background:#fafafa;border:1px solid #f3f4f6;border-radius:12px;">
  <div style="display:flex;align-items:center;gap:5px;">
    ${STARS_HTML}
    <strong style="margin-left:6px;font-size:0.95rem;color:#1f2937;">${block.rating}</strong>
  </div>
  <span style="color:#e5e7eb;font-size:20px;">|</span>
  <div style="font-size:0.95rem;color:#374151;"><strong>${block.reviewCount}</strong></div>
  <span style="color:#e5e7eb;font-size:20px;">|</span>
  <div style="font-size:0.95rem;color:#374151;"><strong>${block.customerCount}</strong></div>
</div>`;
}

function renderStats(block: Extract<Block, { type: "stats" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align:center;margin-bottom:20px;"><h2 style="font-size:1.7rem;font-weight:700;margin:0;font-family:inherit;color:#111827;">${block.heading}</h2></div>`
    : "";
  const cols = Math.min(block.stats.length, 4);
  const layout = block.layout || "grid";
  if (layout === "horizontal") {
    return `${heading}
<div class="adv-stats-grid" style="display:flex;justify-content:center;gap:40px;padding:32px 24px;margin:28px 0;flex-wrap:wrap;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
  ${block.stats.map((s) => `<div style="text-align:center;">
    <div style="font-size:3.25rem;font-weight:900;color:${primaryColor};line-height:1;margin-bottom:6px;letter-spacing:-0.03em;">${s.value}</div>
    <div style="font-size:0.9rem;color:#6b7280;line-height:1.4;font-weight:500;">${s.label}</div>
  </div>`).join("")}
</div>`;
  }
  return `${heading}
<div class="adv-stats-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:1px;margin:28px 0;background:${hexToRgba(primaryColor, 0.08)};border-radius:14px;overflow:hidden;border:1px solid ${hexToRgba(primaryColor, 0.12)};">
  ${block.stats.map((s, i) => `<div style="text-align:center;padding:28px 16px;background:#fff;">
    <div style="font-size:3rem;font-weight:900;color:${primaryColor};line-height:1;margin-bottom:8px;letter-spacing:-0.03em;">${s.value}</div>
    <div style="font-size:0.9rem;color:#6b7280;line-height:1.4;font-weight:500;">${s.label}</div>
  </div>`).join("")}
</div>`;
}

function renderTestimonials(block: Extract<Block, { type: "testimonials" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<div style="text-align:center;margin-bottom:24px;"><h2 style="font-size:1.8rem;font-weight:800;margin:0;font-family:inherit;color:#111827;">${block.heading}</h2></div>`
    : "";
  const showStars = block.showStars !== false;
  const layout = block.layout || "grid";
  const cardHtml = (t: { quote: string; name: string; detail: string }) => {
    const initials = t.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
  ${showStars ? `<div style="display:flex;gap:2px;margin-bottom:14px;">${STARS_HTML}</div>` : ""}
  <p style="font-size:1.05rem;line-height:1.7;margin:0 0 auto;color:#374151;padding-bottom:18px;flex:1;">"${t.quote}"</p>
  <div style="display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid #f3f4f6;">
    <div style="width:38px;height:38px;border-radius:50%;background:${hexToRgba(primaryColor, 0.1)};border:2px solid ${hexToRgba(primaryColor, 0.2)};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${primaryColor};flex-shrink:0;">${initials}</div>
    <div>
      <div style="font-weight:600;font-size:0.95rem;color:#1f2937;">${t.name}</div>
      <div style="font-size:0.83rem;color:#9ca3af;">${t.detail}</div>
    </div>
  </div>
</div>`;
  };
  if (layout === "stacked") {
    return `${heading}<div style="margin:28px 0;display:flex;flex-direction:column;gap:16px;">${block.testimonials.map(cardHtml).join("")}</div>`;
  }
  const cols = Math.min(block.testimonials.length, 3);
  return `${heading}
<div style="margin:28px 0;">
  <div class="adv-testimonials-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;">
    ${block.testimonials.map(cardHtml).join("")}
  </div>
</div>`;
}

function renderNumberedSection(block: Extract<Block, { type: "numberedSection" }>, primaryColor: string): string {
  const imageHtml = block.imageLabel
    ? renderImage({ type: "image", id: block.id + "_img", label: block.imageLabel, hint: block.imageHint || "Add a relevant visual here", height: "220px" }, primaryColor)
    : "";
  return `<div class="adv-numbered-section" style="margin-bottom:44px;padding-bottom:40px;border-bottom:1px solid #f3f4f6;">
  <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:14px;">
    <div style="width:52px;height:52px;border-radius:50%;background:${primaryColor};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 12px ${hexToRgba(primaryColor, 0.3)};">${block.number}</div>
    <div style="padding-top:12px;">
      <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${primaryColor};">${block.label}</div>
    </div>
  </div>
  <h3 class="adv-numbered-headline" style="font-size:1.75rem;font-weight:800;margin:0 0 12px;font-family:inherit;line-height:1.25;color:#111827;">${block.headline}</h3>
  <p style="font-size:1.1rem;line-height:1.8;color:#4b5563;margin:0;">${block.body}</p>
  ${imageHtml}
</div>`;
}

function renderComparison(block: Extract<Block, { type: "comparison" }>, primaryColor: string, productTitle: string): string {
  const heading = block.heading
    ? `<div style="text-align:center;margin-bottom:16px;"><h2 style="font-size:1.7rem;font-weight:700;margin:0;font-family:inherit;">${block.heading}</h2></div>`
    : "";
  const checkIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#059669"/><path d="M5 9l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const xIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#e5e7eb"/><path d="M6 6l6 6M12 6l-6 6" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  return `${heading}
<div style="margin:24px 0;overflow-x:auto;border-radius:14px;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.05);-webkit-overflow-scrolling:touch;">
  <table style="width:100%;border-collapse:collapse;font-size:1rem;min-width:320px;">
    <thead>
      <tr>
        <th style="padding:16px 20px;text-align:left;font-weight:600;background:#f9fafb;color:#6b7280;border-bottom:2px solid #e5e7eb;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;"></th>
        <th style="padding:16px 20px;text-align:center;background:${primaryColor};color:#fff;border-bottom:2px solid ${primaryColor};font-weight:700;">
          <div>${productTitle}</div>
          <div style="font-size:0.7rem;font-weight:600;opacity:0.85;margin-top:3px;">★ Best Choice</div>
        </th>
        <th style="padding:16px 20px;text-align:center;background:#f9fafb;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600;">Others</th>
      </tr>
    </thead>
    <tbody>
      ${block.rows.map((r, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#fafafa"};">
        <td style="padding:14px 20px;font-weight:500;border-bottom:1px solid #f3f4f6;color:#374151;">${r.feature}</td>
        <td style="padding:14px 20px;text-align:center;border-bottom:1px solid #f3f4f6;color:#059669;font-weight:600;background:${hexToRgba(primaryColor, 0.03)};">${r.ours.match(/^[✓✗×x]$/i) ? (r.ours === "✓" ? checkIcon : xIcon) : r.ours}</td>
        <td style="padding:14px 20px;text-align:center;border-bottom:1px solid #f3f4f6;color:#9ca3af;">${r.theirs.match(/^[✓✗×x]$/i) ? xIcon : r.theirs}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>`;
}

function renderProsCons(block: Extract<Block, { type: "prosCons" }>): string {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:32px 0;" class="adv-proscons-grid">
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:22px;">
    <h3 style="font-size:1.05rem;font-weight:700;color:#059669;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#059669"/><path d="M5 9l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> What We Love
    </h3>
    <ul style="list-style:none;padding:0;margin:0;">
      ${block.pros.map((p) => `<li style="padding:7px 0 7px 22px;position:relative;font-size:1rem;color:#374151;line-height:1.5;">
        <span style="position:absolute;left:0;top:10px;color:#059669;">✓</span> ${p}
      </li>`).join("")}
    </ul>
  </div>
  <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:22px;">
    <h3 style="font-size:1.05rem;font-weight:700;color:#6b7280;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#e5e7eb"/><path d="M6 6l6 6M12 6l-6 6" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round"/></svg> Worth Noting
    </h3>
    <ul style="list-style:none;padding:0;margin:0;">
      ${block.cons.map((c) => `<li style="padding:7px 0 7px 22px;position:relative;font-size:1rem;color:#6b7280;line-height:1.5;">
        <span style="position:absolute;left:0;top:10px;">–</span> ${c}
      </li>`).join("")}
    </ul>
  </div>
</div>`;
}

function renderTimeline(block: Extract<Block, { type: "timeline" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size:1.5rem;font-weight:700;margin:0 0 24px;text-align:center;font-family:inherit;color:#111827;">${block.heading}</h2>`
    : "";
  const cols = Math.min(block.steps.length, 4);
  return `<div class="adv-timeline-wrapper" style="margin:44px 0;padding:32px 24px;background:linear-gradient(135deg,#fafafa 0%,#f5f5f5 100%);border-radius:16px;border:1px solid #f0f0f0;">
  ${heading}
  <div class="adv-timeline-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px;">
    ${block.steps.map((s, i) => `<div style="text-align:center;">
      <div style="width:40px;height:40px;border-radius:50%;background:${primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;margin:0 auto 12px;box-shadow:0 4px 10px ${hexToRgba(primaryColor, 0.25)};">${i + 1}</div>
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:${primaryColor};font-weight:700;margin-bottom:6px;">${s.label}</div>
      <div style="font-weight:700;font-size:1rem;margin-bottom:6px;color:#111827;">${s.headline}</div>
      <div style="font-size:0.9rem;color:#6b7280;line-height:1.55;">${s.body}</div>
    </div>`).join("")}
  </div>
</div>`;
}

function renderGuarantee(block: Extract<Block, { type: "guarantee" }>, primaryColor: string): string {
  if (block.badges && block.badges.length > 0) {
    return `<div class="adv-guarantee-badges" style="display:flex;justify-content:center;gap:28px;padding:28px 20px;margin:24px 0;background:${hexToRgba(primaryColor, 0.04)};border-radius:14px;border:1px solid ${hexToRgba(primaryColor, 0.1)};flex-wrap:wrap;">
  ${block.badges.map((b) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">
    <span style="font-size:28px;">${b.icon}</span>
    <span style="font-size:0.82rem;font-weight:600;color:#374151;line-height:1.3;">${b.label}</span>
  </div>`).join("")}
</div>`;
  }
  return `<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px 24px;margin:24px 0;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
  ${SHIELD_SVG}
  <p style="font-size:1rem;color:#059669;margin:0;font-weight:600;">${block.text}</p>
</div>`;
}

function renderDivider(): string {
  return `<div style="margin:44px 0;display:flex;align-items:center;gap:16px;">
  <div style="flex:1;height:1px;background:#e5e7eb;"></div>
  <div style="color:#d1d5db;font-size:10px;letter-spacing:3px;">✦ ✦ ✦</div>
  <div style="flex:1;height:1px;background:#e5e7eb;"></div>
</div>`;
}

function renderNote(block: Extract<Block, { type: "note" }>, primaryColor: string): string {
  const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    info: { bg: "#eff6ff", border: "#3b82f6", color: "#1e40af", icon: "ℹ" },
    warning: { bg: "#fffbeb", border: "#f59e0b", color: "#92400e", icon: "!" },
    highlight: { bg: hexToRgba(primaryColor, 0.06), border: primaryColor, color: "#1f2937", icon: "★" },
  };
  const s = styles[block.style];
  return `<div style="margin:24px 0;padding:18px 22px;background:${s.bg};border-left:4px solid ${s.border};border-radius:0 10px 10px 0;display:flex;gap:14px;align-items:flex-start;">
  <span style="font-size:15px;font-weight:700;flex-shrink:0;margin-top:1px;color:${s.border};width:20px;height:20px;border-radius:50%;border:2px solid ${s.border};display:flex;align-items:center;justify-content:center;">${s.icon}</span>
  <p style="margin:0;font-size:1.05rem;font-weight:500;color:${s.color};line-height:1.65;">${block.text}</p>
</div>`;
}

function renderFaq(block: Extract<Block, { type: "faq" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h2 style="font-size:1.9rem;font-weight:800;margin:0 0 24px;font-family:inherit;color:#111827;">${block.heading}</h2>`
    : "";
  return `<div style="margin:44px 0;">
  ${heading}
  ${block.items.map((item) => `
  <details style="margin-bottom:8px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
    <summary style="padding:18px 22px;font-weight:600;font-size:1.05rem;cursor:pointer;background:#fff;list-style:none;display:flex;justify-content:space-between;align-items:center;color:#1f2937;">
      ${item.question}
      <span style="font-size:18px;color:${primaryColor};flex-shrink:0;margin-left:12px;font-weight:400;">+</span>
    </summary>
    <div style="padding:0 22px 18px;font-size:1rem;color:#4b5563;line-height:1.75;background:#fff;border-top:1px solid #f3f4f6;">
      ${item.answer}
    </div>
  </details>
  `).join("")}
</div>`;
}

function renderAsSeenIn(block: Extract<Block, { type: "asSeenIn" }>, _primaryColor: string): string {
  return `<div style="text-align:center;margin:36px 0;padding:22px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#9ca3af;margin-bottom:18px;font-weight:700;">As Featured In</div>
  <div style="display:flex;align-items:center;justify-content:center;gap:36px;flex-wrap:wrap;">
    ${block.publications.map((pub) => `<span style="font-size:1.05rem;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">${pub}</span>`).join("")}
  </div>
</div>`;
}

function renderAuthorByline(block: Extract<Block, { type: "authorByline" }>): string {
  const meta = [block.role, block.date, block.publicationName].filter(Boolean).join(" · ");
  const viewLine = block.viewCount || block.liveViewers
    ? `<div style="font-size:0.875rem;color:#9ca3af;margin-top:5px;">
        ${block.viewCount ? `<span>${block.viewCount} views</span>` : ""}${block.viewCount && block.liveViewers ? " &nbsp;/&nbsp; " : ""}${block.liveViewers ? `<span style="color:#ef4444;font-weight:600;">● ${block.liveViewers} reading now Live Viewers</span>` : ""}
      </div>`
    : "";
  return `<div style="margin:0 0 28px;padding-bottom:18px;border-bottom:2px solid #f3f4f6;">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;font-weight:700;margin-bottom:5px;">Written By: ${block.author}</div>
  ${meta ? `<div style="font-size:0.875rem;color:#6b7280;">${meta}</div>` : ""}
  ${viewLine}
</div>`;
}

function renderFeatureList(block: Extract<Block, { type: "featureList" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h3 style="font-size:1.45rem;font-weight:700;margin:0 0 16px;font-family:inherit;color:#111827;">${block.heading}</h3>`
    : "";
  return `<div style="margin:28px 0;">
  ${heading}
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;">
    ${block.items.map((item) => `
    <li style="display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid #f9fafb;font-size:1.05rem;color:#374151;line-height:1.55;">
      ${CHECK_SVG(primaryColor)}
      <span>${item}</span>
    </li>
    `).join("")}
  </ul>
</div>`;
}

function renderOfferBox(block: Extract<Block, { type: "offerBox" }>, primaryColor: string, productHandle: string): string {
  const buttonText = block.buttonText.replace(/\s*👉\s*$/, "").trim();
  const layout = block.layout || "stacked";
  const discountBadge = block.discount
    ? `<div style="display:inline-flex;align-items:center;background:${primaryColor};color:#fff;font-size:0.8rem;font-weight:700;padding:4px 14px;border-radius:99px;margin-bottom:14px;letter-spacing:0.05em;">${block.discount}</div>`
    : "";
  const guaranteeRow = block.guarantee
    ? `<div style="display:flex;align-items:center;gap:6px;margin-top:14px;justify-content:center;font-size:0.9rem;color:#059669;font-weight:600;">${SHIELD_SVG} ${block.guarantee}</div>`
    : "";
  const urgencyRow = block.urgency
    ? `<div style="margin-top:8px;font-size:0.875rem;color:#ef4444;font-weight:600;">🔥 ${block.urgency}</div>`
    : "";
  if (layout === "horizontal") {
    return `<div class="adv-offer-box" style="margin:36px 0;padding:28px 32px;border:2px solid ${hexToRgba(primaryColor, 0.15)};border-radius:16px;background:${hexToRgba(primaryColor, 0.03)};display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">
  <div style="flex:1;min-width:200px;">
    ${discountBadge}
    ${block.headline ? `<div style="font-size:1.15rem;font-weight:700;color:#111827;margin-bottom:6px;">${block.headline}</div>` : ""}
    ${block.subtext ? `<p style="font-size:1rem;color:#4b5563;margin:0;line-height:1.5;">${block.subtext}</p>` : ""}
    ${block.guarantee ? `<div style="display:flex;align-items:center;gap:5px;margin-top:10px;font-size:0.875rem;color:#059669;font-weight:600;">${SHIELD_SVG} ${block.guarantee}</div>` : ""}
  </div>
  <a href="/products/${escapeAttr(productHandle)}" style="display:inline-flex;align-items:center;justify-content:center;padding:15px 32px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:1.05rem;white-space:nowrap;box-shadow:0 4px 16px ${hexToRgba(primaryColor, 0.3)};">${buttonText}</a>
</div>`;
  }
  return `<div class="adv-offer-box" style="margin:40px 0;padding:36px 32px;border:2px solid ${hexToRgba(primaryColor, 0.15)};border-radius:18px;background:linear-gradient(135deg,${hexToRgba(primaryColor, 0.04)} 0%,${hexToRgba(primaryColor, 0.08)} 100%);text-align:center;">
  ${discountBadge}
  ${block.headline ? `<h3 style="font-size:1.5rem;font-weight:800;color:#111827;margin:0 0 10px;line-height:1.25;">${block.headline}</h3>` : ""}
  ${block.subtext ? `<p style="font-size:1.05rem;color:#4b5563;margin:0 auto 22px;max-width:480px;line-height:1.6;">${block.subtext}</p>` : ""}
  <a href="/products/${escapeAttr(productHandle)}" class="adv-offer-btn" style="display:inline-flex;align-items:center;justify-content:center;padding:17px 44px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:1.1rem;box-shadow:0 4px 20px ${hexToRgba(primaryColor, 0.35)};letter-spacing:0.01em;">${buttonText}</a>
  ${guaranteeRow}
  ${urgencyRow}
</div>`;
}

function renderComments(block: Extract<Block, { type: "comments" }>, primaryColor: string): string {
  const heading = block.heading
    ? `<h3 style="font-size:1.3rem;font-weight:700;margin:0 0 20px;padding-bottom:14px;border-bottom:2px solid #f3f4f6;color:#111827;">${block.heading}</h3>`
    : "";
  return `<div style="margin:40px 0;">
  ${heading}
  ${block.comments.map((c) => `
  <div style="padding:16px 0;border-bottom:1px solid #f3f4f6;${c.isReply ? "padding-left:44px;" : ""}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:34px;height:34px;border-radius:50%;background:${hexToRgba(primaryColor, 0.1)};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${primaryColor};flex-shrink:0;">${c.name.charAt(0).toUpperCase()}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-weight:600;font-size:0.95rem;color:#1f2937;">${c.name}</span>
        ${c.isVerified ? `<span style="font-size:0.72rem;font-weight:600;color:#059669;background:#ecfdf5;padding:2px 7px;border-radius:4px;">✓ Verified Buyer</span>` : ""}
        <span style="font-size:0.82rem;color:#9ca3af;">${c.timeAgo}</span>
      </div>
    </div>
    <p style="margin:0;font-size:1rem;line-height:1.65;color:#374151;">${c.text}</p>
    ${c.likes ? `<div style="margin-top:8px;display:flex;align-items:center;gap:14px;font-size:0.85rem;color:#9ca3af;">
      <span>👍 ${c.likes}</span>
      <span>Reply</span>
    </div>` : ""}
  </div>
  `).join("")}
</div>`;
}

function renderDisclaimer(block: Extract<Block, { type: "disclaimer" }>): string {
  return `<div style="margin:48px 0 12px;padding:20px 24px;background:#f9fafb;border-radius:8px;border-top:3px solid #f3f4f6;">
  <p style="margin:0;font-size:0.78rem;color:#9ca3af;line-height:1.75;text-align:center;">${block.text}</p>
</div>`;
}

// ─── Urgency Banner ───────────────────────────────────────────────────────────

function renderUrgencyBanner(block: Extract<Block, { type: "urgencyBanner" }>, primaryColor: string): string {
  const bg = block.style === "breaking" ? "#dc2626"
    : block.style === "limited" ? "#111827"
    : primaryColor;
  const prefix = block.style === "breaking" ? "🔴 BREAKING:"
    : block.style === "limited" ? "⚡ LIMITED:"
    : "📈 TRENDING:";
  const text = block.text.replace(/^(BREAKING:|LIMITED:|TRENDING:)\s*/i, "");
  return `<div class="adv-urgency-banner" style="position:fixed;top:0;left:0;right:0;z-index:1000;background:${bg};color:#fff;text-align:center;padding:10px 20px;font-size:0.8rem;font-weight:700;letter-spacing:0.04em;line-height:1.4;">
  <span style="opacity:0.9">${prefix}</span> ${text}
</div>
<div style="height:44px;"></div>`;
}

// ─── Pricing Tiers ────────────────────────────────────────────────────────────

function renderPricingTiers(block: Extract<Block, { type: "pricingTiers" }>, primaryColor: string): string {
  const rgba = (hex: string, a: number) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
    const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
    if (isNaN(r)||isNaN(g)||isNaN(b)) return `rgba(99,102,241,${a})`;
    return `rgba(${r},${g},${b},${a})`;
  };
  const ctaText = block.ctaText || "Get My Order";
  const tiers = block.tiers || [];

  const tierCards = tiers.map((tier) => {
    const isHighlight = tier.highlight === true;
    const border = isHighlight ? `2px solid ${primaryColor}` : "2px solid #e5e7eb";
    const bg = isHighlight ? `background:${rgba(primaryColor, 0.04)};` : "background:#fff;";
    const shadow = isHighlight ? `box-shadow:0 8px 32px ${rgba(primaryColor, 0.18)};` : "box-shadow:0 2px 12px rgba(0,0,0,0.06);";
    const tagHtml = tier.tag ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:${primaryColor};color:#fff;font-size:0.7rem;font-weight:800;letter-spacing:0.08em;padding:5px 14px;border-radius:99px;white-space:nowrap;">${tier.tag}</div>` : "";
    const featuresHtml = (tier.features || []).map(f =>
      `<div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:#4b5563;margin-top:8px;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="${primaryColor}" opacity="0.15"/><path d="M4 7l2 2 4-4" stroke="${primaryColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${f}
      </div>`
    ).join("");

    return `<div style="position:relative;border-radius:16px;padding:28px 24px;flex:1;min-width:0;${bg}border:${border};${shadow}transition:all 0.2s;">
  ${tagHtml}
  <div style="font-size:0.85rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">${tier.name}</div>
  <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
    <span style="font-size:2rem;font-weight:900;color:#111827;line-height:1;">${tier.salePrice}</span>
    ${tier.originalPrice ? `<span style="font-size:1rem;color:#9ca3af;text-decoration:line-through;">${tier.originalPrice}</span>` : ""}
  </div>
  ${tier.perUnit ? `<div style="font-size:0.8rem;color:${primaryColor};font-weight:600;margin-bottom:16px;">${tier.perUnit}</div>` : `<div style="margin-bottom:16px;"></div>`}
  ${featuresHtml}
  <a href="/products/${block.productHandle}" style="display:block;margin-top:20px;background:${isHighlight ? primaryColor : "#fff"};color:${isHighlight ? "#fff" : primaryColor};border:2px solid ${primaryColor};text-align:center;padding:13px 20px;border-radius:10px;font-size:0.9rem;font-weight:700;text-decoration:none;letter-spacing:0.02em;transition:all 0.15s;">${ctaText}</a>
</div>`;
  }).join("\n");

  return `<div style="margin:48px 0;">
  ${block.heading ? `<h2 style="text-align:center;font-size:1.6rem;font-weight:800;color:#111827;margin-bottom:32px;">${block.heading}</h2>` : ""}
  <div class="adv-pricing-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start;">
    ${tierCards}
  </div>
  ${block.guarantee ? `<div style="text-align:center;margin-top:20px;font-size:0.82rem;color:#6b7280;display:flex;align-items:center;justify-content:center;gap:6px;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ${block.guarantee}
  </div>` : ""}
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
    case "headline":      return renderHeadline(block, primaryColor);
    case "text":          return renderText(block, primaryColor);
    case "image":         return renderImage(block, primaryColor);
    case "cta":           return renderCta(block, primaryColor, productHandle);
    case "socialProof":   return renderSocialProof(block, primaryColor);
    case "stats":         return renderStats(block, primaryColor);
    case "testimonials":  return renderTestimonials(block, primaryColor);
    case "numberedSection": return renderNumberedSection(block, primaryColor);
    case "comparison":    return renderComparison(block, primaryColor, productTitle);
    case "prosCons":      return renderProsCons(block);
    case "timeline":      return renderTimeline(block, primaryColor);
    case "guarantee":     return renderGuarantee(block, primaryColor);
    case "divider":       return renderDivider();
    case "note":          return renderNote(block, primaryColor);
    case "faq":           return renderFaq(block, primaryColor);
    case "asSeenIn":      return renderAsSeenIn(block, primaryColor);
    case "authorByline":  return renderAuthorByline(block);
    case "featureList":   return renderFeatureList(block, primaryColor);
    case "offerBox":      return renderOfferBox(block, primaryColor, productHandle);
    case "comments":       return renderComments(block, primaryColor);
    case "disclaimer":     return renderDisclaimer(block);
    case "urgencyBanner":  return renderUrgencyBanner(block, primaryColor);
    case "pricingTiers":   return renderPricingTiers(block, primaryColor);
    default:               return "";
  }
}

export function renderBlocksToHtml(blocks: Block[], options: RenderOptions): string {
  const mainHtml = blocks.map((block) => renderBlockToHtml(block, options)).join("\n");
  return `<style>
.page-title,.article-template__title,h1.page-title,.page-header h1,.main-page-title,.template-page h1:first-of-type{display:none!important;}
.adv-content{box-sizing:border-box;width:100%;}
.adv-content *,.adv-content *::before,.adv-content *::after{box-sizing:border-box;}
.adv-content img{max-width:100%;height:auto;}
.adv-content{overflow-wrap:break-word;word-break:break-word;}
.adv-content mark{background:#fef08a;color:inherit;padding:2px 5px;border-radius:3px;}
.adv-content a{transition:opacity 0.15s ease;}
.adv-content a:hover{opacity:0.85;}
.adv-content details[open] summary span:last-child{content:"-";}
.adv-offer-btn{transition:transform 0.15s ease,box-shadow 0.15s ease;}
.adv-offer-btn:hover{transform:translateY(-1px);}
@media(max-width:640px){
  .adv-content{padding:20px 16px!important;font-size:1rem!important;}
  .adv-content h1{font-size:2rem!important;letter-spacing:-0.01em!important;}
  .adv-content h2{font-size:1.6rem!important;}
  .adv-content h3{font-size:1.3rem!important;}
  .adv-content p{font-size:1rem!important;}
  .adv-testimonials-grid{grid-template-columns:1fr!important;}
  .adv-stats-grid{grid-template-columns:repeat(2,1fr)!important;}
  .adv-stats-grid>div>div:first-child{font-size:2.5rem!important;}
  .adv-timeline-grid{grid-template-columns:1fr 1fr!important;}
  .adv-timeline-wrapper{padding:20px 16px!important;margin:32px 0!important;}
  .adv-cta-primary{padding:32px 18px!important;margin:32px 0!important;}
  .adv-cta-primary h2{font-size:1.55rem!important;}
  .adv-offer-box{padding:24px 18px!important;flex-direction:column!important;text-align:center!important;}
  .adv-offer-btn{width:100%!important;padding:16px!important;}
  .adv-img-placeholder{height:200px!important;}
  .adv-social-proof{gap:10px!important;padding:14px 12px!important;font-size:0.875rem!important;}
  .adv-numbered-section{margin-bottom:32px!important;padding-bottom:28px!important;}
  .adv-numbered-headline{font-size:1.4rem!important;}
  .adv-guarantee-badges{gap:20px!important;padding:20px 12px!important;}
  .adv-proscons-grid{grid-template-columns:1fr!important;}
  table{font-size:0.85rem!important;}
  table th,table td{padding:10px 10px!important;}
  details summary{padding:16px 18px!important;font-size:1rem!important;}
  .adv-pricing-grid{grid-template-columns:1fr!important;}
}
</style>
<script>
(function(){
  var c=document.querySelector('.adv-content');
  if(!c)return;
  var n=c;
  for(var i=0;i<5;i++){
    n=n.parentElement;
    if(!n||n===document.body)break;
    var h=n.previousElementSibling;
    if(h&&h.querySelector&&h.querySelector('h1')){h.style.display='none';break;}
  }
})();
</script>
<div class="adv-content" style="max-width:800px;margin:0 auto;padding:32px 24px;font-family:inherit;line-height:1.75;color:#374151;font-size:1.1rem;">
${mainHtml}
</div>`;
}

/** Render a single block to HTML (used by the visual editor canvas). */
export function renderSingleBlockToHtml(block: Block, options: RenderOptions): string {
  return renderBlockToHtml(block, options);
}
