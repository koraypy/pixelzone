// Pixelzone sunucusu: TikTok yayınını dinler, karakter listesini tutar, herkese WebSocket ile dağıtır.
// Ortam değişkenleri: TIKTOK_USERNAME (@'siz), PORT, MAX_CHARACTERS, SEED, DEMO=1 (TikTok olmadan sahte izleyici)
const http = require('http');
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8080;
const USER = (process.env.TIKTOK_USERNAME || '').replace(/^@/, '');
const DEMO = process.env.DEMO === '1';
const MAX = +process.env.MAX_CHARACTERS || 40;      // odada aynı anda en fazla karakter
const IDLE_MS = 15 * 60e3;                          // bu kadar sessiz kalan karakter odadan çıkar
const SEED = +process.env.SEED || 2026;
const BUBBLE_MS = 6000;

const roster = new Map(), chats = [];
const now = () => Date.now();
const pub = u => ({ id: u.id, name: u.name, look: u.look, joinedAt: u.joinedAt });

const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/plain' }); r.end(`pixelzone ok · ${roster.size} karakter`); });
const wss = new WebSocketServer({ server });
const send = (ws, m) => ws.readyState === 1 && ws.send(JSON.stringify(m));
const bc = m => wss.clients.forEach(ws => send(ws, m));

function touch(id, name) {
  if (!id) return null;
  let u = roster.get(id);
  if (!u) {
    if (roster.size >= MAX) { const old = [...roster.values()].sort((a, b) => a.last - b.last)[0]; roster.delete(old.id); bc({ type: 'leave', id: old.id }); }
    u = { id, name: name || id, look: (Math.random() * 2 ** 31) | 0, joinedAt: now(), last: now() };
    roster.set(id, u); bc({ type: 'join', user: pub(u) });
  }
  u.last = now(); return u;
}
function onChat(id, name, text) {
  if (!touch(id, name)) return;
  const m = { type: 'chat', id, text: String(text || '').replace(/\s+/g, ' ').trim().slice(0, 100), t: now() };
  if (!m.text) return;
  chats.push(m); if (chats.length > 30) chats.shift(); bc(m);
}
setInterval(() => { for (const u of roster.values()) if (now() - u.last > IDLE_MS) { roster.delete(u.id); bc({ type: 'leave', id: u.id }); } }, 30e3);

wss.on('connection', ws => {
  send(ws, { type: 'hello', t: now(), seed: SEED, roster: [...roster.values()].map(pub), chats: chats.filter(c => now() - c.t < BUBBLE_MS) });
  ws.on('message', raw => { try { const m = JSON.parse(raw); if (m.type === 'ping') send(ws, { type: 'pong', c: m.c, t: now() }); } catch {} });
});

function startTikTok() {
  const lib = require('tiktok-live-connector');
  const V2 = !!lib.TikTokLiveConnection;                       // v2 ve v1 API'sini ikisini de destekler
  const conn = V2 ? new lib.TikTokLiveConnection(USER) : new lib.WebcastPushConnection(USER);
  const ev = (k2, k1) => V2 ? ((lib.WebcastEvent && lib.WebcastEvent[k2]) || k1) : k1;
  const U = d => d.user || d;
  conn.on(ev('CHAT', 'chat'), d => { const u = U(d); onChat(u.uniqueId, u.nickname || u.uniqueId, d.comment); });
  conn.on(ev('MEMBER', 'member'), d => { const u = U(d); touch(u.uniqueId, u.nickname || u.uniqueId); });
  conn.on(ev('GIFT', 'gift'), d => { const u = U(d); if (!touch(u.uniqueId, u.nickname || u.uniqueId)) return;
    bc({ type: 'gift', id: u.uniqueId, gift: d.giftName || (d.giftDetails && d.giftDetails.giftName) || 'gift', count: d.repeatCount || 1, t: now() }); });
  conn.on(ev('ERROR', 'error'), e => console.error('TikTok hata:', e && e.message || e));
  let retry = null;
  const go = () => conn.connect().then(s => console.log('TikTok bağlandı: oda', s.roomId)).catch(e => { console.error('Bağlanamadı (yayın açık mı?):', e.message || e); retry = setTimeout(go, 15e3); });
  conn.on(ev('DISCONNECTED', 'disconnected'), () => { clearTimeout(retry); retry = setTimeout(go, 10e3); });
  go();
}
function startDemo() {
  const names = ['Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Deniz', 'Ece'];
  const talk = ['merhaba!', 'selam herkese 👋', 'bu oda çok güzel', 'kim kazanacak?', 'takip ettim ❤️', 'çok uzun bir mesaj yazıyorum ki balon satırlara bölünsün ve nasıl göründüğünü görelim'];
  setInterval(() => { const n = names[Math.floor(Math.random() * names.length)]; onChat('demo_' + n.toLowerCase(), n, talk[Math.floor(Math.random() * talk.length)]); }, 2500);
  console.log('DEMO modu: sahte izleyiciler konuşuyor.');
}
server.listen(PORT, () => {
  console.log(`Sunucu :${PORT} üzerinde`);
  if (DEMO) startDemo(); else if (USER) startTikTok(); else console.log('TIKTOK_USERNAME verilmedi; DEMO=1 ile dene.');
});
