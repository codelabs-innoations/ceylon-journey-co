// Email templates. Inline styles and tables only, because email apps ignore most CSS.
const GOLD = "#e8b94f";
const DARK = "#0b0b0b";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const multiline = (s) => esc(s).replace(/\r?\n/g, "<br/>");

// "077 123 4567" -> "94771234567" (digits for wa.me and tel: links)
export const toIntlDigits = (raw) => {
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, "");
  if (s.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "94" + digits.slice(1); // local Sri Lankan format
  return digits;
};

const button = (href, label, bg, color) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 20px;` +
  `background:${bg};color:${color};font-family:${SANS};font-size:14px;font-weight:700;` +
  `text-decoration:none;border-radius:999px">${label}</a>`;

const detailRows = (q) =>
  [
    ["🚗", "Service", q.service],
    ["📅", "Date", q.date],
    [
      "↔️",
      "Direction",
      q.direction === "arrival"
        ? "Airport → hotel"
        : q.direction === "departure"
          ? "Hotel → airport"
          : q.direction,
    ],
    ["👥", "Passengers", q.passengers],
    ["🏨", "Hotel / address", q.hotel],
    ["✈️", "Flight", q.flight],
    ["📍", "Pickup", q.pickup],
    ["🗓️", "Days", q.days],
    ["🛫", "From", q.from],
    ["🏁", "To", q.to],
    ["📝", "Notes", q.message],
  ].filter(([, , v]) => v);

const detailsTable = (q) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:12px;border-collapse:separate;overflow:hidden">` +
  detailRows(q)
    .map(
      ([icon, label, value], i, a) =>
        `<tr>` +
        `<td valign="top" style="padding:12px 14px;${i < a.length - 1 ? "border-bottom:1px solid #f0ece3;" : ""}width:38%;font-family:${SANS};font-size:13px;color:#6b6b6b">${icon}&nbsp; ${esc(label)}</td>` +
        `<td valign="top" style="padding:12px 14px;${i < a.length - 1 ? "border-bottom:1px solid #f0ece3;" : ""}font-family:${SANS};font-size:14px;font-weight:600;color:#1a1a1a">${multiline(value)}</td>` +
        `</tr>`,
    )
    .join("") +
  `</table>`;

const shell = ({ preheader, body, siteUrl }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f1ea">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td align="center" style="background:${DARK};padding:26px 20px 22px">
    <img src="${esc(siteUrl)}/car-mark.png" width="150" alt="" style="display:block;margin:0 auto 6px;border:0;max-width:150px;height:auto"/>
    <div style="font-family:${SERIF};font-size:27px;font-weight:bold;color:${GOLD};line-height:1.1">Ceylon Journey Co.</div>
    <div style="font-family:${SANS};font-size:11px;letter-spacing:2px;color:#ffffff;margin-top:6px">Explore &middot; Travel &middot; Experience</div>
  </td></tr>
  <tr><td style="height:4px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:28px 26px 8px">${body}</td></tr>
  <tr><td align="center" style="padding:18px 20px 26px;border-top:1px solid #f0ece3">
    <div style="font-family:${SANS};font-size:12px;color:#8a8a8a;line-height:1.6">
      Ceylon Journey Co. &middot; Explore. Travel. Experience.<br/>
      <a href="${esc(siteUrl)}" style="color:#b08a2e;text-decoration:none">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

const socialLinks = (socials = []) =>
  socials.length
    ? `<p style="margin:24px 0 0;font-family:${SANS};font-size:14px;color:#555">Follow our journeys: ` +
      socials
        .map(
          (s) =>
            `<a href="${esc(s.url)}" style="color:#b08a2e;font-weight:700;text-decoration:none">${esc(s.label)}</a>`,
        )
        .join(" &nbsp;&middot;&nbsp; ") +
      `</p>`
    : "";

// ---------- email to you ----------
export function ownerEmail(q, ctx) {
  const num = toIntlDigits(q.whatsapp);
  const hello = `Hi ${q.name}, this is Ceylon Journey Co. about your ${q.service} request for ${q.date}.`;
  const received = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const body =
    `<div style="display:inline-block;background:${GOLD};color:#111;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1px;padding:6px 12px;border-radius:999px">${esc(q.service.toUpperCase())}</div>` +
    `<h1 style="margin:14px 0 4px;font-family:${SERIF};font-size:28px;color:#111">New quote request</h1>` +
    `<div style="font-family:${SANS};font-size:13px;color:#8a8a8a;margin-bottom:20px">Received ${esc(received)} (Sri Lanka time)</div>` +
    // customer card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f0;border:1px solid #efe7d2;border-radius:12px;margin-bottom:18px"><tr><td style="padding:16px 18px">` +
    `<div style="font-family:${SERIF};font-size:22px;font-weight:bold;color:#111;margin-bottom:8px">${esc(q.name)}</div>` +
    `<div style="font-family:${SANS};font-size:14px;line-height:2">` +
    `📞&nbsp; <a href="tel:+${num}" style="color:#1a1a1a;font-weight:600;text-decoration:none">${esc(q.whatsapp)}</a><br/>` +
    `✉️&nbsp; <a href="mailto:${esc(q.email)}" style="color:#1a1a1a;font-weight:600;text-decoration:none">${esc(q.email)}</a>` +
    `</div></td></tr></table>` +
    // action buttons
    `<div style="margin-bottom:12px">` +
    button(
      `https://wa.me/${num}?text=${encodeURIComponent(hello)}`,
      "💬&nbsp; WhatsApp",
      "#128C7E",
      "#ffffff",
    ) +
    button(`tel:+${num}`, "📞&nbsp; Call", GOLD, "#111111") +
    button(
      `mailto:${q.email}?subject=${encodeURIComponent("Your quote request - Ceylon Journey Co.")}`,
      "✉️&nbsp; Email",
      DARK,
      "#ffffff",
    ) +
    `</div>` +
    `<h2 style="margin:18px 0 10px;font-family:${SERIF};font-size:20px;color:#111">Trip details</h2>` +
    detailsTable(q) +
    `<p style="font-family:${SANS};font-size:12px;color:#8a8a8a;margin:16px 0 18px">Tip: pressing Reply on this email answers the customer directly.</p>`;

  return {
    html: shell({
      preheader: `${q.name} · ${q.service} · ${q.date}`,
      body,
      siteUrl: ctx.siteUrl,
    }),
    text: textSummary(q, true),
  };
}

// ---------- copy to the customer ----------
export function customerEmail(q, ctx) {
  const first = q.name.split(/\s+/)[0];
  const body =
    `<h1 style="margin:0 0 10px;font-family:${SERIF};font-size:28px;color:#111">Thank you, ${esc(first)}!</h1>` +
    `<p style="margin:0 0 20px;font-family:${SANS};font-size:15px;line-height:1.6;color:#333">We have received your request and will get back to you shortly with the best option.</p>` +
    `<h2 style="margin:0 0 10px;font-family:${SERIF};font-size:20px;color:#111">Your request</h2>` +
    detailsTable(q) +
    `<h2 style="margin:24px 0 6px;font-family:${SERIF};font-size:20px;color:#111">Need us sooner?</h2>` +
    `<p style="margin:0 0 12px;font-family:${SANS};font-size:14px;color:#555">Message or call us any time:</p>` +
    `<div style="margin-bottom:14px">` +
    button(
      `https://wa.me/${ctx.wa}`,
      "💬&nbsp; WhatsApp us",
      "#128C7E",
      "#ffffff",
    ) +
    button(`tel:+${ctx.wa}`, `📞&nbsp; ${esc(ctx.waShown)}`, GOLD, "#111111") +
    `</div>` +
    socialLinks(ctx.socials);

  return {
    html: shell({
      preheader: "We received your quote request",
      body,
      siteUrl: ctx.siteUrl,
    }),
    text:
      `Hi ${first},\n\nThank you for your request. We'll get back to you shortly with the best option.\n\n` +
      `Your request:\n${textSummary(q, false)}\n\n` +
      `Need us sooner? WhatsApp ${ctx.waShown}: https://wa.me/${ctx.wa}\n` +
      (ctx.socials?.length
        ? `\nFollow us:\n${ctx.socials.map((s) => `${s.label}: ${s.url}`).join("\n")}\n`
        : "") +
      `\nCeylon Journey Co.`,
  };
}

function textSummary(q, withContact) {
  const lines = [];
  if (withContact) {
    lines.push(
      `Name: ${q.name}`,
      `WhatsApp: ${q.whatsapp}`,
      `Email: ${q.email}`,
    );
  }
  for (const [, label, value] of detailRows(q))
    lines.push(`${label}: ${value}`);
  return lines.join("\n");
}
