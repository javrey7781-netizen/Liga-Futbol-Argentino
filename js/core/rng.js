/* ============================================================
   LigaSim Argentina — Generador pseudoaleatorio determinístico
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createRng(seed) {
    const next = mulberry32(seed);
    return {
      next,
      int(min, max) {
        return Math.floor(next() * (max - min + 1)) + min;
      },
      pick(arr) {
        return arr[Math.floor(next() * arr.length)];
      },
      shuffle(arr) {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      },
      chance(p) {
        return next() < p;
      },
      poisson(lambda) {
        const limit = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
          k++;
          p *= next();
        } while (p > limit && k < 40);
        return k - 1;
      }
    };
  }

  LAS.rng = { hashString, createRng };
})();
