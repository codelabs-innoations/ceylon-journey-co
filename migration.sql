CREATE TABLE IF NOT EXISTS tours (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL,
  image      TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1
);

DELETE FROM tours;

INSERT OR IGNORE INTO tours (id, name, price, image, sort_order) VALUES
  ('001', 'Colombo',      6000,  '/images/tours/image_colombo.jpg',      1),
  ('002', 'Kandy',        16000, '/images/tours/image_kandy.jpg',        2),
  ('003', 'Sigiriya',     18000, '/images/tours/image_sigiriya.jpg',     3),
  ('004', 'Ella',         45000, '/images/tours/image_ella.jpg',         4),
  ('005', 'Galle',        17500, '/images/tours/image_galle.jpg',        5),
  ('006', 'Mirissa',      22000, '/images/tours/image_mirissa.jpg',      6),
  ('007', 'Weligama',     21000, '/images/tours/image_weligama.jpg',     7),
  ('008', 'Trincomalee',  37000, '/images/tours/image_trincomalee.jpg',  8),
  ('009', 'Nuwara Eliya', 20000, '/images/tours/image_nuwaraeliya.jpg',  9),
  ('010', 'Mathara',      24000, '/images/tours/image_mathara.jpg',      10),
  ('011', 'Negombo',      3000,  '/images/tours/image_negombo.jpg',      11),
  ('012', 'Arugambay',    55000, '/images/tours/image_arugambay.jpg',    12),
  ('013', 'Batticaloa',   36000, '/images/tours/image_batticaloa.jpg',   13),
  ('014', 'Jaffna',       46500, '/images/tours/image_jaffna.jpg',       14);

CREATE TABLE IF NOT EXISTS quote_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  name        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  email       TEXT NOT NULL,
  service     TEXT NOT NULL,
  direction   TEXT,
  travel_date TEXT NOT NULL,
  passengers  TEXT,
  hotel       TEXT,
  flight      TEXT,
  pickup      TEXT,
  days        TEXT,
  from_place  TEXT,
  to_place    TEXT,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  email_sent  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS moments (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO moments (id, src, alt, sort_order) VALUES
  ('m1', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m1', 'Guests at Matara Coconut Tree Hills', 1),
  ('m2', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m2', 'Sigiriya sunrise tour', 2),
  ('m3', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m3', 'Yala elephants safari', 3),
  ('m4', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m4', 'Jaffna Nallur Kovil', 4),
  ('m5', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m5', 'Flying Ravana at Ella', 5),
  ('m6', 'https://res.cloudinary.com/qsv4fivq/image/upload/f_auto,q_auto,w_900/m6', 'Adisham Bungalow at Haputale', 6);