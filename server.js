const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Configure a PostgreSQL database connection string.");
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    device VARCHAR(80) NOT NULL,
    support_type VARCHAR(80) NOT NULL,
    service VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'New Request',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS tickets_lookup_idx ON tickets(ticket_id, phone)');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const clean = (value, max = 2000) => String(value ?? "").trim().slice(0, max);
const phoneDigits = value => clean(value, 30).replace(/[^\d+]/g, "");
const newTicketId = () => "NSIT-" + crypto.randomBytes(3).toString("hex").toUpperCase();
const adminAuth = (req, res, next) => {
  if (!ADMIN_TOKEN || req.get("authorization") !== `Bearer ${ADMIN_TOKEN}`) return res.status(401).json({ error: "Unauthorized. Enter the administrator token." });
  next();
};

app.post("/api/tickets", async (req, res, next) => {
  try {
    const name = clean(req.body.name, 100), phone = phoneDigits(req.body.phone);
    const email = clean(req.body.email, 150), device = clean(req.body.device, 80);
    const supportType = clean(req.body.supportType, 80), service = clean(req.body.service, 100);
    const description = clean(req.body.description, 2000);
    if (!name || phone.replace(/\D/g, "").length < 7 || !device || !supportType || !service || description.length < 3) {
      return res.status(400).json({ error: "Please provide valid contact details and complete all required fields." });
    }
    let ticketId;
    for (let i = 0; i < 5; i++) {
      ticketId = newTicketId();
      try {
        await pool.query(`INSERT INTO tickets (ticket_id,name,phone,email,device,support_type,service,description)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [ticketId,name,phone,email,device,supportType,service,description]);
        return res.status(201).json({ ticketId, status: "New Request" });
      } catch (e) { if (e.code !== "23505") throw e; }
    }
    return res.status(500).json({ error: "Could not create a ticket. Please try again." });
  } catch (e) { next(e); }
});

app.get("/api/tickets/:ticketId", async (req, res, next) => {
  try {
    const phone = phoneDigits(req.query.phone);
    const result = await pool.query(`SELECT ticket_id AS "ticketId", device, service, status, updated_at AS "updatedAt"
      FROM tickets WHERE ticket_id = $1 AND phone = $2`, [clean(req.params.ticketId, 30).toUpperCase(), phone]);
    if (!result.rows.length) return res.status(404).json({ error: "Ticket not found. Check the ticket number and booking phone number." });
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

app.get("/api/admin/tickets", adminAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(`SELECT ticket_id AS "ticketId", name, phone, email, device, support_type AS "supportType",
      service, description, status, created_at AS "createdAt", updated_at AS "updatedAt" FROM tickets ORDER BY id DESC LIMIT 500`);
    res.json(result.rows);
  } catch (e) { next(e); }
});

app.patch("/api/admin/tickets/:ticketId", adminAuth, async (req, res, next) => {
  try {
    const allowed = ["New Request", "Accepted", "In Progress", "Waiting for Parts", "Completed", "Cancelled"];
    const status = clean(req.body.status, 40);
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid ticket status." });
    const result = await pool.query("UPDATE tickets SET status = $1, updated_at = NOW() WHERE ticket_id = $2 RETURNING ticket_id AS \"ticketId\", status", [status, clean(req.params.ticketId, 30).toUpperCase()]);
    if (!result.rowCount) return res.status(404).json({ error: "Ticket not found." });
    res.json({ ok: true, ...result.rows[0] });
  } catch (e) { next(e); }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", req.path === "/admin" || req.path === "/admin/" ? "admin.html" : "index.html"));
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error. Please try again later." });
});

initDb().then(() => app.listen(PORT, "0.0.0.0", () => console.log(`N's IT Tech Solution website listening on ${PORT}`)))
  .catch(err => { console.error("Database initialization failed:", err); process.exit(1); });
