const SERVICES = ["Airport Transfer", "Private Ride", "Tours & Day Trips"];

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
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// trim and cap the length of anything a visitor sends
const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);

// today in Sri Lanka as YYYY-MM-DD
const todayLK = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

// real calendar date check, so 2026-02-31 is rejected
const isRealDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

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
  // the email settings must exist, otherwise say so clearly in the logs
  const missing = ["BREVO_API_KEY", "MAIL_FROM", "MAIL_TO"].filter(
    (k) => !env[k],
  );
  if (missing.length) {
    console.error("Missing settings:", missing.join(", "));
    return json({ error: "Failed to send" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  if (body.website) return json({ ok: true }); // honeypot

  const q = {
    name: clean(body.name, 80),
    whatsapp: clean(body.whatsapp, 30),
    email: clean(body.email, 120),
    service: clean(body.service, 40),
    direction: clean(body.direction, 20),
    date: clean(body.date, 10),
    passengers: clean(body.passengers, 20),
    hotel: clean(body.hotel, 150),
    flight: clean(body.flight, 60),
    pickup: clean(body.pickup, 150),
    days: clean(body.days, 20),
    from: clean(body.from, 150),
    to: clean(body.to, 150),
    message: clean(body.message, 1500),
  };

  if (!q.name || !q.whatsapp || !q.email || !q.date || !q.service) {
    return json({ error: "Missing required fields" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) {
    return json({ error: "Invalid email" }, 400);
  }
  if (!/^\+?[\d\s\-()]{7,20}$/.test(q.whatsapp)) {
    return json({ error: "Invalid WhatsApp number" }, 400);
  }
  if (!SERVICES.includes(q.service)) {
    return json({ error: "Invalid service" }, 400);
  }
  if (!isRealDate(q.date) || q.date < todayLK()) {
    return json({ error: "Invalid date" }, 400);
  }

  // WhatsApp number shown in the customer's copy (set WHATSAPP_NUMBER to change it)
  const wa = String(env.WHATSAPP_NUMBER || "94778589711").replace(/\D/g, "");
  const waShown = /^94\d{9}$/.test(wa)
    ? `+${wa.slice(0, 2)} ${wa.slice(2, 4)} ${wa.slice(4, 7)} ${wa.slice(7)}`
    : `+${wa}`;

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
          `Need us sooner? WhatsApp ${waShown}.\n\nCeylon Journey Co.`,
        htmlContent:
          `<p>Hi ${esc(q.name)},</p>` +
          `<p>Thank you for your request. We'll get back to you shortly with the best option.</p>` +
          `<p><b>Your request</b></p>${table}` +
          `<p>Need us sooner? WhatsApp <a href="https://wa.me/${wa}">${waShown}</a>.</p>` +
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
    const { pathname } = new URL(request.url);

    if (pathname === "/api/tours" && request.method === "GET") {
      try {
        return await handleTours(env);
      } catch (err) {
        console.error("tours failed", err);
        return json({ error: "Could not load tours." }, 500);
      }
    }

    if (pathname === "/api/quote") {
      if (request.method !== "POST")
        return json({ error: "Method not allowed" }, 405);
      return handleQuote(request, env);
    }

    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

    return env.ASSETS.fetch(request); // everything else: your website
  },
};