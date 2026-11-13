export type TrendItem={reviews:{stage:string;decision:string;created_at:string}[]};
const dayMs=86400000;
// Shift UTC to the university's calendar day (Asia/Tashkent, UTC+5).
export const tashkentDay=(value:string|number)=>new Date(new Date(value).getTime()+5*3600000).toISOString().slice(0,10);
export function executionTrend(items:TrendItem[],days:number,now=Date.now()){
 const today=tashkentDay(now),end=Date.parse(today+'T00:00:00Z');
 const dates=items.flatMap(item=>{const approvals=item.reviews.filter(r=>r.stage==='FINAL'&&r.decision==='APPROVED'&&Number.isFinite(Date.parse(r.created_at))).map(r=>tashkentDay(r.created_at)).sort();return approvals.length?[approvals[0]]:[];});
 const points=Array.from({length:days},(_,i)=>{const date=new Date(end-(days-1-i)*dayMs).toISOString().slice(0,10);return{date,total:dates.filter(d=>d<=date).length,daily:dates.filter(d=>d===date).length};});
 const start=points[0].date,previousStart=new Date(end-(2*days-1)*dayMs).toISOString().slice(0,10);
 return{points,current:dates.filter(d=>d>=start&&d<=today).length,previous:dates.filter(d=>d>=previousStart&&d<start).length};
}
