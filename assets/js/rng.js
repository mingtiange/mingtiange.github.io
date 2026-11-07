/**
 * 随机源
 * ------------------------------------------------------------
 * 1. 底层一律走 Web Crypto（操作系统熵池 + CSPRNG），不用 Math.random()。
 * 2. 每次取数都掺入高精度时间与用户手势累积的熵，使「此刻的手」进入种子。
 * 3. 取模用拒绝采样，避免 2^32 % n 造成的偏差。
 */

const cryptoObj = globalThis.crypto;
const buf = new Uint32Array(1);

let pool = new Uint32Array(1);
cryptoObj.getRandomValues(pool);

/** 用户手势熵：在 pointer/touch 移动时调用 */
export function stir(x, y, dt) {
  let v = pool[0];
  v ^= Math.imul((x | 0) + 1, 0x9e3779b1);
  v ^= Math.imul((y | 0) + 1, 0x85ebca6b);
  v ^= Math.imul(((dt || 0) * 1000) | 0, 0xc2b2ae35);
  v = Math.imul(v ^ (v >>> 15), 0x27d4eb2f);
  pool[0] = v >>> 0;
}

export class Rng {
  constructor(tag = "") {
    this.tag = tag;
  }

  /** 32 位均匀整数 */
  u32() {
    cryptoObj.getRandomValues(buf);
    const t = (performance.now() * 1000) | 0;
    let v = (buf[0] ^ t ^ pool[0]) >>> 0;
    pool[0] = Math.imul(v ^ (v >>> 13), 0x5bd1e995) >>> 0;
    return v >>> 0;
  }

  /** [0, n) 均匀整数 */
  int(n) {
    if (n <= 1) return 0;
    const limit = Math.floor(0x100000000 / n) * n;
    let v;
    do {
      v = this.u32();
    } while (v >= limit);
    return v % n;
  }
}
