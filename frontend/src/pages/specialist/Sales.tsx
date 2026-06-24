import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { confirm, promptInput } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  salesService,
  GiftCard,
  ServicePackage,
  CustomerPackage,
  MembershipPlan,
  CustomerMembership,
  SalesSummary,
  GiftCardStatus,
  PackageStatus,
  MembershipStatus,
  BillingPeriod,
  BILLING_PERIODS,
  IssueGiftCardData,
  CreatePackageData,
  CreatePlanData,
} from '../../services/sales.service';
import {
  storeService,
  ProductOrder,
  StoreSummary,
  OrderStatus,
  FulfilmentType,
} from '../../services/store.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  GiftIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowPathIcon,
  GiftIcon as TicketIcon,
  CreditCardIcon,
  NoSymbolIcon,
  BuildingStorefrontIcon as ShoppingBagIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

type Currency = 'USD' | 'EUR' | 'UAH';

const asCurrency = (c?: string | null): Currency =>
  c === 'USD' || c === 'EUR' || c === 'UAH' ? c : 'UAH';

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

type Tab = 'giftCards' | 'packages' | 'memberships' | 'orders';

// ---- form shapes ----------------------------------------------------------

interface GiftCardFormData {
  initialAmount: string;
  currency: string;
  recipientEmail: string;
  note: string;
  expiresAt: string;
}
const initialGiftCardForm: GiftCardFormData = {
  initialAmount: '',
  currency: 'UAH',
  recipientEmail: '',
  note: '',
  expiresAt: '',
};

interface PackageFormData {
  name: string;
  description: string;
  credits: string;
  price: string;
  currency: string;
  validDays: string;
}
const initialPackageForm: PackageFormData = {
  name: '',
  description: '',
  credits: '10',
  price: '',
  currency: 'UAH',
  validDays: '365',
};

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: BillingPeriod;
  benefits: string;
  discountPercent: string;
}
const initialPlanForm: PlanFormData = {
  name: '',
  description: '',
  price: '',
  currency: 'UAH',
  billingPeriod: 'MONTHLY',
  benefits: '',
  discountPercent: '0',
};

const SALES_HELP = {
  en: {
    overview: 'Sales — manage gift cards, prepaid service packages, memberships, and online store orders.\n\nTabs:\n• Gift cards — issue a prepaid card with a fixed monetary value. The client pays for the card upfront (you collect payment separately); they redeem it later against services or products. The balance decreases each time you tap Redeem and enter the amount used.\n• Packages — define bundles of a fixed number of credits (e.g. 10 haircuts). Sell a package to a client (collect payment yourself), then Grant it to them by email. Each visit you tap Use credit to deduct one credit. Status turns Used when credits hit 0 or the validity period expires.\n• Memberships — recurring subscription plans (monthly or yearly). Define a plan with a price, billing period, and optional % discount for members. Enroll a client by email; billing is handled manually. Active members see a renewal date (Renews column). Cancel to stop the subscription.\n• Store orders — product orders placed online by clients. Mark Paid when payment is collected; tap Fulfil to hand over the goods (stock is deducted at that point).\n\nDashboard cards show: outstanding gift-card balance, unused package credits, and active member count + estimated MRR.',
    giftCards: 'Gift cards are prepaid vouchers with a fixed monetary value (e.g. 500 UAH).\n\nHow it works:\n1. Tap Issue gift card — set the amount, optional recipient email, and expiry date.\n2. Collect payment from the client yourself — MiyZapis does not process it.\n3. The card gets a unique code. Give the code to the client.\n4. When the client wants to use it: tap Redeem next to the card, enter the amount being applied, and the balance decreases.\n5. A card is fully Redeemed when the balance reaches zero. Cancel a card to void its remaining balance.\n\nThe outstanding balance card shows the total liability — money clients have paid but not yet spent.',
    packages: 'Service packages are prepaid sets of credits (visits or service sessions), sold as a bundle at a fixed price.\n\nHow it works:\n1. Define the package — give it a name, set the number of credits (e.g. 10), set a price and validity period in days.\n2. Sell it to a client offline and collect payment yourself.\n3. Tap Grant, enter the client\'s email — a copy of the package is assigned to them (Sold packages section).\n4. Each visit: tap Use credit — one credit is deducted. Remaining credits are tracked per client.\n5. Status becomes Used when credits reach 0, or Expired when the validity period ends.\n\nCredits outstanding (dashboard card) = total unused credits you owe clients.',
    memberships: 'Memberships are recurring subscription plans — clients pay a regular fee (monthly or yearly) for access or a discount.\n\nHow it works:\n1. Define a plan — set a name, price, billing period (Monthly / Yearly), optional discount % for members, and benefits description.\n2. Enroll a client by email — their membership starts immediately. Billing is handled manually by you (you collect payment offline).\n3. Track members in the Members list: start date, renewal date (current period end), and status.\n4. Cancel a membership to stop it — status becomes Cancelled.\n\nMRR (Monthly Recurring Revenue) estimate on the dashboard = sum of all active members\' monthly fees.',
  },
  uk: {
    overview: 'Продажі — керування подарунковими картками, передплаченими пакетами послуг, абонементами та замовленнями онлайн-магазину.\n\nВкладки:\n• Подарункові картки — видайте картку з фіксованою грошовою сумою. Клієнт оплачує її заздалегідь (ви приймаєте оплату самостійно); пізніше він гасить її при оплаті послуг або товарів. Баланс зменшується щоразу, коли ви натискаєте «Погасити» і вводите суму.\n• Пакети послуг — набори з фіксованою кількістю кредитів (напр., 10 стрижок). Продайте пакет клієнту (оплату приймайте самостійно), потім натисніть «Видати» та вкажіть email клієнта. На кожному відвідуванні натискайте «Використати кредит». Статус стає «Використаний», коли кредити вичерпані або закінчується термін дії.\n• Абонементи — повторювані підписки (щомісяця або щороку). Створіть план з ціною, періодом та необов\'язковою знижкою. Запишіть клієнта за email; оплату стягуйте вручну. Активні учасники мають дату поновлення (колонка «Поновлення»). Скасуйте для зупинки підписки.\n• Замовлення магазину — онлайн-замовлення товарів від клієнтів. Позначте «Оплачено» після отримання коштів; натисніть «Виконати» для видачі товарів (залишок списується в цей момент).\n\nКарточки зведення: загальний залишок подарункових карток, невикористані кредити пакетів, кількість активних учасників + оціночний MRR.',
    giftCards: 'Подарункові картки — передплачені ваучери з фіксованою сумою (напр., 500 грн).\n\nЯк це працює:\n1. Натисніть «Видати картку» — вкажіть суму, необов\'язковий email отримувача та дату закінчення.\n2. Прийміть оплату від клієнта самостійно — MiyZapis не обробляє платежі.\n3. Картка отримує унікальний код. Передайте код клієнту.\n4. Коли клієнт хоче використати картку: натисніть «Погасити», введіть суму, яку застосовуєте, — баланс зменшується.\n5. Картка стає «Використаною», коли баланс досягає нуля. Скасуйте картку, щоб анулювати залишок.\n\nКарточка «Залишок карток» показує загальне зобов\'язання — гроші, які клієнти вже заплатили, але ще не витратили.',
    packages: 'Пакети послуг — передплачені набори кредитів (відвідувань або сеансів), продані за фіксованою ціною.\n\nЯк це працює:\n1. Створіть пакет — назва, кількість кредитів (напр., 10), ціна та термін дії в днях.\n2. Продайте клієнту офлайн і прийміть оплату самостійно.\n3. Натисніть «Видати», введіть email клієнта — копія пакету призначається йому (розділ «Продані пакети»).\n4. На кожному відвідуванні: натисніть «Використати кредит» — один кредит списується. Залишок відстежується для кожного клієнта.\n5. Статус стає «Використаний», коли кредити вичерпані, або «Прострочений» — після закінчення терміну.\n\nНевикористані кредити (карточка зведення) = загальна кількість кредитів, що ви ще маєте надати клієнтам.',
    memberships: 'Абонементи — повторювані підписки: клієнти платять регулярну суму (щомісяця або щороку) за доступ або знижку.\n\nЯк це працює:\n1. Створіть план — назва, ціна, period (Щомісяця / Щороку), необов\'язкова знижка % для учасників та опис переваг.\n2. Запишіть клієнта за email — абонемент починається одразу. Оплату стягуйте вручну офлайн.\n3. Відстежуйте учасників у списку: дата початку, дата поновлення та статус.\n4. Скасуйте абонемент для зупинки — статус стає «Скасовано».\n\nОціночний MRR (щомісячний recurring дохід) на дашборді = сума щомісячних платежів усіх активних учасників.',
  },
  ru: {
    overview: 'Продажи — управление подарочными картами, предоплаченными пакетами услуг, абонементами и заказами онлайн-магазина.\n\nВкладки:\n• Подарочные карты — выдайте карту с фиксированной суммой. Клиент оплачивает её заранее (вы принимаете оплату самостоятельно); позже погашает при оплате услуг или товаров. Баланс уменьшается каждый раз, когда вы нажимаете «Погасить» и вводите сумму.\n• Пакеты услуг — наборы с фиксированным количеством кредитов (напр., 10 стрижек). Продайте пакет клиенту (оплату принимайте самостоятельно), затем нажмите «Выдать» и укажите email клиента. На каждом визите нажимайте «Использовать кредит». Статус становится «Использован», когда кредиты исчерпаны или истекает срок действия.\n• Абонементы — повторяющиеся подписки (ежемесячно или ежегодно). Создайте план с ценой, периодом и необязательной скидкой. Запишите клиента по email; оплату взимайте вручную. Активные участники имеют дату обновления (столбец «Обновляется»). Отмените для остановки подписки.\n• Заказы магазина — онлайн-заказы товаров от клиентов. Отметьте «Оплачено» после получения средств; нажмите «Выполнить» для выдачи товаров (остаток списывается в этот момент).\n\nКарточки сводки: общий остаток подарочных карт, неиспользованные кредиты пакетов, количество активных участников + оценочный MRR.',
    giftCards: 'Подарочные карты — предоплаченные ваучеры с фиксированной суммой (напр., 500 грн).\n\nКак это работает:\n1. Нажмите «Выдать карту» — укажите сумму, необязательный email получателя и дату окончания.\n2. Примите оплату от клиента самостоятельно — MiyZapis не обрабатывает платежи.\n3. Карта получает уникальный код. Передайте код клиенту.\n4. Когда клиент хочет использовать карту: нажмите «Погасить», введите сумму — баланс уменьшается.\n5. Карта становится «Использованной», когда баланс достигает нуля. Отмените карту, чтобы аннулировать остаток.\n\nКарточка «Остаток карт» показывает общее обязательство — деньги, которые клиенты уже заплатили, но ещё не потратили.',
    packages: 'Пакеты услуг — предоплаченные наборы кредитов (визитов или сеансов), продаваемые за фиксированную цену.\n\nКак это работает:\n1. Создайте пакет — название, количество кредитов (напр., 10), цена и срок действия в днях.\n2. Продайте клиенту офлайн и примите оплату самостоятельно.\n3. Нажмите «Выдать», введите email клиента — копия пакета назначается ему (раздел «Проданные пакеты»).\n4. На каждом визите: нажмите «Использовать кредит» — один кредит списывается. Остаток отслеживается для каждого клиента.\n5. Статус становится «Использован», когда кредиты исчерпаны, или «Просрочен» — после истечения срока.\n\nНеиспользованные кредиты (карточка сводки) = общее количество кредитов, которые вы ещё должны предоставить клиентам.',
    memberships: 'Абонементы — повторяющиеся подписки: клиенты платят регулярную сумму (ежемесячно или ежегодно) за доступ или скидку.\n\nКак это работает:\n1. Создайте план — название, цена, период (Ежемесячно / Ежегодно), необязательная скидка % и описание преимуществ.\n2. Запишите клиента по email — абонемент начинается сразу. Оплату взимайте вручную офлайн.\n3. Отслеживайте участников в списке: дата начала, дата обновления и статус.\n4. Отмените абонемент для остановки — статус становится «Отменено».\n\nОценочный MRR (ежемесячный recurring доход) на дашборде = сумма ежемесячных платежей всех активных участников.',
  },
};

const SpecialistSales: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (SALES_HELP as any)[language] || SALES_HELP.en;
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<Tab>('giftCards');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  // Gift cards
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [giftCardForm, setGiftCardForm] = useState<GiftCardFormData>(initialGiftCardForm);
  const [isGiftCardModalOpen, setIsGiftCardModalOpen] = useState(false);

  // Packages
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [packageForm, setPackageForm] = useState<PackageFormData>(initialPackageForm);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [grantPackage, setGrantPackage] = useState<ServicePackage | null>(null);
  const [grantEmail, setGrantEmail] = useState('');

  // Memberships
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<CustomerMembership[]>([]);
  const [planForm, setPlanForm] = useState<PlanFormData>(initialPlanForm);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [enrollPlan, setEnrollPlan] = useState<MembershipPlan | null>(null);
  const [enrollEmail, setEnrollEmail] = useState('');

  // Store orders
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [storeSummary, setStoreSummary] = useState<StoreSummary | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [s, gc, pkg, cpkg, pl, mem, ord, ss] = await Promise.all([
        salesService.getSummary(),
        salesService.getGiftCards(),
        salesService.getPackages(),
        salesService.getCustomerPackages(),
        salesService.getPlans(),
        salesService.getMembers(),
        storeService.listOrders().catch(() => [] as ProductOrder[]),
        storeService.getSummary().catch(() => null),
      ]);
      setSummary(s);
      setGiftCards(gc || []);
      setPackages(pkg || []);
      setCustomerPackages(cpkg || []);
      setPlans(pl || []);
      setMembers(mem || []);
      setOrders(ord || []);
      setStoreSummary(ss);
    } catch (error: unknown) {
      console.error('Error loading sales:', error);
      toast.error(t('sales.loadError') || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // ---- labels -------------------------------------------------------------

  const giftCardStatusLabel = (status: GiftCardStatus): string => {
    const labels: Record<GiftCardStatus, Record<string, string>> = {
      ACTIVE: { en: 'Active', uk: 'Активна', ru: 'Активна' },
      REDEEMED: { en: 'Redeemed', uk: 'Використана', ru: 'Использована' },
      EXPIRED: { en: 'Expired', uk: 'Прострочена', ru: 'Просрочена' },
      CANCELLED: { en: 'Cancelled', uk: 'Скасована', ru: 'Отменена' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const packageStatusLabel = (status: PackageStatus): string => {
    const labels: Record<PackageStatus, Record<string, string>> = {
      ACTIVE: { en: 'Active', uk: 'Активний', ru: 'Активный' },
      USED: { en: 'Used', uk: 'Використаний', ru: 'Использован' },
      EXPIRED: { en: 'Expired', uk: 'Прострочений', ru: 'Просрочен' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const membershipStatusLabel = (status: MembershipStatus): string => {
    const labels: Record<MembershipStatus, Record<string, string>> = {
      ACTIVE: { en: 'Active', uk: 'Активне', ru: 'Активное' },
      CANCELLED: { en: 'Cancelled', uk: 'Скасоване', ru: 'Отменено' },
      EXPIRED: { en: 'Expired', uk: 'Прострочене', ru: 'Просрочено' },
      PAST_DUE: { en: 'Past due', uk: 'Прострочено оплату', ru: 'Просрочена оплата' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const billingPeriodLabel = (p: BillingPeriod): string => {
    const labels: Record<BillingPeriod, Record<string, string>> = {
      MONTHLY: { en: 'Monthly', uk: 'Щомісяця', ru: 'Ежемесячно' },
      YEARLY: { en: 'Yearly', uk: 'Щороку', ru: 'Ежегодно' },
    };
    return labels[p]?.[language] || labels[p]?.en || p;
  };

  const orderStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, Record<string, string>> = {
      PENDING: { en: 'Pending', uk: 'Очікує', ru: 'Ожидает' },
      PAID: { en: 'Paid', uk: 'Оплачено', ru: 'Оплачено' },
      FULFILLED: { en: 'Fulfilled', uk: 'Виконано', ru: 'Выполнено' },
      CANCELLED: { en: 'Cancelled', uk: 'Скасовано', ru: 'Отменено' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const fulfilmentLabel = (f: FulfilmentType): string => {
    const labels: Record<FulfilmentType, Record<string, string>> = {
      PICKUP: { en: 'Pickup', uk: 'Самовивіз', ru: 'Самовывоз' },
      DELIVERY: { en: 'Delivery', uk: 'Доставка', ru: 'Доставка' },
    };
    return labels[f]?.[language] || labels[f]?.en || f;
  };

  // Order status badges: PENDING gray, PAID amber, FULFILLED green, CANCELLED red.
  const orderStatusBadgeClass = (status: OrderStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
      case 'PAID':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'FULFILLED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  const handleSetOrderStatus = async (order: ProductOrder, status: OrderStatus) => {
    if (
      status === 'FULFILLED' &&
      !await confirm(t('store.confirmFulfil') || 'Mark this order fulfilled? Stock will be deducted.')
    ) {
      return;
    }
    if (status === 'CANCELLED' && !await confirm(t('store.confirmCancel') || 'Cancel this order?')) {
      return;
    }
    try {
      setActing(order.id);
      await storeService.setOrderStatus(order.id, status);
      toast.success(t('store.orderUpdated') || 'Order updated');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed');
    } finally {
      setActing(null);
    }
  };

  const statusBadgeClass = (status: string): string => {
    if (status === 'ACTIVE') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (status === 'REDEEMED' || status === 'USED') return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    if (status === 'CANCELLED') return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
  };

  const fmtDate = (s?: string | null): string => (s ? new Date(s).toLocaleDateString() : '—');

  // ---- gift card actions --------------------------------------------------

  const handleIssueGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(giftCardForm.initialAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('sales.invalidAmount') || 'Please enter a valid amount');
      return;
    }
    try {
      setSubmitting(true);
      const data: IssueGiftCardData = {
        initialAmount: amount,
        currency: giftCardForm.currency,
        recipientEmail: giftCardForm.recipientEmail.trim() || undefined,
        note: giftCardForm.note.trim() || undefined,
        expiresAt: giftCardForm.expiresAt ? new Date(giftCardForm.expiresAt).toISOString() : null,
      };
      const card = await salesService.issueGiftCard(data);
      toast.success((t('sales.giftCardIssued') || 'Gift card issued') + `: ${card.code}`);
      setIsGiftCardModalOpen(false);
      setGiftCardForm(initialGiftCardForm);
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async (card: GiftCard) => {
    const input = await promptInput({
      message: (t('sales.redeemPrompt') || 'Amount to redeem') + ` (${t('sales.balance') || 'Balance'}: ${num(card.balance)} ${card.currency})`,
    });
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('sales.invalidAmount') || 'Please enter a valid amount');
      return;
    }
    try {
      setActing(card.id);
      await salesService.redeemGiftCard(card.id, amount);
      toast.success(t('sales.redeemed') || 'Redeemed');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.redeemError') || 'Failed to redeem');
    } finally {
      setActing(null);
    }
  };

  const handleCancelGiftCard = async (card: GiftCard) => {
    if (!await confirm(t('sales.confirmCancelGiftCard') || 'Cancel this gift card? Remaining balance will be voided.')) return;
    try {
      setActing(card.id);
      await salesService.cancelGiftCard(card.id);
      toast.success(t('sales.giftCardCancelled') || 'Gift card cancelled');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed');
    } finally {
      setActing(null);
    }
  };

  // ---- package actions ----------------------------------------------------

  const openNewPackage = () => {
    setEditingPackage(null);
    setPackageForm(initialPackageForm);
    setIsPackageModalOpen(true);
  };

  const openEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      credits: String(pkg.credits),
      price: String(num(pkg.price)),
      currency: pkg.currency || 'UAH',
      validDays: String(pkg.validDays),
    });
    setIsPackageModalOpen(true);
  };

  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      toast.error(t('sales.nameRequired') || 'Name is required');
      return;
    }
    const credits = parseInt(packageForm.credits, 10);
    if (isNaN(credits) || credits < 1) {
      toast.error(t('sales.invalidCredits') || 'Credits must be a positive whole number');
      return;
    }
    const price = parseFloat(packageForm.price || '0');
    if (isNaN(price) || price < 0) {
      toast.error(t('sales.invalidPrice') || 'Please enter a valid price');
      return;
    }
    try {
      setSubmitting(true);
      const data: CreatePackageData = {
        name: packageForm.name.trim(),
        description: packageForm.description.trim() || undefined,
        credits,
        price,
        currency: packageForm.currency,
        validDays: parseInt(packageForm.validDays || '365', 10),
      };
      if (editingPackage) {
        await salesService.updatePackage(editingPackage.id, data);
        toast.success(t('sales.packageUpdated') || 'Package updated');
      } else {
        await salesService.createPackage(data);
        toast.success(t('sales.packageCreated') || 'Package created');
      }
      setIsPackageModalOpen(false);
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!await confirm(t('sales.confirmDeletePackage') || 'Delete this package definition?')) return;
    try {
      setActing(id);
      await salesService.deletePackage(id);
      toast.success(t('sales.packageDeleted') || 'Package deleted');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.deleteError') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  const handleGrantPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantPackage) return;
    if (!grantEmail.trim()) {
      toast.error(t('sales.emailRequired') || 'Customer email is required');
      return;
    }
    try {
      setSubmitting(true);
      await salesService.grantPackage(grantPackage.id, { customerEmail: grantEmail.trim() });
      toast.success(t('sales.packageGranted') || 'Package granted');
      setGrantPackage(null);
      setGrantEmail('');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.grantError') || 'Failed to grant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseCredit = async (cp: CustomerPackage) => {
    if (!await confirm(t('sales.confirmUseCredit') || 'Use one credit from this package?')) return;
    try {
      setActing(cp.id);
      await salesService.usePackageCredit(cp.id);
      toast.success(t('sales.creditUsed') || 'Credit used');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed');
    } finally {
      setActing(null);
    }
  };

  // ---- plan / membership actions ------------------------------------------

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm(initialPlanForm);
    setIsPlanModalOpen(true);
  };

  const openEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: String(num(plan.price)),
      currency: plan.currency || 'UAH',
      billingPeriod: plan.billingPeriod,
      benefits: plan.benefits || '',
      discountPercent: String(num(plan.discountPercent)),
    });
    setIsPlanModalOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      toast.error(t('sales.nameRequired') || 'Name is required');
      return;
    }
    const price = parseFloat(planForm.price || '0');
    if (isNaN(price) || price < 0) {
      toast.error(t('sales.invalidPrice') || 'Please enter a valid price');
      return;
    }
    const discount = parseFloat(planForm.discountPercent || '0');
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast.error(t('sales.invalidDiscount') || 'Discount must be between 0 and 100');
      return;
    }
    try {
      setSubmitting(true);
      const data: CreatePlanData = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || undefined,
        price,
        currency: planForm.currency,
        billingPeriod: planForm.billingPeriod,
        benefits: planForm.benefits.trim() || undefined,
        discountPercent: discount,
      };
      if (editingPlan) {
        await salesService.updatePlan(editingPlan.id, data);
        toast.success(t('sales.planUpdated') || 'Plan updated');
      } else {
        await salesService.createPlan(data);
        toast.success(t('sales.planCreated') || 'Plan created');
      }
      setIsPlanModalOpen(false);
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!await confirm(t('sales.confirmDeletePlan') || 'Delete this membership plan?')) return;
    try {
      setActing(id);
      await salesService.deletePlan(id);
      toast.success(t('sales.planDeleted') || 'Plan deleted');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.deleteError') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollPlan) return;
    if (!enrollEmail.trim()) {
      toast.error(t('sales.emailRequired') || 'Customer email is required');
      return;
    }
    try {
      setSubmitting(true);
      await salesService.enrollMember(enrollPlan.id, { customerEmail: enrollEmail.trim() });
      toast.success(t('sales.memberEnrolled') || 'Member enrolled');
      setEnrollPlan(null);
      setEnrollEmail('');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.enrollError') || 'Failed to enroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMembership = async (m: CustomerMembership) => {
    if (!await confirm(t('sales.confirmCancelMembership') || 'Cancel this membership?')) return;
    try {
      setActing(m.id);
      await salesService.cancelMembership(m.id);
      toast.success(t('sales.membershipCancelled') || 'Membership cancelled');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('sales.saveError') || 'Failed');
    } finally {
      setActing(null);
    }
  };

  if (loading && !summary) {
    return <PageLoader text={t('sales.loading') || 'Loading sales...'} />;
  }

  const summaryCurrency = asCurrency(summary?.currency);

  const tabs: { key: Tab; label: string; icon: typeof GiftIcon }[] = [
    { key: 'giftCards', label: t('sales.giftCards') || 'Gift cards', icon: GiftIcon },
    { key: 'packages', label: t('sales.packages') || 'Packages', icon: TicketIcon },
    { key: 'memberships', label: t('sales.memberships') || 'Memberships', icon: CreditCardIcon },
    { key: 'orders', label: t('store.orders') || 'Store orders', icon: ShoppingBagIcon },
  ];

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('sales.title') || 'Sales'}
            </h1>
            <HelpTip title={t('help.sales.title') || 'Sales'} content={h.overview} />
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('sales.subtitle') || 'Gift cards, service packages and memberships'}
          </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('sales.outstandingBalance') || 'Gift-card balance outstanding'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.giftCardOutstanding || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex-shrink-0">
                  <TicketIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('sales.creditsOutstanding') || 'Package credits outstanding'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {summary.creditsOutstanding}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('sales.activeMembers') || 'Active members'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white break-words tabular-nums">
                    {summary.activeMembers}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      · {t('sales.mrr') || 'MRR'} {formatPrice(summary.mrrEstimate || 0, summaryCurrency)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-1 gap-y-0 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition active:scale-[0.96] ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* ============================ GIFT CARDS ============================ */}
        {tab === 'giftCards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <HelpTip title={t('sales.giftCards') || 'Gift cards'} content={h.giftCards} />
              <button
                onClick={() => {
                  setGiftCardForm(initialGiftCardForm);
                  setIsGiftCardModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
              >
                <PlusIcon className="h-5 w-5" />
                {t('sales.issueGiftCard') || 'Issue gift card'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {giftCards.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <GiftIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('sales.noGiftCards') || 'No gift cards issued yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('sales.code') || 'Code'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.balance') || 'Balance'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.status') || 'Status'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.recipient') || 'Recipient'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.expires') || 'Expires'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {giftCards.map((card) => {
                          const cur = asCurrency(card.currency);
                          return (
                            <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {card.code}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-900 dark:text-white font-medium">
                                {formatPrice(num(card.balance), cur)}
                                <span className="block text-xs text-gray-400 dark:text-gray-500">
                                  / {formatPrice(num(card.initialAmount), cur)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(card.status)}`}>
                                  {giftCardStatusLabel(card.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                {card.recipientEmail || <span className="text-gray-400 dark:text-gray-600">—</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                {fmtDate(card.expiresAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  {card.status === 'ACTIVE' && (
                                    <>
                                      <button
                                        onClick={() => handleRedeem(card)}
                                        disabled={acting === card.id}
                                        className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {t('sales.redeem') || 'Redeem'}
                                      </button>
                                      <button
                                        onClick={() => handleCancelGiftCard(card)}
                                        disabled={acting === card.id}
                                        aria-label={t('sales.cancel') || 'Cancel'}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                      >
                                        <NoSymbolIcon className="h-4 w-4" />
                                      </button>
                                    </>
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
                    {giftCards.map((card) => {
                      const cur = asCurrency(card.currency);
                      return (
                        <div key={card.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 font-semibold font-mono text-gray-900 dark:text-white break-words">{card.code}</p>
                            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(card.status)}`}>
                              {giftCardStatusLabel(card.status)}
                            </span>
                          </div>
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.balance') || 'Balance'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words tabular-nums">
                                {formatPrice(num(card.balance), cur)}
                                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">/ {formatPrice(num(card.initialAmount), cur)}</span>
                              </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.recipient') || 'Recipient'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">
                                {card.recipientEmail || <span className="text-gray-400 dark:text-gray-600">—</span>}
                              </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.expires') || 'Expires'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{fmtDate(card.expiresAt)}</dd>
                            </div>
                          </dl>
                          {card.status === 'ACTIVE' && (
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                              <button
                                onClick={() => handleRedeem(card)}
                                disabled={acting === card.id}
                                className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {t('sales.redeem') || 'Redeem'}
                              </button>
                              <button
                                onClick={() => handleCancelGiftCard(card)}
                                disabled={acting === card.id}
                                aria-label={t('sales.cancel') || 'Cancel'}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                <NoSymbolIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================ PACKAGES ============================ */}
        {tab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <HelpTip title={t('sales.packages') || 'Packages'} content={h.packages} />
              <button
                onClick={openNewPackage}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
              >
                <PlusIcon className="h-5 w-5" />
                {t('sales.addPackage') || 'Add package'}
              </button>
            </div>

            {/* Package definitions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sales.packageDefinitions') || 'Package definitions'}
                </h2>
              </div>
              {packages.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  {t('sales.noPackages') || 'No packages defined yet'}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('sales.name') || 'Name'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.credits') || 'Credits'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.price') || 'Price'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.validDays') || 'Valid days'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.sold') || 'Sold'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {packages.map((pkg) => {
                          const cur = asCurrency(pkg.currency);
                          return (
                            <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{pkg.name}</p>
                                {pkg.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{pkg.description}</p>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-900 dark:text-white">{pkg.credits}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{formatPrice(num(pkg.price), cur)}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{pkg.validDays}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{pkg._count?.purchases ?? 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => { setGrantPackage(pkg); setGrantEmail(''); }}
                                    className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                  >
                                    {t('sales.grant') || 'Grant'}
                                  </button>
                                  <button
                                    onClick={() => openEditPackage(pkg)}
                                    aria-label={t('common.edit') || 'Edit'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePackage(pkg.id)}
                                    disabled={acting === pkg.id}
                                    aria-label={t('common.delete') || 'Delete'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                  >
                                    {acting === pkg.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                  </button>
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
                    {packages.map((pkg) => {
                      const cur = asCurrency(pkg.currency);
                      return (
                        <div key={pkg.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white break-words">{pkg.name}</p>
                              {pkg.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">{pkg.description}</p>
                              )}
                            </div>
                          </div>
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.credits') || 'Credits'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{pkg.credits}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.price') || 'Price'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{formatPrice(num(pkg.price), cur)}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.validDays') || 'Valid days'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{pkg.validDays}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.sold') || 'Sold'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{pkg._count?.purchases ?? 0}</dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => { setGrantPackage(pkg); setGrantEmail(''); }}
                              className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            >
                              {t('sales.grant') || 'Grant'}
                            </button>
                            <button
                              onClick={() => openEditPackage(pkg)}
                              aria-label={t('common.edit') || 'Edit'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              disabled={acting === pkg.id}
                              aria-label={t('common.delete') || 'Delete'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              {acting === pkg.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Sold customer packages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sales.soldPackages') || 'Sold packages'}
                </h2>
              </div>
              {customerPackages.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  {t('sales.noSoldPackages') || 'No packages granted to customers yet'}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('sales.package') || 'Package'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.remaining') || 'Remaining'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.status') || 'Status'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.expires') || 'Expires'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {customerPackages.map((cp) => (
                          <tr key={cp.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{cp.package?.name || cp.packageId}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-gray-900 dark:text-white">{cp.remainingCredits}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(cp.status)}`}>
                                {packageStatusLabel(cp.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{fmtDate(cp.expiresAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {cp.status === 'ACTIVE' && cp.remainingCredits > 0 && (
                                <button
                                  onClick={() => handleUseCredit(cp)}
                                  disabled={acting === cp.id}
                                  className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {t('sales.useCredit') || 'Use credit'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="lg:hidden space-y-3 p-4">
                    {customerPackages.map((cp) => (
                      <div key={cp.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">{cp.package?.name || cp.packageId}</p>
                          <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(cp.status)}`}>
                            {packageStatusLabel(cp.status)}
                          </span>
                        </div>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.remaining') || 'Remaining'}</dt>
                            <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{cp.remainingCredits}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.expires') || 'Expires'}</dt>
                            <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{fmtDate(cp.expiresAt)}</dd>
                          </div>
                        </dl>
                        {cp.status === 'ACTIVE' && cp.remainingCredits > 0 && (
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => handleUseCredit(cp)}
                              disabled={acting === cp.id}
                              className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {t('sales.useCredit') || 'Use credit'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================ MEMBERSHIPS ============================ */}
        {tab === 'memberships' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <HelpTip title={t('sales.memberships') || 'Memberships'} content={h.memberships} />
              <button
                onClick={openNewPlan}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
              >
                <PlusIcon className="h-5 w-5" />
                {t('sales.addPlan') || 'Add plan'}
              </button>
            </div>

            {/* Plan definitions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sales.plans') || 'Membership plans'}
                </h2>
              </div>
              {plans.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  {t('sales.noPlans') || 'No membership plans defined yet'}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('sales.name') || 'Name'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.price') || 'Price'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.billingPeriod') || 'Billing'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.discount') || 'Discount'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.members') || 'Members'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {plans.map((plan) => {
                          const cur = asCurrency(plan.currency);
                          return (
                            <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{plan.name}</p>
                                {plan.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{plan.description}</p>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{formatPrice(num(plan.price), cur)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{billingPeriodLabel(plan.billingPeriod)}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{num(plan.discountPercent)}%</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">{plan._count?.members ?? 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => { setEnrollPlan(plan); setEnrollEmail(''); }}
                                    className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                  >
                                    {t('sales.enroll') || 'Enroll'}
                                  </button>
                                  <button
                                    onClick={() => openEditPlan(plan)}
                                    aria-label={t('common.edit') || 'Edit'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    disabled={acting === plan.id}
                                    aria-label={t('common.delete') || 'Delete'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                  >
                                    {acting === plan.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                  </button>
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
                    {plans.map((plan) => {
                      const cur = asCurrency(plan.currency);
                      return (
                        <div key={plan.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white break-words">{plan.name}</p>
                              {plan.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">{plan.description}</p>
                              )}
                            </div>
                          </div>
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.price') || 'Price'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{formatPrice(num(plan.price), cur)}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.billingPeriod') || 'Billing'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">{billingPeriodLabel(plan.billingPeriod)}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.discount') || 'Discount'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{num(plan.discountPercent)}%</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.members') || 'Members'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{plan._count?.members ?? 0}</dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => { setEnrollPlan(plan); setEnrollEmail(''); }}
                              className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            >
                              {t('sales.enroll') || 'Enroll'}
                            </button>
                            <button
                              onClick={() => openEditPlan(plan)}
                              aria-label={t('common.edit') || 'Edit'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={acting === plan.id}
                              aria-label={t('common.delete') || 'Delete'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              {acting === plan.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sales.membersList') || 'Members'}
                </h2>
              </div>
              {members.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  {t('sales.noMembers') || 'No members enrolled yet'}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('sales.plan') || 'Plan'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.status') || 'Status'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.started') || 'Started'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.renews') || 'Renews'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {members.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4 text-gray-900 dark:text-white">{m.plan?.name || m.planId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(m.status)}`}>
                                {membershipStatusLabel(m.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{fmtDate(m.startedAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{fmtDate(m.currentPeriodEnd)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {m.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleCancelMembership(m)}
                                  disabled={acting === m.id}
                                  className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {t('sales.cancel') || 'Cancel'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="lg:hidden space-y-3 p-4">
                    {members.map((m) => (
                      <div key={m.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">{m.plan?.name || m.planId}</p>
                          <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(m.status)}`}>
                            {membershipStatusLabel(m.status)}
                          </span>
                        </div>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.started') || 'Started'}</dt>
                            <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{fmtDate(m.startedAt)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.renews') || 'Renews'}</dt>
                            <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{fmtDate(m.currentPeriodEnd)}</dd>
                          </div>
                        </dl>
                        {m.status === 'ACTIVE' && (
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => handleCancelMembership(m)}
                              disabled={acting === m.id}
                              className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {t('sales.cancel') || 'Cancel'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================ STORE ORDERS ============================ */}
        {tab === 'orders' && (
          <div className="space-y-6">
            {/* Store summary cards */}
            {storeSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0">
                      <ShoppingBagIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('store.pendingOrders') || 'Pending orders'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                        {storeSummary.pendingOrders}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('store.monthSales') || 'Sales this month'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                        {formatPrice(storeSummary.monthSalesTotal || 0, asCurrency(storeSummary.currency))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('store.orders') || 'Store orders'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('store.ordersHint') || 'Orders are paid and collected in-store. Stock is deducted when fulfilled.'}
                </p>
              </div>
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBagIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('store.noOrders') || 'No product orders yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-6 py-3 font-medium">{t('store.orderNumber') || 'Order #'}</th>
                          <th className="px-6 py-3 font-medium">{t('store.customer') || 'Customer'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('store.items') || 'Items'}</th>
                          <th className="px-6 py-3 font-medium text-right">{t('sales.total') || 'Total'}</th>
                          <th className="px-6 py-3 font-medium">{t('store.fulfilment') || 'Fulfilment'}</th>
                          <th className="px-6 py-3 font-medium">{t('sales.status') || 'Status'}</th>
                          <th className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map((order) => {
                          const cur = asCurrency(order.currency);
                          const itemCount = order._count?.items ?? order.items?.length ?? 0;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {order.orderNumber}
                                <span className="block text-xs font-sans text-gray-400 dark:text-gray-500">
                                  {fmtDate(order.createdAt)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                {order.customerName || order.customerEmail || (
                                  <span className="text-gray-400 dark:text-gray-600">{t('store.guest') || 'Guest'}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-gray-900 dark:text-white">{itemCount}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                {formatPrice(num(order.total), cur)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                {fulfilmentLabel(order.fulfilment)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}>
                                  {orderStatusLabel(order.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  {order.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleSetOrderStatus(order, 'PAID')}
                                      disabled={acting === order.id}
                                      className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {t('store.markPaid') || 'Mark paid'}
                                    </button>
                                  )}
                                  {(order.status === 'PENDING' || order.status === 'PAID') && (
                                    <button
                                      onClick={() => handleSetOrderStatus(order, 'FULFILLED')}
                                      disabled={acting === order.id}
                                      className="px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {t('store.fulfil') || 'Fulfil'}
                                    </button>
                                  )}
                                  {order.status !== 'FULFILLED' && order.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleSetOrderStatus(order, 'CANCELLED')}
                                      disabled={acting === order.id}
                                      aria-label={t('sales.cancel') || 'Cancel'}
                                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                      {acting === order.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <NoSymbolIcon className="h-4 w-4" />}
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
                    {orders.map((order) => {
                      const cur = asCurrency(order.currency);
                      const itemCount = order._count?.items ?? order.items?.length ?? 0;
                      return (
                        <div key={order.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold font-mono text-gray-900 dark:text-white break-words">{order.orderNumber}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(order.createdAt)}</p>
                            </div>
                            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}>
                              {orderStatusLabel(order.status)}
                            </span>
                          </div>
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('store.customer') || 'Customer'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">
                                {order.customerName || order.customerEmail || (
                                  <span className="text-gray-400 dark:text-gray-600">{t('store.guest') || 'Guest'}</span>
                                )}
                              </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('sales.total') || 'Total'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{formatPrice(num(order.total), cur)}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('store.items') || 'Items'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{itemCount}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('store.fulfilment') || 'Fulfilment'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">{fulfilmentLabel(order.fulfilment)}</dd>
                            </div>
                          </dl>
                          {order.status !== 'FULFILLED' && order.status !== 'CANCELLED' && (
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => handleSetOrderStatus(order, 'PAID')}
                                  disabled={acting === order.id}
                                  className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {t('store.markPaid') || 'Mark paid'}
                                </button>
                              )}
                              <button
                                onClick={() => handleSetOrderStatus(order, 'FULFILLED')}
                                disabled={acting === order.id}
                                className="px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {t('store.fulfil') || 'Fulfil'}
                              </button>
                              <button
                                onClick={() => handleSetOrderStatus(order, 'CANCELLED')}
                                disabled={acting === order.id}
                                aria-label={t('sales.cancel') || 'Cancel'}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                {acting === order.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <NoSymbolIcon className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================ MODALS ============================ */}

        {/* Issue gift card */}
        {isGiftCardModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('sales.issueGiftCard') || 'Issue gift card'}
                </h2>
                <button onClick={() => setIsGiftCardModalOpen(false)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleIssueGiftCard} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('sales.amount') || 'Amount'} *</label>
                    <input type="number" step="0.01" min="0" value={giftCardForm.initialAmount}
                      onChange={(e) => setGiftCardForm({ ...giftCardForm, initialAmount: e.target.value })}
                      placeholder="0.00" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('sales.currency') || 'Currency'}</label>
                    <select value={giftCardForm.currency}
                      onChange={(e) => setGiftCardForm({ ...giftCardForm, currency: e.target.value })}
                      className={inputClass}>
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('sales.recipientEmail') || 'Recipient email'}</label>
                  <input type="email" value={giftCardForm.recipientEmail}
                    onChange={(e) => setGiftCardForm({ ...giftCardForm, recipientEmail: e.target.value })}
                    placeholder={t('sales.optional') || 'Optional'} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sales.expires') || 'Expires'}</label>
                  <input type="date" value={giftCardForm.expiresAt}
                    onChange={(e) => setGiftCardForm({ ...giftCardForm, expiresAt: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sales.note') || 'Note'}</label>
                  <textarea value={giftCardForm.note} rows={2}
                    onChange={(e) => setGiftCardForm({ ...giftCardForm, note: e.target.value })}
                    placeholder={t('sales.optional') || 'Optional'} className={`${inputClass} resize-none`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('sales.issueHint') || 'Issuing records the gift card. Payment collection is handled separately.'}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsGiftCardModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('sales.issue') || 'Issue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Package definition modal */}
        {isPackageModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingPackage ? (t('sales.editPackage') || 'Edit package') : (t('sales.addPackage') || 'Add package')}
                </h2>
                <button onClick={() => setIsPackageModalOpen(false)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitPackage} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('sales.name') || 'Name'} *</label>
                  <input type="text" value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    placeholder={t('sales.packageNamePlaceholder') || 'e.g., 10 haircuts'} className={inputClass} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('sales.credits') || 'Credits'} *</label>
                    <input type="number" step="1" min="1" value={packageForm.credits}
                      onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                      className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('sales.validDays') || 'Valid days'}</label>
                    <input type="number" step="1" min="0" value={packageForm.validDays}
                      onChange={(e) => setPackageForm({ ...packageForm, validDays: e.target.value })}
                      className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('sales.price') || 'Price'} *</label>
                    <input type="number" step="0.01" min="0" value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                      placeholder="0.00" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('sales.currency') || 'Currency'}</label>
                    <select value={packageForm.currency}
                      onChange={(e) => setPackageForm({ ...packageForm, currency: e.target.value })}
                      className={inputClass}>
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('sales.description') || 'Description'}</label>
                  <textarea value={packageForm.description} rows={2}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    placeholder={t('sales.optional') || 'Optional'} className={`${inputClass} resize-none`} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsPackageModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingPackage ? (t('common.save') || 'Save') : (t('sales.create') || 'Create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Grant package modal */}
        {grantPackage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sales.grantPackage') || 'Grant package'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{grantPackage.name} · {grantPackage.credits} {t('sales.credits') || 'credits'}</p>
                </div>
                <button onClick={() => setGrantPackage(null)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleGrantPackage} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('sales.customerEmail') || 'Customer email'} *</label>
                  <input type="email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="customer@example.com" className={inputClass} required />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('sales.grantHint') || 'Assigns the package to an existing customer. No payment is collected here.'}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setGrantPackage(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('sales.grant') || 'Grant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Plan definition modal */}
        {isPlanModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingPlan ? (t('sales.editPlan') || 'Edit plan') : (t('sales.addPlan') || 'Add plan')}
                </h2>
                <button onClick={() => setIsPlanModalOpen(false)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitPlan} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('sales.name') || 'Name'} *</label>
                  <input type="text" value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder={t('sales.planNamePlaceholder') || 'e.g., VIP membership'} className={inputClass} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('sales.price') || 'Price'} *</label>
                    <input type="number" step="0.01" min="0" value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      placeholder="0.00" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('sales.currency') || 'Currency'}</label>
                    <select value={planForm.currency}
                      onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                      className={inputClass}>
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('sales.billingPeriod') || 'Billing period'}</label>
                    <select value={planForm.billingPeriod}
                      onChange={(e) => setPlanForm({ ...planForm, billingPeriod: e.target.value as BillingPeriod })}
                      className={inputClass}>
                      {BILLING_PERIODS.map((p) => (
                        <option key={p} value={p}>{billingPeriodLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t('sales.discount') || 'Discount'} (%)</label>
                    <input type="number" step="0.1" min="0" max="100" value={planForm.discountPercent}
                      onChange={(e) => setPlanForm({ ...planForm, discountPercent: e.target.value })}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('sales.benefits') || 'Benefits'}</label>
                  <textarea value={planForm.benefits} rows={2}
                    onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
                    placeholder={t('sales.benefitsPlaceholder') || 'What members get...'} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t('sales.description') || 'Description'}</label>
                  <textarea value={planForm.description} rows={2}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder={t('sales.optional') || 'Optional'} className={`${inputClass} resize-none`} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingPlan ? (t('common.save') || 'Save') : (t('sales.create') || 'Create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Enroll member modal */}
        {enrollPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sales.enrollMember') || 'Enroll member'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{enrollPlan.name} · {billingPeriodLabel(enrollPlan.billingPeriod)}</p>
                </div>
                <button onClick={() => setEnrollPlan(null)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEnroll} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('sales.customerEmail') || 'Customer email'} *</label>
                  <input type="email" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="customer@example.com" className={inputClass} required />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('sales.enrollHint') || 'Enrolls an existing customer. Recurring billing is handled separately.'}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEnrollPlan(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('sales.enroll') || 'Enroll'}
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

export default SpecialistSales;
