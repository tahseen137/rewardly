#!/usr/bin/env node
/**
 * Add comprehensive Open Graph and Twitter Card meta tags to all HTML files
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://rewardly.ca';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`; // TODO: Create this image

// Page-specific metadata
const pageMetadata = {
  'best-credit-card-rewards-app-canada.html': {
    title: 'Best Credit Card Rewards App for Canada 2026 | Rewardly',
    description: 'Compare the best credit card rewards apps for Canada in 2026. Rewardly vs SaveSage vs MaxRewards vs spreadsheets. Find the right optimizer for your cards.',
    image: `${SITE_URL}/og-best-credit-card-app.png`,
  },
  'credit-card-calculator-canada.html': {
    title: 'Credit Card Rewards Calculator Canada | Rewardly',
    description: 'Free Canadian credit card rewards calculator. Compare cashback, points, and travel rewards across 116+ cards. Find your best card match.',
    image: `${SITE_URL}/og-calculator.png`,
  },
  'canadian-loyalty-programs-guide-2026.html': {
    title: 'Canadian Loyalty Programs Guide 2026 | Aeroplan, Scene+, PC Optimum',
    description: 'Complete guide to Canadian loyalty programs in 2026: Aeroplan, Scene+, PC Optimum, Air Miles. Earn rates, redemption values, transfer partners.',
    image: `${SITE_URL}/og-loyalty-guide.png`,
  },
  'credit-card-referral-bonuses-canada-2026.html': {
    title: 'Best Credit Card Referral Bonuses Canada 2026 | Rewardly',
    description: 'Earn up to 50,000 bonus points through credit card referrals in Canada. Amex, Chase, TD, CIBC, RBC referral programs compared.',
    image: `${SITE_URL}/og-referrals.png`,
  },
  'maximize-credit-card-rewards-canada.html': {
    title: 'How to Maximize Credit Card Rewards in Canada 2026',
    description: 'Expert strategies to maximize Canadian credit card rewards. Category bonuses, stacking techniques, point transfers, and redemption optimization.',
    image: `${SITE_URL}/og-maximize-rewards.png`,
  },
  'maxrewards-alternative.html': {
    title: 'MaxRewards Alternative Canada | Rewardly',
    description: 'Looking for a MaxRewards alternative in Canada? Rewardly offers 116+ Canadian cards, AI recommendations, and real-time optimization.',
    image: `${SITE_URL}/og-maxrewards-alt.png`,
  },
  'savesage-alternative.html': {
    title: 'SaveSage Alternative Canada | Rewardly',
    description: 'Free SaveSage alternative for Canadians. Compare 116+ credit cards with AI-powered recommendations and real-time rewards tracking.',
    image: `${SITE_URL}/og-savesage-alt.png`,
  },
};

function generateMetaTags(filePath, metadata) {
  const url = `${SITE_URL}/${path.basename(filePath)}`;
  const title = metadata?.title || 'Rewardly - Canadian Credit Card Rewards Optimizer';
  const description = metadata?.description || 'Maximize your Canadian credit card rewards with AI-powered recommendations. 116+ cards, real-time optimization.';
  const image = metadata?.image || DEFAULT_OG_IMAGE;

  return `
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Rewardly">
<meta property="og:locale" content="en_CA">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${url}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:site" content="@rewardlyca">
<meta name="twitter:creator" content="@rewardlyca">
`.trim();
}

function updateHTMLFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Remove existing OG and Twitter meta tags to avoid duplicates
  html = html.replace(/<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]+"\s+content="[^"]*"\s*\/?>/gi, '');
  
  const metadata = pageMetadata[path.basename(filePath)];
  const metaTags = generateMetaTags(filePath, metadata);
  
  // Insert new meta tags after viewport tag
  const viewportIndex = html.indexOf('<meta name="viewport"');
  if (viewportIndex !== -1) {
    const viewportEnd = html.indexOf('>', viewportIndex) + 1;
    html = html.slice(0, viewportEnd) + '\n' + metaTags + html.slice(viewportEnd);
  } else {
    // Fallback: insert after <head>
    const headIndex = html.indexOf('<head>');
    if (headIndex !== -1) {
      const headEnd = headIndex + 6;
      html = html.slice(0, headEnd) + '\n' + metaTags + html.slice(headEnd);
    }
  }
  
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ Updated: ${path.basename(filePath)}`);
}

function main() {
  const files = fs.readdirSync(PUBLIC_DIR)
    .filter(f => f.endsWith('.html') && !f.includes('admin') && !f.includes('ceo-queue'))
    .map(f => path.join(PUBLIC_DIR, f));
  
  console.log(`Found ${files.length} HTML files to update\n`);
  
  files.forEach(updateHTMLFile);
  
  console.log(`\n✓ All files updated with OG and Twitter Card meta tags`);
  console.log(`\n⚠️  TODO: Generate OG images for each page (1200x630px)`);
  console.log(`   - Default: og-image.png`);
  console.log(`   - Per-page images: ${Object.values(pageMetadata).map(m => path.basename(m.image)).join(', ')}`);
}

main();
