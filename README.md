# Frame·Friends — Visitor Photo Slideshow

## 1. Project Overview

Frame·Friends is a web-based visitor photo slideshow application. Visitors can enter their name and upload photos, which are automatically displayed on a shared TV or computer screen.

Returning visitors can use their unique visitor code to access their existing profile. Their previously uploaded photos remain part of the slideshow.

## 2. Features

- Visitor registration using name.
- Unique visitor code for returning visitors.
- Upload multiple photos.
- Automatic slideshow on a smart TV or computer.
- Previously uploaded photos are retained for returning visitors.
- Consent required before public photo display.
- Image validation and upload size restrictions.
- Support for JPEG, PNG and WebP.
- Individual photo and visitor profile deletion.
- Handles simultaneous uploads with database transactions.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | SQLite |
| Image Processing | Sharp |
| File Uploads | Multer |
| Security | Helmet, express-rate-limit |

## 4. Installation and Setup

### Prerequisites

- Node.js 20 or newer
- npm
- A modern web browser

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure environment

Copy `.env.example` to `.env`.

Default configuration:

```env
PORT=3000
HOST=127.0.0.1
DATABASE_PATH=./data/slideshow.db
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_MB=10
PHOTO_SECONDS=8
MAX_QUEUE_PHOTOS=500
```

### Step 3: Start the application

```bash
npm start
```

### Step 4: Open the application

Visitor upload page:

http://localhost:3000

Slideshow display page:

http://localhost:3000/display.html

Open the display page on a smart TV or computer and enable full-screen mode.

## 5. How It Works

1. A visitor enters their name.
2. A new visitor receives a unique recovery code.
3. The visitor selects and uploads photos.
4. The visitor provides consent for public display.
5. The server validates and processes the images.
6. Approved photos are added to the slideshow.
7. The TV automatically displays the uploaded photos.
8. Returning visitors enter their previous name and recovery code to reconnect with their existing profile.

## 6. Privacy and Security

- Public-display consent is mandatory.
- Visitor codes are stored as SHA-256 hashes.
- Uploaded photos are stored outside the public static directory.
- Only approved photos can be displayed.
- Upload file size and image dimensions are restricted.
- Rate limiting helps prevent upload abuse.
- Visitors can delete their profiles and photos.

Visitors should only upload photos they have permission to share.

## 7. Testing

Run automated tests:

```bash
npm test
```

Run syntax checks:

```bash
npm run check
```

Automated test results:

- 4 unit tests passed.
- JavaScript syntax checks passed.

See `TEST_PLAN.md` for manual testing scenarios.

## 8. Project Documentation

The repository includes:

- `README.md` — Project overview and setup.
- `AI_LOG.md` — AI prompts, mistakes and corrections.
- `ASSUMPTIONS.md` — Design assumptions and decisions.
- `ARCHITECTURE.md` — System architecture and database design.
- `TEST_PLAN.md` — Automated and manual testing.
- `.env.example` — Environment configuration.

## 9. Deployment

The application has not yet been deployed.

**Live Application URL:** To be added after deployment.

For production deployment, configure HTTPS, persistent storage, database backups, moderation and an appropriate photo-retention policy.

## 10. Git History

The project uses multiple meaningful commits to document development progress.

Run:

```bash
git log --oneline
```

This displays the project development history.
