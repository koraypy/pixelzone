# Pixelzone — Taht Salonu (TikTok canlı yayın entegrasyonu)

İki parça var:
- **Site** (`index.html`, `characters.json`, `builtin-characters.js`, `assets/`) → GitHub Pages'te durur.
- **Sunucu** (`server/`) → TikTok yayınını dinler, karakterleri tutar, herkese dağıtır. GitHub Pages'te ÇALIŞMAZ; senin bilgisayarında ya da bir bulutta çalışır.

Sunucu varken herkes aynı sahneyi görür: karakter listesi ve saat sunucudan gelir.
Sunucu yokken site eskisi gibi çevrimdışı çalışır (yerel 4 karakter).

## Hızlı deneme (TikTok'suz)
```
cd server && npm install
DEMO=1 node server.js          # sahte izleyiciler konuşur
```
Sonra siteyi şu adresle aç: `https://koraypy.github.io/pixelzone/?server=ws://localhost:8080`
(Aynı bilgisayarda localhost'a bağlanmak tarayıcıda çalışır; Safari engelleyebilir, Chrome önerilir.)

## Canlı yayın
```
cd server && npm install
TIKTOK_USERNAME=kullaniciadin node server.js
```
Yayın AÇIKKEN başlat. Bağlanamazsa 15 sn'de bir yeniden dener.

## Başkaları da bağlansın (herkese açık)
GitHub Pages `https` olduğu için sunucu adresi `wss://` olmalı:
- **Kolay:** bilgisayarında `cloudflared tunnel --url http://localhost:8080` çalıştır, verdiği `https://xxx.trycloudflare.com` adresini `wss://xxx.trycloudflare.com` yap.
- **Kalıcı:** `server/` klasörünü Render / Railway / Fly.io gibi bir yere koy (start: `node server.js`).
  Not: TikTok bulut IP'lerini sık engeller; sunucuyu kendi bilgisayarında çalıştırıp tünelle açmak daha güvenilirdir.

Adresi sabitlemek için `characters.json` içinde `"server": "wss://..."` yaz (`?server=` her zaman önceliklidir).

## Karakterler
- Her izleyiciye rastgele ama sabit bir görünüm verilir (aynı kişi hep aynı karakter).
- Üstünde TikTok adı (nickname) yazar; sohbete yazdığı mesaj 6 sn balon olarak çıkar.
- `characters.json` içine sprite eklersen izleyicilere onlardan atanır (`assets/characters/README.txt`).
  Sprite yoksa `builtin-characters.js` rastgele renkli figür üretir; o dosyayı da silersen gri yedek figür kullanılır.
- Sunucu ayarları: `MAX_CHARACTERS` (40), 15 dk sessiz kalan karakter çıkar, `SEED`.

## Sıradaki adımlar için hazır noktalar
- Bağış: sunucu `{type:'gift', id, gift, count}` yayınlar; istemcide `handle()` içinde `gift` dalı eylem eklemek için hazır.
- Her olay sunucu zamanıyla damgalı; herkes aynı anda aynı olayı görür.

## Windows / Python alternatifi
Node yerine Python da kullanabilirsin (aynı protokol, site değişmez):
```
pip install TikTokLive websockets
set TIKTOK_USERNAME=kullaniciadin
python server\server.py
```
(PowerShell: `$env:TIKTOK_USERNAME="kullaniciadin"; python server\server.py`) · Deneme: `set DEMO=1`
Tünel için Windows'ta `cloudflared.exe tunnel --url http://localhost:8080`.

## Telefondan açınca
- Telefonda `localhost` telefonun kendisidir; bilgisayardaki sunucuya bağlanamaz. Tünel adresini (`wss://xxx.trycloudflare.com`) kullan.
- `https` sayfa `ws://` adrese bağlanamaz; mutlaka `wss://`.
- Sorun varsa adresin sonuna `&debug` ekle (ör. `?server=wss://...&debug`): bağlantı durumu ve hata ekranda yazar.

## Çıkan karakterler ve hediyeler
- TikTok "çıktı" olayı vermediği için karakter, **180 sn** (`IDLE_SECONDS`) boyunca yazma/beğeni/hediye/giriş yapmazsa 1 sn'de silinip kaybolur.
  Daha hızlı silinsin istersen sunucuyu `IDLE_SECONDS=60` ile başlat.
- **Hediyeler:** Gül (Rose) atan kişinin balonu pembe vurgulu olur, anında "🌹 Gül" balonu çıkar,
  sonraki mesajları da 120 sn boyunca vurgulu kalır, ismi de pembeleşir. Başka hediyeler altın renkli.
  Yeni hediye stili için `index.html` içindeki `GIFT_STYLES` listesine satır ekle (anahtar: hediye adı, küçük harf).
