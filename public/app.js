const $ = (id) => document.getElementById(id);
let visitor = null;
const say = (target, message) => { $(target).textContent = message; };
$("visitor-form").addEventListener("submit", async (event) => {
  event.preventDefault(); say("notice", "Checking visitor details…");
  const payload = { name: $("name").value, visitorCode: $("code").value.trim() };
  try {
    const response = await fetch("/api/visitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    visitor = data;
    $("upload-panel").classList.remove("hidden");
    $("delete-account").classList.remove("hidden");
    if (data.visitorCode) { $("new-code").textContent = data.visitorCode; $("code-card").classList.remove("hidden"); }
    say("notice", data.returning ? `Welcome back, ${data.name}. Your previous photos remain in the slideshow.` : `Welcome, ${data.name}. Your visitor profile is ready.`);
    $("upload-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { say("notice", error.message); }
});
$("copy-code").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("new-code").textContent); $("copy-code").textContent = "Copied";
});
$("upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!visitor || !$("consent").checked) return;
  const files = [...$("photos").files];
  if (!files.length || files.length > 5) return say("upload-notice", "Choose between 1 and 5 photos.");
  if (files.some(f => f.size > 10 * 1024 * 1024)) return say("upload-notice", "Each photo must be 10 MB or smaller.");
  const body = new FormData(); files.forEach(f => body.append("photos", f));
  body.append("visitorId", visitor.visitorId); body.append("visitorCode", visitor.visitorCode || $("code").value.trim()); body.append("consent", "true");
  say("upload-notice", "Uploading and preparing your photos…");
  try {
    const response = await fetch("/api/photos", { method: "POST", body }); const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    say("upload-notice", `${data.uploaded} photo${data.uploaded === 1 ? "" : "s"} added. They will appear on the shared display shortly.`);
    $("photos").value = "";
  } catch (error) { say("upload-notice", error.message); }
});
$("delete-account").addEventListener("click", async () => {
  if (!visitor || !confirm("Delete your visitor profile and all its photos? This cannot be undone.")) return;
  const code = visitor.visitorCode || $("code").value.trim();
  const response = await fetch("/api/visitors/me", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitor.visitorId, visitorCode: code }) });
  if (response.ok) { visitor = null; $("upload-panel").classList.add("hidden"); say("notice", "Your profile and photos have been deleted."); }
  else say("upload-notice", "Could not delete the profile. Please verify your visitor code.");
});