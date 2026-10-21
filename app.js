const $ = (s) => document.querySelector(s);
$("#year").textContent = new Date().getFullYear();
$("#menuToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));

$("#bookingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const msg = $("#bookingMessage");
  const button = form.querySelector("button");
  msg.className = "form-message";
  msg.textContent = "Submitting your request…";
  button.disabled = true;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/tickets", {
      method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not submit request.");
    msg.className = "form-message success";
    msg.innerHTML = `Request submitted! Your ticket number is <strong>${escapeHtml(result.ticketId)}</strong>. Please save it to track your request.<br><span class="kn">ವಿನಂತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಟಿಕೆಟ್ ಸಂಖ್ಯೆ ${escapeHtml(result.ticketId)}. ದಯವಿಟ್ಟು ಇದನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ.</span>`;
    form.reset();
  } catch (error) {
    msg.className = "form-message error";
    msg.textContent = error.message.includes("Failed to fetch")
      ? "The website API is not running. Follow the README to start the server, or contact the site administrator."
      : error.message;
  } finally { button.disabled = false; }
});

$("#trackForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const target = $("#trackResult");
  target.innerHTML = "Checking ticket… <span class=\"kn\">ಟಿಕೆಟ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…</span>";
  try {
    const response = await fetch(`/api/tickets/${encodeURIComponent(data.ticketId)}?phone=${encodeURIComponent(data.phone)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Ticket not found.");
    target.innerHTML = `<div class="ticket-card"><div><b>${escapeHtml(result.ticketId)}</b><small>${escapeHtml(result.service)} · ${escapeHtml(result.device)}</small><small>Last updated: ${new Date(result.updatedAt).toLocaleString()}</small></div><span class="status-pill">${escapeHtml(result.status)}</span></div>`;
  } catch (error) { target.textContent = error.message; }
});
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
