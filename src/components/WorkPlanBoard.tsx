import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { localizeText } from '../utils/i18n';
import { parseDraftPlanWorkbook, type DraftPlanImport, type DraftPlanItem } from '../utils/draftPlanImport';
import type { Priority } from '../types';

type Member = { userId:string; departmentId:string };
type Stage = { title:string; deadline:string; assignees:Member[]; taskId?:string };
type Mapping = { itemNumber:number; stages:Stage[] };
type Workflow = { status:string; version:number; priority:Priority|''; rectorId:string; mappings:Mapping[]; remarks?:string; approvedAt?:string; approvedBy?:string };
type Plan = { id:string; title:string; year:number; sourceName:string; active:boolean; legacy:boolean; items:DraftPlanItem[]; workflow:Workflow };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const buttonClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600';

export const WorkPlanBoard: React.FC = () => {
  const { currentUser, permissions, tasks, users, departments, language, refreshState, openTma } = useApp();
  const t = (value:string) => localizeText(value,language);
  const manager = permissions.includes('workplans.manage');
  const [plans,setPlans] = useState<Plan[]>([]), [selectedId,setSelectedId] = useState('');
  const [loading,setLoading] = useState(true),[busy,setBusy] = useState(false),[error,setError] = useState(''),[notice,setNotice] = useState('');
  const [priority,setPriority] = useState<Priority|''>(''),[rectorId,setRectorId] = useState(''),[mappings,setMappings] = useState<Mapping[]>([]);
  const [search,setSearch] = useState(''),[section,setSection] = useState(''),[page,setPage] = useState(0),[itemNumber,setItemNumber] = useState<number|null>(null);
  const [stages,setStages] = useState<Stage[]>([]),[remarks,setRemarks] = useState(''),[dirty,setDirty] = useState(false);
  const [source,setSource] = useState<DraftPlanImport|null>(null);
  const [statusFilter,setStatusFilter] = useState('ALL');
  const load = async () => { const rows=await api<Plan[]>('/work-plans');setPlans(rows);setSelectedId(id=>rows.some(p=>p.id===id)?id:rows[0]?.id||''); };
  useEffect(()=>{
    let cancelled=false;
    api<Plan[]>('/work-plans').then(rows=>{if(!cancelled){setPlans(rows);setSelectedId(id=>rows.some(p=>p.id===id)?id:rows[0]?.id||'');}}).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[tasks]);
  const previousTasks=tasks.filter(task=>!task.workPlanId);
  const visiblePlans:Plan[]=[...plans,...(previousTasks.length?[{id:'previous-records',title:t('Previous records'),year:0,active:true,sourceName:'',legacy:true,items:[],workflow:{status:'ACTIVE',version:1,priority:'MEDIUM' as Priority,rectorId:'',mappings:[]}}]:[])];
  const plan=visiblePlans.find(p=>p.id===selectedId);
  useEffect(()=>{
    if(!plan || dirty) return;
    setPriority(plan.workflow.priority);setRectorId(plan.workflow.rectorId||'');setMappings(plan.workflow.mappings||[]);
  },[plan?.id,plan?.workflow?.version,dirty]);
  const run = async (action:()=>Promise<void>) => {
    setBusy(true);setError('');setNotice('');
    try{await action();await load();await refreshState();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  const selectPlan=(id:string)=>{
    if(dirty && !window.confirm(t('Discard unsaved work-plan changes?')))return;
    setDirty(false);setSelectedId(id);setItemNumber(null);setPage(0);setSection('');setSearch('');
  };
  const readSource=async(file?:File)=>{
    if(!file)return;setError('');setBusy(true);
    try{if(file.size>10*1024*1024)throw new Error('Import files must not exceed 10 MB.');setSource(parseDraftPlanWorkbook(await file.arrayBuffer(),file.name));}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  const editable=manager && !!plan && !plan.legacy && ['DRAFT','RETURNED'].includes(plan.workflow.status);
  const planTasks=tasks.filter(task=>(selectedId==='previous-records'?!task.workPlanId:task.workPlanId===selectedId) && !task.archivedAt && !task.draft);
  const bandTasks=(number:number)=>planTasks.filter(task=>task.workPlanItemNumber===number);
  const statusOf=(number:number)=>{
    const rows=bandTasks(number);
    if(!rows.length)return 'UNASSIGNED';
    if(rows.every(task=>(task.overallStatus||task.status)==='COMPLETED'))return 'COMPLETED';
    if(rows.some(task=>task.isOverdue))return 'OVERDUE';
    if(rows.some(task=>(task.overallStatus||task.status)==='SUBMITTED_FOR_REVIEW'))return 'SUBMITTED_FOR_REVIEW';
    return 'IN_PROGRESS';
  };
  const allItems=plan?.items || [];
  const filtered=allItems.filter(item=>(!search || `${item.number} ${item.title} ${item.responsible} ${item.distributedUnits}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())) && (!section||item.sectionNumber===section) && (statusFilter==='ALL'||statusOf(item.number)===statusFilter));
  const currentItem=allItems.find(item=>item.number===itemNumber);
  const openMapping=(item:DraftPlanItem)=>{setItemNumber(item.number);setStages(structuredClone(mappings.find(m=>m.itemNumber===item.number)?.stages||[{title:item.title.slice(0,500),deadline:'',assignees:[{userId:'',departmentId:''}]}]));};
  const updateStage=(index:number,change:Partial<Stage>)=>setStages(values=>values.map((stage,i)=>i===index?{...stage,...change}:stage));
  const progress=planTasks.length?Math.round(planTasks.reduce((sum,task)=>sum+(task.overallProgress??task.progressPercent),0)/planTasks.length):0;
  const approved=planTasks.filter(task=>(task.overallStatus||task.status)==='COMPLETED').length;
  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
      <div><h1 className="text-2xl font-bold">{t('Work plans and execution')}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{t('Import the official plan, assign its items and stages, and submit evidence for rector approval.')}</p></div>
      {manager&&<label className={`${buttonClass} cursor-pointer bg-sky-700 text-white`}>{t('Import official work plan')}<input aria-label={t('Choose Excel file')} disabled={busy} className="sr-only" type="file" accept=".xlsx,.xls" onChange={e=>{void readSource(e.target.files?.[0]);e.target.value='';}}/></label>}
    </header>
    {error&&<p role="alert" className="whitespace-pre-wrap rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-900">{t(error)}</p>}
    {notice&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-900">{t(notice)}</p>}
    {loading&&<p role="status">{t('Loading')}</p>}
    {source&&<section className="space-y-3 rounded-xl border border-sky-300 bg-white p-5 dark:bg-slate-900">
      <h2 className="font-bold">{t('Import preview')}</h2><p className="text-sm">{source.title}</p><p className="text-sm">{`${t('Plan items')}: ${source.items.length} · ${t('Sections')}: ${source.sections.length}`}</p>
      <p className="text-sm text-slate-500">{t('Source responsibilities and schedules are preserved. No employee is assigned until you map and publish the plan.')}</p>
      <ul className="max-h-44 space-y-2 overflow-y-auto text-sm">{source.items.slice(0,8).map(item=><li key={item.number}>{`${item.number}. ${item.title}`}</li>)}</ul>
      <div className="flex flex-wrap gap-2"><button disabled={busy} className={`${buttonClass} bg-sky-700 text-white`} onClick={()=>{void run(async()=>{const result=await api<{id:string}>('/work-plans/import',{method:'POST',body:JSON.stringify(source)});setSource(null);setDirty(false);setSelectedId(result.id);setNotice('Draft work plan imported.');});}}>{t('Save draft work plan')}</button><button className={buttonClass} onClick={()=>setSource(null)}>{t('Cancel')}</button></div>
    </section>}
    <label className="block text-sm font-semibold">{t('Work plan')}<select aria-label={t('Work plan')} value={selectedId} onChange={e=>selectPlan(e.target.value)} className={inputClass}><option value="">{t('Select work plan')}</option>{visiblePlans.map(p=><option value={p.id} key={p.id}>{`${p.year||''} · ${p.title}`}</option>)}</select></label>
    {!loading&&!visiblePlans.length&&<p className="rounded-xl border border-dashed p-8 text-center text-slate-500">{t('No work plans assigned yet.')}</p>}
    {plan&&<>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="max-w-3xl font-bold">{plan.title}</h2><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">{t(plan.legacy?'Previous records':plan.workflow.status)}</span></div>
        {plan.workflow.remarks&&<p className="whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{plan.workflow.remarks}</p>}
        {plan.workflow.approvedAt&&<p className="text-sm text-slate-500">{`${t('Rector approved')}: ${new Date(plan.workflow.approvedAt).toLocaleString(language)}`}</p>}
        {!plan.legacy&&<><div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">{t('Work-plan priority')}<select disabled={!editable||busy} value={priority} onChange={e=>{setPriority(e.target.value as Priority);setDirty(true);}} className={inputClass}><option value="">{t('Choose priority')}</option>{(['CRITICAL','HIGH','MEDIUM','LOW'] as Priority[]).map(value=><option key={value} value={value}>{t(value)}</option>)}</select></label>
          {manager?<label className="text-sm">{t('Rector for final approval')}<select disabled={!editable||busy} value={rectorId} onChange={e=>{setRectorId(e.target.value);setDirty(true);}} className={inputClass}><option value="">{t('Choose rector')}</option>{users.filter(user=>user.active&&user.role==='DIRECTOR').map(user=><option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>:<p className="self-center text-sm">{t('Evidence is submitted to the rector for final approval.')}</p>}
        </div>
        <p className="text-sm text-slate-500">{t('Priority applies to the whole work plan. Items and stages have no separate priority.')}</p>
        </>}
        {editable&&<div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{`${t('Mapped items')}: ${mappings.length}/${allItems.length}`}</span>
          <button disabled={busy||!priority} className={`${buttonClass} bg-slate-900 text-white dark:bg-sky-700`} onClick={()=>{void run(async()=>{await api(`/work-plans/${plan.id}/setup`,{method:'PUT',body:JSON.stringify({version:plan.workflow.version,priority,rectorId,mappings})});setDirty(false);setNotice('Work-plan mappings saved.');});}}>{t('Save mappings')}</button>
          <button disabled={busy||dirty||mappings.length!==allItems.length||!rectorId} className={`${buttonClass} bg-sky-700 text-white`} onClick={()=>{void run(async()=>{await api(`/work-plans/${plan.id}/submit`,{method:'POST',body:JSON.stringify({version:plan.workflow.version})});setNotice('Work plan sent to rector.');});}}>{t('Send plan to rector')}</button>
          {dirty&&<span className="text-sm text-amber-700">{t('Unsaved changes')}</span>}
        </div>}
        {plan.workflow.status==='PENDING_APPROVAL'&&currentUser.role==='DIRECTOR'&&currentUser.id===plan.workflow.rectorId&&<div className="space-y-3 border-t pt-4 dark:border-slate-700">
          <label className="block text-sm">{t('Rector remarks')}<textarea value={remarks} onChange={e=>setRemarks(e.target.value)} className={inputClass}/></label>
          <div className="flex flex-wrap gap-3">{(['APPROVE','RETURN'] as const).map(decision=><button key={decision} disabled={busy||(decision==='RETURN'&&!remarks.trim())} className={`${buttonClass} ${decision==='APPROVE'?'bg-emerald-700 text-white':'bg-amber-50 text-amber-900'}`} onClick={()=>{void run(async()=>{await api(`/work-plans/${plan.id}/decision`,{method:'POST',body:JSON.stringify({version:plan.workflow.version,decision,remarks})});setRemarks('');setNotice(decision==='APPROVE'?'Work plan published for execution.':'Work plan returned for correction.');});}}>{t(decision==='APPROVE'?'Approve and publish plan':'Return for correction')}</button>)}</div>
        </div>}
      </section>
      {!!planTasks.length&&<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ['Execution progress',`${progress}%`],['Rector approved',`${approved}/${planTasks.length}`],['Awaiting rector review',String(planTasks.filter(task=>(task.overallStatus||task.status)==='SUBMITTED_FOR_REVIEW').length)],['Overdue',String(planTasks.filter(task=>task.isOverdue).length)],
      ].map(([label,value])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs text-slate-500">{t(label)}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>}
      {manager&&!!allItems.length&&<>
        <div className="grid gap-3 sm:grid-cols-3"><input aria-label={t('Search plan items')} placeholder={t('Search plan items')} className={inputClass} value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
          <select aria-label={t('Sections')} className={inputClass} value={section} onChange={e=>{setSection(e.target.value);setPage(0);}}><option value="">{t('All sections')}</option>{[...new Set(allItems.map(item=>item.sectionNumber))].map(number=><option value={number} key={number}>{`${number}. ${allItems.find(item=>item.sectionNumber===number)?.sectionTitle}`}</option>)}</select>
          <select aria-label={t('Status')} className={inputClass} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0);}}>{['ALL','UNASSIGNED','IN_PROGRESS','SUBMITTED_FOR_REVIEW','OVERDUE','COMPLETED'].map(status=><option key={status} value={status}>{t(status)}</option>)}</select>
        </div>
        <div className="space-y-3">{filtered.slice(page*15,page*15+15).map(item=>{
          const mapping=mappings.find(m=>m.itemNumber===item.number),rows=bandTasks(item.number);
          return <article key={item.number} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs text-slate-500">{`${item.sectionNumber}. ${item.sectionTitle}`}</p><h3 className="font-semibold">{`${item.number}. ${item.title}`}</h3>
            <details className="text-sm"><summary className="cursor-pointer text-sky-700 dark:text-sky-400">{t('Original plan details')}</summary><div className="mt-3 space-y-3 whitespace-pre-wrap break-words">
              <p>{item.mechanism}</p><p>{`${t('Source schedule')}: ${item.schedule}`}</p><p>{`${t('Source responsible staff')}: ${item.responsible||'—'}`}</p><p>{`${t('Source departments')}: ${item.distributedUnits||'—'}`}</p><p>{`${t('Source oversight')}: ${item.oversight||'—'}`}</p>
            </div></details>
            {mapping&&<div className="space-y-2 text-sm">{mapping.stages.map((stage,index)=><div key={index} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="font-medium">{`${index+1}. ${stage.title}`}</p><p className="mt-1 text-slate-500">{`${stage.deadline} · ${stage.assignees.map(member=>`${users.find(u=>u.id===member.userId)?.fullName||member.userId} (${departments.find(d=>d.id===member.departmentId)?.name||member.departmentId})`).join(', ')}`}</p></div>)}</div>}
            {editable&&<button disabled={busy} className={buttonClass} onClick={()=>openMapping(item)}>{t(mapping?'Edit item assignment':'Assign item and stages')}</button>}
            {rows.map(task=><button key={task.id} className="mr-2 rounded-lg bg-sky-700 px-3 py-2 text-sm text-white" onClick={()=>openTma(task.id)}>{`${t('Open stage')}: ${task.title} · ${t(task.overallStatus||task.status)}`}</button>)}
          </article>;
        })}</div>
        <div className="flex items-center justify-between"><button disabled={!page} className={buttonClass} onClick={()=>setPage(p=>p-1)}>{t('Previous')}</button><span className="text-sm">{`${page+1}/${Math.max(1,Math.ceil(filtered.length/15))}`}</span><button disabled={(page+1)*15>=filtered.length} className={buttonClass} onClick={()=>setPage(p=>p+1)}>{t('Next')}</button></div>
      </>}
      {(!manager||plan.legacy)&&<div className="space-y-3">{planTasks.map(task=><article key={task.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs text-slate-500">{`${t('Plan item')}: ${task.workPlanItemNumber||task.planCode}`}</p><h3 className="mt-2 font-bold">{task.workPlanItemTitle||task.title}</h3><p className="mt-2 text-sm">{task.title}</p><p className="mt-2 text-sm text-slate-500">{`${task.deadline} · ${t(task.status)} · ${task.progressPercent}%`}</p><button className="mt-4 rounded-lg bg-sky-700 px-4 py-3 text-sm font-bold text-white" onClick={()=>openTma(task.id)}>{t('Ish maydonini ochish')}</button></article>)}</div>}
    </>}
    {currentItem&&editable&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-2 sm:p-6">
      <form role="dialog" aria-modal="true" aria-labelledby="mapping-title" className="max-h-[94dvh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900 sm:p-6" onSubmit={e=>{
        e.preventDefault();setMappings(values=>[...values.filter(m=>m.itemNumber!==currentItem.number),{itemNumber:currentItem.number,stages}]);setDirty(true);setItemNumber(null);
      }}>
        <h2 id="mapping-title" className="font-bold">{`${currentItem.number}. ${currentItem.title}`}</h2><p className="whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{`${t('Source schedule')}: ${currentItem.schedule}`}</p>
        <p className="text-sm text-slate-500">{t('Enter each stage and confirm its exact deadline. Source dates are never guessed.')}</p>
        {stages.map((stage,index)=><fieldset key={index} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><legend className="px-2 font-semibold">{`${t('Stage')} ${index+1}`}</legend>
          <label className="block text-sm">{t('Stage title')}<input required maxLength={500} className={inputClass} value={stage.title} onChange={e=>updateStage(index,{title:e.target.value})}/></label>
          <label className="block text-sm">{t('Confirmed deadline')}<input required type="date" className={inputClass} value={stage.deadline} onChange={e=>updateStage(index,{deadline:e.target.value})}/></label>
          {stage.assignees.map((member,memberIndex)=><div key={memberIndex} className="grid gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm">{t('Department')}<select required className={inputClass} value={member.departmentId} onChange={e=>updateStage(index,{assignees:stage.assignees.map((m,i)=>i===memberIndex?{userId:'',departmentId:e.target.value}:m)})}><option value="">{t('Choose department')}</option>{departments.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
            <label className="text-sm">{t('Assignee')}<select required className={inputClass} value={member.userId} onChange={e=>updateStage(index,{assignees:stage.assignees.map((m,i)=>i===memberIndex?{...m,userId:e.target.value}:m)})}><option value="">{t('Choose employee')}</option>{users.filter(u=>u.active&&u.id!==rectorId&&u.departmentId===member.departmentId&&!stage.assignees.some((m,i)=>i!==memberIndex&&m.userId===u.id)).map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>
            {stage.assignees.length>1&&<button type="button" className={`${buttonClass} self-end`} onClick={()=>updateStage(index,{assignees:stage.assignees.filter((_,i)=>i!==memberIndex)})}>{t('Remove')}</button>}
          </div>)}
          <div className="flex flex-wrap gap-2"><button type="button" disabled={stage.assignees.length>=50} className={buttonClass} onClick={()=>updateStage(index,{assignees:[...stage.assignees,{userId:'',departmentId:''}]})}>{t('Add assignee')}</button>{stages.length>1&&<button type="button" className={buttonClass} onClick={()=>setStages(values=>values.filter((_,i)=>i!==index))}>{t('Remove stage')}</button>}</div>
        </fieldset>)}
        <button type="button" disabled={stages.length>=30} className={buttonClass} onClick={()=>setStages(values=>[...values,{title:'',deadline:'',assignees:[{userId:'',departmentId:''}]}])}>{t('Add stage')}</button>
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-white py-3 dark:border-slate-700 dark:bg-slate-900"><button type="button" className={buttonClass} onClick={()=>setItemNumber(null)}>{t('Cancel')}</button><button type="submit" className={`${buttonClass} bg-sky-700 text-white`}>{t('Use this mapping')}</button></div>
      </form>
    </div>}
  </div>;
};
