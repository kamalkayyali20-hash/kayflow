import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Building2,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { db } from '../../db/db';
import { CalendarEvent, Task, FollowUp, Visit, ProjectSale } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const CalendarView: React.FC = () => {
  const { t, isRTL, activeWorkspaceId } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [sales, setSales] = useState<ProjectSale[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      const [evList, tList, fList, vList, sList] = await Promise.all([
        db.calendarEvents.where('workspaceId').equals(activeWorkspaceId).toArray(),
        db.tasks.where('workspaceId').equals(activeWorkspaceId).toArray(),
        db.followUps.toArray(),
        db.visits.toArray(),
        db.projectSales.toArray()
      ]);
      setEvents(evList);
      setTasks(tList);
      setFollowUps(fList);
      setVisits(vList);
      setSales(sList);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspaceId]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    try {
      const newEv: CalendarEvent = {
        id: crypto.randomUUID(),
        workspaceId: activeWorkspaceId,
        title,
        startDate: eventDate,
        startTime,
        endTime,
        description: description || undefined,
        allDay: false,
        createdAt: new Date().toISOString()
      };
      await db.calendarEvents.add(newEv);

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      console.error('Failed to save calendar event:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm(isRTL ? 'حذف هذا الموعد؟' : 'Delete this event?')) {
      try {
        await db.calendarEvents.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  // Compile combined schedule items for active workspace
  const scheduleItems: Array<{
    id: string;
    type: 'event' | 'task' | 'followup' | 'visit' | 'renewal';
    title: string;
    date: string;
    time?: string;
    details?: string;
    color: string;
  }> = [];

  // Workspace calendar events
  events.forEach(e => {
    scheduleItems.push({
      id: e.id,
      type: 'event',
      title: e.title,
      date: e.startDate,
      time: e.startTime,
      details: e.description,
      color: 'bg-sky-500'
    });
  });

  // Workspace tasks
  tasks.forEach(t => {
    if (t.dueDate) {
      scheduleItems.push({
        id: t.id,
        type: 'task',
        title: `${isRTL ? 'مهمة:' : 'Task:'} ${t.title}`,
        date: t.dueDate,
        details: t.description,
        color: 'bg-blue-500'
      });
    }
  });

  // In OFIS-SOFT, include follow-ups and scheduled visits
  if (activeWorkspaceId === 'ofis-soft') {
    followUps.forEach(f => {
      scheduleItems.push({
        id: f.id,
        type: 'followup',
        title: `${isRTL ? 'متابعة:' : 'Follow-up:'} ${f.title}`,
        date: f.dueDate,
        details: f.description,
        color: 'bg-amber-500'
      });
    });
  }

  // In KAY-SOFT, include subscription renewal dates
  if (activeWorkspaceId === 'kay-soft') {
    sales.forEach(s => {
      if (s.renewalDate) {
        scheduleItems.push({
          id: s.id,
          type: 'renewal',
          title: `${isRTL ? 'تجديد اشتراك برمجي' : 'Subscription Renewal'}`,
          date: s.renewalDate,
          details: `${s.billingFrequency} renewal`,
          color: 'bg-emerald-500'
        });
      }
    });
  }

  // Filter items matching selected date or future
  const itemsForSelectedDate = scheduleItems.filter(i => i.date === selectedDate);
  const upcomingItems = scheduleItems
    .filter(i => i.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'التقويم والمواعيد' : 'Calendar & Schedules'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? 'متابعة جدول المواعيد، الزيارات الميدانية، ومواعيد تجديد الاشتراكات'
              : 'Interactive schedule across appointments, follow-ups, and subscription renewals'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة موعد' : 'Add Event'}</span>
        </button>
      </div>

      {/* Date Picker Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-sky-600" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {isRTL ? 'تاريخ العرض المحدد:' : 'Selected Date:'}
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs sm:text-sm font-mono p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
        >
          {isRTL ? 'اليوم' : 'Today'}
        </button>
      </div>

      {/* Schedule Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Day Agenda */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>{isRTL ? `جدول يوم (${selectedDate})` : `Schedule for (${selectedDate})`}</span>
          </h2>

          {itemsForSelectedDate.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isRTL ? 'لا توجد مواعيد أو التزامات مجدولة في هذا اليوم.' : 'No events scheduled for this day.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {itemsForSelectedDate.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.color}`} />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {item.details && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.details}
                        </p>
                      )}
                      {item.time && (
                        <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                          {item.time}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.type === 'event' && (
                    <button
                      onClick={() => handleDeleteEvent(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-500" />
            <span>{isRTL ? 'المواعيد والاستحقاقات القادمة' : 'Upcoming Schedule'}</span>
          </h2>

          {upcomingItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isRTL ? 'لا توجد مواعيد قادمة.' : 'No upcoming appointments.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {upcomingItems.slice(0, 10).map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDate(item.date)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between gap-3 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة موعد أو فعالية' : 'New Calendar Event'}
            </h2>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'مسمى الموعد *' : 'Event Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'اجتماع مجلس الإدارة، مراجعة المشروع...' : 'Client meeting, project demo...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الوقت' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تفاصيل الموعد' : 'Notes / Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ الموعد' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
