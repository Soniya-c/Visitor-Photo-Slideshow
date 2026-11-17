# Test plan

## Automated tests

Run:

```bash
npm install
npm test
npm run check
```

The automated suite covers name normalization, visitor-code shape/normalization, SHA-256 token comparison and explicit consent parsing. These tests are included; actual execution results should be recorded below after running them in the target environment.

**Automated execution results (Node.js v22.16.0, 2026-11-16):** `npm test` — PASS (4 tests); `npm run check` — PASS. Runtime dependencies were not installed, so the full HTTP/upload integration and manual acceptance cases remain unverified.

## Manual acceptance tests

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| 1 | First-time visitor | Enter a name; leave visitor code blank; continue. | New visitor profile is created; a 10-character code is shown once. |
| 2 | Returning visitor | Reload; enter the same name and saved code. | Existing profile is restored; no duplicate profile is created. |
| 3 | Wrong code | Enter a valid name with a different code. | HTTP 401 / clear mismatch message; no profile access. |
| 4 | Required consent | Select photos but leave consent unchecked; submit. | Browser blocks submission; API independently rejects missing consent. |
| 5 | Valid upload | Upload JPEG, PNG and WebP under size limit with consent. | Images decode, normalize and appear in `/display.html`. |
| 6 | Invalid file | Rename a non-image to `.jpg` and upload it. | Image decoding rejects it; no photo appears in queue. |
| 7 | Oversized file | Upload a file larger than configured limit. | Request rejected with size-limit message. |
| 8 | Too many files | Select more than five photos in one request. | Request rejected by multipart file-count limit. |
| 9 | Returning photos | Upload on first visit, then sign in with visitor code and upload again. | Both old and new photos remain in the slideshow queue. |
| 10 | Display timing | Set `PHOTO_SECONDS=3`; open display. | Each image remains visible for about 3 seconds before advancing. |
| 11 | Concurrent uploads | Submit uploads from two devices at nearly the same time. | Both valid requests complete or receive a clear capacity/rate-limit error; database remains consistent. |
| 12 | Queue full | Set a low `MAX_QUEUE_PHOTOS`, fill it, then upload. | New batch rejected; existing photos remain unchanged. |
| 13 | Delete one photo | Call authenticated `DELETE /api/photos/:id` for an owned photo. | Photo is removed from database and display queue; other visitor photos remain. |
| 14 | Delete visitor | Use the UI delete-profile action. | Visitor and all their photo metadata/files are removed. |
| 15 | Private storage | Inspect `public/` and request a random/non-approved media ID. | Uploaded files are not in static web root; unknown IDs return 404. |

## Results template

Record environment, date, command, pass/fail, and notes after each actual run. Do not mark a case passed based only on code inspection.
