import {test,expect} from 'bun:test';
import {executionTrend,tashkentDay} from './executionTrend';
test('uses Tashkent days, deduplicates final approvals, excludes first reviews and compares equal periods',()=>{
 const review=(date:string,stage='FINAL',decision='APPROVED')=>({created_at:date,stage,decision});
 const r=executionTrend([{reviews:[review('2026-11-12T20:00:00Z'),review('2026-11-13T05:00:00Z')]},{reviews:[review('2026-11-11T10:00:00Z')]},{reviews:[review('2026-11-13T10:00:00Z','FIRST')]},{reviews:[review('2026-11-13T10:00:00Z','FINAL','REJECTED')]}],2,Date.parse('2026-11-13T12:00:00Z'));
 expect(tashkentDay('2026-11-12T20:00:00Z')).toBe('2026-11-13');expect(r.current).toBe(1);expect(r.previous).toBe(1);expect(r.points.map(p=>p.total)).toEqual([1,2]);
 expect(executionTrend([],30).points.every(p=>p.total===0)).toBe(true);
});
