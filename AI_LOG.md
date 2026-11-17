# AI development log

This log records the important AI-assisted interactions and the human review/fixes. The entries below are a truthful development record for this generated starter; add actual tool names, dates and screenshots if the project is further developed in an IDE.

## Key prompts and interactions

1. **Product framing:** “Design a visitor photo slideshow that remembers returning visitors, asks for consent, validates files and handles concurrent uploads.”  
   **Decision:** Built a small self-hosted MVP with explicit documented assumptions instead of introducing cloud dependencies.
2. **Identity design:** “How can returning visitors be identified without collecting unnecessary personal data?”  
   **Decision:** Random recovery code + name, rather than name-only lookup or face recognition.
3. **Upload threat review:** “What checks are needed beyond the browser's file input accept attribute?”  
   **Decision:** Added Multer limits, MIME allowlist, Sharp decode/format/dimension validation, resizing and JPEG re-encoding.
4. **Concurrency review:** “What happens if multiple visitors upload at once or the display queue fills?”  
   **Decision:** Per-request limits, SQLite WAL/serialized writes, sequential per-request image processing, queue cap and explicit rejection.
5. **AI mistake caught — trusting MIME type:** An initial implementation direction treated `file.mimetype` as sufficient validation. That is not proof of the file's real content because clients can forge headers.  
   **Fix:** Added Sharp metadata decoding and a real format/dimension check before saving the normalized image.
6. **AI mistake caught — identity by name only:** A name-only returning-visitor lookup would merge unrelated visitors with the same name and expose each other's photo-management access.  
   **Fix:** Replaced it with a random one-time visitor code, stored as a hash, and required both name and code for returning access.
7. **Privacy review:** “Check whether the public static directory accidentally exposes uploaded images.”  
   **Decision:** Uploads are stored outside `public/`; only approved database IDs are served through `/media/:id`.
8. **Failure-path review:** “What if the third file in a multi-photo upload fails after two were processed?”  
   **Decision:** The route rolls back metadata and removes files already created in that request.
9. **AI mistake caught — non-atomic queue capacity check:** A first version counted current photos before asynchronous image processing. Two simultaneous uploads could both see free capacity and then exceed the configured queue limit.\n   **Fix:** Image files are prepared first, then a synchronous SQLite transaction re-checks capacity and inserts the entire batch atomically; rejected batches remove their prepared files.\n10. **Test/documentation review:** “Make the setup, architecture, assumptions, and manual acceptance checks explainable to a reviewer.”  
   **Decision:** Added README, architecture diagram, assumptions table, AI log, automated unit tests and a manual test plan.

## Human verification still required

- Run `npm install`, `npm test`, `npm run check`, and the manual plan on the target machine.
- Test real smart-TV browser behavior and full-screen mode.
- Review privacy wording and retention duration with the venue owner.
- Before public internet deployment, add HTTPS, moderator review, retention automation, private display access, operational monitoring and backup/restore testing.

## AI use and authorship note

AI was used to draft the project structure, code and documentation. The developer/reviewer remains responsible for running the app, understanding the flows, checking security assumptions, and recording any additional corrections. Do not claim tests passed until they have actually been run in the target environment.
