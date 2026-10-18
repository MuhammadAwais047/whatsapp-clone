/* Chatterly — WhatsApp-style messenger, 100% client-side.
   Conversations live in localStorage; replies are simulated per-contact personas. */
(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const rndInt = (max) => Math.floor(Math.random() * max);

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* session-only fallback */
      }
    },
  };

  const KEY_CHATS = "chatterly-chats-v1";
  const KEY_UNREAD = "chatterly-unread-v1";

  const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const sameDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };
  const dayLabel = (ts) => {
    const now = Date.now();
    if (sameDay(ts, now)) return "Today";
    if (sameDay(ts, now - 86400000)) return "Yesterday";
    return new Date(ts).toLocaleDateString([], { day: "numeric", month: "long" });
  };
  const listTime = (ts) => {
    const now = Date.now();
    if (sameDay(ts, now)) return fmtTime(ts);
    if (sameDay(ts, now - 86400000)) return "Yesterday";
    return new Date(ts).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  /* ---------- contacts & seed conversations ---------- */
  const H = 3600000;
  const D = 86400000;

  const CONTACTS = [
    {
      id: "ayesha", name: "Ayesha", color: "linear-gradient(135deg,#e1306c,#f77737)",
      status: "online",
      replies: ["hahaha stop 😂", "wait really??", "ok but did you see the match last night", "let's get coffee tomorrow ☕", "sending you the pics rn 📸", "you're unreal 😭"],
      seed: [
        { from: "me", text: "ayesha guess what", ts: Date.now() - 2 * D - 5 * H, status: "read" },
        { from: "them", text: "WHAT tell me right now", ts: Date.now() - 2 * D - 4.8 * H },
        { from: "me", text: "i got the internship 🎉", ts: Date.now() - 2 * D - 4.7 * H, status: "read" },
        { from: "them", text: "NO WAY", ts: Date.now() - 26 * H },
        { from: "them", text: "so proud of you!! celebrating on friday, non-negotiable 🎉🎉", ts: Date.now() - 20 * H },
      ],
      unread: 2,
    },
    {
      id: "baba", name: "Baba", color: "linear-gradient(135deg,#1971c2,#1864ab)",
      status: "last seen today at 9:14 AM",
      replies: ["Good. Take care of yourself.", "Call me when you're free.", "Don't stay up too late.", "That's my boy. 😊"],
      seed: [
        { from: "them", text: "Beta, remember to drink your milk.", ts: Date.now() - 1.4 * D },
        { from: "me", text: "yes baba 😅 every morning", ts: Date.now() - 1.3 * D, status: "read" },
        { from: "them", text: "Good. Sleep early tonight.", ts: Date.now() - 1.3 * D + 600000 },
      ],
      unread: 0,
    },
    {
      id: "hamza", name: "Hamza", color: "linear-gradient(135deg,#12b886,#087f5b)",
      status: "last seen yesterday at 10:42 PM",
      replies: ["leg day tomorrow, no excuses 🏋️", "bro I can't feel my arms", "6am sharp?", "protein after workout. always."],
      seed: [
        { from: "me", text: "gym tomorrow?", ts: Date.now() - 3 * D, status: "read" },
        { from: "them", text: "6am sharp. no excuses 💪", ts: Date.now() - 3 * D + 1200000 },
      ],
      unread: 0,
    },
    {
      id: "zainab", name: "Zainab", color: "linear-gradient(135deg,#7048e8,#4263eb)",
      status: "online",
      replies: ["sending you the recipe 🍰", "aww that's so cute", "we should visit nani this weekend", "lol mum says hi 👋"],
      seed: [
        { from: "them", text: "baking the chocolate cake tonight — recipe incoming 🍫", ts: Date.now() - 2.2 * H },
      ],
      unread: 0,
    },
    {
      id: "mama", name: "Mama", color: "linear-gradient(135deg,#f76707,#e8590c)",
      status: "last seen today at 8:02 AM",
      replies: ["Did you drink water today? 💧", "I made your favorite 😊", "Come home this Sunday, beta.", "Allah bless you."],
      seed: [
        { from: "them", text: "Come home this Sunday, I'm making biryani 🍛", ts: Date.now() - 7 * H },
        { from: "me", text: "counting the minutes ❤️", ts: Date.now() - 6.8 * H, status: "read" },
        { from: "them", text: "Bring your laundry too 😄", ts: Date.now() - 55 * 60000 },
      ],
      unread: 1,
    },
    {
      id: "bilal", name: "Bilal", color: "linear-gradient(135deg,#0ca678,#2b8a3e)",
      status: "last seen today at 1:37 PM",
      replies: ["did you finish the assignment?", "prof moved the quiz to Friday btw", "sending notes in a bit 📚", "library at 4?"],
      seed: [
        { from: "me", text: "did prof post the notes?", ts: Date.now() - 1.2 * D, status: "read" },
        { from: "them", text: "yep, check the portal", ts: Date.now() - 1.15 * D },
      ],
      unread: 0,
    },
    {
      id: "sara", name: "Sara (Team Lead)", color: "linear-gradient(135deg,#1098ad,#1c7ed6)",
      status: "online",
      replies: ["standup moved to 10:30 tomorrow", "can you review my PR when free?", "the client loved the demo 🎉", "heads up — sprint review on Thursday"],
      seed: [
        { from: "them", text: "Great demo today! The client is thrilled 🎉", ts: Date.now() - 1.1 * H },
        { from: "them", text: "Log it in the deck when you get a chance — no rush", ts: Date.now() - 40 * 60000 },
      ],
      unread: 1,
    },
    {
      id: "usman", name: "Usman", color: "linear-gradient(135deg,#5f3dc4,#6741d9)",
      status: "last seen today at 3:20 PM",
      replies: ["gaming tonight? 🎮", "brb food", "that new update is insane", "ok ranked, you and me, 9pm"],
      seed: [
        { from: "them", text: "that new update is actually insane", ts: Date.now() - 2 * D - 2 * H },
        { from: "me", text: "right?? the movement feels so smooth now", ts: Date.now() - 2 * D - 1.9 * H, status: "read" },
      ],
      unread: 0,
    },
  ];

  /* ---------- state ---------- */
  let chats = store.get(KEY_CHATS, null);
  if (!chats) {
    chats = {};
    for (const c of CONTACTS) chats[c.id] = c.seed.map((m) => ({ ...m }));
    store.set(KEY_CHATS, chats);
  }
  let unread = store.get(KEY_UNREAD, null);
  if (!unread) {
    unread = Object.fromEntries(CONTACTS.map((c) => [c.id, c.unread]));
    store.set(KEY_UNREAD, unread);
  }
  const contact = (id) => CONTACTS.find((c) => c.id === id);
  const lastMsg = (id) => {
    const arr = chats[id] || [];
    return arr[arr.length - 1];
  };
  const save = () => {
    store.set(KEY_CHATS, chats);
    store.set(KEY_UNREAD, unread);
  };

  /* ---------- toast ---------- */
  let toastTimer;
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.hidden = true;
    }, 2400);
  };

  /* ---------- ticks ---------- */
  const tickSvg = (status) => {
    const span = el("span", "tick " + (status === "read" ? "tick-read" : "tick-dim"));
    if (status === "sent") {
      span.innerHTML =
        '<svg viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Sent"><path d="M14.5 1.5 5.5 9.5 1.5 5.8"/></svg>';
      span.setAttribute("title", "Sent");
    } else {
      span.innerHTML =
        '<svg viewBox="0 0 18 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="' +
        (status === "read" ? "Read" : "Delivered") +
        '"><path d="M12.5 1.5 4.6 9.5 1 6"/><path d="M17 1.5 9.1 9.5l-.9-.9"/></svg>';
      span.setAttribute("title", status === "read" ? "Read" : "Delivered");
    }
    return span;
  };

  /* ---------- chat list ---------- */
  const chatListEl = $("#chat-list");
  let activeId = null;

  const previewOf = (m) => {
    if (!m) return "";
    const prefix = m.from === "me" ? "you: " : "";
    return prefix + m.text;
  };

  const renderList = () => {
    chatListEl.textContent = "";
    const q = $("#search").value.trim().toLowerCase();
    const ordered = [...CONTACTS]
      .filter((c) => {
        if (!q) return true;
        if (c.name.toLowerCase().includes(q)) return true;
        return (chats[c.id] || []).some((m) => m.text.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const la = lastMsg(a.id)?.ts || 0;
        const lb = lastMsg(b.id)?.ts || 0;
        return lb - la;
      });
    $("#list-empty").hidden = ordered.length > 0;
    for (const c of ordered) {
      const m = lastMsg(c.id);
      const item = el("button", "chat-item" + (c.id === activeId ? " is-active" : ""));
      item.type = "button";
      item.setAttribute("role", "listitem");
      item.setAttribute("aria-label", `Chat with ${c.name}${unread[c.id] ? `, ${unread[c.id]} unread` : ""}`);

      const av = el("span", "avatar sm");
      av.style.background = c.color;
      av.textContent = c.name[0];
      item.append(av);

      const main = el("div", "ci-main");
      const top = el("div", "ci-top");
      top.append(el("span", "ci-name", c.name), el("span", "ci-time", m ? listTime(m.ts) : ""));
      const bottom = el("div", "ci-bottom");
      const prev = el("span", "ci-preview");
      if (m) {
        if (m.from === "me") {
          prev.append(
            (() => {
              const s = el("span", "tick tick-dim");
              s.innerHTML =
                '<svg viewBox="0 0 18 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 1.5 4.6 9.5 1 6"/><path d="M17 1.5 9.1 9.5l-.9-.9"/></svg>';
              s.style.marginRight = "4px";
              s.querySelector("svg").style.width = "14px";
              return s;
            })()
          );
        }
        prev.append(previewOf(m).slice(0, 60));
      }
      bottom.append(prev);
      if (unread[c.id] > 0) bottom.append(el("span", "ci-badge", String(unread[c.id])));
      main.append(top, bottom);
      item.append(main);
      item.addEventListener("click", () => openChat(c.id));
      chatListEl.append(item);
    }
  };

  $("#search").addEventListener("input", renderList);

  /* ---------- conversation rendering ---------- */
  const messagesEl = $("#messages");

  const bubbleRow = (m) => {
    const row = el("div", "row " + (m.from === "me" ? "out" : "in"));
    const b = el("div", "bubble");
    b.append(el("span", "b-text", m.text));
    const meta = el("span", "b-meta");
    meta.append(el("span", "b-time", fmtTime(m.ts)));
    if (m.from === "me") meta.append(tickSvg(m.status || "sent"));
    b.append(meta);
    row.append(b);
    return row;
  };

  const renderMessages = () => {
    messagesEl.textContent = "";
    const arr = chats[activeId] || [];
    let lastDay = "";
    for (const m of arr) {
      const label = dayLabel(m.ts);
      if (label !== lastDay) {
        const sep = el("div", "day-sep");
        sep.append(el("span", null, label));
        messagesEl.append(sep);
        lastDay = label;
      }
      messagesEl.append(bubbleRow(m));
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const appendMessage = (m) => {
    const arr = chats[activeId];
    const last = arr[arr.length - 1];
    if (!last || dayLabel(last.ts) !== dayLabel(m.ts)) {
      const sep = el("div", "day-sep");
      sep.append(el("span", null, dayLabel(m.ts)));
      messagesEl.append(sep);
    }
    messagesEl.append(bubbleRow(m));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const refreshBubbleStatus = (m) => {
    const rows = messagesEl.querySelectorAll(".row.out");
    const idx = (chats[activeId] || []).filter((x) => x.from === "me").indexOf(m);
    const row = rows[idx];
    if (!row) return;
    const old = row.querySelector(".tick");
    if (old) old.replaceWith(tickSvg(m.status));
  };

  /* ---------- open / close chat ---------- */
  const chatEmpty = $("#chat-empty");
  const chatActive = $("#chat-active");

  const updateHeader = () => {
    const c = contact(activeId);
    $("#chat-avatar").style.background = c.color;
    $("#chat-avatar").textContent = c.name[0];
    $("#chat-name").textContent = c.name;
    const st = $("#chat-status");
    st.classList.remove("is-typing");
    st.textContent = c.status;
  };

  const openChat = (id) => {
    activeId = id;
    if (unread[id] > 0) {
      unread[id] = 0;
      save();
    }
    chatEmpty.hidden = true;
    chatActive.hidden = false;
    updateHeader();
    renderMessages();
    renderList();
    document.body.classList.add("chat-open");
    $("#msg-input").focus();
  };

  const closeChat = () => {
    activeId = null;
    chatActive.hidden = true;
    chatEmpty.hidden = false;
    document.body.classList.remove("chat-open");
  };

  $("#back-btn").addEventListener("click", closeChat);

  /* ---------- send + simulated reply ---------- */
  const msgForm = $("#msg-form");
  const msgInput = $("#msg-input");
  const typingEl = $("#typing");
  const pendingReplies = {};
  const typingNow = {};

  msgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text || !activeId) return;
    const m = { from: "me", text, ts: Date.now(), status: "sent" };
    chats[activeId].push(m);
    save();
    appendMessage(m);
    renderList();
    msgInput.value = "";
    scheduleTick(activeId, m);
    scheduleReply(activeId);
  });

  const scheduleTick = (id, m) => {
    setTimeout(() => {
      if (m.status === "sent") {
        m.status = "delivered";
        save();
        if (id === activeId) refreshBubbleStatus(m);
      }
    }, 700 + rndInt(500));
  };

  const markMineRead = (id) => {
    for (const m of chats[id]) {
      if (m.from === "me" && m.status !== "read") m.status = "read";
    }
    save();
    if (id === activeId) renderMessages();
  };

  const scheduleReply = (id) => {
    pendingReplies[id] = (pendingReplies[id] || 0) + 1;
    runReplyQueue(id);
  };

  const runReplyQueue = (id) => {
    if (typingNow[id] || !(pendingReplies[id] > 0)) return;
    typingNow[id] = true;
    const c = contact(id);
    setTimeout(() => {
      if (id === activeId) {
        typingEl.hidden = false;
        const st = $("#chat-status");
        st.textContent = "typing…";
        st.classList.add("is-typing");
      }
      setTimeout(() => {
        typingNow[id] = false;
        if (id === activeId) {
          typingEl.hidden = true;
          updateHeader();
        }
        pendingReplies[id]--;
        const reply = {
          from: "them",
          text: c.replies[rndInt(c.replies.length)],
          ts: Date.now(),
        };
        chats[id].push(reply);
        markMineRead(id);
        save();
        if (id === activeId) {
          appendMessage(reply);
        } else {
          unread[id] = (unread[id] || 0) + 1;
        }
        renderList();
        if (pendingReplies[id] > 0) runReplyQueue(id);
      }, 1400 + rndInt(1800));
    }, 900 + rndInt(1600));
  };

  /* ---------- emoji picker ---------- */
  const EMOJIS = [
    "😀","😂","🥹","😍","😎","🤔","😴","🤒",
    "👍","👏","🙏","💪","🤝","✌️","🫶","👋",
    "❤️","🔥","✨","🎉","🥳","☕","🍕","🎮",
    "📚","🏋️","📸","😢","😭","😅","💯","🚀",
  ];
  const emojiPanel = $("#emoji-panel");
  const emojiBtn = $("#emoji-btn");

  EMOJIS.forEach((em) => {
    const b = el("button");
    b.type = "button";
    b.textContent = em;
    b.setAttribute("aria-label", `Insert ${em}`);
    b.addEventListener("click", () => {
      const start = msgInput.selectionStart ?? msgInput.value.length;
      const end = msgInput.selectionEnd ?? msgInput.value.length;
      msgInput.value = msgInput.value.slice(0, start) + em + msgInput.value.slice(end);
      const pos = start + em.length;
      msgInput.focus();
      msgInput.setSelectionRange(pos, pos);
    });
    emojiPanel.append(b);
  });

  emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = emojiPanel.hidden;
    emojiPanel.hidden = !open;
    emojiBtn.setAttribute("aria-expanded", String(open));
    if (open) msgInput.focus();
  });
  document.addEventListener("click", (e) => {
    if (!emojiPanel.hidden && !emojiPanel.contains(e.target) && e.target !== emojiBtn) {
      emojiPanel.hidden = true;
      emojiBtn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !emojiPanel.hidden) {
      emojiPanel.hidden = true;
      emojiBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- demo-only buttons ---------- */
  $("#new-chat-btn").addEventListener("click", () => toast("This demo has a fixed friend list 😄"));
  $("#call-btn").addEventListener("click", () => toast("No real calls in the demo ☎️"));
  $("#menu-btn").addEventListener("click", () => toast("Menu is decorative in this demo ✨"));

  /* ---------- boot ---------- */
  renderList();
})();
