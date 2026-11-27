import { ownerEmail, customerEmail } from "./email.js";

const SERVICES = ["Airport Transfer", "Private Ride", "Tours & Day Trips"];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

// trim and cap the length of anything a visitor sends
const clean = (v, max = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

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

async function handleMoments(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, src, alt FROM moments WHERE active = 1 ORDER BY sort_order, id`,
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
  // missing email settings are logged, but the request is still saved to the database
  const missing = ["BREVO_API_KEY", "MAIL_FROM", "MAIL_TO"].filter(
    (k) => !env[k],
  );
  if (missing.length) console.error("Missing settings:", missing.join(", "));

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

  const ctx = {
    wa,
    waShown,
    siteUrl: String(env.SITE_URL || "https://ceylonjourneyco.org.lk").replace(
      /\/+$/,
      "",
    ),
    socials: [
      { label: "Facebook", url: env.FACEBOOK_URL },
      { label: "Instagram", url: env.INSTAGRAM_URL },
    ].filter((s) => s.url),
  };

  // 1) save the request first, so it is never lost even if the email fails
  let quoteId = null;
  try {
    const r = await env.DB.prepare(
      `INSERT INTO quote_requests
        (name, whatsapp, email, service, direction, travel_date, passengers,
         hotel, flight, pickup, days, from_place, to_place, message)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    )
      .bind(
        q.name,
        q.whatsapp,
        q.email,
        q.service,
        q.direction || null,
        q.date,
        q.passengers || null,
        q.hotel || null,
        q.flight || null,
        q.pickup || null,
        q.days || null,
        q.from || null,
        q.to || null,
        q.message || null,
      )
      .run();
    quoteId = r.meta?.last_row_id ?? null;
  } catch (err) {
    console.error("Saving quote failed:", err);
  }

  // 2) email you, then send the customer a copy
  const owner = ownerEmail(q, ctx);
  let notified = false;
  try {
    await brevo(env, {
      sender: { name: "Ceylon Journey Co. Website", email: env.MAIL_FROM },
      to: [{ email: env.MAIL_TO }],
      replyTo: { email: q.email, name: q.name },
      subject: `New quote request: ${q.service} (${q.name})`,
      textContent: owner.text,
      htmlContent: owner.html,
    });
    notified = true;

    try {
      const copy = customerEmail(q, ctx);
      await brevo(env, {
        sender: { name: "Ceylon Journey Co.", email: env.MAIL_FROM },
        to: [{ email: q.email, name: q.name }],
        replyTo: { email: env.REPLY_TO || env.MAIL_TO },
        subject: "We received your quote request - Ceylon Journey Co.",
        textContent: copy.text,
        htmlContent: copy.html,
      });
    } catch (err) {
      console.error("Customer copy failed:", err);
    }
  } catch (err) {
    console.error("Owner email failed:", err);
  }

  if (quoteId && notified) {
    try {
      await env.DB.prepare(
        "UPDATE quote_requests SET email_sent = 1 WHERE id = ?1",
      )
        .bind(quoteId)
        .run();
    } catch (err) {
      console.error("Updating email_sent failed:", err);
    }
  }

  // success if the request was saved or emailed; fail only if both failed
  if (quoteId || notified) return json({ ok: true });
  return json({ error: "Failed to send" }, 500);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/socials" && request.method === "GET") {
      const items = [
        { id: "facebook", label: "Facebook", url: env.FACEBOOK_URL },
        { id: "instagram", label: "Instagram", url: env.INSTAGRAM_URL },
      ].filter((s) => s.url);
      return new Response(JSON.stringify(items), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    if (pathname === "/api/tours" && request.method === "GET") {
      try {
        return await handleTours(env);
      } catch (err) {
        console.error("tours failed", err);
        return json({ error: "Could not load tours." }, 500);
      }
    }

    if (pathname === "/api/moments" && request.method === "GET") {
      try {
        return await handleMoments(env);
      } catch (err) {
        console.error("moments failed", err);
        return json({ error: "Could not load moments." }, 500);
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
