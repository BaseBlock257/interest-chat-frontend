// frontend/src/App.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import { motion } from "framer-motion";


// Import backgrounds for interests
import sportsBg from "./assets/sports.gif";
import codingBg from "./assets/coding.gif";
import moviesBg from "./assets/movies.gif";
import musicBg from "./assets/music.gif";
import gamingBg from "./assets/gaming.gif";
import travelBg from "./assets/travel.gif";
import newsBg from "./assets/news.gif";
import politicsBg from "./assets/politics.gif";
import gossipsBg from "./assets/gossips.gif";
import storiesBg from "./assets/stories.gif";
import scienceBg from "./assets/science.gif";
import spaceBg from "./assets/space.gif";
import artBg from "./assets/art.gif";
import memesBg from "./assets/memes.gif";

const INTEREST_BACKGROUNDS = {
  Sports: sportsBg,
  Coding: codingBg,
  Movies: moviesBg,
  Music: musicBg,
  Gaming: gamingBg,
  Travel: travelBg,
  News: newsBg,
  Politics: politicsBg,
  Gossips: gossipsBg,
  Stories: storiesBg,
  Science: scienceBg,
  Space: spaceBg,
  Art: artBg,
  Memes: memesBg,
};

// const socket = io("http://localhost:5000"); // update later for deployed backend
const socket = io("https://interest-chat-backend-production.up.railway.app", {
    transports: ["websocket"],
});

const INTERESTS = [
  "Sports",
  "Coding",
  "Movies",
  "Music",
  "Gaming",
  "Travel",
  "News",
  "Politics",
  "Gossips",
  "Stories",
  "Science",
  "Space",
  "Art",
  "Memes",
];

const PRIMARY = INTERESTS.slice(0, 3);

function guestId() {
  return "Guest" + Math.floor(1000 + Math.random() * 9000);
}
// --- MouseTrail: lightweight, smooth cursor trail ---
function MouseTrail({ count = 14, ease = 0.25 }) {
  const dotsRef = React.useRef([]);
  const targetRef = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef(null);

  // create DOT DOM nodes once
  React.useEffect(() => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "2147483647"; // above everything
    document.body.appendChild(container);

    const dots = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "trail-dot";
      container.appendChild(el);
      dots.push({ el, x: 0, y: 0 });
    }
    dotsRef.current = dots;

    const onMove = (e) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      const dots = dotsRef.current;
      const target = targetRef.current;

      // the first dot eases to the cursor
      if (dots[0]) {
        dots[0].x += (target.x - dots[0].x) * ease;
        dots[0].y += (target.y - dots[0].y) * ease;
        dots[0].el.style.transform = `translate(${dots[0].x}px, ${dots[0].y}px)`;
      }

      // each next dot eases toward the previous one
      for (let i = 1; i < dots.length; i++) {
        const prev = dots[i - 1];
        const dot = dots[i];
        dot.x += (prev.x - dot.x) * ease;
        dot.y += (prev.y - dot.y) * ease;
        dot.el.style.transform = `translate(${dot.x}px, ${dot.y}px)`;
        // subtle size & opacity falloff
        const t = 1 - i / dots.length;
        dot.el.style.opacity = String(0.15 + t * 0.6);
        dot.el.style.width = `${6 + t * 10}px`;
        dot.el.style.height = `${6 + t * 10}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      container.remove();
    };
  }, [count, ease]);

  return null; // DOM is managed imperatively for perf
}

export default function App() {
  const [me] = useState(guestId());
  const [mode, setMode] = useState(null); // 'group' | 'private'
  const [interest, setInterest] = useState("");
  const [groupJoined, setGroupJoined] = useState(false);
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [groupTyping, setGroupTyping] = useState("");

  const [privateStatus, setPrivateStatus] = useState("idle"); // idle | waiting | matched
  const [privateRoom, setPrivateRoom] = useState(null);
  const [privatePartner, setPrivatePartner] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateInput, setPrivateInput] = useState("");
  const [privateTyping, setPrivateTyping] = useState("");

  const groupEndRef = useRef(null);
  const privateEndRef = useRef(null);
  const groupTypingTimeout = useRef(null);
  const privateTypingTimeout = useRef(null);

  const EMOJIS = ["😀","😂","😍","🔥","👍","🎉","😮","🤯","😢","💯"];
  const fileInputRef = useRef();
  const privateFileInputRef = useRef();
  
  useEffect(() => {
    // GROUP listeners
    socket.on("update_group_users", (list) => setGroupUsers(list || []));
    socket.on("receive_group_message", (msg) => {
      setGroupMessages(prev => [...prev, msg]);
    });
    socket.on("typing_group", ({ from, typing }) => {
      if (typing && from !== me) {
        setGroupTyping(from);
        clearTimeout(groupTypingTimeout.current);
        groupTypingTimeout.current = setTimeout(() => setGroupTyping(""), 1400);
      }
    });

    // PRIVATE listeners
    socket.on("private_waiting", () => setPrivateStatus("waiting"));
    socket.on("private_match_found", ({ roomId, partnerId, interest }) => {
      setPrivateRoom(roomId);
      setPrivatePartner(partnerId);
      setPrivateStatus("matched");
      setPrivateMessages(prev => [
        ...prev,
        { text: `Matched with ${partnerId} (${interest})`, sender: "system", ts: Date.now() }
      ]);
    });
    socket.on("receive_private_message", (msg) => {
      setPrivateMessages(prev => [...prev, msg]);
    });
    socket.on("typing_private", ({ from, typing }) => {
      if (typing && from !== me) {
        setPrivateTyping(from);
        clearTimeout(privateTypingTimeout.current);
        privateTypingTimeout.current = setTimeout(() => setPrivateTyping(""), 1400);
      }
    });
    socket.on("peer_left", () => {
      setPrivateMessages(prev => [...prev, { text: "Partner left the chat", sender: "system", ts: Date.now() }]);
      setPrivatePartner(null);
      setPrivateRoom(null);
      setPrivateStatus("idle");
    });

    socket.on("joined_group_random", ({ interest }) => {
      setInterest(interest);
      setGroupJoined(true);
    });
    
    return () => {
      socket.off("update_group_users");
      socket.off("receive_group_message");
      socket.off("typing_group");
      socket.off("private_waiting");
      socket.off("private_match_found");
      socket.off("receive_private_message");
      socket.off("typing_private");
      socket.off("peer_left");
      socket.off("joined_group_random");
    };
  }, [me]);
  useEffect(() => {
  const handleClick = (e) => {
    for (let i = 0; i < 3; i++) {
      const bubble = document.createElement("span");
      bubble.className = "click-bubble";

      const size = Math.random() * 25 + 10;
      bubble.style.width = size + "px";
      bubble.style.height = size + "px";

      const x = e.pageX + (Math.random() * 40 - 20);
      const y = e.pageY + (Math.random() * 40 - 20);

      bubble.style.left = x - size / 2 + "px";
      bubble.style.top = y - size / 2 + "px";

      document.body.appendChild(bubble);

      setTimeout(() => bubble.remove(), 2000);
    }
  };

  document.addEventListener("click", handleClick);
  return () => document.removeEventListener("click", handleClick);
}, []);



  useEffect(() => { groupEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages]);
  useEffect(() => { privateEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [privateMessages]);

  /* ---------- Group actions ---------- */
  function openGroup(topic) {
    setInterest(topic);
    socket.emit("join_group", { interest: topic, guestId: me });
    setGroupMessages([]);
    setGroupJoined(true);
  }

  function joinRandomGroup() {
    socket.emit("join_group_random", { guestId: me });
  }

  function leaveGroup() {
    socket.emit("leave_group", { guestId: me, interest });
    setGroupJoined(false);
    setInterest("");
    setGroupUsers([]);
    setGroupMessages([]);
  }

  function sendGroupMessage() {
    if (!groupInput.trim()) return;
    const payload = { interest, text: groupInput, sender: me, ts: Date.now(), type: "text" };
    socket.emit("send_group_message", payload);
    setGroupInput("");
  }

  function groupOnTyping(isTyping=true) {
    socket.emit("typing_group", { interest, from: me, typing: isTyping });
  }

  /* ---------- Private actions ---------- */
  function requestPrivateInterest(topic) {
    setInterest(topic);
    setPrivateMessages([]);
    socket.emit("request_private_match", { mode: "interest", interest: topic, guestId: me });
  }

  function requestPrivateRandom() {
    setInterest("Random");
    setPrivateMessages([]);
    socket.emit("request_private_match", { mode: "random", guestId: me });
  }

  function sendPrivateMessage() {
    if (!privateInput.trim() || !privateRoom) return;
    const payload = { roomId: privateRoom, text: privateInput, sender: me, ts: Date.now(), type: "text" };
    socket.emit("send_private_message", payload);
    setPrivateInput("");
  }

  function privateOnTyping(isTyping=true) {
    if (!privateRoom) return;
    socket.emit("typing_private", { roomId: privateRoom, from: me, typing: isTyping });
  }

  function leavePrivate() {
    socket.emit("leave_private");
    setPrivateRoom(null);
    setPrivatePartner(null);
    setPrivateMessages([]);
    setPrivateStatus("idle");
    setInterest("");
  }

  /* ---------- File upload ---------- */
  async function uploadFileAndSend(file, target = "group") {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) {
        if (target === "group") {
          socket.emit("send_group_message", { interest, text: "", sender: me, ts: Date.now(), type: "image", imageUrl: json.url });
        } else {
          if (!privateRoom) return;
          socket.emit("send_private_message", { roomId: privateRoom, text: "", sender: me, ts: Date.now(), type: "image", imageUrl: json.url });
        }
      }
    } catch (e) {
      console.error("upload failed", e);
    }
  }

  function insertEmojiIntoField(e, forPrivate=false) {
    if (forPrivate) setPrivateInput(prev => prev + e);
    else setGroupInput(prev => prev + e);
  }

  /* ---------- UI ---------- */
  if (!mode) {
    return (
      <div
        className="app"
        style={{
          background: interest && INTEREST_BACKGROUNDS[interest]
            ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat, #000`
            : "#000",
        }}
      ><MouseTrail />

        <header className="header">🔥 Interest Chat</header>
        <div className="center-card">
          <h2>How do you want to chat?</h2>
          <div className="mode-buttons">
            <button onClick={() => setMode("group")}>Group Lounge</button>
            <button onClick={() => setMode("private")}>Private Match</button>
          </div>
          <p className="small">You are <b>{me}</b></p>
        </div>
      </div>
    );
  }

  if (mode === "group" && !groupJoined) {
    return (
      <div
        className="app"
        style={{
          background: interest && INTEREST_BACKGROUNDS[interest]
            ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat, #000`
            : "#000",
        }}
      ><MouseTrail />

        <header className="header">Group Lounge — pick a topic</header>
        <div className="center-card">
          <div className="primary-row">
            {PRIMARY.map(p => (
              <button key={p} className="primary-topic" onClick={() => openGroup(p)}>{p}</button>
            ))}
          </div>
          <div className="secondary-row">
            {INTERESTS.filter(i=>!PRIMARY.includes(i)).map((t) => (
              <button key={t} className="secondary-topic" onClick={() => openGroup(t)}>{t}</button>
            ))}
          </div>
          <div style={{marginTop:16}}>
            <button className="random-public" onClick={joinRandomGroup}>Join a random public room</button>
            <button className="back" onClick={() => setMode(null)}>Back</button>
          </div>
          <p className="small">You are <b>{me}</b></p>
        </div>
      </div>
    );
  }

  if (mode === "private" && privateStatus === "idle" && !privateRoom) {
    return (
      <div
        className="app"
        style={{
          background: interest && INTEREST_BACKGROUNDS[interest]
            ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat, #000`
            : "#000",
        }}
      ><MouseTrail />

        <header className="header">Private Match — pick interest (or random)</header>
        <div className="center-card">
          <div className="primary-row">
            {PRIMARY.map(p => (
              <button key={p} className="primary-topic" onClick={() => requestPrivateInterest(p)}>{p}</button>
            ))}
          </div>
          <div className="secondary-row">
            {INTERESTS.filter(i=>!PRIMARY.includes(i)).map((t) => (
              <button key={t} className="secondary-topic" onClick={() => requestPrivateInterest(t)}>{t}</button>
            ))}
          </div>
          <div style={{marginTop:16}}>
            <button className="random-private" onClick={requestPrivateRandom}>🎲 Random private match</button>
            <button className="back" onClick={() => setMode(null)}>Back</button>
          </div>
          <p className="small">You are <b>{me}</b></p>
        </div>
      </div>
    );
  }

  if (mode === "private" && privateStatus === "waiting") {
    return (
      <div
        className="app"
        style={{
          background: interest && INTEREST_BACKGROUNDS[interest]
            ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat, #000`
            : "#000",
        }}
      ><MouseTrail />

        <header className="header">Searching…</header>
        <div className="center-card">
          <p>Finding a match for <b>{interest}</b> — keep this tab open</p>
          <div className="spinner" />
          <button className="back" onClick={() => { setPrivateStatus("idle"); setMode(null); }}>Cancel</button>
        </div>
      </div>
    );
  }

  /* ---------- GROUP ROOM ---------- */
  if (mode === "group" && groupJoined) {
    return (
       <motion.div
            className="app group-room"
            style={{
              background: interest && INTEREST_BACKGROUNDS[interest]
                ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat`
                : undefined,
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        ><MouseTrail />

        <header className="header group-header">#{interest} Lounge</header>
        <div className="layout">
          <aside className="sidebar">
            <h4>Online</h4>
            <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
                }}
              >
                {groupUsers.map(u => (
                  <motion.li
                    key={u}
                    className={u === me ? "me" : ""}
                    variants={{ hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                  >
                    {u}
                  </motion.li>
                ))}
              </motion.ul>

            <button className="back small" onClick={() => leaveGroup()}>Leave room</button>
            <button className="back small" onClick={() => { leaveGroup(); setMode(null); }}>Back Home</button>
          </aside>

          <main className="main">
            <div className="messages chat-scroll">
              {groupMessages.map((m, i) => (
                <motion.div
              key={m.ts + m.sender}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`msg ${m.sender==='system' ? 'system' : (m.sender===me ? 'me' : 'guest')}`}
            >
              {m.sender !== 'system' && <div className="from">{m.sender}</div>}
              {m.sender === 'system' ? (
                <div className="system-msg">{m.text}</div>
              ) : (
                <div className="bubble">
                  {m.type === 'image' && m.imageUrl ? (
                    <img src={m.imageUrl} alt="uploaded" className="msg-image" />
                  ) : <div className="text">{m.text}</div>}
                  <div className="time">{new Date(m.ts).toLocaleTimeString()}</div>
                </div>
              )}
                </motion.div>

              ))}
              <div ref={groupEndRef} />
            </div>

            <div className="composer fixed-composer">
              <div className="emoji-strip">
                {EMOJIS.map(e => <button key={e} onClick={() => insertEmojiIntoField(e, false)} className="emoji-btn">{e}</button>)}
                <input ref={fileInputRef} type="file" accept="image/*,video/*,image/gif" style={{display:'none'}}
                  onChange={(ev) => { uploadFileAndSend(ev.target.files[0], 'group'); ev.target.value=''; }} />
                <button className="attach" onClick={() => fileInputRef.current?.click()}>📎</button>
              </div>

              <textarea
                value={groupInput}
                placeholder="Write a message… (Enter to send)"
                onChange={(e)=> setGroupInput(e.target.value)}
                onKeyDown={(e)=> {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); groupOnTyping(false); }
                  else groupOnTyping(true);
                }}
              />
              <button onClick={() => { sendGroupMessage(); groupOnTyping(false); }}>Send</button>
            </div>

            {groupTyping && (
              <div className="typing-indicator">
                <span>{groupTyping} is typing</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}

          </main>
        </div>
      </motion.div>
    );
  }

  /* ---------- PRIVATE ROOM ---------- */
  if (mode === "private" && privateStatus === "matched") {
    return (
      <motion.div
          className="app private-room"
          style={{
            background: interest && INTEREST_BACKGROUNDS[interest]
              ? `url(${INTEREST_BACKGROUNDS[interest]}) center/cover no-repeat`
              : undefined,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
      ><MouseTrail />

        <header className="header whisper">Private — chatting with {privatePartner || "..."}</header>
        <div className="layout">
          <aside className="sidebar">
            <h4>Private</h4>
            <ul>
              <li className="me">{me}</li>
              <li>{privatePartner || "waiting..."}</li>
            </ul>
            <button className="back small" onClick={() => { leavePrivate(); setMode(null); }}>Leave / Back</button>
          </aside>

          <main className="main">
            <div className="messages chat-scroll">
              {privateMessages.map((m, i) => (
                <motion.div
                key={m.ts + m.sender} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`msg ${m.sender==='system' ? 'system' : (m.sender===me ? 'me' : 'guest')}`}
              >
                {m.sender !== 'system' && <div className="from">{m.sender}</div>}
                {m.sender === 'system' ? (
                  <div className="system-msg">{m.text}</div>
                ) : (
                  <div className="bubble">
                    {m.type === 'image' && m.imageUrl ? (
                      <img src={m.imageUrl} alt="uploaded" className="msg-image" />
                    ) : <div className="text">{m.text}</div>}
                    <div className="time">{new Date(m.ts).toLocaleTimeString()}</div>
                  </div>
                )}
              </motion.div>

              ))}
              <div ref={privateEndRef} />
            </div>

            <div className="composer fixed-composer">
              <div className="emoji-strip">
                {EMOJIS.map(e => <button key={e} onClick={() => insertEmojiIntoField(e, true)} className="emoji-btn">{e}</button>)}
                <input ref={privateFileInputRef} type="file" accept="image/*,video/*,image/gif" style={{display:'none'}}
                  onChange={(ev) => { uploadFileAndSend(ev.target.files[0], 'private'); ev.target.value=''; }} />
                <button className="attach" onClick={() => privateFileInputRef.current?.click()}>📎</button>
              </div>

              <textarea
                value={privateInput}
                placeholder="Write a message… (Enter to send)"
                onChange={(e)=> setPrivateInput(e.target.value)}
                onKeyDown={(e)=> {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrivateMessage(); privateOnTyping(false); }
                  else privateOnTyping(true);
                }}
              />
              <button onClick={() => { sendPrivateMessage(); privateOnTyping(false); }}>Send</button>
            </div>

            {privateTyping && (
              <div className="typing-indicator">
                <span>{privateTyping} is typing</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}

          </main>
        </div>
      </motion.div>
    );
  }

  return <div className="app"><p>Loading…</p></div>;
}
