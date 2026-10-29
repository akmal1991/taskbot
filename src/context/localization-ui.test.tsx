// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { Window } from 'happy-dom';
import { AuthProvider } from './AuthContext';
import { AppProvider, useApp } from './AppContext';
import { LoginPage } from '../components/LoginPage';
import { AdminPanel } from '../components/AdminPanel';
import { TaskRegister } from '../components/TaskRegister';
import { localizeText } from '../utils/i18n';
const window = new Window({ url:'https://unitask.example/' });
const previous = new Map(), realFetch = globalThis.fetch;
let createRoot, act, authenticated = false;
const emptyState = {users:[],departments:[],tasks:[],auditLogs:[],queueJobs:[],notifications:[],tickets:[],sections:[],workPlans:[],categories:[]};

it('selects an active assignee when inactive accounts appear first or data arrives after mount', async () => {
  const previousFetch = globalThis.fetch;
  const staff = [
    { id: 'inactive', fullName: 'Inactive worker', role: 'WORKER', roleLabel: 'WORKER', active: false },
    { id: 'active', fullName: 'Active worker', role: 'WORKER', roleLabel: 'WORKER', active: true, departmentId: 'dept' },
    { id: 'second', fullName: 'Second worker', role: 'WORKER', roleLabel: 'WORKER', active: true, departmentId: 'dept-two' },
  ];
  globalThis.fetch = async url => Response.json(String(url).endsWith('/auth/me') ? {
    user: { id: 'admin', role: 'ADMIN', fullName: 'Admin' }, permissions: ['tasks.create'], csrfToken: 'test',
  } : { ...emptyState, users: staff, departments: [{ id: 'dept', name: 'IT', active: true }, { id: 'dept-two', name: 'Research', active: true }] });
  const { useAuth } = await import('./AuthContext');
  const Gate = () => useAuth().user ? <AppProvider><TaskRegister /></AppProvider> : null;
  let page;
  try {
    page = await mount(<AuthProvider><Gate /></AuthProvider>);
    await act(async () => { [...page.container.querySelectorAll('button')].find(b => b.textContent.includes('Янги Топшириқ')).click(); });
    const assignee = [...page.container.querySelectorAll('select')].find(select => [...select.options].some(option => option.value === 'active'));
    expect(assignee.value).toBe('active');
    expect([...assignee.options].some(option => option.value === 'inactive')).toBe(false);
    expect(assignee.textContent).not.toContain('"},');
    const addAssignee = page.container.querySelector('select[aria-label="Add assignee"]');
    await act(async () => { addAssignee.value = 'second'; addAssignee.dispatchEvent(new window.Event('change', { bubbles: true })); });
    expect(page.container.querySelector('fieldset').textContent).toContain('Second worker');
    expect(page.container.querySelector('fieldset select[aria-label="Department"]').value).toBe('dept-two');
    expect([...addAssignee.options].some(option => option.value === 'second')).toBe(false);
  } finally { if (page) await page.unmount(); globalThis.fetch = previousFetch; }
});
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

it('submits the displayed Worker role without requiring a dropdown change', async () => {
  const previousFetch = globalThis.fetch;
  let submitted;
  window.localStorage.setItem('unitask_language', 'en');
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/auth/me')) return Response.json({
      user: { id: 'admin-test', fullName: 'Administrator', role: 'ADMIN' },
      permissions: ['users.manage'], csrfToken: 'test-csrf',
    });
    if (String(url).endsWith('/admin/overview')) return Response.json({
      ...emptyState, rolePermissions: { ADMIN: [], DIRECTOR: [], WORKER: [] },
      permissionCeilings: { ADMIN: [], DIRECTOR: [], WORKER: [] },
      imports: [], deliveries: [], settings: {}, stats: { tasks: 0, users: 0, departments: 0 },
    });
    if (String(url).endsWith('/admin/users') && options?.method === 'POST') {
      submitted = JSON.parse(options.body);
      return Response.json({ error: 'Test request captured' }, { status: 400 });
    }
    return Response.json(emptyState);
  };
  const { useAuth } = await import('./AuthContext');
  const Gate = () => useAuth().user ? <AppProvider><AdminPanel /></AppProvider> : null;
  let page;
  try {
    page = await mount(<AuthProvider><Gate /></AuthProvider>);
    const clickButton = async text => act(async () => {
      [...page.container.querySelectorAll('button')].find(button => button.textContent === text).click();
    });
    await clickButton('Users');
    await clickButton('Add user');
    const form = window.document.querySelector('form');
    expect(form.querySelector('select').value).toBe('WORKER');
    await act(async () => { form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
    expect(submitted.role).toBe('WORKER');
  } finally {
    if (page) await page.unmount();
    globalThis.fetch = previousFetch;
  }
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
