import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
  Star,
  RouteArrowRight,
} from "lucide-react";
import "./styles.css";

// Change this one line to replace the hero background.
// Use a remote URL, or a local file placed in /public, e.g. '/images/hero.jpg'
const HERO_SLIDES = [
  {
    desktop: "/images/image_001.jpeg",
    mobile: "/images/mobile/image_001.jpg",
  },
  {
    desktop: "/images/image_002.jpeg",
    mobile: "/images/mobile/image_002.jpg",
  },
  {
    desktop: "/images/image_003.jpeg",
    mobile: "/images/mobile/image_003.jpg",
  },
  {
    desktop: "/images/image_004.jpeg",
    mobile: "/images/mobile/image_004.jpg",
  },
];
const HERO_DELAY = 5000;
const SOCIAL_ICONS = {
  facebook: (
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  ),
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
};
const SERVICE_TILES = [
  [Plane, "Airport Transfers", "Arrive & depart with ease"],
  [CarFront, "Private Rides", "Comfortable and punctual rides"],
  [MapPin, "Tours & Day Trips", "Discover the paradise island"],
];
const tours = [
  {
    id: "001",
    name: "Colombo",
    price: 6000,
    image: "/images/tours/image_colombo.jpg",
  },
  {
    id: "002",
    name: "Sigiriya",
    price: 18000,
    image: "/images/tours/image_sigiriya.jpg",
  },
  {
    id: "003",
    name: "Ella",
    price: 45000,
    image: "/images/tours/image_ella.jpg",
  },
  {
    id: "004",
    name: "Mirissa",
    price: 22000,
    image: "/images/tours/image_mirissa.jpg",
  },
  {
    id: "005",
    name: "Galle",
    price: 17500,
    image: "/images/tours/image_galle.jpg",
  },
  {
    id: "006",
    name: "Kandy",
    price: 16000,
    image: "/images/tours/image_kandy.jpg",
  },
  {
    id: "007",
    name: "Nuwara Eliya",
    price: 20000,
    image: "/images/tours/image_nuwaraeliya.jpg",
  },
  {
    id: "008",
    name: "Negombo",
    price: 3500,
    image: "/images/tours/image_negombo.jpg",
  },
];
const moments = [
  { id: "m1", src: "/images/moments/m1.jpg", alt: "Guests at Galle Fort" },
  { id: "m2", src: "/images/moments/m2.jpg", alt: "Sigiriya sunrise tour" },
  { id: "m3", src: "/images/moments/m3.jpg", alt: "Beach stop in Mirissa" },
  { id: "m4", src: "/images/moments/m4.jpg", alt: "Tea country drive" },
  { id: "m5", src: "/images/moments/m5.jpg", alt: "Airport pickup" },
  { id: "m6", src: "/images/moments/m6.jpg", alt: "Airport pickup" },
];
const reviews = [
  {
    id: "r1",
    name: "Sarah Perera",
    rating: 5,
    text: "Excellent service! The driver was punctual and the tour was perfectly planned. Highly recommended!",
  },
  {
    id: "r2",
    name: "Henry Hudson",
    rating: 5,
    text: "A wonderful experience exploring Sri Lanka with Ceylon Journey Co. Will definitely book again!",
  },
  {
    id: "r3",
    name: "James Walker",
    rating: 5,
    text: "Smooth airport pickup after a long flight. The car was spotless and the driver knew every shortcut.",
  },
  {
    id: "r4",
    name: "Anika Rao",
    rating: 4,
    text: "Our Ella and Mirissa trip was relaxed and well organised. Great local tips along the way.",
  },
];
const socials = [
  { id: "facebook", label: "Facebook", url: "https://facebook.com/yourpage" },
  {
    id: "instagram",
    label: "Instagram",
    url: "https://instagram.com/yourpage",
  },
  // { id: 'youtube',   label: 'YouTube',   url: 'https://youtube.com/@yourchannel' }
];
const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};
const validateDate = (v) => {
  if (!v) return "Please select a travel date.";
  if (v < todayStr()) return "Date cannot be in the past.";
  return "";
};
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};
function App({ heroSlides = HERO_SLIDES }) {
  const [slide, setSlide] = useState(0);
  const [service, setService] = useState("Airport Transfer");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setSending(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, service, direction, passengers }),
      });
      if (!res.ok) throw new Error("failed");
      setQuoteOpen(false);
      alert("Thanks! Your quotation request has been received.");
    } catch {
      alert(
        "Sorry, we couldn't send your request. Please contact us on WhatsApp.",
      );
    } finally {
      setSending(false);
    }
  };
  const [date, setDate] = useState(tomorrowStr);
  const [dateError, setDateError] = useState("");
  const [direction, setDirection] = useState("arrival"); // 'arrival' = from airport, 'departure' = to airport
  const [passengers, setPassengers] = useState("1 Passengers");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const isPhone = window.matchMedia("(max-width: 560px)").matches;
    heroSlides.forEach((s) => {
      const i = new Image();
      i.src = isPhone && s.mobile ? s.mobile : s.desktop;
    });
    const id = setInterval(
      () => setSlide((s) => (s + 1) % heroSlides.length),
      HERO_DELAY,
    );
    return () => clearInterval(id);
  }, [heroSlides]);

  useEffect(() => {
    const refresh = () => {
      const today = todayStr();
      setDate((d) => (d && d < today ? today : d));
      setDateError("");
    };
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(refresh, 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, []);

  return (
    <div className="site">
      <header className="nav wrap">
        <Brand />
        <button className="menu-btn" onClick={() => setMenu(!menu)}>
          Menu
        </button>
        <nav className={menu ? "open" : ""}>
          {["Home", "Tours", "Gallery", "Contact"].map((x, i) => (
            <a
              key={x}
              className={i === 0 ? "active" : ""}
              href={"#" + x.toLowerCase()}
              onClick={() => setMenu(false)}
            >
              {x}
            </a>
          ))}
          <a className="whatsapp" href="https://wa.me/94778589711">
            <MessageCircle size={17} /> Chat with Us
          </a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-slides">
            {heroSlides.map((s, i) => (
              <div
                key={s.desktop}
                className={"hero-slide" + (i === slide ? " active" : "")}
                style={{
                  "--img": `url("${encodeURI(s.desktop)}")`,
                  ...(s.mobile && {
                    "--img-m": `url("${encodeURI(s.mobile)}")`,
                  }),
                }}
              />
            ))}
          </div>
          <div className="hero-overlay"></div>
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">PRIVATE TRAVEL · SRI LANKA</div>
              <h1>
                Explore
                <br />
                <em>Sri Lanka</em> With Us
              </h1>
              <p>
                Reliable transport, unforgettable tours, and
                <br className="desktop" /> memories for a lifetime.
              </p>
              <div className="quick-features">
                <Feature
                  icon={<Plane />}
                  text={
                    <>
                      Airport
                      <br />
                      Transfers
                    </>
                  }
                />
                <Feature
                  icon={<CarFront />}
                  text={
                    <>
                      City-to-City
                      <br />
                      Transport
                    </>
                  }
                />
                <Feature
                  icon={<span className="palm">♨</span>}
                  text={
                    <>
                      Sri Lanka
                      <br />
                      Tours
                    </>
                  }
                />
                <Feature
                  icon={<ShieldCheck />}
                  text={
                    <>
                      Safe &<br />
                      Reliable
                    </>
                  }
                />
              </div>
            </div>
          </div>
          <div className="quote-bar wrap">
            <div className="quote-intro">
              <div className="gold-line"></div>
              <div>
                <h3>Request a Quote</h3>
                <p>
                  Tell us what you need, and we’ll get back to you
                  <br /> with the best option.
                </p>
              </div>
            </div>
            <div className="quote-fields">
              <Select
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option>Airport Transfer</option>
                <option>Private Ride</option>
                <option>Tours & Day Trips</option>
              </Select>
              <div className="date-field">
                <label className={dateError ? "invalid" : ""}>
                  <CalendarDays />
                  <input
                    type="date"
                    value={date}
                    min={todayStr()}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setDateError(validateDate(e.target.value));
                    }}
                  />
                </label>
              </div>
              <Select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
              >
                <option>1 Passengers</option>
                <option>2 Passengers</option>
                <option>3 Passengers</option>
                <option>4 Passengers</option>
                <option>5+ Passengers</option>
              </Select>
              <button
                onClick={() => {
                  const err = validateDate(date);
                  setDateError(err);
                  if (!err) setQuoteOpen(true);
                }}
              >
                Request Quote <ArrowRight />
              </button>
            </div>
          </div>
        </section>

        <ServiceTiles items={SERVICE_TILES} />

        <section className="wrap section" id="tours">
          <SectionHeading
            kicker="POPULAR TOURS"
            title="Discover Sri Lanka’s Beauty"
          />
          <TourCarousel tours={tours} />
        </section>

        <section className="wrap section moments" id="gallery">
          <SectionHeading
            kicker="OUR JOURNEYS"
            title="Special Moments"
            subtitle="A glimpse of the beautiful journeys we’ve shared together."
          />
          <MomentsMarquee photos={moments} />
        </section>

        <section className="wrap testimonials">
          <ReviewCarousel reviews={reviews} />
        </section>
      </main>

      <footer id="contact">
        <div className="wrap footer-top">
          <Brand className="footer-brand" />
          <div className="contact-items">
            <span>
              <MapPin /> Katunayake, Sri Lanka
            </span>
            <a href="tel:+94778605390">
              <Phone /> +94 77 860 5390
            </a>
            <a href="tel:+94778589711">
              <Phone /> +94 77 858 9711
            </a>
            <a href="https://wa.me/94778589711">
              <MessageCircle /> Chat on WhatsApp
            </a>
          </div>
          <SocialLinks items={socials} />
        </div>
        <div className="wrap footer-bottom">
          © 2026 Ceylon Journey Co. <span>|</span> Explore. Travel. Experience.
        </div>
      </footer>

      {quoteOpen && (
        <div className="modal-backdrop" onClick={() => setQuoteOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setQuoteOpen(false)}>
              ×
            </button>
            <div className="eyebrow">CEYLON JOURNEY CO.</div>
            <h2>Request a Quote</h2>
            <p>
              Tell us about your journey and we’ll prepare the best option for
              you.
            </p>
            <form onSubmit={submit}>
              <div className="two">
                <input name="name" required placeholder="Your name" />
                <input
                  name="whatsapp"
                  required
                  placeholder="WhatsApp number (with country code)"
                />
              </div>
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
              />
              <TripFields
                service={service}
                direction={direction}
                setDirection={setDirection}
              />
              <div className="two">
                <input
                  name="date"
                  type="date"
                  required
                  value={date}
                  min={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                />
                <select
                  name="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option>Airport Transfer</option>
                  <option>Private Ride</option>
                  <option>Tours & Day Trips</option>
                </select>
              </div>
              <textarea
                name="message"
                rows="4"
                placeholder={
                  service === "Tours & Day Trips"
                    ? "Places you want to visit, or your route and plans"
                    : "Anything else we should know?"
                }
              ></textarea>

              {/* honeypot: hidden from real users, bots fill it */}
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px" }}
              />

              <button className="submit" disabled={sending}>
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    Send Request <ArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function Feature({ icon, text }) {
  return (
    <div className="feature">
      <span>{icon}</span>
      <b>{text}</b>
    </div>
  );
}
function Brand({ className = "" }) {
  return (
    <a className={"brand " + className} href="#home">
      <img
        className="brand-logo"
        src="/images/logo.png"
        alt="Ceylon Journey Co. logo"
      />
      <strong>Ceylon Journey Co.</strong>
      <small>Explore · Travel · Experience</small>
    </a>
  );
}
function SectionHeading({ kicker, title, subtitle }) {
  return (
    <div className="heading">
      <div>
        <div className="kicker">
          <i></i>
          {kicker}
          <i></i>
        </div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
function Review({ text, name }) {
  return (
    <div className="review">
      <button className="circle">←</button>
      <div>
        <p>“{text}”</p>
        <div className="person">
          <div className="avatar">{name[0]}</div>
          <b>— {name}</b>
          <span className="stars">★★★★★</span>
        </div>
      </div>
      <button className="circle">→</button>
    </div>
  );
}
function Select({ value, onChange, children }) {
  return (
    <div className="select-wrap">
      <select value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown />
    </div>
  );
}
function TourCard({ tour }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="tour-card">
      {!failed && (
        <img
          className="tour-img"
          src={tour.image}
          alt={tour.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <div className="tour-shade"></div>
      <div className="tour-bottom">
        <h3>
          <MapPin /> {tour.name}
        </h3>
        <div>
          <span>
            <Star /> From LKR {tour.price}
          </span>
        </div>
      </div>
    </article>
  );
}
function TourCarousel({ tours }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [tours]);

  const move = (dir) => {
    const el = ref.current;
    if (el)
      el.scrollBy({ left: dir * (el.clientWidth + 14), behavior: "smooth" });
  };

  return (
    <div className="carousel">
      <button
        className="car-btn prev"
        disabled={edge.start}
        onClick={() => move(-1)}
        aria-label="Previous tours"
      >
        <ChevronLeft />
      </button>
      <div className="tour-track" ref={ref} onScroll={update}>
        {tours.map((t) => (
          <TourCard key={t.id} tour={t} />
        ))}
      </div>
      <button
        className="car-btn next"
        disabled={edge.end}
        onClick={() => move(1)}
        aria-label="Next tours"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
function MomentsMarquee({ photos, secondsPerPhoto = 5 }) {
  let base = photos;
  while (base.length < 6) base = [...base, ...photos];
  const loop = [...base, ...base];

  return (
    <div className="marquee">
      <div
        className="marquee-track"
        style={{ "--dur": `${base.length * secondsPerPhoto}s` }}
      >
        {loop.map((p, i) => (
          <img
            key={i}
            className={"photo p" + ((i % base.length) % 5)}
            src={p.src}
            alt={i < base.length ? p.alt : ""}
            aria-hidden={i >= base.length}
            loading="lazy"
            draggable="false"
          />
        ))}
      </div>
    </div>
  );
}
function Stars({ n = 5 }) {
  return (
    <span className="stars" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}
function ReviewCard({ review }) {
  return (
    <figure className="review">
      <p>“{review.text}”</p>
      <figcaption className="person">
        <div className="avatar">{review.name[0]}</div>
        <b>— {review.name}</b>
        <Stars n={review.rating} />
      </figcaption>
    </figure>
  );
}
function ReviewCarousel({ reviews }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + el.clientWidth,
        behavior: "smooth",
      });
    }, 6000);
    return () => clearInterval(id);
  }, [reviews]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [reviews]);

  const move = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <div className="reviews-head">
        <h2>What Our Customers Say</h2>
        <div className="rev-nav">
          <button
            className="circle"
            disabled={edge.start}
            onClick={() => move(-1)}
            aria-label="Previous reviews"
          >
            <ChevronLeft />
          </button>
          <button
            className="circle"
            disabled={edge.end}
            onClick={() => move(1)}
            aria-label="Next reviews"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="review-track" ref={ref} onScroll={update}>
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </>
  );
}
function SocialLinks({ items }) {
  return (
    <div className="social">
      {items.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {SOCIAL_ICONS[s.id]}
          </svg>
        </a>
      ))}
    </div>
  );
}
function TripFields({ service, direction, setDirection }) {
  if (service === "Airport Transfer")
    return (
      <div className="trip-fields">
        <div className="seg">
          <button
            type="button"
            className={direction === "arrival" ? "on" : ""}
            onClick={() => setDirection("arrival")}
          >
            Airport → My hotel
          </button>
          <button
            type="button"
            className={direction === "departure" ? "on" : ""}
            onClick={() => setDirection("departure")}
          >
            My hotel → Airport
          </button>
        </div>
        <p className="fixed-note">
          <Plane /> Bandaranaike International Airport (CMB)
        </p>
        <div className="two">
          <input
            name="hotel"
            required
            placeholder={
              direction === "arrival"
                ? "Drop-off hotel / address"
                : "Pickup hotel / address"
            }
          />
          <input
            name="flight"
            placeholder={
              direction === "arrival"
                ? "Flight number (optional)"
                : "Flight time (optional)"
            }
          />
        </div>
      </div>
    );

  if (service === "Tours & Day Trips")
    return (
      <div className="trip-fields">
        <div className="two">
          <input name="pickup" required placeholder="Pickup location" />
          <input name="days" placeholder="Number of days" />
        </div>
      </div>
    );

  return (
    <div className="trip-fields">
      <div className="two">
        <input name="from" required placeholder="From" />
        <input name="to" required placeholder="To" />
      </div>
    </div>
  );
}
function ServiceTiles({ items }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  // tapping anywhere outside the tiles puts everything back to normal
  useEffect(() => {
    const away = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  return (
    <section
      className={"wrap services" + (open !== null ? " has-open" : "")}
      id="transport"
      ref={ref}
    >
      {items.map(([I, t, s], i) => (
        <div
          key={t}
          role="button"
          tabIndex={0}
          aria-expanded={open === i}
          className={"service-card" + (open === i ? " open" : "")}
          onClick={() => setOpen(open === i ? null : i)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(open === i ? null : i);
            }
          }}
        >
          <I />
          <h3>{t}</h3>
          <p>{s}</p>
        </div>
      ))}
    </section>
  );
}
createRoot(document.getElementById("root")).render(<App />);
