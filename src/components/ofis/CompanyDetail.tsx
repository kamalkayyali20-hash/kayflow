import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  PhoneCall,
  Clock,
  AlertCircle,
  StickyNote,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Globe,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  Company,
  Contact,
  Contract,
  Visit,
  FollowUp,
  SupportIssue,
  Note,
  PriorityLevel,
} from '../../types';
import { formatCurrency } from '../../services/currencyService';
import { Modal } from '../common/Modal';

interface CompanyDetailProps {
  companyId: string;
  onBack: () => void;
  onEditCompany: (company: Company) => void;
}

export const CompanyDetail: React.FC<CompanyDetailProps> = ({
  companyId,
  onBack,
  onEditCompany,
}) => {
  const { t, isRTL, reportingCurrency } = useApp();

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [supportIssues, setSupportIssues] = useState<SupportIssue[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'contracts' | 'visits' | 'followups' | 'issues' | 'notes'
  >('overview');

  // Sub-Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Contact Form
  const [cName, setCName] = useState('');
  const [cPos, setCPos] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cWhatsapp, setCWhatsapp] = useState('');
  const [cEmail, setCEmail] = useState('');

  // Visit Form
  const [vType, setVType] = useState<any>('visit');
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [vPurpose, setVPurpose] = useState('');
  const [vOutcome, setVOutcome] = useState('');

  // FollowUp Form
  const [fuTitle, setFuTitle] = useState('');
  const [fuDate, setFuDate] = useState(new Date().toISOString().split('T')[0]);

  // Support Issue Form
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePriority, setIssuePriority] = useState<PriorityLevel>('medium');

  // Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const loadAll = async () => {
    const comp = await db.companies.get(companyId);
    if (!comp) return;
    setCompany(comp);

    const cList = await db.contacts.where('companyId').equals(companyId).toArray();
    setContacts(cList);

    const ctrList = await db.contracts.where('companyId').equals(companyId).toArray();
    setContracts(ctrList);

    const vList = await db.visits.where('companyId').equals(companyId).toArray();
    vList.sort((a, b) => new Date(b.date || b.visitDate || 0).getTime() - new Date(a.date || a.visitDate || 0).getTime());
    setVisits(vList);

    const fuList = await db.followUps.where('companyId').equals(companyId).toArray();
    fuList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    setFollowUps(fuList);

    const issueList = await db.supportIssues.where('companyId').equals(companyId).toArray();
    setSupportIssues(issueList);

    const nList = await db.notes.filter((n) => n.relatedId === companyId).toArray();
    setNotes(nList);
  };

  useEffect(() => {
    loadAll();
  }, [companyId]);

  if (!company) return null;

  // Contact handler
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    await db.contacts.add({
      id: `cont-${Date.now()}`,
      companyId,
      name: cName.trim(),
      position: cPos.trim() || undefined,
      phone: cPhone.trim() || undefined,
      whatsapp: cWhatsapp.trim() || undefined,
      email: cEmail.trim() || undefined,
      workspaceId: 'ofis-soft',
      createdAt: new Date().toISOString(),
    });

    setIsContactModalOpen(false);
    setCName('');
    setCPos('');
    setCPhone('');
    loadAll();
  };

  // Visit handler (auto-updates last visit on company and recalculates next follow up!)
  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vPurpose.trim()) return;

    const newVisit: Visit = {
      id: `vis-${Date.now()}`,
      companyId,
      date: vDate,
      type: vType,
      purpose: vPurpose.trim(),
      outcome: vOutcome.trim() || undefined,
      completed: true,
      workspaceId: 'ofis-soft',
      createdAt: new Date().toISOString(),
    };

    // Calculate next follow up date based on recurrence
    const days =
      company.followUpFrequency === '7_days'
        ? 7
        : company.followUpFrequency === '14_days'
        ? 14
        : company.followUpFrequency === '30_days'
        ? 30
        : 14;
    const nextDate = new Date(new Date(vDate).getTime() + days * 86400000)
      .toISOString()
      .split('T')[0];

    await db.transaction('rw', [db.visits, db.companies, db.followUps], async () => {
      await db.visits.add(newVisit);
      await db.companies.update(companyId, {
        lastVisitDate: vDate,
        nextFollowUpDate: nextDate,
        updatedAt: new Date().toISOString(),
      });
      await db.followUps.add({
        id: `fu-${Date.now()}`,
        companyId,
        title: `Follow up following visit: ${vPurpose.trim()}`,
        dueDate: nextDate,
        status: 'pending',
        workspaceId: 'ofis-soft',
        createdAt: new Date().toISOString(),
      });
    });

    setIsVisitModalOpen(false);
    setVPurpose('');
    setVOutcome('');
    loadAll();
  };

  // Complete Followup handler
  const handleCompleteFollowUp = async (fu: FollowUp) => {
    const today = new Date().toISOString().split('T')[0];
    await db.followUps.update(fu.id, {
      status: 'completed',
      completedDate: today,
    });
    loadAll();
  };

  // Save Followup handler
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuTitle.trim()) return;

    await db.followUps.add({
      id: `fu-${Date.now()}`,
      companyId,
      title: fuTitle.trim(),
      dueDate: fuDate,
      status: 'pending',
      workspaceId: 'ofis-soft',
      createdAt: new Date().toISOString(),
    });

    setIsFollowUpModalOpen(false);
    setFuTitle('');
    loadAll();
  };

  // Support Issue handler
  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;

    await db.supportIssues.add({
      id: `iss-${Date.now()}`,
      companyId,
      title: issueTitle.trim(),
      description: issueDesc.trim(),
      priority: issuePriority,
      status: 'open',
      reportedDate: new Date().toISOString().split('T')[0],
      workspaceId: 'ofis-soft',
      createdAt: new Date().toISOString(),
    });

    setIsIssueModalOpen(false);
    setIssueTitle('');
    setIssueDesc('');
    loadAll();
  };

  // Note handler
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const now = new Date().toISOString();
    await db.notes.add({
      id: `note-${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      workspaceId: 'ofis-soft',
      relatedType: 'company',
      relatedId: companyId,
      createdAt: now,
      updatedAt: now,
    });

    setIsNoteModalOpen(false);
    setNoteTitle('');
    setNoteContent('');
    loadAll();
  };

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {company.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                {company.status}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  company.accountPriority === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {company.accountPriority.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              {company.industry && <span>{company.industry}</span>}
              {company.city && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{company.city}</span>
                </>
              )}
              {company.area && <span>({company.area})</span>}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {primaryContact?.phone && (
            <a
              href={`tel:${primaryContact.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.callContact}</span>
            </a>
          )}
          {primaryContact?.whatsapp && (
            <a
              href={`https://wa.me/${primaryContact.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.openWhatsApp}</span>
            </a>
          )}
          <button
            onClick={() => setIsVisitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.recordVisit}</span>
          </button>
          <button
            onClick={() => onEditCompany(company)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: t.tabOverview, icon: Building2 },
          { id: 'contacts', label: `${t.tabContacts} (${contacts.length})`, icon: Users },
          { id: 'contracts', label: `${t.tabContracts} (${contracts.length})`, icon: FileText },
          { id: 'visits', label: `${t.tabVisits} (${visits.length})`, icon: PhoneCall },
          { id: 'followups', label: `${t.tabFollowUps} (${followUps.filter((f) => f.status === 'pending').length})`, icon: Clock },
          { id: 'issues', label: `${t.tabSupportIssues} (${supportIssues.filter((i) => i.status !== 'closed').length})`, icon: AlertCircle },
          { id: 'notes', label: `${t.tabNotes} (${notes.length})`, icon: StickyNote },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                {isRTL ? 'معلومات الشركة والموقع' : 'Company & Location Details'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block mb-0.5">{t.businessActivity}</span>
                  <span className="font-medium">{company.businessActivity || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{t.fullAddress}</span>
                  <span className="font-medium">{company.fullAddress || `${company.area || ''}, ${company.city || ''}`}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{t.googleMapsLink}</span>
                  {company.googleMapsUrl ? (
                    <a
                      href={company.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}</span>
                    </a>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{t.website}</span>
                  {company.website ? (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{company.website}</span>
                    </a>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes preview */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                {t.tabNotes}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                {company.notes || (isRTL ? 'لا توجد ملاحظات عامة مسجلة.' : 'No general company notes recorded.')}
              </p>
            </div>
          </div>

          {/* Follow-up & Interaction Schedule Card */}
          <div className="space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                {isRTL ? 'جدول المتابعات والزيارات' : 'Schedule & Frequency'}
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">{t.lastVisit}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {company.lastVisitDate || (isRTL ? 'لم تسجل زيارة بعد' : 'No visit recorded')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900">
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 block font-semibold">
                    {t.nextFollowUp}
                  </span>
                  <span className="font-bold text-sky-700 dark:text-sky-300 text-sm">
                    {company.nextFollowUpDate || (isRTL ? 'غير محدد' : 'Not set')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">{t.followUpFrequency}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {company.followUpFrequency.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.navContacts}
            </h3>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addContact}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {c.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">{c.position || 'Representative'}</span>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold">
                      {isRTL ? 'رئيسي' : 'Primary'}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${c.phone}`} className="hover:text-blue-600 font-mono">
                        {c.phone}
                      </a>
                    </div>
                  )}
                  {c.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <a
                        href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-600 font-mono"
                      >
                        {c.whatsapp}
                      </a>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${c.email}`} className="hover:text-blue-600 truncate">
                        {c.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Contracts */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.navContracts}
            </h3>
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addContract}</span>
            </button>
          </div>

          {contracts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isRTL ? 'لا توجد عقود مسجلة لهذه الشركة بعد.' : 'No contracts registered for this company.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              {contracts.map((ctr) => (
                <div key={ctr.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {ctr.contractNumber} — <span className="capitalize">{ctr.type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {ctr.startDate} {ctr.endDate ? `→ ${ctr.endDate}` : ''}
                      {ctr.servicesModules && ` · Modules: ${ctr.servicesModules}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(ctr.contractValue, ctr.currency)}
                    </span>
                    <span className="text-[10px] block text-emerald-600 uppercase font-semibold">
                      {ctr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Visits & Calls */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.navVisits}
            </h3>
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.recordVisit}</span>
            </button>
          </div>

          {visits.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isRTL ? 'لم تسجل زيارات أو مكالمات بعد.' : 'No visits or calls logged yet.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              {visits.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {v.purpose}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 capitalize text-slate-600">
                        {v.type}
                      </span>
                    </div>
                    {v.outcome && (
                      <p className="text-[11px] text-slate-500">{v.outcome}</p>
                    )}
                  </div>
                  <span className="font-mono text-slate-400 text-xs shrink-0">{v.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Follow-ups */}
      {activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.navFollowUps}
            </h3>
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.createFollowUp}</span>
            </button>
          </div>

          {followUps.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isRTL ? 'لا توجد مواعيد متابعة مجدولة.' : 'No follow-up reminders scheduled.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              {followUps.map((fu) => (
                <div key={fu.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCompleteFollowUp(fu)}
                      disabled={fu.status === 'completed'}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        fu.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {fu.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <span
                        className={`font-semibold text-slate-900 dark:text-slate-100 ${
                          fu.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {fu.title}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-500">{fu.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Support Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.navSupportIssues}
            </h3>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addSupportIssue}</span>
            </button>
          </div>

          {supportIssues.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isRTL ? 'لا توجد مشاكل دعم فني مسجلة.' : 'No support issues recorded.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              {supportIssues.map((iss) => (
                <div key={iss.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {iss.title}
                    </div>
                    <p className="text-[11px] text-slate-400">{iss.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 uppercase">
                      {iss.priority}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 uppercase">
                      {iss.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.tabNotes}
            </h3>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isRTL ? 'إضافة ملاحظة' : 'Add Note'}</span>
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isRTL ? 'لا توجد ملاحظات مسجلة.' : 'No notes recorded.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs"
                >
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{n.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={t.addContact}
      >
        <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الاسم *' : 'Name *'}
            </label>
            <input
              type="text"
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'المنصب' : 'Position'}
            </label>
            <input
              type="text"
              value={cPos}
              onChange={(e) => setCPos(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'الهاتف' : 'Phone'}
              </label>
              <input
                type="tel"
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'واتساب' : 'WhatsApp'}
              </label>
              <input
                type="tel"
                value={cWhatsapp}
                onChange={(e) => setCWhatsapp(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Visit Modal */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title={t.recordVisit}
      >
        <form onSubmit={handleSaveVisit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'نوع التفاعل' : 'Type'}
              </label>
              <select
                value={vType}
                onChange={(e) => setVType(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="visit">{isRTL ? 'زيارة ميدانية' : 'Field Visit'}</option>
                <option value="call">{isRTL ? 'مكالمة هاتفية' : 'Phone Call'}</option>
                <option value="online_meeting">{isRTL ? 'اجتماع أونلاين' : 'Online Meeting'}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                {t.date} *
              </label>
              <input
                type="date"
                required
                value={vDate}
                onChange={(e) => setVDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الغرض من الزيارة / المكالمة *' : 'Purpose *'}
            </label>
            <input
              type="text"
              required
              value={vPurpose}
              onChange={(e) => setVPurpose(e.target.value)}
              placeholder="e.g. Contract Renewal Discussion, Demo ERP Module"
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'النتائج والمخرجات' : 'Outcome & Next Action'}
            </label>
            <textarea
              rows={2}
              value={vOutcome}
              onChange={(e) => setVOutcome(e.target.value)}
              placeholder="e.g. Client requested a customized pricing proposal for inventory module."
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {isRTL
              ? `سيتم تلقائياً تحديث آخر زيارة وجدولة متابعة قادمة بعد ${company.followUpFrequency.replace('_', ' ')}.`
              : `Will automatically update last visit date and schedule next follow-up (${company.followUpFrequency.replace('_', ' ')}).`}
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title={t.createFollowUp}
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'عنوان المتابعة *' : 'Follow-up Title *'}
            </label>
            <input
              type="text"
              required
              value={fuTitle}
              onChange={(e) => setFuTitle(e.target.value)}
              placeholder="e.g. Call CFO to confirm ERP demo date"
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {t.date} *
            </label>
            <input
              type="date"
              required
              value={fuDate}
              onChange={(e) => setFuDate(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Support Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={t.addSupportIssue}
      >
        <form onSubmit={handleSaveIssue} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'عنوان المشكلة *' : 'Issue Summary *'}
            </label>
            <input
              type="text"
              required
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="e.g. Printer driver issue in POS branch 2"
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {t.priority}
            </label>
            <select
              value={issuePriority}
              onChange={(e) => setIssuePriority(e.target.value as PriorityLevel)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="urgent">{isRTL ? 'طارئ / حرج' : 'Urgent'}</option>
              <option value="high">{isRTL ? 'عالي' : 'High'}</option>
              <option value="medium">{isRTL ? 'متوسط' : 'Medium'}</option>
              <option value="low">{isRTL ? 'منخفض' : 'Low'}</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {t.description}
            </label>
            <textarea
              rows={2}
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={isRTL ? 'إضافة ملاحظة' : 'New Note'}
      >
        <form onSubmit={handleSaveNote} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'العنوان *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'المحتوى *' : 'Content *'}
            </label>
            <textarea
              rows={3}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
