const image = document.getElementById("slide");
const empty = document.getElementById("empty");
const caption = document.getElementById("caption");
const name = document.getElementById("visitor-name");
const progress = document.getElementById("progress-fill");
let queue = [], index = 0, duration = 8000, timer = null, refreshTimer = null;
async function refresh() {
  try {
    const response = await fetch("/api/slideshow", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load slideshow");
    const data = await response.json();
    queue = data.photos || []; duration = Math.max(3000, (data.durationSeconds || 8) * 1000);
    if (!queue.length) { image.classList.add("hidden"); caption.classList.add("hidden"); empty.classList.remove("hidden"); clearTimeout(timer); }
    else { empty.classList.add("hidden"); if (index >= queue.length) index = 0; if (!timer) showSlide(); }
  } catch { /* Keep the current slide visible during a brief network interruption. */ }
}
function showSlide() {
  if (!queue.length) return;
  const photo = queue[index % queue.length];
  image.onload = () => { image.classList.remove("hidden"); caption.classList.remove("hidden"); };
  image.src = `${photo.url}?v=${encodeURIComponent(photo.createdAt)}`;
  name.textContent = photo.visitorName;
  progress.style.transition = "none"; progress.style.width = "0";
  requestAnimationFrame(() => { progress.style.transition = `width ${duration}ms linear`; progress.style.width = "100%"; });
  clearTimeout(timer);
  timer = setTimeout(() => { index = (index + 1) % queue.length; showSlide(); }, duration);
}
refresh();
refreshTimer = setInterval(refresh, 15000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
