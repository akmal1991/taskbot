import { gzipSync } from 'node:zlib';

export const priorityLabels: Record<string, string> = {
  CRITICAL: '🔴 JUDA MUHIM (CRITICAL)', HIGH: '🟠 YUQORI (HIGH)',
  MEDIUM: '🔵 O‘RTACHA (MEDIUM)', LOW: '⚪ PAST (LOW)',
};
const colors: Record<string, number[]> = {
  CRITICAL: [0.9, 0.05, 0.2, 1], HIGH: [1, 0.42, 0.05, 1],
  MEDIUM: [0.03, 0.48, 0.91, 1], LOW: [0.45, 0.5, 0.6, 1],
};
// Original vector artwork: a gently pulsing priority badge, exported as Telegram's TGS format.
export function prioritySticker(priority: string): Buffer {
  const fill = (color: number[]) => ({ ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 });
  return gzipSync(JSON.stringify({ v: '5.7.4', tgs: 1, fr: 60, ip: 0, op: 120, w: 512, h: 512, nm: 'UniTask priority', assets: [],
    layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'Priority badge', sr: 1, ip: 0, op: 120, st: 0, bm: 0,
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [256, 256, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [92, 92, 100], e: [100, 100, 100], i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } },
          { t: 60, s: [100, 100, 100], e: [92, 92, 100], i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } },
          { t: 120, s: [92, 92, 100] },
        ] } },
      shapes: [
        { ty: 'gr', it: [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [448, 448] } }, fill([1, 1, 1, 1])] },
        { ty: 'gr', it: [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [416, 416] } }, fill(colors[priority] || colors.MEDIUM)] },
        { ty: 'gr', it: [{ ty: 'rc', p: { a: 0, k: [0, -40] }, s: { a: 0, k: [48, 172] }, r: { a: 0, k: 24 } }, fill([1, 1, 1, 1])] },
        { ty: 'gr', it: [{ ty: 'el', p: { a: 0, k: [0, 100] }, s: { a: 0, k: [52, 52] } }, fill([1, 1, 1, 1])] },
      ].reverse(),
    }],
  }));
}
