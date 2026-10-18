# Chatterly — WhatsApp Clone 💬

A WhatsApp-style messenger built with **pure vanilla JavaScript** — no frameworks, no backend, no accounts.

**Live demo:** https://muhammadawais047.github.io/whatsapp-clone/

## Features

- **Chat list** — 8 demo contacts with avatars, last-message previews, delivery ticks, timestamps, and green unread badges, sorted by most recent
- **Real conversations** — every contact has a seeded history with WhatsApp-style **date separators** (Today / Yesterday / date)
- **Message bubbles** — authentic tails, dark theme (`#005c4b` outgoing, `#202c33` incoming)
- **Delivery ticks** — single ✓ sent → double ✓✓ delivered (grey) → double ✓✓ **read** (blue), progressing just like the real thing
- **Typing indicator** — animated three-dot bubble *and* a green "typing…" status in the header before each reply
- **Simulated replies** — each contact has their own personality and canned reply pool; they even reply while the chat is closed (and land in your unread badges)
- **Emoji picker** — 32-emoji popover that inserts at the cursor
- **Search** — filters chats by contact name *or* message text
- **Persistence** — every conversation, tick state and unread count is stored in `localStorage`; reload and your chats are exactly where you left them
- **Responsive** — two-pane desktop layout collapses to single-pane mobile with a back button, just like WhatsApp Web → mobile

## Tech

- One `index.html` + `styles.css` + `app.js` (~430 lines of JS, zero dependencies)
- All rendering via `createElement` / `textContent` (no `innerHTML` with user data → XSS-safe)
- `prefers-reduced-motion` respected, keyboard accessible, visible focus rings

## Run locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

(Any static server works — or just open `index.html` directly.)

---

All contacts are fictional demo personas. Built by [Muhammad Awais](https://github.com/MuhammadAwais047) as portfolio project #15.
