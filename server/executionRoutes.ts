import {Router} from 'express';
import type pg from 'pg';
import multer from 'multer';
import {z} from 'zod';
import {audit,id,HttpError,transaction,type Actor,type DB} from './db';
import {wrap,permit} from './security';
import {evidenceMime} from './evidenceMime';

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
const manager=(a:Actor)=>a.permissions.includes('workplans.manage');
const canRead=(a:Actor,t:any)=>manager(a)||t.assignee_ids.includes(a.id)||t.first_reviewer_id===a.id||t.final_reviewer_id===a.id;
async function locked(db:DB,itemId:string,actor:Actor,version?:number){
 const t=(await db.query('SELECT * FROM ut_execution_items WHERE id=$1 FOR UPDATE',[itemId])).rows[0];
 if(!t||!canRead(actor,t))throw new HttpError(404,'Ish rejasi bandi topilmadi.');
 if(version!==undefined&&t.version!==version)throw new HttpError(409,'Ma’lumot yangilangan. Sahifani yangilang.');
 return t;
}
async function notify(db:DB,users:string[],title:string,body:string){for(const user of new Set(users))await db.query("INSERT INTO ut_notifications(id,user_id,type,title,body) VALUES($1,$2,'WORK_PLAN_EXECUTION',$3,$4)",[id('notice'),user,title,body]);}
export function executionRoutes(database:pg.Pool){
 const router=Router();
 router.get('/config',wrap(async(_req,res)=>{const r=await database.query("SELECT value FROM ut_settings WHERE key='department_execution_enabled'");res.json({enabled:r.rows[0]?.value===true});}));
 router.get('/',wrap(async(req,res)=>{
  const a=req.actor!;
  const items=(await database.query(`SELECT i.*,d.name AS department_name FROM ut_execution_items i JOIN ut_departments d ON d.id=i.department_id
    WHERE $1::boolean OR $2=ANY(i.assignee_ids) OR i.first_reviewer_id=$2 OR i.final_reviewer_id=$2 OR (cardinality(i.assignee_ids)=0 AND i.department_id=(SELECT department_id FROM ut_users WHERE id=$2)) ORDER BY d.name,i.source_number`,[manager(a),a.id])).rows;
  const ids=items.map(i=>i.id);
  const evidence=(await database.query('SELECT e.id,e.item_id,e.user_id,e.cycle,e.note,e.filename,e.created_at,u.full_name FROM ut_execution_evidence e JOIN ut_users u ON u.id=e.user_id WHERE e.item_id=ANY($1::text[]) ORDER BY e.created_at DESC',[ids])).rows;
  const reviews=(await database.query('SELECT r.*,u.full_name FROM ut_execution_reviews r JOIN ut_users u ON u.id=r.reviewer_id WHERE r.item_id=ANY($1::text[]) ORDER BY r.created_at DESC',[ids])).rows;
  const users=(await database.query(`SELECT id,full_name,department_id,active FROM ut_users WHERE active=true AND ($1::boolean OR id=ANY($2::text[])) ORDER BY full_name`,[manager(a),[...new Set(items.flatMap(i=>[...i.assignee_ids,i.first_reviewer_id,i.final_reviewer_id]))]])).rows;
  res.json({items:items.map(i=>({...i,evidence:evidence.filter(e=>e.item_id===i.id),reviews:reviews.filter(r=>r.item_id===i.id)})),users,canManage:manager(a)});
 }));
 router.post('/:id/evidence',permit('tasks.submit'),upload.single('file'),wrap(async(req,res)=>{
  const input=z.object({version:z.coerce.number().int().positive(),note:z.string().trim().min(1).max(20000)}).parse(req.body);
  const file=req.file,mime=file&&evidenceMime(file.buffer);
  if(!file||!mime)throw new HttpError(400,'PDF, Word, Excel, JPG yoki PNG faylini yuklang (10 MB gacha).');
  await transaction(database,async db=>{
   const t=await locked(db,String(req.params.id),req.actor!,input.version);
   if(!t.assignee_ids.includes(req.actor!.id)||!['ASSIGNED','RETURNED'].includes(t.status))throw new HttpError(403,'Hozir bu bandga dalil yuborib bo‘lmaydi.');
   if((await db.query('SELECT id FROM ut_execution_evidence WHERE item_id=$1 AND user_id=$2 AND cycle=$3',[t.id,req.actor!.id,t.cycle])).rowCount)throw new HttpError(409,'Siz bu tekshiruv uchun dalil yuborgansiz.');
   await db.query('INSERT INTO ut_execution_evidence(id,item_id,user_id,cycle,note,filename,mime,content) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id('proof'),t.id,req.actor!.id,t.cycle,input.note,file.originalname.replace(/[\\/\r\n"]/g,'_'),mime,file.buffer]);
   const submitted=(await db.query('SELECT user_id FROM ut_execution_evidence WHERE item_id=$1 AND cycle=$2',[t.id,t.cycle])).rows.map(r=>r.user_id);
   const ready=t.assignee_ids.every((u:string)=>submitted.includes(u))&&t.unresolved_roles.length===0;
   await db.query('UPDATE ut_execution_items SET status=$2,version=version+1,updated_at=now() WHERE id=$1',[t.id,ready?'FIRST_REVIEW':t.status]);
   await notify(db,[t.first_reviewer_id],t.title,`${req.actor!.fullName} dalil yubordi. ${submitted.length}/${t.assignee_ids.length} ijrochi topshirgan.${ready?' Barcha dalillar tekshirishga tayyor.':''}`);
   await notify(db,ready?t.assignee_ids:[req.actor!.id],t.title,ready?'📨 Barcha ijrochilar dalil yubordi. Dalillar Akmal Rustamov tekshiruviga yuborildi.':`📨 Dalilingiz qabul qilindi. ${submitted.length}/${t.assignee_ids.length} ijrochi dalil yuborgan. Qolgan ijrochilar yoki belgilanmagan mas’ullar kutilmoqda.`);
   await audit(db,req,'EXECUTION_EVIDENCE_SUBMITTED',t.id,null,{cycle:t.cycle,ready});
  });res.status(201).json({ok:true});
 }));
 router.get('/evidence/:evidenceId',wrap(async(req,res)=>{
  const e=(await database.query('SELECT e.*,i.assignee_ids,i.first_reviewer_id,i.final_reviewer_id FROM ut_execution_evidence e JOIN ut_execution_items i ON i.id=e.item_id WHERE e.id=$1',[req.params.evidenceId])).rows[0];
  if(!e||!canRead(req.actor!,e))throw new HttpError(404,'Dalil topilmadi.');
  res.setHeader('Content-Type',e.mime);res.setHeader('Content-Disposition',`attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(e.filename)}`);res.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");res.send(e.content);
 }));
 router.post('/:id/review',permit('tasks.review'),wrap(async(req,res)=>{
  const input=z.object({version:z.number().int().positive(),decision:z.enum(['APPROVED','REJECTED']),remarks:z.string().trim().max(5000)}).strict().parse(req.body);
  if(input.decision==='REJECTED'&&!input.remarks)throw new HttpError(400,'Qaytarish sababini yozing.');
  await transaction(database,async db=>{
   const t=await locked(db,String(req.params.id),req.actor!,input.version),first=t.status==='FIRST_REVIEW';
   if(!['FIRST_REVIEW','FINAL_REVIEW'].includes(t.status)||req.actor!.id!==(first?t.first_reviewer_id:t.final_reviewer_id)||t.assignee_ids.includes(req.actor!.id))throw new HttpError(403,'Bu bosqichni faqat belgilangan tekshiruvchi tasdiqlaydi.');
   const submitted=(await db.query('SELECT user_id FROM ut_execution_evidence WHERE item_id=$1 AND cycle=$2',[t.id,t.cycle])).rows.map(r=>r.user_id);
   if(t.unresolved_roles.length||!t.assignee_ids.length||!t.assignee_ids.every((u:string)=>submitted.includes(u)))throw new HttpError(409,'Barcha ijrochilarning dalillari talab qilinadi.');
   if(!first&&!(await db.query("SELECT id FROM ut_execution_reviews WHERE item_id=$1 AND cycle=$2 AND stage='FIRST' AND decision='APPROVED'",[t.id,t.cycle])).rowCount)throw new HttpError(409,'Avval Akmal Rustamov tasdig‘i kerak.');
   await db.query('INSERT INTO ut_execution_reviews(id,item_id,reviewer_id,cycle,stage,decision,remarks) VALUES($1,$2,$3,$4,$5,$6,$7)',[id('review'),t.id,req.actor!.id,t.cycle,first?'FIRST':'FINAL',input.decision,input.remarks]);
   const rejected=input.decision==='REJECTED',status=rejected?'RETURNED':first?'FINAL_REVIEW':'COMPLETED';
   await db.query('UPDATE ut_execution_items SET status=$2,cycle=cycle+$3,version=version+1,updated_at=now() WHERE id=$1',[t.id,status,rejected?1:0]);
   const reviewer=first?'Akmal Rustamov':'G‘ayrat Asomidinov (ijrochi direktor)';
   const decisionText=rejected?`↩️ ${reviewer} dalilni tuzatish uchun qaytardi.\nSabab: ${input.remarks}\nDalilni tuzatib, qayta yuboring. Yangi dalillar avval Akmal Rustamov tekshiruvidan o‘tadi.`:first?`✅ Akmal Rustamov dalilni tasdiqladi.\nDalillar G‘ayrat Asomidinovning yakuniy tasdig‘iga yuborildi. Hali yakuniy tasdiq kutilmoqda.${input.remarks?`\nIzoh: ${input.remarks}`:''}`:`✅ G‘ayrat Asomidinov dalilni yakuniy tasdiqladi.\nIsh rejasi bandi bajarildi.${input.remarks?`\nIzoh: ${input.remarks}`:''}`;
   await notify(db,[...t.assignee_ids,...(!first?[t.first_reviewer_id]:[])],t.title,decisionText);
   if(first&&!rejected)await notify(db,[t.final_reviewer_id],t.title,`📋 Akmal Rustamov dalillarni tasdiqladi. Yakuniy qaroringiz kutilmoqda.${input.remarks?`\nIzoh: ${input.remarks}`:''}`);
   await audit(db,req,'EXECUTION_REVIEW',t.id,{status:t.status},{status,cycle:t.cycle,decision:input.decision},input.remarks);
  });res.json({ok:true});
 }));
 router.put('/:id/assignees',permit('workplans.manage'),wrap(async(req,res)=>{
  const input=z.object({version:z.number().int().positive(),assigneeIds:z.array(z.string().min(1)).max(50),unresolvedRoles:z.array(z.string().trim().min(1)).max(50)}).strict().parse(req.body);
  await transaction(database,async db=>{
   const t=await locked(db,String(req.params.id),req.actor!,input.version);
   if(!['ASSIGNED','RETURNED'].includes(t.status))throw new HttpError(409,'Tekshiruvdagi yoki bajarilgan ish ijrochilarini o‘zgartirib bo‘lmaydi.');
   if(new Set(input.assigneeIds).size!==input.assigneeIds.length||input.assigneeIds.some(u=>[t.first_reviewer_id,t.final_reviewer_id].includes(u)))throw new HttpError(400,'Ijrochilar takrorlanmasligi va tekshiruvchilardan farqli bo‘lishi kerak.');
   const valid=await db.query('SELECT id FROM ut_users WHERE id=ANY($1::text[]) AND active=true',[input.assigneeIds]);if(valid.rowCount!==input.assigneeIds.length)throw new HttpError(400,'Faol xodimni tanlang.');
   const submitted=(await db.query('SELECT user_id FROM ut_execution_evidence WHERE item_id=$1 AND cycle=$2',[t.id,t.cycle])).rows.map(r=>r.user_id);
   if(submitted.some(u=>!input.assigneeIds.includes(u)))throw new HttpError(409,'Dalil yuborgan ijrochini olib tashlab bo‘lmaydi.');
   const ready=input.assigneeIds.length>0&&!input.unresolvedRoles.length&&input.assigneeIds.every(u=>submitted.includes(u));
   await db.query('UPDATE ut_execution_items SET assignee_ids=$2,unresolved_roles=$3,status=$4,version=version+1,updated_at=now() WHERE id=$1',[t.id,input.assigneeIds,input.unresolvedRoles,ready?'FIRST_REVIEW':t.status]);
   await notify(db,input.assigneeIds.filter(u=>!t.assignee_ids.includes(u)),t.title,`Sizga ish rejasi bandi biriktirildi. Muddat: ${t.schedule}`);
   await audit(db,req,'EXECUTION_ASSIGNED',t.id,{assignees:t.assignee_ids},input);
  });res.json({ok:true});
 }));
 return router;
}
