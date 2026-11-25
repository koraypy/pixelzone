KENDİ KARAKTERİNİ EKLEME
1) Sprite PNG dosyanı bu klasöre koy (örn. assets/characters/ayse.png).
2) Proje kökündeki characters.json içindeki "characters" listesine ekle:

{
  "maxCharacters": 4,
  "characters": [
    { "name": "Ayşe", "image": "assets/characters/ayse.png",
      "frameW": 32, "frameH": 48, "cols": 4, "scale": 1.5 }
  ]
}

Sprite sheet düzeni (satır = yön, sütun = yürüme karesi):
  satır 0: aşağı (ekrana doğru)   satır 1: sol
  satır 2: sağ                    satır 3: yukarı
Tek satırlık sheet ya da tek kare görsel de olur (rows otomatik anlaşılır).
Dosyadan gelen karakterler önceliklidir; kalan yerleri builtin-characters.js doldurur.
"maxCharacters" odada aynı anda görünecek toplam karakter sayısıdır.
