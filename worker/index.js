const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function handleTours(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, price, image FROM tours
     WHERE active = 1 ORDER BY sort_order, name`,
  ).all();

  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}

async function brevo(env, payload) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${await r.text()}`);
}

async function handleQuote(request, env) {
  let q;
  try {
    q = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  if (q.website) return json({ ok: true }); // honeypot
  if (!q.name || !q.whatsapp || !q.email || !q.date || !q.service) {
    return json({ error: "Missing required fields" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) {
    return json({ error: "Invalid email" }, 400);
  }

  const rows = [
    ["Name", q.name],
    ["WhatsApp", q.whatsapp],
    ["Email", q.email],
    ["Service", q.service],
    ["Direction", q.direction],
    ["Date", q.date],
    ["Passengers", q.passengers],
    ["Hotel / address", q.hotel],
    ["Flight", q.flight],
    ["Pickup", q.pickup],
    ["Days", q.days],
    ["From", q.from],
    ["To", q.to],
    ["Notes", q.message],
  ].filter(([, v]) => v);

  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const table = `<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
    .join("")}</table>`;

  try {
    // 1) notification to you
    await brevo(env, {
      sender: { name: "Ceylon Journey Co. Website", email: env.MAIL_FROM },
      to: [{ email: env.MAIL_TO }],
      replyTo: { email: q.email, name: q.name },
      subject: `New quote request: ${q.service} (${q.name})`,
      textContent: plain,
      htmlContent: table,
    });

    // 2) copy to the customer (best effort)
    try {
      await brevo(env, {
        sender: { name: "Ceylon Journey Co.", email: env.MAIL_FROM },
        to: [{ email: q.email, name: q.name }],
        replyTo: { email: env.MAIL_TO },
        subject: "We received your quote request - Ceylon Journey Co.",
        textContent:
          `Hi ${q.name},\n\nThank you for your request. We'll get back to you shortly ` +
          `with the best option.\n\nYour request:\n${plain}\n\n` +
          `Need us sooner? WhatsApp +94 77 858 9711.\n\nCeylon Journey Co.`,
        htmlContent:
          `<p>Hi ${esc(q.name)},</p>` +
          `<p>Thank you for your request. We'll get back to you shortly with the best option.</p>` +
          `<p><b>Your request</b></p>${table}` +
          `<p>Need us sooner? WhatsApp <a href="https://wa.me/94778589711">+94 77 858 9711</a>.</p>` +
          `<p>Ceylon Journey Co.<br/>Explore · Travel · Experience</p>`,
      });
    } catch (err) {
      console.error("Customer copy failed:", err);
    }

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Failed to send" }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (pathname === "/api/tours" && request.method === "GET") {
      try {
        return await handleTours(env);
      } catch (err) {
        console.error("tours failed", err);
        return json({ error: "Could not load tours." }, 500);
      }
    }
    if (url.pathname === "/api/quote") {
      if (request.method !== "POST")
        return json({ error: "Method not allowed" }, 405);
      return handleQuote(request, env);
    }
    return env.ASSETS.fetch(request); // everything else: your website
  },
};
