// Vercel Serverless Function for WhatsApp OG Cards
export default async function handler(req, res) {
  const { slug } = req.query; // e.g. /api/og?slug=ayesha-weds-hamza-12ab
  
  // Default fallback
  let title = "Wedding Invitation";
  let description = "You are cordially invited to our wedding celebration.";
  let image = "https://ghaziacreatives.com/images/default-og.jpg"; // Ek default image rakhna

  try {
    // Supabase Edge function call to fetch data
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ action: 'get', identifier: slug })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.bride && data.data.groom) {
        title = `${data.data.bride.name} weds ${data.data.groom.name}`;
        description = `You are cordially invited to the wedding of ${data.data.bride.name} & ${data.data.groom.name}.`;
        // Yahan tum design ki image ya ek dynamic OG image link de sakte ho
        // image = `https://ghaziacreatives.com/images/og-${data.design_id}.jpg`;
      }
    }
  } catch (err) {
    console.error("OG Fetch error", err);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="https://ghaziacreatives.com/i/${slug}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta http-equiv="refresh" content="0; url=/i/${slug}" /> <!-- Real user redirect -->
      </head>
      <body>Redirecting...</body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}