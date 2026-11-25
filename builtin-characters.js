// BU DOSYAYI SİLERSEN hazır (kodla çizilen) karakterler kaldırılır; başka bir şey bozulmaz.
(() => {
  const mk = (name, shirt, skin, hair, pants) => ({
    name,
    // c: ayakların olduğu noktaya taşınmış canvas context, t: zaman (sn)
    // f: {back:bool, sx:-1|0|1}, m: yürüyor mu
    draw(c, t, f, m) {
      const s = m ? Math.sin(t * 12) * 3 : 0, b = m ? Math.abs(Math.sin(t * 12)) * 2 : Math.sin(t * 2);
      c.fillStyle = pants;
      c.fillRect(-7, -12, 6, 12 - Math.max(0, -s)); c.fillRect(1, -12, 6, 12 - Math.max(0, s));
      c.fillStyle = shirt; c.fillRect(-9, -30 - b, 18, 19);
      c.fillRect(-13, -29 - b + s * .4, 4, 14); c.fillRect(9, -29 - b - s * .4, 4, 14);
      c.fillStyle = skin; c.fillRect(-8, -46 - b, 16, 16);
      c.fillStyle = hair; c.fillRect(-9, -48 - b, 18, f.back ? 17 : 7);
      if (!f.back) { c.fillStyle = '#263044'; c.fillRect(-5 + f.sx * 2, -39 - b, 3, 3); c.fillRect(2 + f.sx * 2, -39 - b, 3, 3); }
    }
  });
  window.BUILTIN_CHARACTERS = [
    mk('Miso', '#f97316', '#f2c9a5', '#493b3b', '#30394d'),
    mk('Piko', '#38bdf8', '#d9a47e', '#2b2220', '#3b3f57'),
    mk('Luna', '#c084fc', '#f0c5a2', '#7a3b2e', '#33304a'),
    mk('Tobi', '#a3e635', '#b97d5c', '#1c1c1c', '#3a4030')
  ];
})();
