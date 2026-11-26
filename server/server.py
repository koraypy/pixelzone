"""Pixelzone sunucusu (Python). server.js ile aynı protokol; ikisinden birini çalıştır.
Kurulum:  pip install TikTokLive websockets
Canlı:    set TIKTOK_USERNAME=kullaniciadin  &  python server.py      (PowerShell: $env:TIKTOK_USERNAME="kullaniciadin")
Deneme:   set DEMO=1  &  python server.py
"""
import asyncio, json, os, random, time
import websockets, logging
logging.getLogger("websockets").setLevel(logging.CRITICAL)  # WebSocket olmayan istekler (tarayıcıdan açma, tünel kontrolü) log kirletmesin

PORT = int(os.getenv("PORT", "8080"))
USER = os.getenv("TIKTOK_USERNAME", "").lstrip("@")
DEMO = os.getenv("DEMO") == "1"
MAX = int(os.getenv("MAX_CHARACTERS", "40"))
IDLE = int(os.getenv("IDLE_SECONDS", "180"))  # sessiz kalan karakter bu kadar sn sonra çıkar
SEED = int(os.getenv("SEED", "2026"))
BUBBLE = 6.0

roster, chats, clients = {}, [], set()
now = lambda: int(time.time() * 1000)
pub = lambda u: {k: u[k] for k in ("id", "name", "look", "joinedAt")}

async def bc(msg):
    data = json.dumps(msg, ensure_ascii=False)
    await asyncio.gather(*(c.send(data) for c in list(clients)), return_exceptions=True)

async def touch(uid, name):
    if not uid:
        return None
    u = roster.get(uid)
    if not u:
        if len(roster) >= MAX:
            old = min(roster.values(), key=lambda x: x["last"])
            del roster[old["id"]]
            await bc({"type": "leave", "id": old["id"]})
        u = {"id": uid, "name": name or uid, "look": random.randrange(2**31), "joinedAt": now(), "last": now()}
        roster[uid] = u
        await bc({"type": "join", "user": pub(u)})
    u["last"] = now()
    return u

async def on_chat(uid, name, text):
    if not await touch(uid, name):
        return
    text = " ".join(str(text or "").split())[:100]
    if not text:
        return
    m = {"type": "chat", "id": uid, "text": text, "t": now()}
    chats.append(m); del chats[:-30]
    await bc(m)

async def handler(ws):
    clients.add(ws)
    try:
        recent = [c for c in chats if now() - c["t"] < BUBBLE * 1000]
        await ws.send(json.dumps({"type": "hello", "t": now(), "seed": SEED,
                                  "roster": [pub(u) for u in roster.values()], "chats": recent}, ensure_ascii=False))
        async for raw in ws:
            try:
                m = json.loads(raw)
                if m.get("type") == "ping":
                    await ws.send(json.dumps({"type": "pong", "c": m.get("c"), "t": now()}))
            except Exception:
                pass
    finally:
        clients.discard(ws)

async def cleaner():
    while True:
        await asyncio.sleep(30)
        for u in list(roster.values()):
            if now() - u["last"] > IDLE * 1000:
                del roster[u["id"]]
                await bc({"type": "leave", "id": u["id"]})

async def demo():
    names = ["Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Burak", "Deniz", "Ece"]
    talk = ["merhaba!", "selam herkese 👋", "bu oda çok güzel", "takip ettim ❤️",
            "çok uzun bir mesaj yazıyorum ki balon satırlara bölünsün ve nasıl göründüğünü görelim"]
    print("DEMO modu: sahte izleyiciler konuşuyor.")
    while True:
        await asyncio.sleep(2.5)
        n = random.choice(names)
        await on_chat("demo_" + n.lower(), n, random.choice(talk))

async def tiktok():
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import CommentEvent, JoinEvent, GiftEvent, LikeEvent
    client = TikTokLiveClient(unique_id="@" + USER)
    nm = lambda u: getattr(u, "nickname", None) or getattr(u, "unique_id", None)

    @client.on(CommentEvent)
    async def _chat(e):
        await on_chat(e.user.unique_id, nm(e.user), e.comment)

    @client.on(JoinEvent)
    async def _join(e):
        await touch(e.user.unique_id, nm(e.user))

    @client.on(LikeEvent)
    async def _like(e):
        await touch(e.user.unique_id, nm(e.user))

    @client.on(GiftEvent)
    async def _gift(e):
        if await touch(e.user.unique_id, nm(e.user)):
            await bc({"type": "gift", "id": e.user.unique_id, "gift": getattr(e.gift, "name", "gift"),
                      "count": getattr(e, "repeat_count", 1), "diamonds": getattr(e.gift, "diamond_count", 0), "t": now()})

    while True:  # yayın kapalıysa/koparsa yeniden dene
        try:
            print("TikTok'a bağlanılıyor…")
            await client.connect()
        except Exception as ex:
            print("Bağlanamadı (yayın açık mı?):", ex)
        await asyncio.sleep(15)

async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT):
        print(f"Sunucu :{PORT} üzerinde")
        tasks = [cleaner()]
        if DEMO: tasks.append(demo())
        elif USER: tasks.append(tiktok())
        else: print("TIKTOK_USERNAME verilmedi; DEMO=1 ile dene.")
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
