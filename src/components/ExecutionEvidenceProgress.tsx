import React from 'react';
import {CheckCircle2,Clock3,FileCheck2} from 'lucide-react';
type Proof={id:string;user_id:string;cycle:number;filename:string;created_at:string};
type Item={assignee_ids:string[];unresolved_roles:string[];cycle:number;status:string;evidence:Proof[]};
export function evidenceProgress(item:Item){
 const current=item.evidence.filter(e=>e.cycle===item.cycle&&item.assignee_ids.includes(e.user_id));
 const submitted=new Set(current.map(e=>e.user_id));
 const waiting=item.assignee_ids.filter(id=>!submitted.has(id));
 return{current,submitted,waiting,total:item.assignee_ids.length,ready:item.assignee_ids.length>0&&!waiting.length&&!item.unresolved_roles.length};
}
const time=(value:string)=>new Date(value).toLocaleString('uz-UZ',{timeZone:'Asia/Tashkent'});
export function ExecutionEvidenceProgress({item,name,compact=false}:{item:Item;name:(id:string)=>string;compact?:boolean}){
 const p=evidenceProgress(item);
 return <section className={`rounded-xl ${p.ready?'bg-emerald-50':'bg-sky-50'} ${compact?'mt-3 p-3':'border border-slate-200 p-4'}`}>
  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="flex items-center gap-2 text-sm"><FileCheck2 size={17}/>{p.submitted.size} / {p.total} — dalil yuborildi</strong><span className="text-xs font-medium text-slate-600">{p.ready?'Barcha dalillar jamlandi':'Ijrochilar dalili kutilmoqda'}</span></div>
  <div className="my-3 h-1.5 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full transition-all motion-reduce:transition-none ${p.ready?'bg-emerald-500':'bg-sky-500'}`} style={{width:`${p.total?p.submitted.size/p.total*100:0}%`}}/></div>
  {!compact&&<><p className="mb-3 text-xs leading-5 text-slate-600">Har bir ijrochi alohida dalil yuboradi. Barcha dalillar jamlangach Akmal Rustamov tasdiqlashi mumkin.</p><div className="space-y-2">{item.assignee_ids.map(id=>{const proof=p.current.find(e=>e.user_id===id);return <div key={id} className="rounded-xl bg-white p-3"><div className="flex items-start gap-2">{proof?<CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600"/>:<Clock3 size={18} className="mt-0.5 shrink-0 text-amber-600"/>}<div className="min-w-0 flex-1"><p className="text-sm font-semibold">{name(id)}</p><p className={`mt-1 text-xs ${proof?'text-emerald-700':'text-amber-700'}`}>{proof?'Dalil yubordi':'Hali dalil yubormadi'}</p>{proof&&<><a className="mt-2 block break-all text-sm text-sky-700 underline" href={`/api/execution/evidence/${proof.id}`}>{proof.filename}</a><p className="mt-1 text-xs text-slate-400">{time(proof.created_at)}</p></>}</div></div></div>;})}</div>{item.unresolved_roles.length>0&&<p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Belgilanmagan mas’ullar ham aniqlanishi kerak: {item.unresolved_roles.join(', ')}</p>}</>}
  {compact&&p.waiting.length>0&&<p className="text-xs leading-5 text-slate-600">Kutilmoqda: {p.waiting.map(name).join(', ')}</p>}
 </section>;
}
