/// <reference types="bun" />
import { afterEach, expect, test } from 'bun:test';
import { api, ApiError, setCsrfToken } from './api';
const originalFetch = globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch;setCsrfToken('');});
test('uses server sessions and CSRF without trusting client identity',async()=>{
  setCsrfToken('session-csrf');let options:RequestInit|undefined;
  globalThis.fetch=(async(_url,init)=>{options=init;return new Response('{"ok":true}');}) as typeof fetch;
  expect(await api('/example',{method:'POST',body:'{}'})).toEqual({ok:true});
  expect(new Headers(options?.headers).get('X-CSRF-Token')).toBe('session-csrf');
  expect(options?.credentials).toBe('same-origin');expect(options?.cache).toBe('no-store');
});
test('turns network failures into a stable translatable error',async()=>{
  globalThis.fetch=(async()=>{throw new TypeError('Failed to fetch');}) as unknown as typeof fetch;
  await expect(api('/state')).rejects.toMatchObject({message:'Network unavailable. Check your connection and retry.',status:0});
});
test('rejects malformed successful responses instead of reporting a successful mutation',async()=>{
  for(const body of ['not JSON','null','42']) {
    globalThis.fetch=(async()=>new Response(body)) as unknown as typeof fetch;
    await expect(api('/tasks',{method:'POST',body:'{}'})).rejects.toBeInstanceOf(ApiError);
  }
});
test('normalizes invalid error bodies without passing render-unsafe objects into the UI',async()=>{
  globalThis.fetch=(async()=>new Response('{"error":{"private":"details"}}',{status:500})) as unknown as typeof fetch;
  await expect(api('/state')).rejects.toMatchObject({message:'Request failed.',status:500});
});

test('preserves invalid field names so the form can identify a rejected username',async()=>{
  globalThis.fetch=(async()=>Response.json({error:'Invalid form values. Check required fields and formats.',fields:[{field:'username',code:'invalid_format'},null,{field:{private:'data'}}]},{status:400})) as unknown as typeof fetch;
  await expect(api('/admin/users',{method:'POST',body:'{}'})).rejects.toMatchObject({status:400,fields:[{field:'username',code:'invalid_format'}]});
});
