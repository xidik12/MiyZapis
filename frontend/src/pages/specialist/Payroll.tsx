import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { confirm } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  payrollService,
  StaffMember,
  PreviewLine,
  PayrollRecord,
  PayrollSummary,
  PayrollStatus,
  PAYROLL_STATUSES,
  RunLineInput,
  CommissionMode,
  CommissionTier,
} from '../../services/payroll.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  CurrencyDollarIcon as BanknotesIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
  CurrencyDollarIcon as ReceiptPercentIcon,
  PencilIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

type Currency = 'USD' | 'EUR' | 'UAH';
type Tab = 'staff' | 'runs';

interface RecordEditDraft {
  baseSalary: string;
  commissionTotal: string;
  bonus: string;
  deductions: string;
  taxAmount: string;
  notes: string;
}

const asCurrency = (c?: string | null): Currency =>
  c === 'USD' || c === 'EUR' || c === 'UAH' ? c : 'UAH';

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- Status badge styling ----------
const STATUS_BADGE: Record<PayrollStatus, string> = {
  DRAFT: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  APPROVED: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

// Editable pay-run line row (string-typed for inputs).
interface RunRow {
  staffUserId: string;
  name: string;
  role: string;
  commissionPercent: number;
  mode: CommissionMode;
  baseSalary: string;
  commissionTotal: string;
  bonus: string;
  deductions: string;
  taxAmount: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

// ────────────────────────────────────────────────────────────────────────
// Self-contained trilingual help strings for this page.
const PAYROLL_HELP = {
  en: {
    pageTitle: 'Payroll',
    pageBody:
      'Manage staff commissions and issue pay runs.\n\n' +
      'Two tabs:\n' +
      '• Staff & Commission — set each person\'s commission rate (flat or tiered).\n' +
      '• Pay Runs — create, approve, and mark pay runs as paid.\n\n' +
      'Workflow: set commission rates → click Preview for a period → adjust any figures → Create Pay Run (DRAFT) → Approve → Mark Paid.\n\n' +
      'Payroll cost (netPay + taxAmount for each approved/paid run) is rolled into the Accounting P&L as the "PAYROLL" expense line, fully tax-deductible.',

    thisPeriodTotal:
      'This-period Payroll: total net pay across all payroll records (DRAFT + APPROVED + PAID) returned by the current filter.\n\n' +
      'Net pay per person = base salary + commission + bonus − deductions − tax.',

    pendingApproval:
      'Pending Approval: total net pay across records with status DRAFT — runs created but not yet approved.\n\n' +
      'Draft records do NOT flow into the Accounting P&L. Only APPROVED and PAID records are counted as expenses.',

    totalCommission:
      'Total Commission: sum of commission amounts across all records in the current filter.\n\n' +
      'Commission is calculated from completed bookings within the pay-run period at the staff member\'s configured rate.',

    commissionMode:
      'Commission mode:\n\n' +
      '• FLAT — one fixed percentage applied to the staff member\'s total service revenue for the entire period.\n' +
      '  Example: 30% flat on 10,000 UAH revenue = 3,000 UAH commission.\n\n' +
      '• TIERED — the percentage depends on which revenue bracket the staff member\'s total falls into.\n' +
      '  The highest tier whose "min revenue" threshold is met determines the percentage for the whole period.\n' +
      '  Example tiers: 0 UAH → 20%, 20,000 UAH → 30%, 50,000 UAH → 35%.\n' +
      '  If revenue is 25,000 UAH, the 20,000 UAH tier applies → 30% on the full 25,000 UAH.\n\n' +
      'Important: tier thresholds are entered in the run currency. Make sure rates are set in the same currency as your pay run.',

    preview:
      'Preview: calculates commission from all COMPLETED bookings (by completedAt date) falling within the selected period start → end.\n\n' +
      'The preview pre-fills each staff member\'s row with:\n' +
      '• Base salary (from their profile)\n' +
      '• Commission total (calculated from bookings at their current rate)\n' +
      '• Bonus, Deductions, Tax = 0 (adjust manually before creating the run)\n\n' +
      'You can edit any field in the preview table before saving.',

    netPay:
      'Net Pay = base salary + commission + bonus − deductions − tax\n\n' +
      'This is the actual amount to be paid to the staff member. Deductions and tax are subtracted.\n\n' +
      'The "Run total" is the sum of Net Pay across all rows — this is the total cash outflow for the pay run.',

    baseSalary:
      'Base Salary: the fixed monthly (or per-period) salary component, independent of performance.\n\n' +
      'Enter 0 if the person is commission-only.',

    commissionTotal:
      'Commission Total: the commission amount calculated for this period.\n\n' +
      'Auto-filled by Preview based on completed bookings × commission rate. You can override this number manually before creating the run.',

    bonus:
      'Bonus: one-off additional payment for this period (performance bonus, holiday bonus, etc.).\n\n' +
      'Added to Net Pay. Enter 0 if no bonus applies.',

    deductions:
      'Deductions: any amounts subtracted from gross pay this period (advance repayment, equipment cost recovery, disciplinary deduction, etc.).\n\n' +
      'Subtracted from Net Pay. Enter 0 if no deductions apply.',

    taxAmount:
      'Tax (withheld): income tax or social contributions withheld from the staff member\'s gross pay on their behalf.\n\n' +
      'Subtracted from Net Pay. The total employer cost shown in the Accounting P&L = netPay + taxAmount (both are deductible business expenses).\n\n' +
      'Enter 0 if the employee handles tax separately.',

    payRunWorkflow:
      'Pay run lifecycle:\n\n' +
      '• DRAFT — created but not finalised. Editable; not yet visible in the Accounting P&L.\n' +
      '• APPROVED — locked and confirmed. Added to the Accounting P&L as a PAYROLL expense.\n' +
      '• PAID — payment confirmed (physical transfer done). The record is archived.\n\n' +
      'Only DRAFT records can be deleted.',

    minRevenue:
      'Min Revenue: the lower threshold for this commission tier.\n\n' +
      'The tier applies when the staff member\'s total period revenue is ≥ this threshold.\n' +
      'The first tier should always be 0 (covers all revenue from zero upward).\n\n' +
      'Thresholds are in the pay run currency — set them in UAH if you pay in UAH.',
  },
  uk: {
    pageTitle: 'Зарплата',
    pageBody:
      'Керуйте комісіями співробітників та видавайте платіжні відомості.\n\n' +
      'Дві вкладки:\n' +
      '• Співробітники та комісія — встановіть ставку комісії для кожної людини (фіксована або рівнева).\n' +
      '• Платіжні відомості — створення, затвердження та позначення відомостей як виплачених.\n\n' +
      'Робочий процес: встановіть ставки → натисніть «Попередній перегляд» для обраного періоду → скоригуйте показники → Створити відомість (ЧЕРНЕТКА) → Затвердити → Виплачено.\n\n' +
      'Витрати на зарплату (netPay + taxAmount для кожної затвердженої/виплаченої відомості) потрапляють до П&З у Бухгалтерії як рядок «PAYROLL» — повністю вирахувальний.',

    thisPeriodTotal:
      'Зарплата за період: сума чистих виплат по всіх платіжних записах (ЧЕРНЕТКА + ЗАТВЕРДЖЕНО + ВИПЛАЧЕНО), що відповідають поточному фільтру.\n\n' +
      'Чиста виплата на особу = базова зарплата + комісія + бонус − вирахування − податок.',

    pendingApproval:
      'Очікують затвердження: сума чистих виплат по записах зі статусом ЧЕРНЕТКА — відомості створено, але ще не затверджено.\n\n' +
      'Чернеткові записи НЕ потрапляють до П&З у Бухгалтерії. До витрат зараховуються лише ЗАТВЕРДЖЕНІ та ВИПЛАЧЕНІ записи.',

    totalCommission:
      'Загальна комісія: сума комісійних виплат по всіх записах у поточному фільтрі.\n\n' +
      'Комісія розраховується з виконаних записів у межах платіжного періоду за налаштованою ставкою співробітника.',

    commissionMode:
      'Тип комісії:\n\n' +
      '• ФІКСОВАНА — один відсоток від загальної виручки співробітника за весь період.\n' +
      '  Приклад: 30% з виручки 10 000 грн = 3 000 грн комісії.\n\n' +
      '• РІВНЕВА — відсоток залежить від того, до якого рівня виручки потрапив підсумок співробітника.\n' +
      '  Застосовується найвищий рівень, поріг якого досягнуто, і відсоток береться від УСІЄЇ виручки.\n' +
      '  Приклад рівнів: 0 грн → 20%, 20 000 грн → 30%, 50 000 грн → 35%.\n' +
      '  Якщо виручка 25 000 грн — застосовується рівень 20 000 грн → 30% від усіх 25 000 грн.\n\n' +
      'Важливо: пороги рівнів вводяться у валюті платіжної відомості. Переконайтеся, що ставки задані в тій самій валюті.',

    preview:
      'Попередній перегляд: розраховує комісію з усіх ЗАВЕРШЕНИХ записів (за датою completedAt) у межах обраного діапазону дат.\n\n' +
      'Попередній перегляд автоматично заповнює рядок кожного співробітника:\n' +
      '• Базова зарплата (з профілю)\n' +
      '• Сума комісії (розрахована з записів за поточною ставкою)\n' +
      '• Бонус, Вирахування, Податок = 0 (скоригуйте вручну перед збереженням)\n\n' +
      'Будь-яке поле в таблиці попереднього перегляду можна змінити перед збереженням.',

    netPay:
      'Чиста виплата = базова зарплата + комісія + бонус − вирахування − податок\n\n' +
      'Це фактична сума, яку буде виплачено співробітнику. Вирахування та податок відраховуються.\n\n' +
      '«Підсумок відомості» — сума чистих виплат по всіх рядках — загальний грошовий відплив за платіжну відомість.',

    baseSalary:
      'Базова зарплата: фіксована складова за місяць (або за період), незалежна від результатів.\n\n' +
      'Введіть 0, якщо оплата лише відрядна.',

    commissionTotal:
      'Сума комісії: розрахований обсяг комісії за цей період.\n\n' +
      'Заповнюється автоматично при попередньому перегляді на основі завершених записів × ставка комісії. Можна змінити вручну перед збереженням.',

    bonus:
      'Бонус: одноразова додаткова виплата за цей період (бонус за результатами, святкова виплата тощо).\n\n' +
      'Додається до чистої виплати. Введіть 0, якщо бонус не нараховується.',

    deductions:
      'Вирахування: будь-які суми, що утримуються з нарахованої зарплати за цей період (погашення авансу, відшкодування вартості обладнання, дисциплінарні утримання тощо).\n\n' +
      'Відраховуються від чистої виплати. Введіть 0, якщо вирахувань немає.',

    taxAmount:
      'Податок (утриманий): ПДФО або єдиний соціальний внесок, утриманий із нарахованої зарплати співробітника.\n\n' +
      'Відраховується від чистої виплати. Загальні витрати роботодавця в П&З Бухгалтерії = netPay + taxAmount (обидві складові є вирахувальними витратами бізнесу).\n\n' +
      'Введіть 0, якщо співробітник сплачує податок самостійно.',

    payRunWorkflow:
      'Статуси платіжної відомості:\n\n' +
      '• ЧЕРНЕТКА — створено, але не завершено. Доступна для редагування; до П&З Бухгалтерії не потрапляє.\n' +
      '• ЗАТВЕРДЖЕНО — зафіксовано та підтверджено. Додається до П&З Бухгалтерії як витрата PAYROLL.\n' +
      '• ВИПЛАЧЕНО — підтверджено фактичне перерахування коштів. Запис архівується.\n\n' +
      'Видалити можна лише записи зі статусом ЧЕРНЕТКА.',

    minRevenue:
      'Мінімальна виручка: нижній поріг для цього рівня комісії.\n\n' +
      'Рівень застосовується, коли загальна виручка співробітника за період ≥ цього порогу.\n' +
      'Перший рівень завжди має бути 0 (охоплює будь-яку виручку від нуля).\n\n' +
      'Пороги задаються у валюті платіжної відомості — вказуйте в гривнях, якщо виплачуєте в гривнях.',
  },
  ru: {
    pageTitle: 'Зарплата',
    pageBody:
      'Управляйте комиссиями сотрудников и выдавайте платёжные ведомости.\n\n' +
      'Две вкладки:\n' +
      '• Сотрудники и комиссия — установите ставку комиссии для каждого (фиксированная или уровневая).\n' +
      '• Платёжные ведомости — создание, утверждение и отметка ведомостей как выплаченных.\n\n' +
      'Рабочий процесс: установите ставки → нажмите «Предпросмотр» для выбранного периода → скорректируйте показатели → Создать ведомость (ЧЕРНОВИК) → Утвердить → Выплачено.\n\n' +
      'Расходы на зарплату (netPay + taxAmount для каждой утверждённой/выплаченной ведомости) попадают в П&У Бухгалтерии как строка «PAYROLL» — полностью вычитаемая.',

    thisPeriodTotal:
      'Зарплата за период: сумма чистых выплат по всем платёжным записям (ЧЕРНОВИК + УТВЕРЖДЕНО + ВЫПЛАЧЕНО), соответствующим текущему фильтру.\n\n' +
      'Чистая выплата на человека = базовая зарплата + комиссия + бонус − удержания − налог.',

    pendingApproval:
      'Ожидают утверждения: сумма чистых выплат по записям со статусом ЧЕРНОВИК — ведомости созданы, но ещё не утверждены.\n\n' +
      'Черновые записи НЕ попадают в П&У Бухгалтерии. В расходы засчитываются только УТВЕРЖДЁННЫЕ и ВЫПЛАЧЕННЫЕ записи.',

    totalCommission:
      'Общая комиссия: сумма комиссионных выплат по всем записям в текущем фильтре.\n\n' +
      'Комиссия рассчитывается из выполненных записей в рамках платёжного периода по настроенной ставке сотрудника.',

    commissionMode:
      'Тип комиссии:\n\n' +
      '• ФИКСИРОВАННАЯ — один процент от общей выручки сотрудника за весь период.\n' +
      '  Пример: 30% с выручки 10 000 грн = 3 000 грн комиссии.\n\n' +
      '• УРОВНЕВАЯ — процент зависит от того, в какой уровень выручки попал итог сотрудника.\n' +
      '  Применяется наивысший уровень, порог которого достигнут, и процент берётся от ВСЕЙ выручки.\n' +
      '  Пример уровней: 0 грн → 20%, 20 000 грн → 30%, 50 000 грн → 35%.\n' +
      '  Если выручка 25 000 грн — применяется уровень 20 000 грн → 30% от всех 25 000 грн.\n\n' +
      'Важно: пороги уровней вводятся в валюте платёжной ведомости. Убедитесь, что ставки заданы в той же валюте.',

    preview:
      'Предпросмотр: рассчитывает комиссию из всех ЗАВЕРШЁННЫХ записей (по дате completedAt) в рамках выбранного диапазона дат.\n\n' +
      'Предпросмотр автоматически заполняет строку каждого сотрудника:\n' +
      '• Базовая зарплата (из профиля)\n' +
      '• Сумма комиссии (рассчитана из записей по текущей ставке)\n' +
      '• Бонус, Удержания, Налог = 0 (скорректируйте вручную перед сохранением)\n\n' +
      'Любое поле в таблице предпросмотра можно изменить перед сохранением.',

    netPay:
      'Чистая выплата = базовая зарплата + комиссия + бонус − удержания − налог\n\n' +
      'Это фактическая сумма, которую получит сотрудник. Удержания и налог вычитаются.\n\n' +
      '«Итог ведомости» — сумма чистых выплат по всем строкам — общий денежный отток за платёжную ведомость.',

    baseSalary:
      'Базовая зарплата: фиксированная составляющая за месяц (или за период), независимая от результатов.\n\n' +
      'Введите 0, если оплата только сдельная.',

    commissionTotal:
      'Сумма комиссии: рассчитанный объём комиссии за этот период.\n\n' +
      'Заполняется автоматически при предпросмотре на основе завершённых записей × ставка комиссии. Можно изменить вручную перед сохранением.',

    bonus:
      'Бонус: единовременная дополнительная выплата за этот период (бонус по результатам, праздничная выплата и т.д.).\n\n' +
      'Добавляется к чистой выплате. Введите 0, если бонус не начисляется.',

    deductions:
      'Удержания: любые суммы, удерживаемые из начисленной зарплаты за этот период (погашение аванса, возмещение стоимости оборудования, дисциплинарные удержания и т.д.).\n\n' +
      'Вычитаются из чистой выплаты. Введите 0, если удержаний нет.',

    taxAmount:
      'Налог (удержанный): НДФЛ или единый социальный взнос, удержанный из начисленной зарплаты сотрудника.\n\n' +
      'Вычитается из чистой выплаты. Общие расходы работодателя в П&У Бухгалтерии = netPay + taxAmount (обе составляющие являются вычитаемыми расходами бизнеса).\n\n' +
      'Введите 0, если сотрудник уплачивает налог самостоятельно.',

    payRunWorkflow:
      'Статусы платёжной ведомости:\n\n' +
      '• ЧЕРНОВИК — создано, но не завершено. Доступно для редактирования; в П&У Бухгалтерии не отражается.\n' +
      '• УТВЕРЖДЕНО — зафиксировано и подтверждено. Добавляется в П&У Бухгалтерии как расход PAYROLL.\n' +
      '• ВЫПЛАЧЕНО — подтверждено фактическое перечисление средств. Запись архивируется.\n\n' +
      'Удалить можно только записи со статусом ЧЕРНОВИК.',

    minRevenue:
      'Минимальная выручка: нижний порог для этого уровня комиссии.\n\n' +
      'Уровень применяется, когда общая выручка сотрудника за период ≥ этого порога.\n' +
      'Первый уровень всегда должен быть 0 (охватывает любую выручку от нуля).\n\n' +
      'Пороги задаются в валюте платёжной ведомости — указывайте в гривнях, если выплачиваете в гривнях.',
  },
};

const SpecialistPayroll: React.FC = () => {
  const { t, language } = useLanguage();
  const ph = (PAYROLL_HELP as any)[language] || PAYROLL_HELP.en;
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<Tab>('staff');
  const [loading, setLoading] = useState(true);

  // Data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<PayrollStatus | ''>('');

  // Commission editing (per staff). Each draft carries mode + flat percent + tier rows.
  interface CommissionDraft {
    mode: CommissionMode;
    percent: string;
    tiers: { minRevenue: string; percent: string }[];
  }
  const [commissionDraft, setCommissionDraft] = useState<Record<string, CommissionDraft>>({});
  const [savingCommission, setSavingCommission] = useState<string | null>(null);

  // Pay run builder
  const [periodStart, setPeriodStart] = useState(monthStartISO());
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [runCurrency, setRunCurrency] = useState('UAH');
  const [runNotes, setRunNotes] = useState('');
  const [runRows, setRunRows] = useState<RunRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [creatingRun, setCreatingRun] = useState(false);

  // Row action busy state
  const [busyRecord, setBusyRecord] = useState<string | null>(null);

  // Payslip view modal
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);

  // ── Edit DRAFT record ──────────────────────────────────────────────────
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [editDraft, setEditDraft] = useState<RecordEditDraft>({
    baseSalary: '', commissionTotal: '', bonus: '', deductions: '', taxAmount: '', notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditRecord = (rec: PayrollRecord) => {
    setEditDraft({
      baseSalary: String(num(rec.baseSalary)),
      commissionTotal: String(num(rec.commissionTotal)),
      bonus: String(num(rec.bonus)),
      deductions: String(num(rec.deductions)),
      taxAmount: String(num(rec.taxAmount)),
      notes: rec.notes ?? '',
    });
    setEditingRecord(rec);
  };

  const editNet = () => {
    return (
      num(editDraft.baseSalary) +
      num(editDraft.commissionTotal) +
      num(editDraft.bonus) -
      num(editDraft.deductions) -
      num(editDraft.taxAmount)
    );
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      setSavingEdit(true);
      await payrollService.updateRecord(editingRecord.id, {
        baseSalary: num(editDraft.baseSalary),
        commissionTotal: num(editDraft.commissionTotal),
        bonus: num(editDraft.bonus),
        deductions: num(editDraft.deductions),
        taxAmount: num(editDraft.taxAmount),
        notes: editDraft.notes.trim() || null,
      });
      toast.success(t('payroll.recordUpdated') || 'Record updated');
      setEditingRecord(null);
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = filterStatus ? { status: filterStatus } : {};
      const [staffRes, recordsRes, summaryRes] = await Promise.all([
        payrollService.getStaff().catch(() => [] as StaffMember[]),
        payrollService.getRecords(filters),
        payrollService.getSummary(),
      ]);
      setStaff(staffRes || []);
      setRecords(recordsRes || []);
      setSummary(summaryRes);
      // Seed commission drafts (mode + flat percent + tier rows).
      const drafts: Record<string, CommissionDraft> = {};
      (staffRes || []).forEach((s) => {
        drafts[s.staffUserId] = {
          mode: s.mode === 'TIERED' ? 'TIERED' : 'FLAT',
          percent: String(s.commissionPercent),
          tiers: (s.tiers && s.tiers.length > 0)
            ? s.tiers.map((t) => ({ minRevenue: String(t.minRevenue), percent: String(t.percent) }))
            : [{ minRevenue: '0', percent: '' }],
        };
      });
      setCommissionDraft(drafts);
    } catch (error: unknown) {
      console.error('Error loading payroll data:', error);
      toast.error(t('payroll.loadError') || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Labels ----------
  const getStatusLabel = (status: PayrollStatus): string => {
    const labels: Record<PayrollStatus, Record<string, string>> = {
      DRAFT: { en: 'Draft', uk: 'Чернетка', ru: 'Черновик' },
      APPROVED: { en: 'Approved', uk: 'Затверджено', ru: 'Утверждено' },
      PAID: { en: 'Paid', uk: 'Виплачено', ru: 'Выплачено' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, Record<string, string>> = {
      OWNER: { en: 'Owner', uk: 'Власник', ru: 'Владелец' },
      MANAGER: { en: 'Manager', uk: 'Менеджер', ru: 'Менеджер' },
      SPECIALIST: { en: 'Specialist', uk: 'Спеціаліст', ru: 'Специалист' },
    };
    return labels[role]?.[language] || labels[role]?.en || role;
  };

  // The owner isn't a commissioned professional — they keep the business's
  // service revenue as profit. Show a note instead of a commission editor.
  const ownerCommissionNote =
    ({
      en: 'Owner — keeps the full service revenue; no commission applies.',
      uk: 'Власник — отримує повний дохід від послуг; комісія не застосовується.',
      ru: 'Владелец — получает полный доход от услуг; комиссия не применяется.',
    } as Record<string, string>)[language] || 'Owner — keeps the full service revenue.';

  // ---------- Commission ----------
  const getDraft = (staffUserId: string): CommissionDraft =>
    commissionDraft[staffUserId] ?? { mode: 'FLAT', percent: '0', tiers: [{ minRevenue: '0', percent: '' }] };

  const setDraft = (staffUserId: string, patch: Partial<CommissionDraft>) => {
    setCommissionDraft((prev) => ({
      ...prev,
      [staffUserId]: { ...getDraft(staffUserId), ...patch },
    }));
  };

  const updateTierRow = (staffUserId: string, idx: number, field: 'minRevenue' | 'percent', value: string) => {
    const d = getDraft(staffUserId);
    const tiers = d.tiers.map((tr, i) => (i === idx ? { ...tr, [field]: value } : tr));
    setDraft(staffUserId, { tiers });
  };

  const addTierRow = (staffUserId: string) => {
    const d = getDraft(staffUserId);
    setDraft(staffUserId, { tiers: [...d.tiers, { minRevenue: '', percent: '' }] });
  };

  const removeTierRow = (staffUserId: string, idx: number) => {
    const d = getDraft(staffUserId);
    const tiers = d.tiers.filter((_, i) => i !== idx);
    setDraft(staffUserId, { tiers: tiers.length > 0 ? tiers : [{ minRevenue: '0', percent: '' }] });
  };

  const handleSaveCommission = async (staffUserId: string) => {
    const d = getDraft(staffUserId);
    try {
      setSavingCommission(staffUserId);
      if (d.mode === 'TIERED') {
        const tiers: CommissionTier[] = [];
        for (const tr of d.tiers) {
          const minRevenue = parseFloat(tr.minRevenue);
          const percent = parseFloat(tr.percent);
          if (isNaN(minRevenue) || minRevenue < 0 || isNaN(percent) || percent < 0 || percent > 100) {
            toast.error(t('payroll.commission.invalidTiers') || 'Each tier needs min revenue ≥ 0 and percent 0–100');
            return;
          }
          tiers.push({ minRevenue, percent });
        }
        if (tiers.length === 0) {
          toast.error(t('payroll.commission.invalidTiers') || 'Add at least one tier');
          return;
        }
        await payrollService.setCommission(staffUserId, { mode: 'TIERED', tiers });
        toast.success(t('payroll.commissionSaved') || 'Commission saved');
        setStaff((prev) => prev.map((s) =>
          s.staffUserId === staffUserId
            ? { ...s, mode: 'TIERED', tiers, commissionPercent: tiers[0]?.percent ?? 0 }
            : s));
      } else {
        const pct = parseFloat(d.percent);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          toast.error(t('payroll.invalidPercent') || 'Percent must be between 0 and 100');
          return;
        }
        await payrollService.setCommission(staffUserId, { mode: 'FLAT', percent: pct });
        toast.success(t('payroll.commissionSaved') || 'Commission saved');
        setStaff((prev) => prev.map((s) =>
          s.staffUserId === staffUserId ? { ...s, mode: 'FLAT', commissionPercent: pct, tiers: [] } : s));
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to save');
    } finally {
      setSavingCommission(null);
    }
  };

  // ---------- Pay run builder ----------
  const handlePreview = async () => {
    if (!periodStart || !periodEnd) {
      toast.error(t('payroll.periodRequired') || 'Select a start and end date');
      return;
    }
    if (periodStart > periodEnd) {
      toast.error(t('payroll.invalidPeriod') || 'Start date must be before end date');
      return;
    }
    try {
      setPreviewing(true);
      const lines = await payrollService.preview(periodStart, periodEnd);
      setRunRows(
        lines.map((l: PreviewLine) => ({
          staffUserId: l.staffUserId,
          name: l.name,
          role: l.role,
          commissionPercent: l.commissionPercent,
          mode: l.mode === 'TIERED' ? 'TIERED' : 'FLAT',
          baseSalary: String(num(l.baseSalary)),
          commissionTotal: String(num(l.commissionTotal)),
          bonus: String(num(l.bonus)),
          deductions: String(num(l.deductions)),
          taxAmount: String(num(l.taxAmount)),
        }))
      );
      if (lines.length === 0) {
        toast.info(t('payroll.noStaffToPay') || 'No staff to pay');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.previewError') || 'Failed to preview');
    } finally {
      setPreviewing(false);
    }
  };

  const updateRunRow = (idx: number, patch: Partial<RunRow>) => {
    setRunRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const rowNet = (r: RunRow): number =>
    num(r.baseSalary) + num(r.commissionTotal) + num(r.bonus) - num(r.deductions) - num(r.taxAmount);

  const runTotal = runRows.reduce((sum, r) => sum + rowNet(r), 0);

  const handleCreateRun = async () => {
    if (runRows.length === 0) {
      toast.error(t('payroll.previewFirst') || 'Preview the period first');
      return;
    }
    try {
      setCreatingRun(true);
      const lines: RunLineInput[] = runRows.map((r) => ({
        staffUserId: r.staffUserId,
        baseSalary: num(r.baseSalary),
        commissionTotal: num(r.commissionTotal),
        bonus: num(r.bonus),
        deductions: num(r.deductions),
        taxAmount: num(r.taxAmount),
      }));
      await payrollService.createRun({
        periodStart,
        periodEnd,
        lines,
        currency: runCurrency,
        notes: runNotes.trim() || null,
      });
      toast.success(t('payroll.runCreated') || 'Pay run created');
      setRunRows([]);
      setRunNotes('');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to create');
    } finally {
      setCreatingRun(false);
    }
  };

  // ---------- Record actions ----------
  const handleApprove = async (rec: PayrollRecord) => {
    try {
      setBusyRecord(rec.id);
      await payrollService.setStatus(rec.id, 'APPROVED');
      toast.success(t('payroll.approved') || 'Approved');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to update');
    } finally {
      setBusyRecord(null);
    }
  };

  const handleMarkPaid = async (rec: PayrollRecord) => {
    try {
      setBusyRecord(rec.id);
      await payrollService.setStatus(rec.id, 'PAID');
      toast.success(t('payroll.markedPaid') || 'Marked as paid');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to update');
    } finally {
      setBusyRecord(null);
    }
  };

  const handleDelete = async (rec: PayrollRecord) => {
    if (!await confirm(t('payroll.confirmDelete') || 'Delete this draft record?')) return;
    try {
      setBusyRecord(rec.id);
      await payrollService.deleteRecord(rec.id);
      toast.success(t('payroll.recordDeleted') || 'Record deleted');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.deleteError') || 'Failed to delete');
    } finally {
      setBusyRecord(null);
    }
  };

  if (loading && staff.length === 0 && records.length === 0) {
    return <PageLoader text={t('payroll.loading') || 'Loading payroll...'} />;
  }

  const summaryCurrency = asCurrency(summary?.currency);
  const counts = summary?.countsByStatus || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('payroll.title') || 'Payroll'}
              </h1>
              <HelpTip title={ph.pageTitle} content={ph.pageBody} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('payroll.subtitle') || 'Manage staff commission and pay runs'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    {t('payroll.thisPeriodTotal') || 'This-period Payroll'}
                    <HelpTip size={14} title={t('payroll.thisPeriodTotal') || 'This-period Payroll'} content={ph.thisPeriodTotal} />
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.totalPayrollThisPeriod || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    {t('payroll.pendingApproval') || 'Pending Approval'}
                    <HelpTip size={14} title={t('payroll.pendingApproval') || 'Pending Approval'} content={ph.pendingApproval} />
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.pendingApproval || 0, summaryCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {counts.DRAFT || 0} {t('payroll.drafts') || 'drafts'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                  <ReceiptPercentIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    {t('payroll.totalCommission') || 'Total Commission'}
                    <HelpTip size={14} title={t('payroll.totalCommission') || 'Total Commission'} content={ph.totalCommission} />
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.totalCommission || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-1 gap-y-0 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('staff')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition active:scale-[0.96] ${
              tab === 'staff'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UsersIcon className="h-5 w-5" />
            {t('payroll.staffCommission') || 'Staff & Commission'}
          </button>
          <button
            onClick={() => setTab('runs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition active:scale-[0.96] ${
              tab === 'runs'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BanknotesIcon className="h-5 w-5" />
            {t('payroll.payRuns') || 'Pay Runs'}
          </button>
        </div>

        {/* ===================== STAFF TAB ===================== */}
        {tab === 'staff' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('payroll.staff') || 'Staff'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('payroll.commissionHint') || "Set each professional's commission as a % of completed service prices."}
              </p>
            </div>

            {staff.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('payroll.noStaff') || 'No staff found'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th scope="col" className="px-6 py-3 font-medium">{t('payroll.name') || 'Name'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('payroll.role') || 'Role'}</th>
                        <th scope="col" className="px-6 py-3 font-medium w-full">{t('payroll.commission') || 'Commission'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {staff.map((s) => {
                        const d = getDraft(s.staffUserId);
                        if (s.role === 'OWNER') {
                          return (
                            <tr key={s.staffUserId} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {getRoleLabel(s.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 w-full text-sm italic text-gray-500 dark:text-gray-400">
                                {ownerCommissionNote}
                              </td>
                            </tr>
                          );
                        }
                        return (
                        <tr key={s.staffUserId} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {getRoleLabel(s.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 w-full min-w-[18rem]">
                            {/* Mode selector */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                {(['FLAT', 'TIERED'] as CommissionMode[]).map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDraft(s.staffUserId, { mode: m })}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      d.mode === m
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {m === 'FLAT'
                                      ? (t('payroll.commission.flat') || 'Flat')
                                      : (t('payroll.commission.tiered') || 'Tiered')}
                                  </button>
                                ))}
                              </div>
                              <HelpTip size={15} title={t('payroll.commission') || 'Commission mode'} content={ph.commissionMode} />
                            </div>

                            {d.mode === 'FLAT' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={d.percent ?? ''}
                                  onChange={(e) => setDraft(s.staffUserId, { percent: e.target.value })}
                                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-500 dark:text-gray-400">%</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('payroll.commission.tieredHint') || "Commission % is chosen by the staff member's total revenue in the pay period."}
                                </p>
                                {d.tiers.map((tr, idx) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {t('payroll.commission.minRevenue') || 'Min revenue'}
                                        <HelpTip size={13} title={t('payroll.commission.minRevenue') || 'Min revenue'} content={ph.minRevenue} />
                                      </span>
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={tr.minRevenue}
                                        onChange={(e) => updateTierRow(s.staffUserId, idx, 'minRevenue', e.target.value)}
                                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={tr.percent}
                                        onChange={(e) => updateTierRow(s.staffUserId, idx, 'percent', e.target.value)}
                                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                      />
                                      <span className="text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeTierRow(s.staffUserId, idx)}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addTierRow(s.staffUserId)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  {t('payroll.commission.addTier') || 'Add tier'}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleSaveCommission(s.staffUserId)}
                              disabled={savingCommission === s.staffUserId}
                              className="mt-3 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 inline-flex items-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                            >
                              {savingCommission === s.staffUserId && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                              {t('common.save') || 'Save'}
                            </button>
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
                    const d = getDraft(s.staffUserId);
                    if (s.role === 'OWNER') {
                      return (
                        <div key={s.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">{s.name}</p>
                            <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {getRoleLabel(s.role)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm italic text-gray-500 dark:text-gray-400">{ownerCommissionNote}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={s.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">{s.name}</p>
                          <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {getRoleLabel(s.role)}
                          </span>
                        </div>

                        {/* Commission editor */}
                        <div className="mt-3 space-y-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t('payroll.commission') || 'Commission'}
                          </p>

                          {/* Mode toggle */}
                          <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                              {(['FLAT', 'TIERED'] as CommissionMode[]).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setDraft(s.staffUserId, { mode: m })}
                                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    d.mode === m
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {m === 'FLAT'
                                    ? (t('payroll.commission.flat') || 'Flat')
                                    : (t('payroll.commission.tiered') || 'Tiered')}
                                </button>
                              ))}
                            </div>
                            <HelpTip size={15} title={t('help.tip.tieredCommission.title') || 'Commission mode'} content={t('help.tip.tieredCommission.body') || 'Flat = one % on all sales; Tiered = higher % as monthly revenue grows.'} />
                          </div>

                          {d.mode === 'FLAT' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={d.percent ?? ''}
                                onChange={(e) => setDraft(s.staffUserId, { percent: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              />
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">%</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('payroll.commission.tieredHint') || "Commission % is chosen by the staff member's total revenue in the pay period."}
                              </p>
                              {d.tiers.map((tr, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                      {t('payroll.commission.minRevenue') || 'Min revenue'}
                                      <HelpTip size={13} title={t('payroll.commission.minRevenue') || 'Min revenue'} content={ph.minRevenue} />
                                    </span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={tr.minRevenue}
                                      onChange={(e) => updateTierRow(s.staffUserId, idx, 'minRevenue', e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                      {t('payroll.commission') || 'Commission'} %
                                    </span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={tr.percent}
                                      onChange={(e) => updateTierRow(s.staffUserId, idx, 'percent', e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">%</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTierRow(s.staffUserId, idx)}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addTierRow(s.staffUserId)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <PlusIcon className="h-4 w-4" />
                                {t('payroll.commission.addTier') || 'Add tier'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Save action */}
                        <div className="mt-3 flex items-center justify-end border-t border-gray-100 dark:border-gray-700 pt-3">
                          <button
                            onClick={() => handleSaveCommission(s.staffUserId)}
                            disabled={savingCommission === s.staffUserId}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 inline-flex items-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                          >
                            {savingCommission === s.staffUserId && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                            {t('common.save') || 'Save'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== RUNS TAB ===================== */}
        {tab === 'runs' && (
          <>
            {/* Pay run builder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('payroll.newPayRun') || 'New Pay Run'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.periodStart') || 'Period start'}
                    </label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.periodEnd') || 'Period end'}
                    </label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.currency') || 'Currency'}
                    </label>
                    <select
                      value={runCurrency}
                      onChange={(e) => setRunCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreview}
                      disabled={previewing}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                    >
                      {previewing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <EyeIcon className="h-5 w-5" />}
                      {t('payroll.preview') || 'Preview'}
                    </button>
                    <HelpTip size={15} title={t('payroll.preview') || 'Preview'} content={ph.preview} />
                  </div>
                </div>

                {runRows.length > 0 && (
                  <>
                    {/* Desktop preview table */}
                    <div className="hidden lg:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                            <th className="px-4 py-2">{t('payroll.name') || 'Name'}</th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.baseSalary') || 'Base'}<HelpTip size={13} title={t('payroll.baseSalary') || 'Base'} content={ph.baseSalary} /></span></th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.commission') || 'Commission'}<HelpTip size={13} title={t('payroll.commission') || 'Commission'} content={ph.commissionTotal} /></span></th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.bonus') || 'Bonus'}<HelpTip size={13} title={t('payroll.bonus') || 'Bonus'} content={ph.bonus} /></span></th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.deductions') || 'Deductions'}<HelpTip size={13} title={t('payroll.deductions') || 'Deductions'} content={ph.deductions} /></span></th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.tax') || 'Tax'}<HelpTip size={13} title={t('payroll.tax') || 'Tax'} content={ph.taxAmount} /></span></th>
                            <th className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 justify-end">{t('payroll.netPay') || 'Net Pay'}<HelpTip size={13} title={t('payroll.netPay') || 'Net Pay'} content={ph.netPay} /></span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {runRows.map((r, idx) => (
                            <tr key={r.staffUserId}>
                              <td className="px-4 py-2 align-middle">
                                <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{r.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getRoleLabel(r.role)} · {r.commissionPercent}%
                                  {r.mode === 'TIERED' && ` (${t('payroll.commission.tiered') || 'Tiered'})`}
                                </p>
                              </td>
                              {(['baseSalary', 'commissionTotal', 'bonus', 'deductions', 'taxAmount'] as const).map((field) => (
                                <td key={field} className="px-2 py-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={r[field]}
                                    onChange={(e) => updateRunRow(idx, { [field]: e.target.value })}
                                    className="w-24 px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                                {formatPrice(rowNet(r), asCurrency(runCurrency))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile preview cards */}
                    <div className="lg:hidden space-y-3">
                      {runRows.map((r, idx) => (
                        <div key={r.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          {/* Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white break-words">{r.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {getRoleLabel(r.role)} · {r.commissionPercent}%
                                {r.mode === 'TIERED' && ` (${t('payroll.commission.tiered') || 'Tiered'})`}
                              </p>
                            </div>
                            <p className="flex-shrink-0 font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatPrice(rowNet(r), asCurrency(runCurrency))}
                            </p>
                          </div>

                          {/* Editable fields */}
                          <dl className="mt-3 space-y-2 text-sm">
                            {([
                              ['baseSalary', t('payroll.baseSalary') || 'Base'],
                              ['commissionTotal', t('payroll.commission') || 'Commission'],
                              ['bonus', t('payroll.bonus') || 'Bonus'],
                              ['deductions', t('payroll.deductions') || 'Deductions'],
                              ['taxAmount', t('payroll.tax') || 'Tax'],
                            ] as [keyof Pick<RunRow, 'baseSalary' | 'commissionTotal' | 'bonus' | 'deductions' | 'taxAmount'>, string][]).map(([field, label]) => (
                              <div key={field} className="flex items-center justify-between gap-3">
                                <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                                <dd className="min-w-0">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={r[field]}
                                    onChange={(e) => updateRunRow(idx, { [field]: e.target.value })}
                                    className="w-32 px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 tabular-nums"
                                  />
                                </dd>
                              </div>
                            ))}
                          </dl>

                          {/* Net pay row */}
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('payroll.netPay') || 'Net Pay'}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatPrice(rowNet(r), asCurrency(runCurrency))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payroll.notes') || 'Notes'}
                      </label>
                      <textarea
                        value={runNotes}
                        onChange={(e) => setRunNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                      <p className="text-base font-semibold text-gray-900 dark:text-white break-words tabular-nums">
                        {t('payroll.runTotal') || 'Run total'}: {formatPrice(runTotal, asCurrency(runCurrency))}
                      </p>
                      <button
                        onClick={handleCreateRun}
                        disabled={creatingRun}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                      >
                        {creatingRun ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                        {t('payroll.createPayRun') || 'Create pay run'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="w-full sm:flex-1 sm:max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('payroll.status') || 'Status'}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PayrollStatus | '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('payroll.allStatuses') || 'All Statuses'}</option>
                    {PAYROLL_STATUSES.map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Records table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {t('payroll.records') || 'Payroll Records'}
                  <HelpTip size={15} title={t('payroll.records') || 'Payroll Records'} content={ph.payRunWorkflow} />
                </h2>
              </div>

              {records.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <BanknotesIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('payroll.noRecords') || 'No payroll records yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop records table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.name') || 'Name'}</th>
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.period') || 'Period'}</th>
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.status') || 'Status'}</th>
                          <th scope="col" className="px-6 py-3 font-medium text-right">{t('payroll.netPay') || 'Net Pay'}</th>
                          <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {records.map((rec) => {
                          const cur = asCurrency(rec.currency);
                          const isBusy = busyRecord === rec.id;
                          return (
                            <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{rec.staffName || rec.staffUserId}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums">
                                {new Date(rec.periodStart).toLocaleDateString()} – {new Date(rec.periodEnd).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[rec.status]}`}>
                                  {getStatusLabel(rec.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white tabular-nums">
                                {formatPrice(num(rec.netPay), cur)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => setViewRecord(rec)}
                                    aria-label={t('payroll.viewPayslip') || 'View payslip'}
                                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition active:scale-[0.96]"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  {rec.status === 'DRAFT' && (
                                    <button
                                      onClick={() => openEditRecord(rec)}
                                      aria-label={t('common.edit') || 'Edit'}
                                      className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition active:scale-[0.96]"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {rec.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleApprove(rec)}
                                      disabled={isBusy}
                                      aria-label={t('payroll.approve') || 'Approve'}
                                      className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {rec.status === 'APPROVED' && (
                                    <button
                                      onClick={() => handleMarkPaid(rec)}
                                      disabled={isBusy}
                                      aria-label={t('payroll.markPaid') || 'Mark paid'}
                                      className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                                    >
                                      <BanknotesIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {rec.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleDelete(rec)}
                                      disabled={isBusy}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                                    >
                                      {isBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
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

                  {/* Mobile records cards */}
                  <div className="lg:hidden space-y-3 p-4">
                    {records.map((rec) => {
                      const cur = asCurrency(rec.currency);
                      const isBusy = busyRecord === rec.id;
                      return (
                        <div key={rec.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">
                              {rec.staffName || rec.staffUserId}
                            </p>
                            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[rec.status]}`}>
                              {getStatusLabel(rec.status)}
                            </span>
                          </div>

                          {/* Detail rows */}
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('payroll.period') || 'Period'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words tabular-nums">
                                {new Date(rec.periodStart).toLocaleDateString()} – {new Date(rec.periodEnd).toLocaleDateString()}
                              </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('payroll.netPay') || 'Net Pay'}</dt>
                              <dd className="min-w-0 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                                {formatPrice(num(rec.netPay), cur)}
                              </dd>
                            </div>
                          </dl>

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => setViewRecord(rec)}
                              aria-label={t('payroll.viewPayslip') || 'View payslip'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border border-gray-200 dark:border-gray-600 rounded-lg transition active:scale-[0.96]"
                            >
                              <EyeIcon className="h-4 w-4" />
                              {t('payroll.viewPayslip') || 'View'}
                            </button>
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => openEditRecord(rec)}
                                aria-label={t('common.edit') || 'Edit'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 border border-amber-200 dark:border-amber-800 rounded-lg transition active:scale-[0.96]"
                              >
                                <PencilIcon className="h-4 w-4" />
                                {t('common.edit') || 'Edit'}
                              </button>
                            )}
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => handleApprove(rec)}
                                disabled={isBusy}
                                aria-label={t('payroll.approve') || 'Approve'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 border border-primary-200 dark:border-primary-800 rounded-lg transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                {t('payroll.approve') || 'Approve'}
                              </button>
                            )}
                            {rec.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMarkPaid(rec)}
                                disabled={isBusy}
                                aria-label={t('payroll.markPaid') || 'Mark paid'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-700 border border-green-200 dark:border-green-800 rounded-lg transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                              >
                                <BanknotesIcon className="h-4 w-4" />
                                {t('payroll.markPaid') || 'Mark paid'}
                              </button>
                            )}
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => handleDelete(rec)}
                                disabled={isBusy}
                                aria-label={t('common.delete') || 'Delete'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                              >
                                {isBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                {t('common.delete') || 'Delete'}
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
          </>
        )}

        {/* ===================== Payslip View Modal ===================== */}
        {viewRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('payroll.payslip') || 'Payslip'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {viewRecord.staffName || viewRecord.staffUserId}
                  </p>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  aria-label={t('common.close') || 'Close'}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('payroll.period') || 'Period'}</span>
                  <span className="text-gray-900 dark:text-white tabular-nums">
                    {new Date(viewRecord.periodStart).toLocaleDateString()} – {new Date(viewRecord.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('payroll.status') || 'Status'}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[viewRecord.status]}`}>
                    {getStatusLabel(viewRecord.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  {[
                    { label: t('payroll.baseSalary') || 'Base salary', value: num(viewRecord.baseSalary), sign: 1 },
                    { label: t('payroll.commission') || 'Commission', value: num(viewRecord.commissionTotal), sign: 1 },
                    { label: t('payroll.bonus') || 'Bonus', value: num(viewRecord.bonus), sign: 1 },
                    { label: t('payroll.deductions') || 'Deductions', value: num(viewRecord.deductions), sign: -1 },
                    { label: t('payroll.tax') || 'Tax', value: num(viewRecord.taxAmount), sign: -1 },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{row.label}</span>
                      <span className={`tabular-nums ${row.sign < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {row.sign < 0 ? '−' : ''}{formatPrice(row.value, asCurrency(viewRecord.currency))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{t('payroll.netPay') || 'Net Pay'}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatPrice(num(viewRecord.netPay), asCurrency(viewRecord.currency))}
                  </span>
                </div>

                {viewRecord.paidAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('payroll.paidOn') || 'Paid on'} {new Date(viewRecord.paidAt).toLocaleDateString()}
                  </p>
                )}
                {viewRecord.notes && (
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400">{t('payroll.notes') || 'Notes'}</p>
                    <p className="text-gray-900 dark:text-white">{viewRecord.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ===================== Edit DRAFT Record Modal ===================== */}
        {editingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('payroll.editRecord') || 'Edit Draft Record'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingRecord.staffName || editingRecord.staffUserId}
                  </p>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  aria-label={t('common.close') || 'Close'}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Fields */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('payroll.period') || 'Period'}:&nbsp;
                  <span className="tabular-nums">
                    {new Date(editingRecord.periodStart).toLocaleDateString()} – {new Date(editingRecord.periodEnd).toLocaleDateString()}
                  </span>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[editingRecord.status]}`}>
                    {getStatusLabel(editingRecord.status)}
                  </span>
                </p>

                {([
                  ['baseSalary', t('payroll.baseSalary') || 'Base salary', ph.baseSalary],
                  ['commissionTotal', t('payroll.commission') || 'Commission', ph.commissionTotal],
                  ['bonus', t('payroll.bonus') || 'Bonus', ph.bonus],
                  ['deductions', t('payroll.deductions') || 'Deductions', ph.deductions],
                  ['taxAmount', t('payroll.tax') || 'Tax (withheld)', ph.taxAmount],
                ] as [Exclude<keyof RecordEditDraft, 'notes'>, string, string][]).map(([field, label, helpContent]) => (
                  <div key={field}>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                      <HelpTip size={13} title={label} content={helpContent} />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editDraft[field]}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 tabular-nums"
                    />
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('payroll.notes') || 'Notes'}
                  </label>
                  <textarea
                    value={editDraft.notes}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Live net-pay preview */}
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('payroll.netPay') || 'Net Pay'}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatPrice(editNet(), asCurrency(editingRecord.currency))}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition active:scale-[0.96]"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 inline-flex items-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                >
                  {savingEdit && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {t('common.save') || 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpecialistPayroll;
