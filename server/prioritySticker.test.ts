import { expect, it } from 'bun:test';
import { gunzipSync } from 'node:zlib';
import { priorityLabels, prioritySticker } from './prioritySticker';

it('creates distinct Telegram priority badges within animated sticker limits', () => {
  const artwork = new Set<string>();
  for (const priority of ['CRITICAL','HIGH','MEDIUM','LOW']) {
    const buffer = prioritySticker(priority);
    expect(buffer.byteLength).toBeLessThan(64*1024);
    const animation = JSON.parse(gunzipSync(buffer).toString());
    expect(animation.w).toBe(512); expect(animation.h).toBe(512);
    expect(animation.fr).toBe(60); expect(animation.op/animation.fr).toBeLessThanOrEqual(3);
    expect(priorityLabels[priority]).toContain(priority);
    artwork.add(buffer.toString('base64'));
  }
  expect(artwork.size).toBe(4);
});
