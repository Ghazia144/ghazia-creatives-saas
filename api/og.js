// Vercel Serverless Function for WhatsApp OG Cards
// Env vars ki zaroorat nahi: Supabase URL aur publishable key public hain (js/config.js jaisi hi).
const SUPABASE_URL = process.env.SUPABASE_URL || "https://jqegjvndpzsgxodtljvq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_w06stRx8HuAv3TTSU5ptCQ_q6FIsh00";

// HTML mein names daalne se pehle escape karna zaroori hai (warna koi bhi name mein code daal sakta hai)
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  // Jis domain par request aayi wohi use karo (vercel.app ya ghaziacreatives.com), hardcode nahi
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "ghaziacreatives.com")
    .replace(/[^a-zA-Z0-9.:-]/g, "");
  const SITE_URL = `https://${host}`;

  // slug mein sirf safe characters allow
  const slug = String(req.query.slug || "").replace(/[^a-zA-Z0-9-_]/g, "");

  // Default fallback
  let title = "Wedding Invitation";
  let description = "You are cordially invited to our wedding celebration.";
  // TIP: images/default-og.jpg (1200x630) bana kar upload karein aur yahan wohi laga dein
  const image = `${SITE_URL}/images/logo.webp`;

  try {
    if (slug) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ action: "get", identifier: slug })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.bride && data.data.groom) {
          title = `${data.data.bride.name} weds ${data.data.groom.name}`;
          description = `You are cordially invited to the wedding of ${data.data.bride.name} & ${data.data.groom.name}.`;
        }
      }
    }
  } catch (err) {
    console.error("OG Fetch error", err);
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${esc(title)}</title>
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:url" content="${esc(SITE_URL)}/i/${esc(slug)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0; url=/i/${esc(slug)}" />
  </head>
  <body>Redirecting...</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.status(200).send(html);
}
