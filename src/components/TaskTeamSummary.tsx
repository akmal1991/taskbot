import React from 'react';
import type { Task } from '../types';
import { localizeText } from '../utils/i18n';

export const TaskTeamSummary = ({ task }: { task: Task }) => {
  if (!task.assignments || task.assignments.length < 2) return null;
  return <section className="my-3 space-y-2 rounded-lg border border-slate-400/30 p-3 text-xs">
    <h4 className="font-semibold">Task team</h4>
    <p>{`${localizeText('Overall progress')}: ${task.overallProgress}% · ${localizeText(task.overallStatus || task.status)}`}</p>
    {task.assignments.map(member => <div key={member.userId} className="flex flex-wrap justify-between gap-2 border-t border-slate-400/20 pt-2">
      <span>{`${member.fullName} — ${member.departmentName}`}</span>
      <span>{`${localizeText(member.status)} · ${member.progress}%`}</span>
    </div>)}
    <p>Each assignee submits their own evidence. Task members can view all submitted evidence.</p>
  </section>;
};
