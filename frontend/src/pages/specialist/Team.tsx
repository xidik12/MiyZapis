import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { confirm } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTip } from '@/components/common/HelpTip';

const TEAM_HELP = {
  en: {
    overview:
      'Team — attendance, leave & shifts\n\nThis page is the HR hub for you and your business staff.\n\nWhat you can do here:\n\nAs a specialist (employee):\n• Clock In / Clock Out — record your work hours for today. Clock In opens your attendance; Clock Out closes it.\n• Request leave — submit a vacation, sick day or other leave request for your employer to approve.\n• View my leaves — see all your leave requests and their status (Pending / Approved / Rejected).\n\nAs a business owner / manager (employer sections):\n• Roster — see today\'s attendance status for all staff.\n• Pending leaves — review and approve or reject leave requests.\n• Shifts — schedule future shifts for staff members.\n• Manual attendance — correct or add attendance records retroactively.\n\nRelation to Payroll:\nAttendance records and shift data feed into payroll calculations. Accurate clock-in/out data ensures correct hour totals.',
    clockInOut:
      'Clock In / Clock Out\n\n• Clock In — tap to record when you started work today. Only one clock-in per day.\n• Clock Out — tap when you finish. The system calculates total minutes worked.\n• Status — Присутній (Present), Запізнився (Late), Відсутній (Absent), У відпустці (On Leave), Пів дня (Half Day).\n\nIf you forgot to clock in or out, your manager can add or correct the record using Manual Attendance.',
    leaveRequest:
      'Leave request\n\nSubmit time-off requests that your manager will approve or reject.\n\n• Type — Vacation (відпустка), Sick leave (лікарняний), Day off (відгул), Other.\n• Start date / End date — the date range for your leave.\n• Reason — optional note for your manager.\n\nOnce submitted, the request shows as Pending until reviewed. You can cancel a Pending request yourself.',
    shifts:
      'Shifts (employer only)\n\nSchedule upcoming work periods for staff members.\n\n• Staff member — who this shift is for.\n• Start / End time — the planned work window.\n• Note — optional internal comment.\n\nShifts are informational and used for planning; they do not replace clock-in/out attendance.',
  },
  uk: {
    overview:
      'Команда — відвідуваність, відпустки та зміни\n\nЦя сторінка — HR-центр для вас і вашого персоналу.\n\nЩо ви можете тут робити:\n\nЯк спеціаліст (співробітник):\n• Прийшов / Пішов — фіксуйте робочі години на сьогодні. "Прийшов" відкриває вашу відвідуваність; "Пішов" закриває її.\n• Запит на відпустку — подайте заявку на відпустку, лікарняний або інший тип відсутності для затвердження.\n• Мої відпустки — перегляньте всі ваші запити та їхній статус (Очікує / Затверджено / Відхилено).\n\nЯк власник / менеджер бізнесу (розділи роботодавця):\n• Розклад — переглядайте статус відвідуваності всього персоналу на сьогодні.\n• Очікуючі відпустки — переглядайте та затверджуйте або відхиляйте запити.\n• Зміни — плануйте майбутні зміни для співробітників.\n• Ручна відвідуваність — виправляйте або додавайте записи про відвідуваність.\n\nЗв\'язок із зарплатою:\nДані про відвідуваність та зміни використовуються у розрахунках зарплати. Точні дані забезпечують правильний підрахунок годин.',
    clockInOut:
      'Прийшов / Пішов\n\n• Прийшов — натисніть, щоб зафіксувати початок роботи сьогодні. Лише один раз на день.\n• Пішов — натисніть, коли закінчите. Система підраховує загальну кількість відпрацьованих хвилин.\n• Статус — Присутній, Запізнився, Відсутній, У відпустці, Пів дня.\n\nЯкщо ви забули відмітити прихід або відхід, менеджер може додати або виправити запис через Ручну відвідуваність.',
    leaveRequest:
      'Запит на відпустку\n\nПодайте заявку на відсутність, яку менеджер затвердить або відхилить.\n\n• Тип — Відпустка, Лікарняний, Відгул, Інше.\n• Дата початку / Дата кінця — діапазон вашої відсутності.\n• Причина — необов\'язкова примітка для менеджера.\n\nПісля подачі заявка відображається як "Очікує" до перевірки. Ви можете самостійно скасувати заявку зі статусом "Очікує".',
    shifts:
      'Зміни (лише для роботодавців)\n\nПлануйте майбутні робочі периоди для співробітників.\n\n• Співробітник — для кого ця зміна.\n• Початок / Кінець — запланований робочий час.\n• Примітка — необов\'язковий внутрішній коментар.\n\nЗміни носять інформаційний характер і використовуються для планування; вони не замінюють відмітки про прихід/відхід.',
  },
  ru: {
    overview:
      'Команда — посещаемость, отпуска и смены\n\nЭта страница — HR-центр для вас и вашего персонала.\n\nЧто вы можете здесь делать:\n\nКак специалист (сотрудник):\n• Пришёл / Ушёл — фиксируйте рабочие часы за сегодня. "Пришёл" открывает вашу посещаемость; "Ушёл" закрывает её.\n• Запрос отпуска — подайте заявку на отпуск, больничный или другой тип отсутствия на утверждение.\n• Мои отпуска — просматривайте все ваши запросы и их статус (Ожидает / Утверждено / Отклонено).\n\nКак владелец / менеджер бизнеса (разделы работодателя):\n• Расписание — просматривайте статус посещаемости всего персонала на сегодня.\n• Ожидающие отпуска — просматривайте и утверждайте или отклоняйте запросы.\n• Смены — планируйте будущие смены для сотрудников.\n• Ручная посещаемость — исправляйте или добавляйте записи о посещаемости.\n\nСвязь с зарплатой:\nДанные о посещаемости и сменах используются в расчётах зарплаты. Точные данные обеспечивают правильный подсчёт часов.',
    clockInOut:
      'Пришёл / Ушёл\n\n• Пришёл — нажмите, чтобы зафиксировать начало работы сегодня. Только один раз в день.\n• Ушёл — нажмите, когда закончите. Система подсчитывает общее количество отработанных минут.\n• Статус — Присутствует, Опоздал, Отсутствует, В отпуске, Полдня.\n\nЕсли вы забыли отметить приход или уход, менеджер может добавить или исправить запись через Ручную посещаемость.',
    leaveRequest:
      'Запрос отпуска\n\nПодайте заявку на отсутствие, которую менеджер утвердит или отклонит.\n\n• Тип — Отпуск, Больничный, Отгул, Другое.\n• Дата начала / Дата окончания — диапазон вашего отсутствия.\n• Причина — необязательная заметка для менеджера.\n\nПосле подачи заявка отображается как "Ожидает" до проверки. Вы можете самостоятельно отменить заявку со статусом "Ожидает".',
    shifts:
      'Смены (только для работодателей)\n\nПланируйте будущие рабочие периоды для сотрудников.\n\n• Сотрудник — для кого эта смена.\n• Начало / Конец — запланированное рабочее время.\n• Заметка — необязательный внутренний комментарий.\n\nСмены носят информационный характер и используются для планирования; они не заменяют отметки о приходе/уходе.',
  },
};
import { PageLoader } from '@/components/ui';
import {
  hrService,
  HrSummary,
  Staff,
  AttendanceRecord,
  LeaveRequest,
  Shift,
  LeaveType,
  AttendanceStatus,
} from '../../services/hr.service';
import {
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  XIcon,
  UsersIcon,
  CalendarIcon,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const todayISO = () => new Date().toISOString().slice(0, 10);
const nowLocalISO = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};

const fmtTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
};

const minutesToHHMM = (min?: number | null) => {
  if (!min) return '0h 0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
};

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const LEAVE_STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  APPROVED:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  REJECTED:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  CANCELLED: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

const ATTEND_STATUS_BADGE: Record<string, string> = {
  PRESENT:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  LATE:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ABSENT:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  ON_LEAVE: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  HALF_DAY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const SpecialistTeam: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (TEAM_HELP as any)[language] || TEAM_HELP.en;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HrSummary | null>(null);

  // My-day state
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  // My leaves
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [cancellingLeave, setCancellingLeave] = useState<string | null>(null);

  // Request leave modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'VACATION' as LeaveType, startDate: todayISO(), endDate: todayISO(), reason: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Employer state
  const [staff, setStaff] = useState<Staff[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Employer actions busy state
  const [busyStaff, setBusyStaff] = useState<string | null>(null);
  const [busyLeave, setBusyLeave] = useState<string | null>(null);
  const [busyShift, setBusyShift] = useState<string | null>(null);

  // Manual attendance modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    staffUserId: '',
    date: todayISO(),
    status: 'PRESENT' as AttendanceStatus,
    clockIn: '',
    clockOut: '',
    note: '',
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  // Leave review modal
  const [reviewLeave, setReviewLeave] = useState<LeaveRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Shift modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({ staffUserId: '', startTime: nowLocalISO(), endTime: nowLocalISO(), note: '' });
  const [submittingShift, setSubmittingShift] = useState(false);

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const sum = await hrService.getSummary();
      setSummary(sum);

      const [todRec, myLv] = await Promise.all([
        hrService.getTodayAttendance().catch(() => null),
        hrService.getLeaves({ staffUserId: undefined }).catch(() => [] as LeaveRequest[]),
      ]);
      setTodayRecord(todRec);
      // Filter to self (backend may return all; we rely on no staffUserId = self)
      setMyLeaves(myLv || []);

      if (sum.isEmployer) {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksOut = new Date(); twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
        const [staffList, todayAtt, penLv, shiftList] = await Promise.all([
          hrService.getStaff().catch(() => [] as Staff[]),
          hrService.getAttendance({ from: todayISO(), to: todayISO() }).catch(() => [] as AttendanceRecord[]),
          hrService.getLeaves({ status: 'PENDING' }).catch(() => [] as LeaveRequest[]),
          hrService.getShifts({ from: weekAgo.toISOString(), to: twoWeeksOut.toISOString() }).catch(() => [] as Shift[]),
        ]);
        setStaff(staffList);
        setTodayAttendance(todayAtt);
        setPendingLeaves(penLv);
        setShifts(shiftList);
        if (staffList.length > 0) {
          setManualForm((f) => ({ ...f, staffUserId: staffList[0].staffUserId }));
          setShiftForm((f) => ({ ...f, staffUserId: staffList[0].staffUserId }));
        }
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── My-day handlers ─────────────────────────────────────────────────────

  const handleClockIn = async () => {
    try {
      setClockingIn(true);
      const rec = await hrService.clockIn();
      setTodayRecord(rec);
      toast.success(t('team.clockedIn'));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.clockError'));
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockingOut(true);
      const rec = await hrService.clockOut();
      setTodayRecord(rec);
      toast.success(t('team.clockedOut'));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.clockError'));
    } finally {
      setClockingOut(false);
    }
  };

  // ─── Leave request ───────────────────────────────────────────────────────

  const handleRequestLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error(t('team.leaveDatesRequired'));
      return;
    }
    if (leaveForm.startDate > leaveForm.endDate) {
      toast.error(t('team.leaveInvalidDates'));
      return;
    }
    try {
      setSubmittingLeave(true);
      await hrService.requestLeave({
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason || undefined,
      });
      toast.success(t('team.leaveRequested'));
      setShowLeaveModal(false);
      setLeaveForm({ type: 'VACATION', startDate: todayISO(), endDate: todayISO(), reason: '' });
      // Refresh leaves
      const lv = await hrService.getLeaves({}).catch(() => myLeaves);
      setMyLeaves(lv);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.leaveError'));
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!await confirm({ title: t('team.cancelLeaveTitle'), message: t('team.cancelLeaveMsg'), variant: 'destructive' })) return;
    try {
      setCancellingLeave(id);
      await hrService.cancelLeave(id);
      toast.success(t('team.leaveCancelled'));
      setMyLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: 'CANCELLED' as const } : l));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.leaveError'));
    } finally {
      setCancellingLeave(null);
    }
  };

  // ─── Employer: clock staff ────────────────────────────────────────────────

  const handleStaffClockIn = async (staffUserId: string) => {
    try {
      setBusyStaff(staffUserId);
      await hrService.clockIn(staffUserId);
      toast.success(t('team.clockedIn'));
      const att = await hrService.getAttendance({ from: todayISO(), to: todayISO() }).catch(() => todayAttendance);
      setTodayAttendance(att);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.clockError'));
    } finally {
      setBusyStaff(null);
    }
  };

  const handleStaffClockOut = async (staffUserId: string) => {
    try {
      setBusyStaff(staffUserId);
      await hrService.clockOut(staffUserId);
      toast.success(t('team.clockedOut'));
      const att = await hrService.getAttendance({ from: todayISO(), to: todayISO() }).catch(() => todayAttendance);
      setTodayAttendance(att);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.clockError'));
    } finally {
      setBusyStaff(null);
    }
  };

  // ─── Manual attendance ───────────────────────────────────────────────────

  const handleManualAttendance = async () => {
    try {
      setSubmittingManual(true);
      await hrService.manualAttendance({
        staffUserId: manualForm.staffUserId,
        date: manualForm.date,
        clockIn: manualForm.clockIn || undefined,
        clockOut: manualForm.clockOut || undefined,
        status: manualForm.status,
        note: manualForm.note || undefined,
      });
      toast.success(t('team.attendanceSaved'));
      setShowManualModal(false);
      const att = await hrService.getAttendance({ from: todayISO(), to: todayISO() }).catch(() => todayAttendance);
      setTodayAttendance(att);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.attendanceError'));
    } finally {
      setSubmittingManual(false);
    }
  };

  // ─── Leave review ────────────────────────────────────────────────────────

  const handleLeaveReview = async (decision: 'APPROVE' | 'REJECT') => {
    if (!reviewLeave) return;
    try {
      setSubmittingReview(true);
      await hrService.reviewLeave(reviewLeave.id, decision, reviewNote || undefined);
      toast.success(decision === 'APPROVE' ? t('team.leaveApproved') : t('team.leaveRejected'));
      setReviewLeave(null);
      setReviewNote('');
      const lv = await hrService.getLeaves({ status: 'PENDING' }).catch(() => pendingLeaves);
      setPendingLeaves(lv);
      const sum = await hrService.getSummary().catch(() => summary);
      if (sum) setSummary(sum);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.leaveError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // ─── Shift ───────────────────────────────────────────────────────────────

  const handleCreateShift = async () => {
    if (!shiftForm.staffUserId || !shiftForm.startTime || !shiftForm.endTime) {
      toast.error(t('team.shiftFieldsRequired'));
      return;
    }
    if (shiftForm.startTime >= shiftForm.endTime) {
      toast.error(t('team.shiftInvalidTimes'));
      return;
    }
    try {
      setSubmittingShift(true);
      await hrService.createShift({
        staffUserId: shiftForm.staffUserId,
        startTime: new Date(shiftForm.startTime).toISOString(),
        endTime: new Date(shiftForm.endTime).toISOString(),
        note: shiftForm.note || undefined,
      });
      toast.success(t('team.shiftCreated'));
      setShowShiftModal(false);
      setShiftForm({ staffUserId: staff[0]?.staffUserId || '', startTime: nowLocalISO(), endTime: nowLocalISO(), note: '' });
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksOut = new Date(); twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
      const sl = await hrService.getShifts({ from: weekAgo.toISOString(), to: twoWeeksOut.toISOString() }).catch(() => shifts);
      setShifts(sl);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.shiftError'));
    } finally {
      setSubmittingShift(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!await confirm({ title: t('team.deleteShiftTitle'), message: t('team.deleteShiftMsg'), variant: 'destructive' })) return;
    try {
      setBusyShift(id);
      await hrService.deleteShift(id);
      toast.success(t('team.shiftDeleted'));
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('team.shiftError'));
    } finally {
      setBusyShift(null);
    }
  };

  // ─── Label helpers ───────────────────────────────────────────────────────

  const leaveTypeLabel = (type: string) => t(`team.leaveType.${type}`) || type;
  const leaveStatusLabel = (status: string) => t(`team.leaveStatus.${status}`) || status;
  const attendStatusLabel = (status: string) => t(`team.attendStatus.${status}`) || status;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) return <PageLoader text={t('team.loading')} />;

  const isEmployer = summary?.isEmployer ?? false;

  // Roster: merge staff list with today's attendance
  const todayAttMap = Object.fromEntries(todayAttendance.map((a) => [a.staffUserId, a]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('team.title')}
            </h1>
            <HelpTip title={t('team.title')} content={h.overview} />
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('team.subtitle')}
          </p>
        </div>

        {/* ── Employer summary cards ─────────────────────────────────────── */}
        {isEmployer && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('team.statStaff'), value: summary.staffCount, icon: UsersIcon, color: 'primary' },
              { label: t('team.statPresent'), value: summary.presentToday, icon: CheckCircleIcon, color: 'green' },
              { label: t('team.statOnLeave'), value: summary.onLeaveToday, icon: CalendarIcon, color: 'amber' },
              { label: t('team.statPendingLeaves'), value: summary.pendingLeaves, icon: ClockIcon, color: 'red' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/30' :
                    color === 'green'   ? 'bg-green-100 dark:bg-green-900/30' :
                    color === 'amber'   ? 'bg-amber-100 dark:bg-amber-900/30' :
                                         'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                      color === 'green'   ? 'text-green-600 dark:text-green-400' :
                      color === 'amber'   ? 'text-amber-600 dark:text-amber-400' :
                                           'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── My Day ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.myDay')}</h2>
            <HelpTip title={t('team.myDay')} content={h.clockInOut} size={15} />
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Clock in/out buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleClockIn}
                  disabled={clockingIn || !!todayRecord?.clockIn}
                  className="min-h-[44px] px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {clockingIn && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {t('team.clockIn')}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={clockingOut || !todayRecord?.clockIn || !!todayRecord?.clockOut}
                  className="min-h-[44px] px-6 py-2.5 bg-gray-700 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-xl font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {clockingOut && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {t('team.clockOut')}
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="min-h-[44px] px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition active:scale-[0.96] inline-flex items-center gap-2"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  {t('team.requestLeave')}
                </button>
              </div>

              {/* Today summary */}
              {todayRecord && (
                <div className="flex-1 flex flex-wrap gap-4 sm:justify-end text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{t('team.in')}:</span>{' '}
                    {fmtTime(todayRecord.clockIn)}
                  </span>
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{t('team.out')}:</span>{' '}
                    {fmtTime(todayRecord.clockOut)}
                  </span>
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{t('team.worked')}:</span>{' '}
                    {minutesToHHMM(todayRecord.minutesWorked)}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTEND_STATUS_BADGE[todayRecord.status] ?? ''}`}>
                    {attendStatusLabel(todayRecord.status)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── My Leave Requests ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.myLeaves')}</h2>
            <HelpTip title={t('team.myLeaves')} content={h.leaveRequest} size={15} />
          </div>
          {myLeaves.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <CalendarDaysIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">{t('team.noLeaves')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {myLeaves.map((lv) => (
                <div key={lv.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{leaveTypeLabel(lv.type)}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STATUS_BADGE[lv.status] ?? ''}`}>
                        {leaveStatusLabel(lv.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {fmtDate(lv.startDate)} — {fmtDate(lv.endDate)} · {lv.days} {t('team.days')}
                    </p>
                    {lv.reason && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{lv.reason}</p>}
                  </div>
                  {lv.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelLeave(lv.id)}
                      disabled={cancellingLeave === lv.id}
                      className="min-h-[44px] px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {cancellingLeave === lv.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <XCircleIcon className="h-4 w-4" />}
                      {t('team.cancel')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            EMPLOYER-ONLY SECTIONS
        ─────────────────────────────────────────────────────────────────── */}
        {isEmployer && (
          <>
            {/* ── Roster + Today's Attendance ─────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.rosterTitle')}</h2>
                </div>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="min-h-[44px] px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('team.setAttendance')}
                </button>
              </div>

              {staff.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">{t('team.noStaff')}</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3">{t('team.colName')}</th>
                          <th className="px-6 py-3">{t('team.colRole')}</th>
                          <th className="px-6 py-3">{t('team.colClockIn')}</th>
                          <th className="px-6 py-3">{t('team.colClockOut')}</th>
                          <th className="px-6 py-3">{t('team.colStatus')}</th>
                          <th className="px-6 py-3 text-right"><span className="sr-only">{t('common.actions')}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {staff.map((s) => {
                          const att = todayAttMap[s.staffUserId];
                          const busy = busyStaff === s.staffUserId;
                          return (
                            <tr key={s.staffUserId} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                {s.isSelf && <p className="text-xs text-gray-400 dark:text-gray-500">{t('team.you')}</p>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {s.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{fmtTime(att?.clockIn)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{fmtTime(att?.clockOut)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {att ? (
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTEND_STATUS_BADGE[att.status] ?? ''}`}>
                                    {attendStatusLabel(att.status)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">{t('team.noRecord')}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  {!att?.clockIn && (
                                    <button
                                      onClick={() => handleStaffClockIn(s.staffUserId)}
                                      disabled={busy}
                                      className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {busy ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : t('team.clockIn')}
                                    </button>
                                  )}
                                  {att?.clockIn && !att?.clockOut && (
                                    <button
                                      onClick={() => handleStaffClockOut(s.staffUserId)}
                                      disabled={busy}
                                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {busy ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : t('team.clockOut')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="lg:hidden space-y-3 p-4">
                    {staff.map((s) => {
                      const att = todayAttMap[s.staffUserId];
                      const busy = busyStaff === s.staffUserId;
                      return (
                        <div key={s.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{s.role}</p>
                            </div>
                            {att && (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTEND_STATUS_BADGE[att.status] ?? ''}`}>
                                {attendStatusLabel(att.status)}
                              </span>
                            )}
                          </div>
                          {att && (
                            <dl className="mt-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">{t('team.in')}</dt>
                                <dd className="text-gray-900 dark:text-white">{fmtTime(att.clockIn)}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">{t('team.out')}</dt>
                                <dd className="text-gray-900 dark:text-white">{fmtTime(att.clockOut)}</dd>
                              </div>
                            </dl>
                          )}
                          <div className="mt-3 flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            {!att?.clockIn && (
                              <button
                                onClick={() => handleStaffClockIn(s.staffUserId)}
                                disabled={busy}
                                className="flex-1 min-h-[44px] px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 text-center"
                              >
                                {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin mx-auto" /> : t('team.clockIn')}
                              </button>
                            )}
                            {att?.clockIn && !att?.clockOut && (
                              <button
                                onClick={() => handleStaffClockOut(s.staffUserId)}
                                disabled={busy}
                                className="flex-1 min-h-[44px] px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 text-center"
                              >
                                {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin mx-auto" /> : t('team.clockOut')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── Pending Leave Approvals ──────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.pendingApprovals')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('team.pendingApprovalsHint')}</p>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <CheckCircleIcon className="h-7 w-7 text-green-500 dark:text-green-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{t('team.noPendingLeaves')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingLeaves.map((lv) => {
                    const busy = busyLeave === lv.id;
                    return (
                      <div key={lv.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{lv.staffName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {leaveTypeLabel(lv.type)} · {fmtDate(lv.startDate)} — {fmtDate(lv.endDate)} ({lv.days} {t('team.days')})
                          </p>
                          {lv.reason && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{lv.reason}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setBusyLeave(lv.id); setReviewLeave(lv); setBusyLeave(null); }}
                            disabled={busy}
                            className="min-h-[44px] px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            {t('team.review')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Shifts ────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('team.shiftsTitle')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('team.shiftsHint')}</p>
                </div>
                <button
                  onClick={() => setShowShiftModal(true)}
                  className="min-h-[44px] px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('team.scheduleShift')}
                </button>
              </div>

              {shifts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">{t('team.noShifts')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {shifts.map((sh) => {
                    const busy = busyShift === sh.id;
                    return (
                      <div key={sh.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{sh.staffName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(sh.startTime).toLocaleString()} — {fmtTime(sh.endTime)}
                          </p>
                          {sh.note && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sh.note}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteShift(sh.id)}
                          disabled={busy}
                          aria-label={t('common.delete')}
                          className="min-h-[44px] p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MODALS
      ──────────────────────────────────────────────────────────────────────── */}

      {/* Request Leave Modal */}
      {showLeaveModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('team.requestLeave')}</h2>
              <button onClick={() => setShowLeaveModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.leaveType')}</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, type: e.target.value as LeaveType }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {(['VACATION', 'SICK', 'UNPAID', 'OTHER'] as LeaveType[]).map((t2) => (
                    <option key={t2} value={t2}>{leaveTypeLabel(t2)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.startDate')}</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.endDate')}</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.reason')}</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder={t('team.reasonPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowLeaveModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRequestLeave}
                disabled={submittingLeave}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingLeave && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {t('team.submitRequest')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('team.setAttendance')}</h2>
              <button onClick={() => setShowManualModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.staffMember')}</label>
                <select
                  value={manualForm.staffUserId}
                  onChange={(e) => setManualForm((f) => ({ ...f, staffUserId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {staff.map((s) => <option key={s.staffUserId} value={s.staffUserId}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.date')}</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.colStatus')}</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm((f) => ({ ...f, status: e.target.value as AttendanceStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {(['PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'HALF_DAY'] as AttendanceStatus[]).map((s) => (
                    <option key={s} value={s}>{attendStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.colClockIn')}</label>
                  <input
                    type="time"
                    value={manualForm.clockIn}
                    onChange={(e) => setManualForm((f) => ({ ...f, clockIn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.colClockOut')}</label>
                  <input
                    type="time"
                    value={manualForm.clockOut}
                    onChange={(e) => setManualForm((f) => ({ ...f, clockOut: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.note')}</label>
                <input
                  type="text"
                  value={manualForm.note}
                  onChange={(e) => setManualForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder={t('team.notePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleManualAttendance}
                disabled={submittingManual}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingManual && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Leave Review Modal */}
      {reviewLeave && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('team.reviewLeave')}</h2>
              <button onClick={() => { setReviewLeave(null); setReviewNote(''); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('team.staffMember')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{reviewLeave.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('team.leaveType')}</span>
                  <span className="text-gray-900 dark:text-white">{leaveTypeLabel(reviewLeave.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('team.period')}</span>
                  <span className="text-gray-900 dark:text-white">{fmtDate(reviewLeave.startDate)} — {fmtDate(reviewLeave.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('team.days')}</span>
                  <span className="text-gray-900 dark:text-white">{reviewLeave.days}</span>
                </div>
                {reviewLeave.reason && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('team.reason')}</span>
                    <span className="text-gray-900 dark:text-white text-right">{reviewLeave.reason}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.reviewNote')}</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder={t('team.reviewNotePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setReviewLeave(null); setReviewNote(''); }} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleLeaveReview('REJECT')}
                disabled={submittingReview}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <XCircleIcon className="h-4 w-4" />
                {t('team.reject')}
              </button>
              <button
                onClick={() => handleLeaveReview('APPROVE')}
                disabled={submittingReview}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submittingReview ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                {t('team.approve')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Schedule Shift Modal */}
      {showShiftModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('team.scheduleShift')}</h2>
              <button onClick={() => setShowShiftModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.staffMember')}</label>
                <select
                  value={shiftForm.staffUserId}
                  onChange={(e) => setShiftForm((f) => ({ ...f, staffUserId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {staff.map((s) => <option key={s.staffUserId} value={s.staffUserId}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.shiftStart')}</label>
                <input
                  type="datetime-local"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.shiftEnd')}</label>
                <input
                  type="datetime-local"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.note')}</label>
                <input
                  type="text"
                  value={shiftForm.note}
                  onChange={(e) => setShiftForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder={t('team.notePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowShiftModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateShift}
                disabled={submittingShift}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingShift && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {t('team.scheduleShift')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SpecialistTeam;
