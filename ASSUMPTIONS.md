# Assumptions and decisions

| Gap in brief | Assumption chosen | Why |
|---|---|---|
| How to recognize a returning visitor | First visit creates a random 10-character recovery code; later visits require both the same display name and code. | Names alone are not unique. A random code avoids collecting email/phone and is explainable to visitors. |
| How to recover a lost code | There is no automated recovery; the visitor creates a new profile. | No email or phone is collected, so there is no verified recovery channel. This is preferable to guessing identity. |
| What “public display” means | Any visitor who uploads after explicit consent agrees the photo may appear on the shared venue display. | Makes the display audience and consent purpose clear. A separate consent is required on each upload. |
| Photos containing other people | Uploader confirms they have permission from people shown. | The uploader may not be the only person in a photo. Venue operators should provide a way to report/remove a photo. |
| How long photos remain | Photos remain until the visitor deletes them or an operator applies a retention policy. | The brief says returning visitors' previous photos should replay; indefinite storage is not automatically safe, so this default must be revisited before production. |
| Who can see photos | Approved photos are visible to anyone with access to the shared display URL/network. | A shared TV is inherently public to its audience. Upload storage is not exposed as a static directory. |
| Which file types are allowed | JPEG, PNG and WebP only; each file is limited to 10 MB by default; up to 5 files per request. | These formats are broadly supported and avoid active document formats. Limits protect bandwidth and memory. |
| Image dimensions | Max 12,000 px per side and 50 million pixels total; images are resized to fit within 2,400 × 2,400 and re-encoded as JPEG. | Reduces display cost and strips many source-file extras by re-encoding. |
| Simultaneous uploads | Each request is independently rate-limited; SQLite serializes writes; each upload is processed file-by-file; the queue has a hard cap of 500 approved photos. | Simple predictable behavior for a small venue. If the queue is full, new uploads are rejected with a retry-later message rather than silently dropping older photos. |
| Slideshow ordering | Oldest approved photo first, then repeat; newly added photos enter after the next queue refresh. | Fair, deterministic ordering without complex scheduling. |
| Display duration | 8 seconds per photo by default, configurable between 3 and 30 seconds. | A readable but not overly long default. |
| Display authentication | The display is intentionally read-only and has no login. | It is expected to run on a venue-controlled screen/network. Internet deployments need access controls or a private display token. |
| Hosting | Single Node process, local persistent disk, SQLite. No cloud vendor or deployment URL is assumed. | Keeps the starter inexpensive and portable. Production multi-instance hosting needs shared object storage and a database designed for concurrent service. |
| Moderation | Consent is self-attested; no moderation dashboard is included in this MVP. | The brief did not identify an operator/admin. Production use should add a moderation queue and reporting/removal workflow before enabling unrestricted public uploads. |
| User account scope | No email, phone, date of birth, face recognition or biometric matching is collected. | Minimizes personal data and avoids unreliable/sensitive identity inference. |
| Browser support | Current evergreen desktop/mobile browsers and a modern smart-TV browser. | No legacy browser requirement was supplied. |
