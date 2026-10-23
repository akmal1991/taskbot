import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { verifyTelegramInitData } from './telegramAuth';

const BOT_TOKEN = 'test-only-bot-token';
const NOW = 1_800_000_000;

function signedInitData(authDate: number): string {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'AAEAAExample',
    user: JSON.stringify({
      id: 123456789,
      first_name: 'Test',
      username: 'tester',
    }),
  });
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

test('accepts initData with a valid Telegram HMAC signature and fresh auth_date', () => {
  const result = verifyTelegramInitData(signedInitData(NOW - 60), BOT_TOKEN, { nowSeconds: NOW });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.id, 123456789);
    assert.equal(result.authDate, NOW - 60);
  }
});

test('rejects initData with an invalid HMAC signature', () => {
  const params = new URLSearchParams(signedInitData(NOW));
  params.set('user', JSON.stringify({ id: 999, first_name: 'Forged' }));
  const result = verifyTelegramInitData(params.toString(), BOT_TOKEN, { nowSeconds: NOW });
  assert.equal(result.ok, false);
});

test('rejects correctly signed initData after the freshness window', () => {
  const result = verifyTelegramInitData(
    signedInitData(NOW - 24 * 60 * 60 - 1),
    BOT_TOKEN,
    { nowSeconds: NOW },
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /expired/i);
});

test('rejects initData with an auth_date too far in the future', () => {
  const result = verifyTelegramInitData(signedInitData(NOW + 31), BOT_TOKEN, { nowSeconds: NOW });
  assert.equal(result.ok, false);
});

test('rejects duplicate fields and missing bot tokens', () => {
  const signed = signedInitData(NOW);
  assert.equal(verifyTelegramInitData(`${signed}&auth_date=${NOW}`, BOT_TOKEN, { nowSeconds: NOW }).ok, false);
  assert.equal(verifyTelegramInitData(signed, '', { nowSeconds: NOW }).ok, false);
});
