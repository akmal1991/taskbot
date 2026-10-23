// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { Window } from 'happy-dom';
import { AuthProvider } from './AuthContext';
import { AppProvider, useApp } from './AppContext';
import { LoginPage } from '../components/LoginPage';
import { localizeText } from '../utils/i18n';
const window = new Window({ url:'https://unitask.example/' });
const previous = new Map(), realFetch = globalThis.fetch;
let createRoot, act, authenticated = false;
const emptyState = {users:[],departments:[],tasks:[],auditLogs:[],queueJobs:[],notifications:[],tickets:[],sections:[],workPlans:[],categories:[]};
beforeAll(async () => {
  for (const name of ['window','document','navigator','localStorage','HTMLElement','Event','MouseEvent']) {
    previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='window'?window:window[name]});
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/auth/me')) return new Response(JSON.stringify(authenticated ? {
      user:{id:'test-account',fullName:'Test account',role:'WORKER',email:'worker@example.test',phone:'',isTelegramBound:false},
      permissions:['tasks.start','tasks.submit'],csrfToken:'test-csrf',
    } : {error:'Please sign in to continue.'}),{status:authenticated?200:401});
    return new Response(JSON.stringify(emptyState));
  };
  ({createRoot} = await import('react-dom/client')); ({act} = await import('react'));
});
afterAll(() => {
  globalThis.fetch=realFetch; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  for (const [name,descriptor] of previous) descriptor ? Object.defineProperty(globalThis,name,descriptor) : delete globalThis[name];
  window.happyDOM.abort();
});
async function mount(element) {
  const container=window.document.createElement('div'); window.document.body.appendChild(container);
  const root=createRoot(container);
  await act(async()=>{root.render(element);await new Promise(resolve=>setTimeout(resolve,0));});
  return {container,root,unmount:async()=>{await act(async()=>root.unmount());container.remove();}};
}
describe('immediate and persistent language changes',()=>{
  it('switches the actual login form between separate Uzbek scripts without a reload',async()=>{
    authenticated=false;window.localStorage.clear();
    const page=await mount(<AuthProvider><LoginPage/></AuthProvider>);
    const change=async(language)=>{
      const select=page.container.querySelector('select');
      await act(async()=>{select.value=language;select.dispatchEvent(new window.Event('change',{bubbles:true}));});
      expect(window.document.documentElement.lang).toBe(language);
      const form=page.container.querySelector('form').textContent;
      expect(form).toContain(localizeText('Username or email',language));
      expect(form).toContain(localizeText('Sign in',language));
      if(language==='uz-Latn') expect(form).not.toMatch(/[А-Яа-яЁёҚқҒғЎўҲҳ]/);
    };
    for(const language of ['en','ru','uz-Cyrl','uz-Latn','uz-Cyrl']) await change(language);
    await page.unmount();
    const restored=await mount(<AuthProvider><LoginPage/></AuthProvider>);
    expect(restored.container.querySelector('select').value).toBe('uz-Cyrl');
    expect(restored.container.querySelector('form').textContent).toContain(localizeText('Sign in','uz-Cyrl'));
    await restored.unmount();
  });
  it('rerenders authenticated shared UI immediately, persists preferences, and leaves browser records untouched',async()=>{
    authenticated=true;window.localStorage.setItem('unitask_app_data_v1','original data must not change');
    window.localStorage.setItem('unitask_language','en');
    const Probe=()=>{
      const app=useApp();
      return <><p id="locale-label">{localizeText('Boshqaruv Paneli',app.language)}</p>
        <button id="cyr" onClick={()=>app.setLanguage('uz-Cyrl')}>change</button>
        <button id="lat" onClick={()=>app.setLanguage('uz-Latn')}>change</button></>;
    };
    const Authenticated=()=> <AppProvider><Probe/></AppProvider>;
    // Wait for AuthProvider's real asynchronous session-loading path before mounting protected data.
    const {useAuth}=await import('./AuthContext');
    const Gate=()=>useAuth().user?<Authenticated/>:null;
    const page=await mount(<AuthProvider><Gate/></AuthProvider>);
    expect(page.container.querySelector('#locale-label').textContent).toBe('Dashboard');
    await act(async()=>page.container.querySelector('#cyr').click());
    expect(page.container.querySelector('#locale-label').textContent).toBe('Бошқарув панели');
    await act(async()=>page.container.querySelector('#lat').click());
    expect(page.container.querySelector('#locale-label').textContent).not.toMatch(/[А-Яа-яЁёҚқҒғЎўҲҳ]/);
    expect(window.localStorage.getItem('unitask_language')).toBe('uz-Latn');
    expect(window.localStorage.getItem('unitask_app_data_v1')).toBe('original data must not change');
    await page.unmount();
  });
});
