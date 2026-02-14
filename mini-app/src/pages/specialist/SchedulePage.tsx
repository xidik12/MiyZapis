import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Edit,
  Plus,
  Trash2,
  CalendarOff,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sheet } from '@/components/ui/Sheet';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { scheduleStrings, commonStrings } from '@/utils/translations';

interface BreakTime {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  id?: string;
  dayOfWeek: number;
  dayKey: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breaks: BreakTime[];
}

interface TimeBlock {
  id?: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const generateBreakId = () => `break-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getDefaultSchedule = (): DaySchedule[] =>
  DAY_KEYS.map((key, index) => ({
    dayOfWeek: index,
    dayKey: key,
    isWorking: index < 5, // Mon-Fri working by default
    startTime: '09:00',
    endTime: '18:00',
    breaks: [],
  }));

export const SchedulePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [schedule, setSchedule] = useState<DaySchedule[]>(getDefaultSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Day edit sheet
  const [showDaySheet, setShowDaySheet] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);

  // Block time sheet
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [timeBlock, setTimeBlock] = useState<TimeBlock>({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [blockSaving, setBlockSaving] = useState(false);

  const sc = useCallback((key: string) => t(scheduleStrings, key, locale), [locale]);
  const c = useCallback((key: string) => t(commonStrings, key, locale), [locale]);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getAvailabilityBlocks() as any;

      if (data && Array.isArray(data) && data.length > 0) {
        const newSchedule = getDefaultSchedule();
        data.forEach((block: any) => {
          const dayIndex = block.dayOfWeek;
          if (dayIndex >= 0 && dayIndex < 7) {
            newSchedule[dayIndex] = {
              ...newSchedule[dayIndex],
              id: block.id,
              isWorking: true,
              startTime: block.startTime || '09:00',
              endTime: block.endTime || '18:00',
              breaks: block.breaks || [],
            };
          }
        });
        setSchedule(newSchedule);
      }
    } catch {
      // Use default schedule if fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleEditDay = (index: number) => {
    hapticFeedback.impactLight();
    setEditingDayIndex(index);
    setEditingDay({ ...schedule[index], breaks: [...schedule[index].breaks] });
    setShowDaySheet(true);
  };

  const handleToggleWorking = () => {
    if (!editingDay) return;
    hapticFeedback.impactLight();
    setEditingDay({ ...editingDay, isWorking: !editingDay.isWorking });
  };

  const handleAddBreak = () => {
    if (!editingDay) return;
    hapticFeedback.impactLight();
    const newBreak: BreakTime = {
      id: generateBreakId(),
      startTime: '12:00',
      endTime: '13:00',
    };
    setEditingDay({
      ...editingDay,
      breaks: [...editingDay.breaks, newBreak],
    });
  };

  const handleRemoveBreak = (breakId: string) => {
    if (!editingDay) return;
    hapticFeedback.impactLight();
    setEditingDay({
      ...editingDay,
      breaks: editingDay.breaks.filter(b => b.id !== breakId),
    });
  };

  const handleUpdateBreak = (breakId: string, field: 'startTime' | 'endTime', value: string) => {
    if (!editingDay) return;
    setEditingDay({
      ...editingDay,
      breaks: editingDay.breaks.map(b =>
        b.id === breakId ? { ...b, [field]: value } : b
      ),
    });
  };

  const handleSaveDay = async () => {
    if (editingDayIndex === null || !editingDay) return;

    setSaving(true);
    try {
      if (editingDay.isWorking) {
        const payload = {
          dayOfWeek: editingDay.dayOfWeek,
          startTime: editingDay.startTime,
          endTime: editingDay.endTime,
          isRecurring: true,
        };

        if (editingDay.id) {
          await apiService.updateAvailabilityBlock(editingDay.id, payload);
        } else {
          await apiService.createAvailabilityBlock(payload);
        }
      } else if (editingDay.id) {
        await apiService.deleteAvailabilityBlock(editingDay.id);
      }

      // Update local state
      const newSchedule = [...schedule];
      newSchedule[editingDayIndex] = editingDay;
      setSchedule(newSchedule);

      dispatch(addToast({
        type: 'success',
        title: c('success'),
        message: sc('saved'),
      }));
      hapticFeedback.notificationSuccess();
      setShowDaySheet(false);
      setEditingDayIndex(null);
      setEditingDay(null);
    } catch {
      dispatch(addToast({
        type: 'error',
        title: c('error'),
        message: sc('saveFailed'),
      }));
      hapticFeedback.notificationError();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlockTime = async () => {
    if (!timeBlock.startDate || !timeBlock.endDate) {
      dispatch(addToast({
        type: 'warning',
        title: c('error'),
        message: sc('saveFailed'),
      }));
      return;
    }

    setBlockSaving(true);
    try {
      await apiService.generateAvailability({
        startDate: timeBlock.startDate,
        endDate: timeBlock.endDate,
      });

      dispatch(addToast({
        type: 'success',
        title: c('success'),
        message: sc('saved'),
      }));
      hapticFeedback.notificationSuccess();
      setShowBlockSheet(false);
      setTimeBlock({ startDate: '', endDate: '', reason: '' });
    } catch {
      dispatch(addToast({
        type: 'error',
        title: c('error'),
        message: sc('saveFailed'),
      }));
      hapticFeedback.notificationError();
    } finally {
      setBlockSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={sc('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={sc('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4 page-stagger">
          {/* Weekly Schedule Header */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-accent-primary" />
              {sc('weeklySchedule')}
            </h3>
            <p className="text-sm text-text-secondary">
              {locale === 'uk'
                ? 'Налаштуйте робочий час для кожного дня'
                : locale === 'ru'
                ? 'Настройте рабочее время для каждого дня'
                : 'Configure your working hours for each day'}
            </p>
          </Card>

          {/* Day Rows */}
          <div className="space-y-2">
            {schedule.map((day, index) => (
              <Card
                key={day.dayKey}
                className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        day.isWorking
                          ? 'bg-accent-primary/10'
                          : 'bg-bg-secondary'
                      }`}
                    >
                      {day.isWorking ? (
                        <Clock size={18} className="text-accent-primary" />
                      ) : (
                        <CalendarOff size={18} className="text-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-text-primary">
                        {sc(day.dayKey)}
                      </h4>
                      {day.isWorking ? (
                        <div className="flex items-center gap-1 text-sm text-text-secondary">
                          <span>{day.startTime}</span>
                          <span>-</span>
                          <span>{day.endTime}</span>
                          {day.breaks.length > 0 && (
                            <span className="text-text-muted ml-1">
                              ({day.breaks.length} {sc('breakTime').toLowerCase()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted">{sc('dayOff')}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditDay(index)}
                    className="p-2.5 rounded-xl hover:bg-bg-hover transition-colors"
                  >
                    <Edit size={16} className="text-accent-primary" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Block Time Card */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center flex-shrink-0">
                <CalendarOff size={18} className="text-accent-red" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary">{sc('blockTime')}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{sc('blockTimeDesc')}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                hapticFeedback.impactLight();
                setShowBlockSheet(true);
              }}
            >
              <Plus size={16} className="mr-1.5" />
              {sc('blockTime')}
            </Button>
          </Card>
        </div>
      </div>

      {/* Day Edit Sheet */}
      <Sheet
        isOpen={showDaySheet}
        onClose={() => {
          setShowDaySheet(false);
          setEditingDayIndex(null);
          setEditingDay(null);
        }}
        title={editingDay ? `${sc('editDay')} - ${sc(editingDay.dayKey)}` : sc('editDay')}
      >
        {editingDay && (
          <div className="space-y-5">
            {/* Working toggle */}
            <div className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl">
              <span className="font-medium text-text-primary">
                {editingDay.isWorking ? sc('working') : sc('notWorking')}
              </span>
              <button onClick={handleToggleWorking} className="p-1">
                {editingDay.isWorking ? (
                  <ToggleRight size={28} className="text-accent-green" />
                ) : (
                  <ToggleLeft size={28} className="text-text-muted" />
                )}
              </button>
            </div>

            {editingDay.isWorking && (
              <>
                {/* Time pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      {sc('startTime')}
                    </label>
                    <input
                      type="time"
                      value={editingDay.startTime}
                      onChange={(e) =>
                        setEditingDay({ ...editingDay, startTime: e.target.value })
                      }
                      className="input-telegram w-full rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      {sc('endTime')}
                    </label>
                    <input
                      type="time"
                      value={editingDay.endTime}
                      onChange={(e) =>
                        setEditingDay({ ...editingDay, endTime: e.target.value })
                      }
                      className="input-telegram w-full rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Breaks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-text-primary text-sm">
                      {sc('breakTime')}
                    </h4>
                    <button
                      onClick={handleAddBreak}
                      className="flex items-center gap-1 text-sm text-accent-primary font-medium"
                    >
                      <Plus size={14} />
                      {sc('addBreak')}
                    </button>
                  </div>

                  {editingDay.breaks.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-3">
                      {locale === 'uk'
                        ? 'Немає перерв'
                        : locale === 'ru'
                        ? 'Нет перерывов'
                        : 'No breaks added'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editingDay.breaks.map((brk) => (
                        <div
                          key={brk.id}
                          className="flex items-center gap-2 p-3 bg-bg-secondary/50 rounded-xl"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={brk.startTime}
                              onChange={(e) =>
                                handleUpdateBreak(brk.id, 'startTime', e.target.value)
                              }
                              className="input-telegram w-full rounded-lg text-xs"
                            />
                            <input
                              type="time"
                              value={brk.endTime}
                              onChange={(e) =>
                                handleUpdateBreak(brk.id, 'endTime', e.target.value)
                              }
                              className="input-telegram w-full rounded-lg text-xs"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveBreak(brk.id)}
                            className="p-1.5 rounded-lg hover:bg-bg-hover"
                          >
                            <Trash2 size={14} className="text-accent-red" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDaySheet(false);
                  setEditingDayIndex(null);
                  setEditingDay(null);
                }}
                className="flex-1"
              >
                {c('cancel')}
              </Button>
              <Button
                onClick={handleSaveDay}
                className="flex-1"
                disabled={saving}
                loading={saving}
              >
                {c('save')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Block Time Sheet */}
      <Sheet
        isOpen={showBlockSheet}
        onClose={() => {
          setShowBlockSheet(false);
          setTimeBlock({ startDate: '', endDate: '', reason: '' });
        }}
        title={sc('timeBlockTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {sc('from')}
            </label>
            <input
              type="date"
              value={timeBlock.startDate}
              onChange={(e) =>
                setTimeBlock({ ...timeBlock, startDate: e.target.value })
              }
              className="input-telegram w-full rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {sc('to')}
            </label>
            <input
              type="date"
              value={timeBlock.endDate}
              onChange={(e) =>
                setTimeBlock({ ...timeBlock, endDate: e.target.value })
              }
              className="input-telegram w-full rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {sc('reason')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['vacation', 'personal', 'other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    hapticFeedback.impactLight();
                    setTimeBlock({ ...timeBlock, reason: sc(reason) });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    timeBlock.reason === sc(reason)
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {sc(reason)}
                </button>
              ))}
            </div>
            <textarea
              value={timeBlock.reason}
              onChange={(e) =>
                setTimeBlock({ ...timeBlock, reason: e.target.value })
              }
              rows={2}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder={
                locale === 'uk'
                  ? 'Введіть причину...'
                  : locale === 'ru'
                  ? 'Введите причину...'
                  : 'Enter reason...'
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBlockSheet(false);
                setTimeBlock({ startDate: '', endDate: '', reason: '' });
              }}
              className="flex-1"
            >
              {c('cancel')}
            </Button>
            <Button
              onClick={handleSaveBlockTime}
              className="flex-1"
              disabled={blockSaving || !timeBlock.startDate || !timeBlock.endDate}
              loading={blockSaving}
            >
              {c('save')}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
