import {expect,it} from 'bun:test';
import {executionMetrics,percentage,type MetricItem} from './executionMetrics';
const item=(extra:Partial<MetricItem>={}):MetricItem=>({status:'ASSIGNED',assignee_ids:['a','b'],unresolved_roles:[],cycle:2,evidence:[],...extra});
it('counts current assignee submissions once and ignores old cycles and foreign evidence',()=>{
 const m=executionMetrics([item({evidence:[{user_id:'a',cycle:2},{user_id:'a',cycle:2},{user_id:'b',cycle:1},{user_id:'foreign',cycle:2}]}),item({status:'COMPLETED',assignee_ids:['c'],evidence:[{user_id:'c',cycle:2}]}),item({status:'RETURNED',assignee_ids:[],unresolved_roles:['Vacancy']})]);
 expect(m.total).toBe(3);expect(m.done).toBe(1);expect(m.required).toBe(3);expect(m.submitted).toBe(2);expect(m.completion).toBe(33.3);expect(m.coverage).toBe(66.7);expect(m.evidence).toBe(66.7);expect(m.returnRate).toBe(33.3);
});
it('keeps partial assignments distinct from full coverage and handles empty denominators',()=>{
 expect(executionMetrics([item({unresolved_roles:['Vacancy']})]).coverage).toBe(0);
 expect(executionMetrics([])).toMatchObject({completion:0,coverage:0,evidence:0,returnRate:0});
 expect(percentage(427,428)).toBe(99.8);expect(percentage(9999,10000)).toBe(99.9);expect(percentage(428,428)).toBe(100);
});
