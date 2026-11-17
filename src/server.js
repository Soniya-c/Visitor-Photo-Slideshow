import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./db.js";
import { normalizeName, normalizeCode, newVisitorCode, tokenHash, safeEqualHex, validConsent } from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const db = openDatabase(process.env.DATABASE_PATH || "./data/slideshow.db");
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
const maxMb = Math.max(1, Math.min(20, Number(process.env.MAX_UPLOAD_MB || 10)));
const photoSeconds = Math.max(3, Math.min(30, Number(process.env.PHOTO_SECONDS || 8)));
const maxQueue = Math.max(1, Number(process.env.MAX_QUEUE_PHOTOS || 500));
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.join(uploadDir, ".tmp"), { recursive: true });

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "../public"), { extensions: ["html"] }));

const visitorLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const upload = multer({
  dest: path.join(uploadDir, ".tmp"),
  limits: { fileSize: maxMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    cb(allowed.has(file.mimetype) ? null : new Error("Only JPEG, PNG, and WebP images are accepted."), allowed.has(file.mimetype));
  }
});

function visitorFromRequest(req) {
  const id = String(req.body?.visitorId || req.query?.visitorId || "");
  const code = normalizeCode(req.body?.visitorCode || req.query?.visitorCode || "");
  if (!id || code.length !== 10) return null;
  const visitor = db.prepare("SELECT id, name, code_hash FROM visitors WHERE id = ?").get(id);
  if (!visitor || !safeEqualHex(visitor.code_hash, tokenHash(code))) return null;
  return visitor;
}

function removeTemp(file) {
  if (file?.path) fs.promises.unlink(file.path).catch(() => {});
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/visitors", visitorLimiter, (req, res) => {
  const name = normalizeName(req.body?.name);
  const suppliedCode = normalizeCode(req.body?.visitorCode);
  if (name.length < 2) return res.status(400).json({ error: "Please enter a name with at least 2 characters." });

  if (suppliedCode) {
    if (suppliedCode.length !== 10) return res.status(400).json({ error: "That visitor code is not valid." });
    const row = db.prepare("SELECT id, name, code_hash FROM visitors WHERE code_hash = ?").get(tokenHash(suppliedCode));
    if (!row || row.name.toLocaleLowerCase() !== name.toLocaleLowerCase()) {
      return res.status(401).json({ error: "We couldn't match that name and code. Check them and try again." });
    }
    return res.json({ visitorId: row.id, name: row.name, returning: true });
  }

  const code = newVisitorCode();
  const id = randomUUID();
  db.prepare("INSERT INTO visitors (id, name, code_hash) VALUES (?, ?, ?)").run(id, name, tokenHash(code));
  res.status(201).json({ visitorId: id, name, visitorCode: code, returning: false });
});

app.post("/api/photos", uploadLimiter, upload.array("photos", 5), async (req, res) => {
  const visitor = visitorFromRequest(req);
  if (!visitor) {
    for (const f of req.files || []) removeTemp(f);
    return res.status(401).json({ error: "Your visitor session could not be verified. Re-enter your name and visitor code." });
  }
  if (!validConsent(req.body?.consent)) {
    for (const f of req.files || []) removeTemp(f);
    return res.status(400).json({ error: "Public-display consent is required before uploading." });
  }
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "Choose at least one photo." });
  const current = db.prepare("SELECT COUNT(*) AS n FROM photos WHERE approved = 1").get().n;
  if (current + files.length > maxQueue) {
    for (const f of files) removeTemp(f);
    return res.status(429).json({ error: "The slideshow is full right now. Please try again later." });
  }

  const saved = [];
  const pending = [];
  try {
    for (const file of files) {
      const meta = await sharp(file.path, { failOn: "error" }).metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format) || !meta.width || !meta.height ||
          meta.width > 12000 || meta.height > 12000 || meta.width * meta.height > 50_000_000) {
        throw new Error("One of those files is not a supported, valid image or exceeds the image dimensions limit.");
      }
      const id = randomUUID();
      const filename = `${id}.jpg`;
      const finalPath = path.join(uploadDir, filename);
      await sharp(file.path).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true }).toFile(finalPath);
      const outMeta = await sharp(finalPath).metadata();
      pending.push({ id, filename, originalName: path.basename(file.originalname).slice(0, 160), width: outMeta.width, height: outMeta.height, finalPath });
      await removeTemp(file);
    }

    // Check capacity and insert as one synchronous transaction so concurrent requests
    // cannot both pass a stale queue-count check.
    const insertBatch = db.transaction((items) => {
      const count = db.prepare("SELECT COUNT(*) AS n FROM photos WHERE approved = 1").get().n;
      if (count + items.length > maxQueue) throw new Error("The slideshow is full right now. Please try again later.");
      const insert = db.prepare(`INSERT INTO photos (id, visitor_id, filename, original_name, mime_type, width, height)
        VALUES (?, ?, ?, ?, 'image/jpeg', ?, ?)`);
      for (const item of items) {
        insert.run(item.id, visitor.id, item.filename, item.originalName, item.width, item.height);
      }
    });
    insertBatch(pending);
    for (const item of pending) saved.push({ id: item.id, url: `/media/${item.id}` });
    res.status(201).json({ uploaded: saved.length, photos: saved });
  } catch (error) {
    for (const file of files) removeTemp(file);
    for (const item of pending) fs.promises.unlink(item.finalPath).catch(() => {});
    res.status(error.message?.includes("slideshow is full") ? 429 : 400).json({ error: error.message || "Photo processing failed." });
  }
});

app.get("/api/slideshow", (_req, res) => {
  const photos = db.prepare(`
    SELECT p.id, v.name AS visitorName, p.created_at AS createdAt
    FROM photos p JOIN visitors v ON v.id = p.visitor_id
    WHERE p.approved = 1 ORDER BY p.created_at ASC, p.id ASC LIMIT ?
  `).all(maxQueue);
  res.set("Cache-Control", "no-store");
  res.json({ photos: photos.map(p => ({ ...p, url: `/media/${p.id}` })), durationSeconds: photoSeconds });
});

app.get("/media/:id", (req, res) => {
  const photo = db.prepare("SELECT filename FROM photos WHERE id = ? AND approved = 1").get(req.params.id);
  if (!photo) return res.sendStatus(404);
  res.set({ "Cache-Control": "private, no-store", "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff" });
  res.sendFile(path.join(uploadDir, photo.filename));
});

app.delete("/api/photos/:id", (req, res) => {
  const visitor = visitorFromRequest(req);
  if (!visitor) return res.status(401).json({ error: "Visitor code could not be verified." });
  const photo = db.prepare("SELECT id, filename FROM photos WHERE id = ? AND visitor_id = ?").get(req.params.id, visitor.id);
  if (!photo) return res.sendStatus(404);
  db.prepare("DELETE FROM photos WHERE id = ?").run(photo.id);
  fs.promises.unlink(path.join(uploadDir, photo.filename)).catch(() => {});
  res.json({ deleted: true });
});

app.delete("/api/visitors/me", (req, res) => {
  const visitor = visitorFromRequest(req);
  if (!visitor) return res.status(401).json({ error: "Visitor code could not be verified." });
  const photos = db.prepare("SELECT filename FROM photos WHERE visitor_id = ?").all(visitor.id);
  db.prepare("DELETE FROM visitors WHERE id = ?").run(visitor.id);
  for (const p of photos) fs.promises.unlink(path.join(uploadDir, p.filename)).catch(() => {});
  res.json({ deleted: true });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? `Each photo must be ${maxMb} MB or smaller.` :
      err.code === "LIMIT_FILE_COUNT" ? "Upload no more than 5 photos at once." : "Upload could not be accepted.";
    return res.status(400).json({ error: message });
  }
  res.status(400).json({ error: err.message || "Request could not be processed." });
});

app.listen(port, host, () => {
  console.log(`Visitor Photo Slideshow running at http://${host}:${port}`);
});
