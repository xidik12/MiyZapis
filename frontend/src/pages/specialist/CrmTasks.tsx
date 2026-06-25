import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { confirm } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import { crmService, ClientTask, CrmClient } from '../../services/crm.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

// ---- Types ------------------------------------------------------------------

type StatusFilter = 'open' | 'done';

interface TaskFormData {
  title: string;
  notes: string;
  dueDate: string;
  customerId: string;
}

const initialTaskForm: TaskFormData = {
  title: '',
  notes: '',
  dueDate: '',
  customerId: '',
};

// ---- Helpers ----------------------------------------------------------------

const fmtDate = (s?: string | null): string => (s ? new Date(s).toLocaleDateString() : '—');

const isOverdue = (dueDate?: string | null): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

// ---- Main component ---------------------------------------------------------

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const TASKS_HELP = {
  en: {
    overview:
      'Tasks\n\nPersonal follow-up reminders — things you need to do for or about your clients.\n\n' +
      'Task statuses:\n' +
      '• Open — not done yet; shown in the "Open" tab\n' +
      '• Done — completed; moved to the "Done" tab\n\n' +
      'Click the checkbox on a task to mark it done (or reopen it).\n\n' +
      'Due date — optional deadline. Tasks past their due date are highlighted in red ("Overdue").\n\n' +
      'Client ID (optional) — link a task to a specific client so their name appears on the card. Find the ID by opening the client\'s card in the Clients section.\n\n' +
      'Examples of tasks:\n' +
      '• "Call Olena to confirm Friday appointment"\n' +
      '• "Send formula to Ira after colour correction"\n' +
      '• "Offer VIP discount to top 5 clients this month"',
  },
  uk: {
    overview:
      'Завдання\n\nОсобисті нагадування для роботи з клієнтами — справи, які потрібно зробити.\n\n' +
      'Статуси завдань:\n' +
      '• Відкрите — ще не виконано; відображається у вкладці "Відкриті"\n' +
      '• Виконане — завершено; переміщується у вкладку "Виконані"\n\n' +
      'Натисніть на прапорець, щоб позначити завдання як виконане (або скасувати це).\n\n' +
      'Дата виконання — необов\'язковий дедлайн. Прострочені завдання виділяються червоним ("Прострочено").\n\n' +
      'ID клієнта (необов\'язково) — прив\'язує завдання до конкретного клієнта, щоб його ім\'я відображалося на картці. ID знаходиться у розділі "Клієнти".\n\n' +
      'Приклади завдань:\n' +
      '• "Зателефонувати Олені, підтвердити запис на п\'ятницю"\n' +
      '• "Надіслати Ірі формулу після корекції кольору"\n' +
      '• "Запропонувати знижку VIP топ-5 клієнтам цього місяця"',
  },
  ru: {
    overview:
      'Задачи\n\nЛичные напоминания для работы с клиентами — дела, которые нужно сделать.\n\n' +
      'Статусы задач:\n' +
      '• Открытая — ещё не выполнена; отображается во вкладке "Открытые"\n' +
      '• Выполненная — завершена; перемещается во вкладку "Выполненные"\n\n' +
      'Нажмите на флажок, чтобы отметить задачу как выполненную (или отменить это).\n\n' +
      'Дата выполнения — необязательный дедлайн. Просроченные задачи выделяются красным ("Просрочено").\n\n' +
      'ID клиента (необязательно) — привязывает задачу к конкретному клиенту, чтобы его имя отображалось на карточке. ID находится в разделе "Клиенты".\n\n' +
      'Примеры задач:\n' +
      '• "Позвонить Елене, подтвердить запись на пятницу"\n' +
      '• "Отправить Ире формулу после коррекции цвета"\n' +
      '• "Предложить скидку VIP топ-5 клиентам этого месяца"',
  },
};

const CrmTasks: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (TASKS_HELP as Record<string, typeof TASKS_HELP.en>)[language] || TASKS_HELP.en;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ClientTask[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(initialTaskForm);

  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  // Client picker state
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    const fetchClients = async () => {
      setClientsLoading(true);
      try {
        const data = await crmService.getClients();
        setClients(data || []);
      } catch {
        // clients are optional for the picker — swallow silently
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await crmService.listTasks({ status: statusFilter });
      setTasks(data || []);
    } catch (error: unknown) {
      console.error('CrmTasks load error:', error);
      toast.error(t('crm.loadError') || 'Failed to load tasks');
      setError(t('crm.loadError') || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ---- Task actions ----------------------------------------------------------

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setIsModalOpen(true);
  };

  const openEditTask = (task: ClientTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      notes: task.notes || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      customerId: task.customerId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error(t('crm.titleRequired') || 'Title is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        title: taskForm.title.trim(),
        notes: taskForm.notes.trim() || undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
        customerId: taskForm.customerId || undefined,
      };
      if (editingTask) {
        await crmService.updateTask(editingTask.id, payload);
        toast.success(t('crm.taskUpdated') || 'Task updated');
      } else {
        await crmService.createTask(payload);
        toast.success(t('crm.taskCreated') || 'Task created');
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.saveError') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (task: ClientTask) => {
    try {
      setActing(task.id);
      await crmService.toggleTask(task.id);
      toast.success(
        task.status === 'open'
          ? (t('crm.taskMarkedDone') || 'Task marked done')
          : (t('crm.taskReopened') || 'Task reopened')
      );
      loadTasks();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.saveError') || 'Failed to update task');
    } finally {
      setActing(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!await confirm(t('crm.confirmDeleteTask') || 'Delete this task?')) return;
    try {
      setActing(id);
      await crmService.deleteTask(id);
      toast.success(t('crm.taskDeleted') || 'Task deleted');
      loadTasks();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.deleteError') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  // ---- Constants -------------------------------------------------------------

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'open', label: t('crm.openTasks') || 'Open' },
    { key: 'done', label: t('crm.doneTasks') || 'Done' },
  ];

  if (loading && tasks.length === 0) {
    return <PageLoader text={t('crm.loadingTasks') || 'Loading tasks...'} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('crm.tasks') || 'Tasks'}
              </h1>
              <HelpTip title={t('help.tasks.title') || 'Tasks'} content={h.overview} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('crm.tasksSubtitle') || 'Track follow-ups and to-dos for your clients'}
            </p>
          </div>
          <button
            onClick={openNewTask}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96] w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5" />
            {t('crm.newTask') || 'New task'}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={() => loadTasks()}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Status tab bar */}
        <div className="flex flex-wrap gap-x-1 gap-y-0 mb-6 border-b border-gray-200 dark:border-gray-700">
          {statusTabs.map((tb) => {
            const active = statusFilter === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setStatusFilter(tb.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition active:scale-[0.96] ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tb.key === 'open' ? (
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                ) : (
                  <CheckIcon className="h-5 w-5" />
                )}
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter === 'open'
                ? (t('crm.noOpenTasks') || 'No open tasks')
                : (t('crm.noDoneTasks') || 'No completed tasks yet')}
            </p>
            {statusFilter === 'open' && (
              <button
                onClick={openNewTask}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
              >
                <PlusIcon className="h-5 w-5" />
                {t('crm.createFirstTask') || 'Create your first task'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const overdue = task.status === 'open' && isOverdue(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox toggle */}
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={acting === task.id}
                      aria-label={task.status === 'open' ? (t('crm.markDone') || 'Mark done') : (t('crm.reopen') || 'Reopen')}
                      className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition active:scale-[0.96] disabled:opacity-50 ${
                        task.status === 'done'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-400 dark:border-gray-500 hover:border-primary-500'
                      }`}
                    >
                      {acting === task.id ? (
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      ) : task.status === 'done' ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : null}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className={`font-medium break-words ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {task.customerName && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 break-words">
                            {task.customerName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 text-xs tabular-nums ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {overdue && (t('crm.overdue') || 'Overdue') + ' · '}
                            {fmtDate(task.dueDate)}
                          </span>
                        )}
                        {task.status === 'done' && task.completedAt && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {t('crm.completedAt') || 'Done'} <span className="tabular-nums">{fmtDate(task.completedAt)}</span>
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 break-words">{task.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditTask(task)}
                        aria-label={t('common.edit') || 'Edit'}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition active:scale-[0.96]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={acting === task.id}
                        aria-label={t('common.delete') || 'Delete'}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition active:scale-[0.96] disabled:opacity-50"
                      >
                        {acting === task.id ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================== TASK MODAL ======================== */}
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingTask
                    ? (t('crm.editTask') || 'Edit task')
                    : (t('crm.newTask') || 'New task')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('crm.taskTitle') || 'Title'} *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder={t('crm.taskTitlePlaceholder') || 'e.g., Follow up with Lena'}
                    className={inputClass}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('crm.dueDate') || 'Due date'}</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t('crm.clientId') || 'Link to client'}{' '}
                    <span className="font-normal text-gray-400 dark:text-gray-500">({t('crm.optional') || 'optional'})</span>
                  </label>
                  <select
                    value={taskForm.customerId}
                    onChange={(e) => setTaskForm({ ...taskForm, customerId: e.target.value })}
                    className={inputClass}
                    disabled={clientsLoading}
                  >
                    <option value="">{clientsLoading ? (t('common.loading') || 'Loading…') : (t('crm.clientPickerNone') || '— No client —')}</option>
                    {clients.map((c) => (
                      <option key={c.customerId} value={c.customerId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('crm.notes') || 'Notes'}</label>
                  <textarea
                    value={taskForm.notes}
                    rows={3}
                    onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                    placeholder={t('crm.optional') || 'Optional'}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-[0.96]"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingTask ? (t('common.save') || 'Save') : (t('crm.createTask') || 'Create task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CrmTasks;
