import { describe, expect, it } from 'bun:test';
import { calculateDeadlineInfo } from './TaskRegister';

describe('calculateDeadlineInfo', () => {
  it('labels open-ended work-plan stages instead of computing NaN days', () => {
    const continuous = calculateDeadlineInfo('', 'IN_PROGRESS', 'CONTINUOUS');
    expect(continuous.label).toBe('Continuous execution');
    expect(continuous.urgency).toBe('NORMAL');
    expect(calculateDeadlineInfo('', 'ASSIGNED', 'CONTRACT').label).toBe('Contract schedule');
    expect(String(calculateDeadlineInfo('', 'ASSIGNED').label)).not.toContain('NaN');
  });
  it('still flags dated tasks that are overdue', () => {
    expect(calculateDeadlineInfo('2000-01-01', 'IN_PROGRESS').urgency).toBe('OVERDUE');
  });
});
