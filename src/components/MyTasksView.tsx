import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';

export interface HubTask {
  id: string;
  title: string;
  subtitle: string;
  status: 'Done' | 'In Progress' | 'Pending';
  completedAt?: string;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

const DEFAULT_TASKS: HubTask[] = [
  {
    id: 'TASK-1',
    title: 'Verify AHPL Morning Inbound Vehicles (Docks 1 & 2)',
    subtitle: 'Completed at 10:15 AM',
    status: 'Done',
    completedAt: '10:15 AM',
    priority: 'High',
  },
  {
    id: 'TASK-2',
    title: 'Check Seal Numbers & Invoice Match for 32 Ft SXL Fleet',
    subtitle: 'Pending Physical Audit at Gate & Dock Bay',
    status: 'In Progress',
    priority: 'High',
  },
  {
    id: 'TASK-3',
    title: 'Audit POD Damage Claims & Upload Photos to Google Sheets',
    subtitle: 'Scheduled for 03:00 PM',
    status: 'Pending',
    priority: 'Medium',
  },
  {
    id: 'TASK-4',
    title: 'Confirm AIL Afternoon Dispatches (Docks 5 to 9)',
    subtitle: 'Coordinate with Transporter representatives',
    status: 'Pending',
    priority: 'Medium',
  },
];

interface MyTasksViewProps {
  lang: Language;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ lang }) => {
  const [tasks, setTasks] = useState<HubTask[]>(() => {
    try {
      const saved = localStorage.getItem('ahpl_my_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved tasks', e);
    }
    return DEFAULT_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubtitle, setNewTaskSubtitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Done'>('All');

  useEffect(() => {
    try {
      localStorage.setItem('ahpl_my_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Error saving tasks', e);
    }
  }, [tasks]);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.status === 'Done') {
          return { ...t, status: 'Pending', completedAt: undefined };
        } else {
          const timeNow = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          return {
            ...t,
            status: 'Done',
            completedAt: timeNow,
            subtitle: `Completed at ${timeNow}`,
          };
        }
      })
    );
  };

  const handleCycleStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: Record<HubTask['status'], HubTask['status']> = {
          Pending: 'In Progress',
          'In Progress': 'Done',
          Done: 'Pending',
        };
        const updatedStatus = nextStatus[t.status];
        const timeNow = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return {
          ...t,
          status: updatedStatus,
          completedAt: updatedStatus === 'Done' ? timeNow : undefined,
          subtitle:
            updatedStatus === 'Done'
              ? `Completed at ${timeNow}`
              : updatedStatus === 'In Progress'
              ? 'Currently underway'
              : 'Pending action',
        };
      })
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: HubTask = {
      id: `TASK-${Date.now().toString().slice(-4)}`,
      title: newTaskTitle.trim(),
      subtitle: newTaskSubtitle.trim() || 'Created today',
      status: 'Pending',
      priority: newTaskPriority,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskSubtitle('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DCCE] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </span>
              <span>{lang === 'hi' ? 'मेरे सौंपे गए दैनिक कार्य' : 'My Assigned Daily Tasks'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'hi'
                ? 'राहुल प्रजापति के लिए निर्धारित चेकलिस्ट • इंदौर हब'
                : 'Scheduled checklist for Rahul Prajapati • Indore Hub'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'hi' ? "आज की शिफ्ट" : "Today's Shift"}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="px-3.5 py-1.5 bg-[#2C3E50] hover:bg-[#1E2B37] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-200" />
              <span>{lang === 'hi' ? 'नया टास्क जोड़ें' : 'Add Task'}</span>
            </button>
          </div>
        </div>

        {/* Task Counters Strip */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFilter('All')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              filter === 'All' ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#FBF9F5] text-slate-700 border-[#EAE4D5]'
            }`}
          >
            <p className="text-lg font-black">{tasks.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {lang === 'hi' ? 'कुल कार्य' : 'Total Tasks'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilter('Pending')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              filter === 'Pending'
                ? 'bg-amber-800 text-white border-amber-800'
                : 'bg-amber-50/50 text-amber-900 border-amber-200/80'
            }`}
          >
            <p className="text-lg font-black">{pendingCount + inProgressCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {lang === 'hi' ? 'लंबित / प्रगति में' : 'Pending Action'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilter('Done')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              filter === 'Done'
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-emerald-50/50 text-emerald-900 border-emerald-200/80'
            }`}
          >
            <p className="text-lg font-black">{doneCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {lang === 'hi' ? 'पूर्ण कार्य' : 'Completed'}
            </p>
          </button>
        </div>

        {/* New Task Inline Form */}
        {isAddingTask && (
          <form onSubmit={handleAddTask} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#EAE4D5] space-y-3">
            <h4 className="text-xs font-bold text-slate-800">
              {lang === 'hi' ? 'नया टास्क दर्ज करें' : 'Create New Checklist Item'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Audit seal numbers on Dock 3)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-700 outline-none"
                  required
                />
              </div>
              <div>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-700 outline-none"
                >
                  <option value="High">Priority: High</option>
                  <option value="Medium">Priority: Medium</option>
                  <option value="Low">Priority: Low</option>
                </select>
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Additional notes / timeline (Optional)..."
                value={newTaskSubtitle}
                onChange={(e) => setNewTaskSubtitle(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-700 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Task Items List (Exact Match to Screenshot with Enhancements) */}
        <div className="space-y-2.5" id="myTasksList">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No tasks found in this view filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'Done';
              const isInProgress = task.status === 'In Progress';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-white/80 border-slate-200 opacity-80'
                      : 'bg-[#FBF9F5] border-[#EAE4D5] shadow-2xs hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-700 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          isInProgress
                            ? 'text-amber-800 font-medium'
                            : isDone
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {task.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(task.id)}
                      title="Click to cycle status"
                      className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold cursor-pointer transition ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {task.status}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
