import { Router } from 'express';
import type pg from 'pg';
import { z } from 'zod';
import { audit, HttpError, id, transaction, type DB } from './db';
import { digest, permit, wrap } from './security';
import { draftPlanInput, validateDraftPlan } from './adminRoutes';
import { insertTask } from './taskRoutes';
import { validateReferences } from './records';
import { PRIORITIES } from '../shared/policy';

const stageInput = z.object({
  title: z.string().trim().min(1).max(500),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value).nullable(),
  scheduleKind: z.enum(['DATE','CONTINUOUS','CONTRACT']).default('DATE'),
  assignees: z.array(z.object({ userId: z.string().min(1).max(128), departmentId: z.string().min(1).max(128) }).strict()).min(1).max(50),
}).strict().refine(stage=>stage.deadline!==null||stage.scheduleKind!=='DATE','Use an explicit date or an open-ended schedule.');
const mappingInput = z.object({ itemNumber: z.number().int().positive(), stages: z.array(stageInput).min(1).max(30),responsibleDepartmentIds:z.array(z.string().min(1).max(128)).max(50).optional() }).strict();
const versionInput = z.object({ version: z.number().int().positive() }).strict();
const flowOf = (p: any) => p.data.workflow || { status: 'DRAFT', version: 1, mappings: [], priority: null, rectorId: '' };
async function locked(db: DB, planId: string, version: number) {
  const p = (await db.query('SELECT * FROM ut_work_plans WHERE id=$1 FOR UPDATE', [planId])).rows[0];
  if (!p || !Array.isArray(p.data?.items)) throw new HttpError(404, 'Source work plan was not found.');
  if (flowOf(p).version !== version) throw new HttpError(409, 'The work plan changed. Reload before saving.');
  return p;
}
async function save(db: DB, p: any, workflow: any, active = false) {
  await db.query('UPDATE ut_work_plans SET active=$2,data=$3 WHERE id=$1', [p.id,active,JSON.stringify({ ...p.data,
    ...(active ? { draftImportKind: 'ASSIGNED_WORK_PLAN' } : {}), workflow: { ...workflow, version: flowOf(p).version+1 } })]);
}
async function validateSetup(db: DB, p: any, flow: any) {
  const rector = (await db.query("SELECT id FROM ut_users WHERE id=$1 AND active=true AND role='DIRECTOR'", [flow.rectorId])).rows[0];
  if (!rector) throw new HttpError(400, 'Choose an active rector for final approval.');
  const itemNumbers = p.data.items.map((item: any) => item.number);
  const assignedOnly=flow.publishAssignedOnly===true;
  if (!flow.mappings.length || (!assignedOnly && flow.mappings.length !== itemNumbers.length) || new Set(flow.mappings.map((m: any) => m.itemNumber)).size !== flow.mappings.length || flow.mappings.some((m: any) => !itemNumbers.includes(m.itemNumber)))
    throw new HttpError(400, 'Assign every work-plan item and confirm each stage deadline.');
  const deferredDepartments=new Set<string>();
  for (const mapping of flow.mappings) for (const stage of mapping.stages) {
    if (new Set(stage.assignees.map((a: any) => a.userId)).size !== stage.assignees.length) throw new HttpError(400, 'Each assignee may only be selected once.');
    for (const member of stage.assignees) await validateReferences(db, { assignedToId: member.userId, departmentId: member.departmentId, approverId: flow.rectorId });
    if(mapping.responsibleDepartmentIds?.length){
      const covered=await db.query(`SELECT DISTINCT d.id FROM ut_departments d WHERE d.id=ANY($1::text[]) AND d.active=true AND EXISTS (
        SELECT 1 FROM ut_users u WHERE u.id=ANY($2::text[]) AND u.active=true AND (u.department_id=d.id OR EXISTS(SELECT 1 FROM ut_memberships m WHERE m.user_id=u.id AND m.department_id=d.id)))`,[mapping.responsibleDepartmentIds,stage.assignees.map((a:any)=>a.userId)]);
      const missing=mapping.responsibleDepartmentIds.filter((departmentId:string)=>!covered.rows.some(d=>d.id===departmentId));
      if(missing.length&&!assignedOnly)throw new HttpError(400,'Each responsible department needs an assigned representative.');
      for(const departmentId of missing)deferredDepartments.add(departmentId);
    }
  }
  return {unassignedItemNumbers:itemNumbers.filter((number:number)=>!flow.mappings.some((m:any)=>m.itemNumber===number)),deferredDepartmentIds:[...deferredDepartments]};
}
export function workPlanRoutes(database: pg.Pool) {
  const router = Router();
  router.get('/', wrap(async (req,res) => {
    const manager = req.actor!.permissions.includes('tasks.readAll');
    const plans = (await database.query(`SELECT p.*,(SELECT count(*)::int FROM ut_tasks t WHERE t.work_plan_id=p.id) AS stage_count,
      (SELECT count(*)::int FROM ut_tasks t WHERE t.work_plan_id=p.id AND t.status<>'COMPLETED') AS unfinished_count
      FROM ut_work_plans p WHERE $1::boolean OR EXISTS (
      SELECT 1 FROM ut_tasks t WHERE t.work_plan_id=p.id AND NOT t.draft AND t.archived_at IS NULL AND
      (t.assignee_id=$2 OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(t.data->'assignments','[]'::jsonb)) a WHERE a->>'userId'=$2))) ORDER BY (p.data ? 'items') DESC,year DESC,title`, [manager,req.actor!.id])).rows;
    res.json(plans.map(p => ({ id:p.id,title:p.title,year:p.year,active:p.active,sourceName:p.data.sourceName || '',
      items: manager ? p.data.items || [] : [], sections:p.data.sections || [],
      workflow: {...(manager ? flowOf(p) : {priority:flowOf(p).priority,rectorId:flowOf(p).rectorId}),
        status:flowOf(p).status==='ACTIVE'&&!flowOf(p).unassignedItemNumbers?.length&&!flowOf(p).deferredDepartmentIds?.length&&p.stage_count>0&&p.unfinished_count===0?'COMPLETED':flowOf(p).status},
      legacy: !Array.isArray(p.data.items),
    })));
  }));
  router.post('/import', permit('workplans.manage'), wrap(async (req,res) => {
    const source = draftPlanInput.parse(req.body);
    const errors = validateDraftPlan(source);
    if (errors.length) throw new HttpError(400, errors.join(' '));
    const planId = id('plan'), sourceDigest = digest(JSON.stringify(source));
    await transaction(database,async db => {
      await db.query('SELECT pg_advisory_xact_lock(741205)');
      if ((await db.query("SELECT id FROM ut_work_plans WHERE (year=$1 AND lower(title)=lower($2)) OR data->>'draftImportDigest'=$3",[source.year,source.title,sourceDigest])).rowCount)
        throw new HttpError(409, 'A work plan with this title and year or source file is already imported.');
      await db.query('INSERT INTO ut_work_plans(id,title,year,active,data) VALUES($1,$2,$3,false,$4)',[planId,source.title,source.year,JSON.stringify({
        sourceName:source.sourceName,draftImportDigest:sourceDigest,draftImportKind:'UNASSIGNED_DRAFT',items:source.items,sections:source.sections,itemCount:source.items.length,
        workflow:{status:'DRAFT',version:1,mappings:[],rectorId:'',priority:null},
      })]);
      for (const section of source.sections) await db.query('INSERT INTO ut_sections(id,work_plan_id,number,title) VALUES($1,$2,$3,$4)',[id('section'),planId,section.number,section.title]);
      await audit(db,req,'WORK_PLAN_DRAFT_IMPORTED',planId,null,{sourceName:source.sourceName,itemCount:source.items.length});
    });
    res.status(201).json({id:planId});
  }));
  router.put('/:id/setup', permit('workplans.manage'), wrap(async (req,res) => {
    const input = z.object({version:z.number().int().positive(),priority:z.enum(PRIORITIES).nullable().optional(),rectorId:z.string().max(128),mappings:z.array(mappingInput).max(2000)}).strict().parse(req.body);
    await transaction(database,async db => {
      const p = await locked(db,String(req.params.id),input.version), flow = flowOf(p);
      if (!['DRAFT','RETURNED'].includes(flow.status) || p.active) throw new HttpError(409, 'Only draft or returned work plans can be edited.');
      const numbers=p.data.items.map((i:any)=>i.number);
      if (new Set(input.mappings.map(m=>m.itemNumber)).size!==input.mappings.length || input.mappings.some(m=>!numbers.includes(m.itemNumber))) throw new HttpError(400,'Invalid work-plan item mapping.');
      await save(db,p,{...flow,priority:null,rectorId:input.rectorId,mappings:input.mappings,status:'DRAFT'});
      await audit(db,req,'WORK_PLAN_MAPPING_SAVED',p.id,null,{mappedItems:input.mappings.length,rectorId:input.rectorId});
    }); res.json({ok:true});
  }));
  router.post('/:id/submit', permit('workplans.manage'), wrap(async (req,res) => {
    const {version,publishAssignedOnly} = versionInput.extend({publishAssignedOnly:z.boolean().default(false)}).parse(req.body);
    await transaction(database,async db => {
      const p = await locked(db,String(req.params.id),version),flow=flowOf(p);
      if (flow.status!=='DRAFT' || p.active) throw new HttpError(409,'Only draft or returned work plans can be edited.');
      const pending=await validateSetup(db,p,{...flow,publishAssignedOnly});
      await save(db,p,{...flow,...pending,publishAssignedOnly,status:'PENDING_APPROVAL',submittedBy:req.actor!.id,submittedAt:new Date().toISOString()});
      await db.query("INSERT INTO ut_notifications(id,user_id,type,title,body) VALUES($1,$2,'WORK_PLAN_APPROVAL',$3,$4)",[id('notice'),flow.rectorId,p.title,'Ish rejasi biriktirildi. Bandlar va muddatlarni tekshirib, ijroga tasdiqlang.']);
      await audit(db,req,'WORK_PLAN_SUBMITTED',p.id,null,{rectorId:flow.rectorId,publishAssignedOnly,...pending});
    }); res.json({ok:true});
  }));
  router.post('/:id/decision', permit('tasks.review'), wrap(async (req,res) => {
    const input=z.object({version:z.number().int().positive(),decision:z.enum(['APPROVE','RETURN']),remarks:z.string().trim().max(5000)}).strict().parse(req.body);
    await transaction(database,async db => {
      const p=await locked(db,String(req.params.id),input.version),flow=flowOf(p);
      if (req.actor!.role!=='DIRECTOR' || req.actor!.id!==flow.rectorId) throw new HttpError(403,'Only the selected rector may approve this work plan.');
      if(flow.status!=='PENDING_APPROVAL') throw new HttpError(409,'This work plan is not awaiting rector approval.');
      if(input.decision==='RETURN') {
        if(!input.remarks) throw new HttpError(400,'Enter a reason for returning the work plan.');
        await save(db,p,{...flow,status:'RETURNED',remarks:input.remarks});
      } else {
        await validateSetup(db,p,flow);
        // Activation and all assignment notifications commit together or roll back together.
        await db.query('UPDATE ut_work_plans SET active=true WHERE id=$1',[p.id]);
        const sections=(await db.query('SELECT id,number FROM ut_sections WHERE work_plan_id=$1',[p.id])).rows;
        for(const mapping of flow.mappings) {
          const item=p.data.items.find((i:any)=>i.number===mapping.itemNumber);
          for(const [index,stage] of mapping.stages.entries()) {
            const [first,...additional]=stage.assignees;
            const taskId=await insertTask(db,req.actor!.id,{
              planCode:`WP-${p.id.slice(-12)}-${item.number}-${index+1}`,title:stage.title,description:item.mechanism,
              assignedToId:first.userId,departmentId:first.departmentId,additionalAssignees:additional,
              approverId:flow.rectorId,workPlanId:p.id,sectionId:sections.find(s=>s.number===item.sectionNumber)?.id,
              priority:'MEDIUM',deadline:stage.deadline||'',requiresEvidence:true,requiresApproval:true,draft:false,
              fundingSource:item.fundingSource,sourceReference:`${p.title} / ${item.number}`,
            },undefined,true,{deadline:stage.deadline,scheduleKind:stage.scheduleKind,sourceSchedule:item.schedule,workPlanItemNumber:item.number,workPlanItemTitle:item.title,workPlanStage:index+1,responsibleDepartmentIds:mapping.responsibleDepartmentIds||stage.assignees.map((a:any)=>a.departmentId)});
            stage.taskId=taskId;
          }
        }
        await save(db,p,{...flow,status:'ACTIVE',approvedBy:req.actor!.id,approvedAt:new Date().toISOString(),remarks:input.remarks},true);
      }
      await audit(db,req,`WORK_PLAN_${input.decision}`,p.id,null,{remarks:input.remarks});
      if(flow.submittedBy) await db.query('INSERT INTO ut_notifications(id,user_id,type,title,body) VALUES($1,$2,$3,$4,$5)',[id('notice'),flow.submittedBy,'WORK_PLAN_DECISION',p.title,input.decision==='APPROVE'?'Rektor ish rejasini ijroga tasdiqladi.':`Ish rejasi qaytarildi: ${input.remarks}`]);
    }); res.json({ok:true});
  }));
  return router;
}
