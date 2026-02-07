export type TemplateType = "Story" | "Listicle";
export type AngleType = "Pain" | "Desire" | "Comparison";

interface GenerateContentParams {
  productTitle: string;
  productDescription?: string;
  template: TemplateType;
  angle: AngleType;
  primaryColor?: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateStoryTemplate(
  productTitle: string,
  productDescription: string,
  angle: AngleType,
  primaryColor: string,
): { title: string; html: string } {
  const angleContent = {
    Pain: {
      hook: `Have you ever felt frustrated with products that just don't deliver on their promises?`,
      problem: `We've all been there - spending money on solutions that fall short, leaving us feeling disappointed and stuck.`,
      solution: `That's exactly why ${productTitle} was created.`,
    },
    Desire: {
      hook: `Imagine waking up every day feeling confident, energized, and ready to take on the world.`,
      problem: `What if there was a way to transform your daily experience and unlock your full potential?`,
      solution: `Introducing ${productTitle} - the solution you've been waiting for.`,
    },
    Comparison: {
      hook: `When it comes to finding the right solution, you have options. But not all options are created equal.`,
      problem: `While other products promise the world, they often fall short. Generic solutions can't address your specific needs.`,
      solution: `${productTitle} is different. It's designed specifically for people like you who demand better.`,
    },
  }[angle];

  const title = angle === "Pain" 
    ? `Why ${productTitle} Solves Your Biggest Problem`
    : angle === "Desire"
    ? `Transform Your Life with ${productTitle}`
    : `${productTitle}: The Better Choice`;

  // Clean HTML content — no document wrapper since the store theme provides <html>, <head>, <body>
  const html = `<div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: inherit; line-height: 1.6; color: #333;">
  <header style="text-align: center; margin-bottom: 60px;">
    <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 20px 0; color: #000; line-height: 1.2;">
      ${escapeHtml(title)}
    </h1>
  </header>

  <section style="margin-bottom: 50px;">
    <p style="font-size: 1.25rem; color: #666; margin-bottom: 30px; font-weight: 300;">
      ${escapeHtml(angleContent.hook)}
    </p>
    <p style="font-size: 1.1rem; color: #444; margin-bottom: 30px;">
      ${escapeHtml(angleContent.problem)}
    </p>
    <p style="font-size: 1.1rem; color: #444; margin-bottom: 30px;">
      ${escapeHtml(angleContent.solution)}
    </p>
  </section>

  <section style="margin-bottom: 50px; padding: 30px; background-color: #f8f9fa; border-radius: 8px;">
    <h2 style="font-size: 1.75rem; margin: 0 0 20px 0; color: #000;">
      Introducing ${escapeHtml(productTitle)}
    </h2>
    ${productDescription ? `<p style="font-size: 1rem; color: #555; margin-bottom: 20px;">${escapeHtml(productDescription)}</p>` : ""}
    <p style="font-size: 1rem; color: #555;">
      ${angle === "Pain" 
        ? "Stop settling for less. Experience the difference that quality makes."
        : angle === "Desire"
        ? "Join thousands who have already transformed their lives. Your journey starts here."
        : "See why smart customers choose us over the competition. The proof is in the results."}
    </p>
  </section>

  <section style="margin-bottom: 50px;">
    <h2 style="font-size: 1.75rem; margin: 0 0 20px 0; color: #000;">
      Why ${escapeHtml(productTitle)} Works
    </h2>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <strong style="color: ${primaryColor};">Proven Results</strong>
        <p style="margin: 5px 0 0 0; color: #666;">Backed by real customer success stories and measurable outcomes.</p>
      </li>
      <li style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <strong style="color: ${primaryColor};">Quality You Can Trust</strong>
        <p style="margin: 5px 0 0 0; color: #666;">Crafted with attention to detail and built to last.</p>
      </li>
      <li style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <strong style="color: ${primaryColor};">Designed for You</strong>
        <p style="margin: 5px 0 0 0; color: #666;">Created with your needs in mind, not a one-size-fits-all approach.</p>
      </li>
    </ul>
  </section>

  <section style="text-align: center; margin: 60px 0; padding: 40px 20px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); border-radius: 12px;">
    <h2 style="font-size: 2rem; margin: 0 0 20px 0; color: #fff; font-weight: 700;">
      Ready to Get Started?
    </h2>
    <p style="font-size: 1.1rem; color: #fff; margin-bottom: 30px; opacity: 0.95;">
      Don't wait another day. ${angle === "Pain" ? "Solve your problem now." : angle === "Desire" ? "Start your transformation today." : "Make the smart choice."}
    </p>
    <a href="/products/${escapeHtml(productTitle.toLowerCase().replace(/\s+/g, "-"))}" 
       style="display: inline-block; padding: 18px 40px; background-color: #fff; color: ${primaryColor}; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      Shop ${escapeHtml(productTitle)} Now
    </a>
  </section>
</div>`;

  return { title, html };
}

function generateListicleTemplate(
  productTitle: string,
  productDescription: string,
  angle: AngleType,
  primaryColor: string,
): { title: string; html: string } {
  const angleContentRaw = {
    Pain: {
      title: `5 Reasons Why {productTitle} Solves Your Problems`,
      intro: `Tired of products that don't deliver? You're not alone. Here are 5 compelling reasons why {productTitle} is the solution you've been searching for.`,
      items: [
        { title: "Addresses Your Core Pain Points", desc: "We understand exactly what you're struggling with and designed {productTitle} to solve those specific problems." },
        { title: "Proven Track Record", desc: "Thousands of satisfied customers have already found relief and success with our solution." },
        { title: "No More Disappointments", desc: "Stop wasting time and money on products that fall short. {productTitle} delivers on its promises." },
        { title: "Immediate Results", desc: "You don't have to wait weeks or months to see a difference. Experience the benefits right away." },
        { title: "Built for Real People", desc: "Created by people who faced the same challenges you're dealing with today." },
      ],
    },
    Desire: {
      title: `7 Ways {productTitle} Will Transform Your Life`,
      intro: `Imagine unlocking your full potential and living the life you've always dreamed of. Here's how {productTitle} can make that vision a reality.`,
      items: [
        { title: "Unlock Your Potential", desc: "Discover what you're truly capable of when you have the right tools and support." },
        { title: "Elevate Your Experience", desc: "Transform your daily routine into something you actually look forward to." },
        { title: "Join a Community of Success", desc: "Connect with others who are achieving their goals and living their best lives." },
        { title: "Feel Confident Every Day", desc: "Experience the confidence that comes from using a product that truly works." },
        { title: "Achieve Your Goals Faster", desc: "Stop struggling and start succeeding with a solution designed for results." },
        { title: "Invest in Yourself", desc: "You deserve the best. {productTitle} is an investment in your future happiness." },
        { title: "Live Without Limits", desc: "Break free from constraints and discover what's possible when you have the right solution." },
      ],
    },
    Comparison: {
      title: `Why {productTitle} Beats the Competition: 6 Key Advantages`,
      intro: `When choosing a solution, you have options. But not all options are equal. Here's why {productTitle} stands out from the crowd.`,
      items: [
        { title: "Superior Quality", desc: "While others cut corners, we focus on quality that you can see and feel." },
        { title: "Better Value", desc: "Get more for your money with features and benefits that competitors simply can't match." },
        { title: "Proven Results", desc: "Our track record speaks for itself - real results for real people." },
        { title: "Customer-First Approach", desc: "We listen to your needs and continuously improve, unlike companies that ignore feedback." },
        { title: "Innovation That Matters", desc: "We don't follow trends - we set them with innovations that actually make a difference." },
        { title: "Trust You Can Count On", desc: "Join thousands who trust {productTitle} for their most important needs." },
      ],
    },
  }[angle];

  // Replace placeholders with actual product title
  const angleContent = {
    title: angleContentRaw.title.replace(/{productTitle}/g, productTitle),
    intro: angleContentRaw.intro.replace(/{productTitle}/g, productTitle),
    items: angleContentRaw.items.map(item => ({
      title: item.title,
      desc: item.desc.replace(/{productTitle}/g, productTitle),
    })),
  };

  const items = angleContent.items;

  // Clean HTML content — no document wrapper since the store theme provides <html>, <head>, <body>
  const html = `<div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: inherit; line-height: 1.6; color: #333;">
  <header style="text-align: center; margin-bottom: 60px;">
    <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 20px 0; color: #000; line-height: 1.2;">
      ${escapeHtml(angleContent.title)}
    </h1>
  </header>

  <section style="margin-bottom: 50px;">
    <p style="font-size: 1.25rem; color: #666; margin-bottom: 30px; font-weight: 300;">
      ${escapeHtml(angleContent.intro)}
    </p>
    ${productDescription ? `<p style="font-size: 1.1rem; color: #444; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; border-radius: 4px;">${escapeHtml(productDescription)}</p>` : ""}
  </section>

  <section style="margin-bottom: 50px;">
    ${items.map((item, index) => `
      <div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: ${index < items.length - 1 ? "1px solid #eee" : "none"};">
        <div style="display: flex; align-items: flex-start; gap: 20px;">
          <div style="flex-shrink: 0; width: 50px; height: 50px; background-color: ${primaryColor}; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700;">
            ${index + 1}
          </div>
          <div style="flex: 1;">
            <h2 style="font-size: 1.5rem; margin: 0 0 15px 0; color: #000; font-weight: 600;">
              ${escapeHtml(item.title)}
            </h2>
            <p style="font-size: 1rem; color: #555; margin: 0; line-height: 1.7;">
              ${escapeHtml(item.desc)}
            </p>
          </div>
        </div>
      </div>
    `).join("")}
  </section>

  <section style="text-align: center; margin: 60px 0; padding: 40px 20px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); border-radius: 12px;">
    <h2 style="font-size: 2rem; margin: 0 0 20px 0; color: #fff; font-weight: 700;">
      Ready to Experience the Difference?
    </h2>
    <p style="font-size: 1.1rem; color: #fff; margin-bottom: 30px; opacity: 0.95;">
      ${angle === "Pain" 
        ? "Stop struggling and start solving. Your solution is just one click away."
        : angle === "Desire"
        ? "Your transformation begins today. Take the first step now."
        : "Join the smart customers who choose quality. Make the switch today."}
    </p>
    <a href="/products/${escapeHtml(productTitle.toLowerCase().replace(/\s+/g, "-"))}" 
       style="display: inline-block; padding: 18px 40px; background-color: #fff; color: ${primaryColor}; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      Get ${escapeHtml(productTitle)} Now
    </a>
  </section>
</div>`;

  return { title: angleContent.title, html };
}

export async function generateAdvertorialContent({
  productTitle,
  productDescription = "",
  template,
  angle,
  primaryColor = "#000000",
}: GenerateContentParams): Promise<{ title: string; html: string }> {
  if (template === "Story") {
    return generateStoryTemplate(productTitle, productDescription, angle, primaryColor);
  } else {
    return generateListicleTemplate(productTitle, productDescription, angle, primaryColor);
  }
}
