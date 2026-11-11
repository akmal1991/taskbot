export type MetricItem={status:string;assignee_ids:string[];unresolved_roles:string[];cycle:number;evidence:{user_id:string;cycle:number}[]};
// One decimal place; incomplete work must never round up to 100%.
export const percentage=(part:number,total:number)=>total>0?Math.min(part<total?99.9:100,Math.round(part/total*1000)/10):0;
export function executionMetrics(items:MetricItem[]){
 const total=items.length,done=items.filter(i=>i.status==='COMPLETED').length;
 const assigned=items.filter(i=>i.assignee_ids.length>0&&!i.unresolved_roles.length).length;
 const required=items.reduce((n,i)=>n+new Set(i.assignee_ids).size,0);
 const submitted=items.reduce((n,i)=>n+new Set(i.evidence.filter(e=>e.cycle===i.cycle&&i.assignee_ids.includes(e.user_id)).map(e=>e.user_id)).size,0);
 const returned=items.filter(i=>i.status==='RETURNED').length;
 return{total,done,assigned,required,submitted,returned,missing:total-assigned,completion:percentage(done,total),coverage:percentage(assigned,total),evidence:percentage(submitted,required),returnRate:percentage(returned,total)};
}
