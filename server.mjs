// Kantor Agent mini: baca transkrip Claude Code (read-only), sajikan state JSON + index.html (tema Warehouse).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.join(os.homedir(), ".claude", "projects");
const RECENT_MS = 10 * 60 * 1000;
const PORT = process.env.PORT || 8788;

function recentFiles() {
  const out = [];
  for (const d of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".jsonl")) continue;
      const p = path.join(dir, f), m = fs.statSync(p).mtimeMs;
      if (Date.now() - m < RECENT_MS) out.push({ p, m, project: d });
    }
  }
  return out.sort((a, b) => b.m - a.m);
}

const T0 = Date.now();
function state() {
  if (process.env.SIM) { // simulasi: SIM=3 -> agen masuk tiap 4s, selesai setelah 35s
    const now = Date.now(), T = ["Cari bug login","Tulis test","Review PR","Update docs","Refactor API","Cek lint"];
    return { lead: { tool: "Read", at: now, text: "Membaca server.mjs" }, events: [], agents: Array.from({ length: +process.env.SIM }, (_, i) => ({ id: "s" + i, type: ["Explore", "Plan", "general-purpose", "claude-code-guide"][i % 4], desc: T[i % T.length], at: T0 + i * 4000, done: now > T0 + i * 4000 + 35000, doneAt: T0 + i * 4000 + 35000 })).filter(a => a.at <= now), otherSessions: 0 };
  }
  const files = recentFiles();
  if (!files.length) return { lead: null, agents: [], otherSessions: 0 };
  const { p, project } = files[0]; // ponytail: hanya sesi terbaru, sesi lain cuma dihitung
  const uses = new Map(), done = new Map(), events = [];
  let lead = { tool: null, at: 0 };
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    const c = e.message?.content;
    if (!Array.isArray(c) || e.isSidechain) continue;
    const at = Date.parse(e.timestamp) || 0;
    for (const b of c) {
      if (b.type === "tool_use") {
        lead = { tool: b.name, at, text: describe(b) };
        events.push({ at, text: lead.text });
        if (b.name === "Agent" || b.name === "Task")
          uses.set(b.id, { id: b.id, type: b.input?.subagent_type || "general", desc: String(b.input?.description || "").slice(0, 60), at });
      } else if (b.type === "tool_result") done.set(b.tool_use_id, at);
    }
  }
  const agents = [...uses.values()].map(a => ({ ...a, done: done.has(a.id), doneAt: done.get(a.id) })).slice(-12);
  return { lead, agents, events: events.slice(-40), project, otherSessions: files.length - 1 };
}

// teks pendek untuk bubble & feed; ponytail: tidak diredact, tampil apa adanya dari transkrip lokal
function describe(b) {
  const i = b.input || {}, short = s => String(s ?? "").slice(0, 70);
  const file = i.file_path ? path.basename(i.file_path) : "";
  switch (b.name) {
    case "Read": return "Membaca " + file;
    case "Edit": case "Write": return "Menulis " + file;
    case "Bash": return "Menjalankan: " + short(i.description || i.command);
    case "Grep": case "Glob": return "Mencari " + short(i.pattern);
    case "Agent": case "Task": return "Memanggil subagent: " + short(i.description);
    case "TodoWrite": return "Memperbarui daftar tugas";
    default: return b.name;
  }
}

http.createServer((req, res) => {
  try {
    if (req.url.startsWith("/api/state")) {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(state()));
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(new URL("./index.html", import.meta.url)));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Kantor: http://127.0.0.1:${PORT}`));
