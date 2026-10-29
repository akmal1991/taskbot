// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID, createHmac } from 'node:crypto';
import { createApplication } from './app';
import { hashPassword, verifyPassword, digest } from './security';

const schema = `unitask_test_${randomUUID().replaceAll('-', '')}`;
const password = `${randomUUID()}-Test-only`;
const botToken = 'synthetic-test-token-not-a-real-credential';
let database, base, server, admin, director, worker, other;
async function request(client, path, method = 'GET', body, extra = {}) {
  const headers = { ...(client?.cookie ? { Cookie: client.cookie, 'X-CSRF-Token': client.csrf } : {}), ...extra };
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}/api${path}`, { method, headers, ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json().catch(() => null), response };
}
async function login(identifier, pass = password) {
  const result = await request(null, '/auth/login', 'POST', { identifier, password: pass });
  expect(result.status).toBe(200);
  expect(result.response.headers.get('set-cookie')).toContain('HttpOnly');
  return { cookie: result.response.headers.get('set-cookie').split(';')[0], csrf: result.body.csrfToken, user: result.body.user };
}
const inputTask = (code, extra = {}) => ({
  planCode: code, title: `Task ${code}`, description: 'Real persisted task description.', assignedToId: 'worker', departmentId: 'dept',
  approverId: 'director', priority: 'HIGH', deadline: '2028-12-31', ...extra,
});
async function create(code, extra = {}) {
  const result = await request(admin, '/tasks', 'POST', inputTask(code, extra));
  expect(result.status).toBe(201); return result.body.task;
}
async function taskFor(client, id) {
  return (await request(client, '/state')).body.tasks.find(t => t.id === id);
}
const signedTelegram = (id, age = 0) => {
  const params = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000) - age), user: JSON.stringify({ id, first_name: 'Test user' }) });
  const data = [...params].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256','WebAppData').update(botToken).digest();
  params.set('hash', createHmac('sha256', secret).update(data).digest('hex')); return params.toString();
};
beforeAll(async () => {
  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1')
    throw new Error('Integration tests require a development database and refuse production.');
  const setup = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await setup.query(`CREATE SCHEMA "${schema}"`); await setup.end();
  database = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}`, max: 5 });
  await database.query(await readFile(new URL('../migrations/001_secure_core.sql', import.meta.url), 'utf8'));
  await database.query("INSERT INTO ut_departments(id,code,name) VALUES('dept','D1','Test department')");
  const hash = await hashPassword(password);
  for (const [id, role] of [['admin','ADMIN'],['director','DIRECTOR'],['worker','WORKER'],['other','WORKER']]) {
    await database.query('INSERT INTO ut_users(id,username,email,full_name,role,department_id,password_hash,active) VALUES($1,$1,$2,$1,$3,$4,$5,true)', [id, `${id}@example.test`, role, 'dept', hash]);
    await database.query("INSERT INTO ut_memberships(user_id,department_id) VALUES($1,'dept')", [id]);
  }
  server = createApplication(database, { telegramBotToken: botToken }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
  admin = await login('admin'); director = await login('director@example.test'); worker = await login('worker'); other = await login('other');
}, 30000);
afterAll(async () => {
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  if (database) {
    await database.end();
    const cleanup = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    // Only the randomly named schema created by this test is removed; application tables are untouched.
    await cleanup.query(`DROP SCHEMA "${schema}" CASCADE`); await cleanup.end();
  }
});
describe('server authentication and fixed-role isolation', () => {
  it('tracks cross-department participants independently and shares only submitted evidence', async () => {
    await database.query("INSERT INTO ut_departments(id,code,name) VALUES('team-dept','TEAM','Second department')");
    await database.query("INSERT INTO ut_memberships(user_id,department_id) VALUES('other','team-dept')");
    const created = await request(admin, '/tasks', 'POST', inputTask('TEAM-TASK', { additionalAssignees: [{ userId: 'other', departmentId: 'team-dept' }] }));
    expect(created.status).toBe(201);
    const taskId = created.body.task.id;
    expect(created.body.task.assignments).toHaveLength(2);
    expect((await taskFor(other, taskId)).assignedToId).toBe('other');
    expect((await taskFor(other, taskId)).departmentId).toBe('team-dept');
    const start = async client => { const t = await taskFor(client, taskId); expect((await request(client, `/tasks/${taskId}/start`, 'POST', { version: t.version })).status).toBe(200); };
    await start(worker);
    expect((await taskFor(other, taskId)).status).toBe('ASSIGNED');
    await start(other);
    const file = new FormData(); file.append('file', new Blob(['%PDF-1.4\nTeam evidence'], { type: 'application/pdf' }), 'team.pdf');
    const uploaded = await request(worker, `/tasks/${taskId}/attachments`, 'POST', file);
    expect(uploaded.status).toBe(201);
    expect((await request(other, `/attachments/${uploaded.body.id}`)).status).toBe(404);
    const submit = async (client, extra = {}) => {
      const t = await taskFor(client, taskId);
      const result = await request(client, `/tasks/${taskId}/evidence`, 'POST', { version: t.version, type: 'TEXT_NOTE', note: 'Completed my department contribution with supporting details.', ...extra });
      expect(result.status).toBe(201);
    };
    await submit(worker, { type: 'DOCUMENT', attachmentId: uploaded.body.id });
    expect((await request(other, `/attachments/${uploaded.body.id}`)).status).toBe(200);
    expect((await taskFor(other, taskId)).proofs[0].submittedById).toBe('worker');
    expect((await taskFor(other, taskId)).status).toBe('IN_PROGRESS');
    await submit(other);
    const review = async (author, decision) => {
      const t = await taskFor(director, taskId);
      const proof = t.proofs.find(p => p.submittedById === author && p.status === 'PENDING');
      expect((await request(director, `/tasks/${taskId}/reviews`, 'POST', { version: t.version, evidenceId: proof.id, decision, remarks: 'Department contribution reviewed.' })).status).toBe(200);
    };
    await review('worker', 'REJECTED');
    expect((await taskFor(worker, taskId)).status).toBe('IN_PROGRESS');
    expect((await taskFor(other, taskId)).status).toBe('SUBMITTED_FOR_REVIEW');
    await review('other', 'APPROVED');
    expect((await taskFor(admin, taskId)).status).toBe('IN_PROGRESS');
    expect((await taskFor(other, taskId)).status).toBe('COMPLETED');
    await submit(worker);
    await review('worker', 'APPROVED');
    const complete = await taskFor(admin, taskId);
    expect(complete.status).toBe('COMPLETED'); expect(complete.progressPercent).toBe(100);
    expect(complete.proofs).toHaveLength(3);
    const noticeCount = await database.query("SELECT count(*)::int AS count FROM ut_notifications WHERE task_id=$1 AND type='NEW_ASSIGNMENT'", [taskId]);
    expect(noticeCount.rows[0].count).toBe(2);
    const duplicate = await request(admin, '/tasks', 'POST', inputTask('TEAM-DUPLICATE', { additionalAssignees: [{ userId: 'worker', departmentId: 'dept' }] }));
    expect(duplicate.status).toBe(400);
    const invalid = await request(admin, '/tasks', 'POST', inputTask('TEAM-INVALID', { additionalAssignees: [{ userId: 'worker', departmentId: 'team-dept' }] }));
    expect(invalid.status).toBe(400);
    const selfReview = await request(admin, '/tasks', 'POST', inputTask('TEAM-SELF', { additionalAssignees: [{ userId: 'director', departmentId: 'dept' }] }));
    expect(selfReview.status).toBe(400);
    const withoutReview = await request(admin, '/tasks', 'POST', inputTask('TEAM-NO-REVIEW', { requiresApproval: false, additionalAssignees: [{ userId: 'other', departmentId: 'team-dept' }] }));
    expect(withoutReview.status).toBe(201);
    for (const member of [worker, other]) {
      let t = await taskFor(member, withoutReview.body.task.id);
      expect((await request(member, `/tasks/${t.id}/start`, 'POST', { version: t.version })).status).toBe(200);
      t = await taskFor(member, t.id);
      expect((await request(member, `/tasks/${t.id}/evidence`, 'POST', { version: t.version, type: 'TEXT_NOTE', note: 'My separate contribution has been completed in full.' })).status).toBe(201);
      expect((await taskFor(admin, t.id)).status).toBe(member === worker ? 'IN_PROGRESS' : 'COMPLETED');
    }
    const outsiderHash = await hashPassword(password);
    await database.query("INSERT INTO ut_users(id,username,email,full_name,role,password_hash,active) VALUES('team-outsider','team-outsider','outsider@example.test','Outsider','WORKER',$1,true)", [outsiderHash]);
    const outsider = await login('team-outsider');
    expect(await taskFor(outsider, taskId)).toBeUndefined();
    expect((await request(outsider, `/attachments/${uploaded.body.id}`)).status).toBe(404);
  });
  it('identifies duplicate usernames and emails without changing the existing account', async () => {
    const input = { username: 'WORKER', email: 'unique-account@example.test', fullName: 'Duplicate test', role: 'WORKER' };
    const usernameConflict = await request(admin, '/admin/users', 'POST', input);
    expect(usernameConflict.status).toBe(409);
    expect(usernameConflict.body.fields).toEqual([{ field: 'username', code: 'duplicate' }]);
    const emailConflict = await request(admin, '/admin/users', 'POST', { ...input, username: 'unique-account', email: 'WORKER@example.test' });
    expect(emailConflict.status).toBe(409);
    expect(emailConflict.body.fields).toEqual([{ field: 'email', code: 'duplicate' }]);
    const original = await database.query("SELECT full_name,role FROM ut_users WHERE id='worker'");
    expect(original.rows[0]).toEqual({ full_name: 'worker', role: 'WORKER' });
  });
  it('uses a verified memory-hard password hash rather than plaintext', async () => {
    const stored = (await database.query("SELECT password_hash FROM ut_users WHERE id='admin'")).rows[0].password_hash;
    expect(stored).toStartWith('scrypt$131072$8$1$'); expect(stored).not.toContain(password);
    expect(await verifyPassword(password, stored)).toBe(true); expect(await verifyPassword('wrong password', stored)).toBe(false);
  });
  it('rejects unauthenticated API/Telegram calls and bad credentials', async () => {
    for (const path of ['/state','/admin/overview']) expect((await request(null, path)).status).toBe(401);
    expect((await request(null, '/telegram/authorize-action','POST', { initData: signedTelegram(1001), action: 'SESSION_CHECK' })).status).toBe(401);
    expect((await request(null, '/auth/login','POST', { identifier: 'admin', password: 'wrong password' })).status).toBe(401);
    expect((await request(null, '/auth/login','POST', { identifier: 'unknown', password })).status).toBe(401);
  });
  it('enforces CSRF, same-origin requests, and DIRECTOR/WORKER security boundaries', async () => {
    expect((await request(admin, '/auth/logout','POST', {}, { 'X-CSRF-Token': '' })).status).toBe(403);
    expect((await request(admin, '/admin/users','POST', {}, { Origin: 'https://attacker.example' })).status).toBe(403);
    for (const c of [director, worker]) {
      expect((await request(c,'/admin/overview')).status).toBe(403);
      expect((await request(c,'/admin/users','POST', {})).status).toBe(403);
      expect((await request(c,'/admin/role-permissions/WORKER','PUT', { permissions:['users.manage'] })).status).toBe(403);
    }
    expect((await request(admin,'/admin/role-permissions/WORKER','PUT', { permissions:['users.manage'] })).status).toBe(400);
    expect((await request(admin,'/admin/users','POST', { username:'legacy',email:'legacy@example.test',fullName:'Legacy',role:'HEAD' })).status).toBe(400);
  });
  it('protects the last administrator from disablement and demotion', async () => {
    expect((await request(admin,'/admin/users/admin','PATCH',{active:false})).status).toBe(409);
    expect((await request(admin,'/admin/users/admin','PATCH',{role:'WORKER'})).status).toBe(409);
  });
  it('creates accounts without passwords, activates securely, expires/resets tokens, and disables sessions', async () => {
    const made = await request(admin,'/admin/users','POST',{username:'newworker',email:'newworker@example.test',fullName:'New worker',role:'WORKER',departmentId:'dept'});
    expect(made.status).toBe(201); expect(made.body.user.active).toBe(false);
    expect((await request(null,'/auth/login','POST',{identifier:'newworker',password})).status).toBe(401);
    const token = made.body.token;
    expect((await request(null,'/auth/setup-password','POST',{token,password})).status).toBe(200);
    expect((await request(null,'/auth/setup-password','POST',{token,password})).status).toBe(400);
    const account = await login('newworker'), userId = made.body.user.id;
    expect((await request(account,'/auth/me')).body.user.role).toBe('WORKER');
    const expired = await request(admin,`/admin/users/${userId}/reset`,'POST',{purpose:'RESET'});
    await database.query('UPDATE ut_account_tokens SET expires_at=now()-interval \'1 second\' WHERE token_hash=$1',[digest(expired.body.token)]);
    expect((await request(null,'/auth/setup-password','POST',{token:expired.body.token,password})).status).toBe(400);
    const reset = await request(admin,`/admin/users/${userId}/reset`,'POST',{purpose:'RESET'});
    expect((await request(null,'/auth/setup-password','POST',{token:reset.body.token,password})).status).toBe(200);
    expect((await request(account,'/state')).status).toBe(401);
    const fresh = await login('newworker');
    expect((await request(admin,`/admin/users/${userId}`,'PATCH',{active:false})).status).toBe(200);
    expect((await request(fresh,'/state')).status).toBe(401);
    expect((await request(null,'/auth/login','POST',{identifier:'newworker',password})).status).toBe(401);
  });
  it('revokes logout and expired sessions rather than trusting the cookie', async () => {
    const session = await login('other');
    expect((await request(session,'/auth/logout','POST',{})).status).toBe(200);
    expect((await request(session,'/state')).status).toBe(401);
    const expired = await login('other');
    await database.query('UPDATE ut_sessions SET expires_at=now()-interval \'1 second\' WHERE token_hash=$1',[digest(expired.cookie.split('=')[1])]);
    expect((await request(expired,'/state')).status).toBe(401);
  });
});
describe('transactional tasks, evidence, and review lifecycle', () => {
  it('scopes worker records, checks owners, enforces versions, and preserves rejection/resubmission history', async () => {
    let task = await create('LIFECYCLE');
    expect((await request(other,'/state')).body.tasks.some(t => t.id === task.id)).toBe(false);
    expect((await request(other,`/tasks/${task.id}/start`,'POST',{version:task.version})).status).toBe(404);
    expect((await request(director,`/tasks/${task.id}/start`,'POST',{version:task.version})).status).toBe(403);
    expect((await request(worker,`/tasks/${task.id}`,'PATCH',{version:task.version,title:'unauthorized'})).status).toBe(403);
    expect((await request(worker,`/tasks/${task.id}/start`,'POST',{version:task.version})).status).toBe(200);
    expect((await request(worker,`/tasks/${task.id}/progress`,'POST',{version:task.version,progressPercent:20})).status).toBe(409);
    task = await taskFor(worker,task.id);
    expect((await request(worker,`/tasks/${task.id}/progress`,'POST',{version:task.version,progressPercent:100})).status).toBe(400);
    expect((await request(worker,`/tasks/${task.id}/progress`,'POST',{version:task.version,progressPercent:40})).status).toBe(200);
    task = await taskFor(worker,task.id);
    expect((await request(worker,`/tasks/${task.id}/evidence`,'POST',{version:task.version,type:'DOCUMENT',note:'A complete evidence note for review.'})).status).toBe(400);
    const upload = new FormData(); upload.append('file', new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0])],{type:'image/png'}),'proof.png');
    const attachment = await request(worker,`/tasks/${task.id}/attachments`,'POST',upload); expect(attachment.status).toBe(201);
    expect((await request(other,`/attachments/${attachment.body.id}`)).status).toBe(404);
    expect((await request(worker,`/tasks/${task.id}/evidence`,'POST',{version:task.version,type:'IMAGE',attachmentId:attachment.body.id,note:'A complete evidence note for review.'})).status).toBe(201);
    task = await taskFor(worker,task.id); expect(task.status).toBe('SUBMITTED_FOR_REVIEW');
    const firstEvidence = task.proofs[0].id;
    expect((await request(worker,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:firstEvidence,decision:'APPROVED',remarks:'Self approval'})).status).toBe(403);
    expect((await request(director,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:'absent',decision:'APPROVED',remarks:'Review'})).status).toBe(409);
    expect((await request(director,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:firstEvidence,decision:'REJECTED',remarks:'Please add the missing result.'})).status).toBe(200);
    task = await taskFor(worker,task.id); expect(task.status).toBe('IN_PROGRESS'); expect(task.proofs[0].status).toBe('REJECTED');
    expect((await request(worker,`/tasks/${task.id}/evidence`,'POST',{version:task.version,type:'TEXT_NOTE',note:'Revised evidence with all requested results.'})).status).toBe(201);
    task = await taskFor(director,task.id); expect(task.proofs.length).toBe(2);
    expect((await request(director,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:firstEvidence,decision:'APPROVED',remarks:'Older evidence'})).status).toBe(409);
    expect((await request(director,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:task.proofs[0].id,decision:'APPROVED',remarks:'Results satisfy the acceptance criteria.'})).status).toBe(200);
    task = await taskFor(admin,task.id); expect(task.status).toBe('COMPLETED'); expect(task.progressPercent).toBe(100);
    expect((await request(director,`/tasks/${task.id}`,'PATCH',{version:task.version,title:'Silent edit'})).status).toBe(403);
    expect((await request(admin,`/tasks/${task.id}`,'PATCH',{version:task.version,title:'Silent edit'})).status).toBe(403);
    expect((await request(admin,`/tasks/${task.id}`,'PATCH',{version:task.version,title:'Corrected title',reason:'Correcting a documented typographical error.'})).status).toBe(200);
    task = await taskFor(admin,task.id);
    expect((await request(admin,`/tasks/${task.id}/archive`,'POST',{version:task.version,reason:'Archive completed record'})).status).toBe(200);
    expect((await request(worker,'/state')).body.tasks.some(t => t.id === task.id)).toBe(false);
    expect((await request(worker,`/attachments/${attachment.body.id}`)).status).toBe(404);
    task = await taskFor(admin,task.id);
    expect((await request(admin,`/tasks/${task.id}/restore`,'POST',{version:task.version,reason:'Restore record'})).status).toBe(200);
    task = await taskFor(admin,task.id);
    expect((await request(admin,`/tasks/${task.id}`,'DELETE',{version:task.version,reason:'Not a draft'})).status).toBe(409);
    expect((await request(worker,'/state')).body.users.every(u => u.id === 'worker')).toBe(true);
  });
  it('never permits self-approval even for administrators', async () => {
    let task = await create('ADMIN-SELF',{assignedToId:'admin',approverId:'director'});
    await request(admin,`/tasks/${task.id}/start`,'POST',{version:task.version}); task = await taskFor(admin,task.id);
    await request(admin,`/tasks/${task.id}/evidence`,'POST',{version:task.version,type:'TEXT_NOTE',note:'Administrator evidence awaiting independent review.'});
    task = await taskFor(admin,task.id);
    expect((await request(admin,`/tasks/${task.id}/reviews`,'POST',{version:task.version,evidenceId:task.proofs[0].id,decision:'APPROVED',remarks:'Self review'})).status).toBe(403);
  });
  it('keeps defaults out of partial updates and supports safe draft deletion', async () => {
    let task = await create('DRAFT',{draft:true,requiresApproval:false,requiresEvidence:false});
    expect((await request(admin,`/tasks/${task.id}`,'PATCH',{version:task.version,priority:'LOW'})).status).toBe(200);
    task = await taskFor(admin,task.id); expect(task.draft).toBe(true); expect(task.requiresApproval).toBe(false); expect(task.requiresEvidence).toBe(false);
    expect((await request(admin,`/tasks/${task.id}`,'DELETE',{version:task.version,reason:'Unused draft'})).status).toBe(200);
    const published = await create('PUBLISHED');
    expect((await request(admin,`/tasks/${published.id}`,'PATCH',{version:published.version,draft:true})).status).toBe(409);
  });
  it('enforces prerequisites, cycle protection, and explicit no-evidence/no-approval policies', async () => {
    const prerequisite = await create('PREREQUISITE');
    let task = await create('DEPENDENT',{dependsOnIds:[prerequisite.id]});
    expect((await request(worker,`/tasks/${task.id}/start`,'POST',{version:task.version})).status).toBe(409);
    expect((await request(admin,`/tasks/${prerequisite.id}`,'PATCH',{version:prerequisite.version,dependsOnIds:[task.id]})).status).toBe(400);
    task = await create('NO-REVIEW',{requiresEvidence:false,requiresApproval:false});
    await request(worker,`/tasks/${task.id}/start`,'POST',{version:task.version}); task = await taskFor(worker,task.id);
    expect((await request(worker,`/tasks/${task.id}/evidence`,'POST',{version:task.version,type:'TEXT_NOTE'})).status).toBe(201);
    expect((await taskFor(worker,task.id)).status).toBe('COMPLETED');
    expect((await database.query("SELECT id FROM ut_notifications WHERE task_id=$1 AND type='PROOF_REVIEW_REQUEST'",[task.id])).rowCount).toBe(0);
  });
  it('enforces append-only audit, evidence, and review records in PostgreSQL', async () => {
    for (const table of ['ut_audit','ut_evidence','ut_reviews']) {
      await expect(database.query(`UPDATE ${table} SET id=id`)).rejects.toThrow('append-only');
      await expect(database.query(`DELETE FROM ${table}`)).rejects.toThrow('append-only');
    }
  });
});
describe('atomic imports and preserved legacy migrations', () => {
  it('rejects invalid values/duplicate numbers and rolls back all rows if a later row fails', async () => {
    expect((await request(admin,'/imports/preview','POST',{tasks:[inputTask('BAD',{priority:'UNKNOWN'})]})).status).toBe(400);
    const duplicates = await request(admin,'/imports/preview','POST',{tasks:[inputTask('DUP'),inputTask('DUP')]});
    expect(duplicates.body.errors.length).toBeGreaterThan(0);
    const tasks = [inputTask('ROLLBACK-1'),inputTask('ROLLBACK-2',{dependsOnIds:['nonexistent']})];
    const preview = await request(admin,'/imports/preview','POST',{tasks});
    expect((await request(admin,'/imports/commit','POST',{tasks,digest:preview.body.digest})).status).toBe(400);
    expect((await database.query("SELECT id FROM ut_tasks WHERE plan_code LIKE 'ROLLBACK-%'")).rowCount).toBe(0);
    const valid = [inputTask('IMPORT-OK')], ready = await request(admin,'/imports/preview','POST',{tasks:valid});
    expect((await request(admin,'/imports/commit','POST',{tasks:valid,digest:ready.body.digest})).status).toBe(201);
  });
  it('stores draft-plan source items without creating live tasks or exposing them to non-admins', async () => {
    const plan = {
      title: 'ToshTech draft import test',
      year: 2026,
      sourceName: 'ToshTech_2026_2027.xlsx',
      sections: [{ number: 'I', title: 'Test section' }],
      items: [{
        number: 1,
        sectionNumber: 'I',
        sectionTitle: 'Test section',
        title: 'Draft-only item',
        mechanism: 'Source mechanism text',
        schedule: '2026 Q4\n2027 Q1',
        fundingSource: 'Source funding',
        oversight: 'Source oversight',
        responsible: 'Source role',
        distributedUnits: 'Source unit',
        completion: {
          planCode: 'TT-2026-001', priority: 'HIGH', category: 'I. Test section',
          reviewer: 'Синов тақризчиси RV-001', responsibleDepartment: 'Source unit', sampleData: true,
        },
      }],
    };
    const preview = await request(admin, '/admin/work-plans/draft-import/preview', 'POST', plan);
    expect(preview.status).toBe(200);
    expect(preview.body.errors).toEqual([]);
    const imported = await request(admin, '/admin/work-plans/draft-import/commit', 'POST', {
      plan,
      digest: preview.body.digest,
    });
    expect(imported.status).toBe(201);
    expect(imported.body.active).toBe(false);

    const stored = await request(admin, `/admin/work-plans/${imported.body.id}/draft-items`);
    expect(stored.status).toBe(200);
    expect(stored.body.items[0].schedule).toBe('2026 Q4\n2027 Q1');
    expect(stored.body.items[0].responsible).toBe('Source role');
    expect(stored.body.items[0].completion.planCode).toBe('TT-2026-001');
    expect(stored.body.items[0].completion.sampleData).toBe(true);
    const invalidCompletion = structuredClone(plan);
    invalidCompletion.items[0].completion.priority = 'URGENT';
    expect((await request(admin, '/admin/work-plans/draft-import/preview', 'POST', invalidCompletion)).status).toBe(400);
    invalidCompletion.items[0].completion.priority = 'HIGH';
    invalidCompletion.items[0].completion.category = 'II. Wrong section';
    expect((await request(admin, '/admin/work-plans/draft-import/preview', 'POST', invalidCompletion)).body.errors)
      .toContain('The completed workbook contains invalid or incomplete task fields.');
    expect((await database.query('SELECT id FROM ut_tasks WHERE work_plan_id=$1', [imported.body.id])).rowCount).toBe(0);
    const adminState = await request(admin, '/state');
    expect(adminState.body.workPlans.some(plan => plan.id === imported.body.id)).toBe(true);
    expect(JSON.stringify(adminState.body)).not.toContain('Source mechanism text');
    const overview = await request(admin, '/admin/overview');
    const draftMetadata = overview.body.workPlans.find(plan => plan.id === imported.body.id);
    expect(draftMetadata.draftImportKind).toBe('UNASSIGNED_DRAFT');
    expect(draftMetadata.draftItemCount).toBe(1);
    expect(draftMetadata.sourceName).toBe(plan.sourceName);
    expect(draftMetadata).not.toHaveProperty('data');
    const directorState = await request(director, '/state');
    expect(directorState.body.workPlans.some(plan => plan.id === imported.body.id)).toBe(false);
    expect(JSON.stringify(directorState.body)).not.toContain('Source mechanism text');

    const duplicate = await request(admin, '/admin/work-plans/draft-import/preview', 'POST', plan);
    expect(duplicate.body.errors.length).toBeGreaterThan(0);
    expect((await request(admin, `/admin/work-plans/${imported.body.id}`, 'PATCH', { active: true })).status).toBe(400);
    expect((await request(director, `/admin/work-plans/${imported.body.id}/draft-items`)).status).toBe(403);
  });
  it('requires explicit legacy role mapping and preserves original source, evidence and actor history', async () => {
    const snapshot = { users:[
      {id:'legacy-head',fullName:'Legacy coordinator',email:'coordinator@example.test',role:'HEAD',departmentId:'legacy-dept'},
      {id:'legacy-user',fullName:'Legacy applicant',email:'applicant@example.test',role:'USER',departmentId:'legacy-dept'},
    ], departments:[{id:'legacy-dept',code:'LD',name:'Legacy department'}], tasks:[{
      id:'legacy-task',planCode:'LEGACY-1',title:'Original task title',description:'Original description',assignedToId:'legacy-user',createdById:'legacy-head',
      departmentId:'legacy-dept',deadline:'2020-01-01',status:'REJECTED',priority:'HIGH',progressPercent:70,
      proofs:[{id:'legacy-proof',type:'TEXT_NOTE',note:'Original rejected evidence.',submittedById:'legacy-user',status:'REJECTED',reviewedBy:'Legacy coordinator',reviewerRemarks:'Original reason'}],
    }], auditLogs:[{actorId:'legacy-head',actorName:'Legacy coordinator',actorRole:'HEAD',action:'ORIGINAL_REVIEW',details:'Original decision'}] };
    const preview = await request(admin,'/admin/migration/preview','POST',{snapshot});
    expect(preview.status).toBe(200); expect(preview.body.accounts.every(a => a.suggestedRole === null)).toBe(true);
    expect((await request(admin,'/admin/migration/commit','POST',{snapshot,digest:preview.body.digest,roleMapping:{'legacy-head':'DIRECTOR'},backupConfirmed:true})).status).toBe(400);
    expect((await database.query('SELECT id FROM ut_legacy_snapshots')).rowCount).toBe(0);
    const input = {snapshot,digest:preview.body.digest,roleMapping:{'legacy-head':'DIRECTOR','legacy-user':'WORKER'},backupConfirmed:true};
    expect((await request(admin,'/admin/migration/commit','POST',input)).status).toBe(201);
    const original = (await database.query('SELECT original FROM ut_legacy_snapshots')).rows[0].original; expect(original).toEqual(snapshot);
    const imported = await taskFor(admin,'legacy-task'); expect(imported.status).toBe('IN_PROGRESS'); expect(imported.isOverdue).toBe(true);
    expect(imported.proofs[0].status).toBe('REJECTED'); expect(imported.proofs[0].reviewerRemarks).toBe('Original reason');
    expect((await database.query("SELECT active,role FROM ut_users WHERE id='legacy-head'")).rows[0]).toEqual({active:false,role:'DIRECTOR'});
    expect((await request(admin,'/admin/migration/commit','POST',input)).status).toBe(409);
  });
});
describe('verified Telegram identity with application authorization', () => {
  it('requires a verified link, matches identities and denies foreign/privileged actions', async () => {
    const token = await request(worker,'/telegram/link-token','POST',{});
    expect((await request(worker,'/telegram/link','POST',{token:token.body.token,initData:signedTelegram(1001)})).status).toBe(200);
    expect((await request(worker,'/telegram/link','POST',{token:token.body.token,initData:signedTelegram(1001)})).status).toBe(403);
    const ownTask = await create('TELEGRAM-OWN'), foreignTask = await create('TELEGRAM-FOREIGN',{assignedToId:'other'});
    expect((await request(worker,'/telegram/authorize-action','POST',{initData:signedTelegram(1001),action:'CLOCK_IN',taskId:ownTask.id})).status).toBe(200);
    expect((await taskFor(worker,ownTask.id)).status).toBe('ASSIGNED');
    expect((await request(worker,'/telegram/authorize-action','POST',{initData:signedTelegram(1001),action:'CLOCK_IN',taskId:foreignTask.id})).status).toBe(404);
    expect((await request(worker,'/telegram/authorize-action','POST',{initData:signedTelegram(1002),action:'SESSION_CHECK'})).status).toBe(403);
    expect((await request(worker,'/telegram/authorize-action','POST',{initData:signedTelegram(1001,90000),action:'SESSION_CHECK'})).status).toBe(403);
    expect((await request(worker,'/telegram/authorize-action','POST',{initData:signedTelegram(1001),action:'APPROVE_PROOF',taskId:ownTask.id})).status).toBe(403);
  });
});
describe('administrative modules and security regressions', () => {
  it('discovers an anonymous session without console errors but still denies protected data', async () => {
    const anonymous=await request(null,'/auth/me'); expect(anonymous.status).toBe(200); expect(anonymous.body.user).toBeNull();
    expect((await request(null,'/state')).status).toBe(401);
  });
  it('creates and edits departments, plans, sections, and categories with validated task references', async () => {
    expect((await request(admin,'/admin/departments','POST',{code:'D2',name:'Second department',coordinatorId:'director'})).status).toBe(201);
    let overview = (await request(admin,'/admin/overview')).body;
    const department = overview.departments.find(d=>d.code==='D2');
    expect((await request(admin,`/admin/departments/${department.id}`,'PATCH',{name:'Renamed department',coordinatorId:null})).status).toBe(200);
    const plan = await request(admin,'/admin/work-plans','POST',{title:'Verified plan',year:2028}); expect(plan.status).toBe(201);
    const section = await request(admin,`/admin/work-plans/${plan.body.id}/sections`,'POST',{number:'I',title:'First section'}); expect(section.status).toBe(201);
    expect((await request(admin,`/admin/sections/${section.body.id}`,'PATCH',{number:'II',title:'Updated section'})).status).toBe(200);
    const category = await request(admin,'/admin/categories','POST',{name:'Verified category'}); expect(category.status).toBe(201);
    expect((await request(admin,`/admin/categories/${category.body.id}`,'PATCH',{name:'Updated category',active:true})).status).toBe(200);
    await create('LINKED-REFERENCES',{workPlanId:plan.body.id,sectionId:section.body.id,categoryId:category.body.id});
    expect((await request(admin,`/admin/work-plans/${plan.body.id}`,'PATCH',{active:false})).status).toBe(200);
    expect((await request(admin,'/tasks','POST',inputTask('INACTIVE-PLAN',{workPlanId:plan.body.id}))).status).toBe(400);
    expect((await request(director,'/admin/settings','PUT',{})).status).toBe(403);
  });
  it('applies permission changes on the next request without letting roles exceed their ceilings', async () => {
    const ceiling = (await request(admin,'/admin/overview')).body.permissionCeilings.WORKER;
    expect((await request(admin,'/admin/role-permissions/WORKER','PUT',{permissions:[]})).status).toBe(200);
    const task = await create('PERMISSION-CHANGE');
    expect((await request(worker,`/tasks/${task.id}/start`,'POST',{version:task.version})).status).toBe(403);
    expect((await request(admin,'/admin/role-permissions/WORKER','PUT',{permissions:ceiling})).status).toBe(200);
  });
  it('queues real reminders once per local day and records actual job results', async () => {
    await create('DUE-REMINDER',{deadline:'2020-01-01'});
    expect((await request(admin,'/admin/jobs/run','POST',{job:'reminders'})).status).toBe(409);
    expect((await request(admin,'/admin/settings','PUT',{notificationsEnabled:true,reminderHour:9,reminderTemplate:'{task}: {deadline}'})).status).toBe(200);
    const first = await request(admin,'/admin/jobs/run','POST',{job:'reminders'}); expect(first.status).toBe(200); expect(first.body.processed).toBeGreaterThan(0);
    expect((await request(admin,'/admin/jobs/run','POST',{job:'reminders'})).body.processed).toBe(0);
  });
  it('scopes tickets to their real owner and allows only authorized resolution', async () => {
    const ticket = await request(worker,'/tickets','POST',{title:'A real request',description:'Please resolve this request.',departmentId:'dept',priority:'MEDIUM'}); expect(ticket.status).toBe(201);
    expect((await request(other,'/state')).body.tickets.some(t=>t.id===ticket.body.id)).toBe(false);
    expect((await request(worker,`/tickets/${ticket.body.id}/resolve`,'POST',{responseNote:'Self resolution'})).status).toBe(403);
    expect((await request(director,`/tickets/${ticket.body.id}/resolve`,'POST',{responseNote:'Resolved with documented action.'})).status).toBe(200);
  });
  it('guards report export and neutralizes spreadsheet formula injection', async () => {
    await create('FORMULA',{title:'=2+2'});
    const response = await fetch(`${base}/api/reports/tasks.csv`,{headers:{Cookie:director.cookie}});
    expect(response.status).toBe(200); expect(await response.text()).toContain("\"'=2+2\"");
    expect((await request(worker,'/reports/tasks.csv')).status).toBe(403);
  });
  it('supports password changes, idle expiry, generic recovery, and shared login throttling', async () => {
    const session = await login('other');
    expect((await request(session,'/auth/change-password','POST',{currentPassword:'wrong',password:'different-strong-password'})).status).toBe(400);
    expect((await request(session,'/auth/change-password','POST',{currentPassword:password,password:'different-strong-password'})).status).toBe(200);
    expect((await request(session,'/state')).status).toBe(401);
    const changed = await login('other','different-strong-password');
    await database.query('UPDATE ut_sessions SET last_seen_at=now()-interval \'31 minutes\' WHERE token_hash=$1',[digest(changed.cookie.split('=')[1])]);
    expect((await request(changed,'/state')).status).toBe(401);
    const known = await request(null,'/auth/forgot-password','POST',{identifier:'other'});
    const unknown = await request(null,'/auth/forgot-password','POST',{identifier:'unknown'});
    expect(known.body).toEqual(unknown.body);
    let result;
    for(let attempt=0;attempt<11;attempt++) result=await request(null,'/auth/login','POST',{identifier:'rate-limited-account',password:'bad-credentials'});
    expect(result.status).toBe(429);
  }, 20000);
});
