import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  AlertCircle,
  Clock,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  MapPin,
  Star,
  FileText
} from 'lucide-react';
import { db } from '../../db/db';
import { Company, CompanyStatus, Visit } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { CompanyModal } from './CompanyModal';
import { CompanyDetail } from './CompanyDetail';
import { EmptyState } from '../common/EmptyState';

export const CompanyList: React.FC = () => {
  const { t, isRTL, reportingCurrency } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'followup' | 'created'>('name');
  
  // Selection / Modals
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined);
  
  // Quick Visit Modal
  const [quickVisitCompany, setQuickVisitCompany] = useState<Company | null>(null);
  const [visitType, setVisitType] = useState<'visit' | 'call' | 'demo' | 'support'>('visit');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitOutcome, setVisitOutcome] = useState('positive');
  const [visitFollowUpDays, setVisitFollowUpDays] = useState(14);
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const list = await db.companies.toArray();
      setCompanies(list);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDeleteCompany = async (company: Company) => {
    const confirmMsg = isRTL
      ? `هل أنت متأكد من حذف شركة "${company.name}"؟ سيتم حذف جميع جهات الاتصال والسجلات المرتبطة بها.`
      : `Are you sure you want to delete "${company.name}"? All related contacts and logs will be deleted.`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await db.companies.delete(company.id);
        // Cascade delete contacts, visits, contracts
        await db.contacts.where('companyId').equals(company.id).delete();
        await db.visits.where('companyId').equals(company.id).delete();
        await db.contracts.where('companyId').equals(company.id).delete();
        await db.followUps.where('companyId').equals(company.id).delete();
        await db.supportIssues.where('companyId').equals(company.id).delete();
        
        await fetchCompanies();
      } catch (err) {
        console.error('Failed to delete company:', err);
      }
    }
  };

  const handleSaveQuickVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVisitCompany) return;

    try {
      setIsSavingVisit(true);
      const now = new Date();
      const visitDateStr = now.toISOString();

      // Next follow-up date calculation
      const nextFollowUpDate = new Date(now.getTime() + visitFollowUpDays * 24 * 60 * 60 * 1000);
      const nextFollowUpStr = nextFollowUpDate.toISOString().split('T')[0];

      // Add visit log
      const newVisit: Visit = {
        id: crypto.randomUUID(),
        companyId: quickVisitCompany.id,
        type: visitType,
        visitDate: visitDateStr,
        purpose: 'Quick Log Interaction',
        summary: visitNotes || 'Quick visit/interaction logged.',
        outcome: visitOutcome,
        nextFollowUpDate: nextFollowUpStr,
        createdAt: visitDateStr
      };
      await db.visits.add(newVisit);

      // Create scheduled follow-up
      await db.followUps.add({
        id: crypto.randomUUID(),
        companyId: quickVisitCompany.id,
        dueDate: nextFollowUpStr,
        title: `${visitType === 'call' ? 'Call' : 'Visit'} follow-up: ${quickVisitCompany.name}`,
        description: visitNotes || 'Scheduled automatic follow-up.',
        status: 'pending',
        priority: 'medium',
        createdAt: visitDateStr
      });

      // Update company's lastVisitDate and nextFollowUpDate
      await db.companies.update(quickVisitCompany.id, {
        lastVisitDate: visitDateStr,
        nextFollowUpDate: nextFollowUpStr,
        updatedAt: visitDateStr
      });

      setQuickVisitCompany(null);
      setVisitNotes('');
      await fetchCompanies();
    } catch (err) {
      console.error('Failed to record quick visit:', err);
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Unique cities for filter
  const uniqueCities = Array.from(new Set(companies.map(c => c.city).filter(Boolean)));

  // Filter & Sort
  const filteredCompanies = companies.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.primaryContactName && c.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCity = cityFilter === 'all' || c.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'followup') {
      if (!a.nextFollowUpDate) return 1;
      if (!b.nextFollowUpDate) return -1;
      return new Date(a.nextFollowUpDate).getTime() - new Date(b.nextFollowUpDate).getTime();
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const getStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{isRTL ? 'نشط' : 'Active'}</span>;
      case 'lead':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">{isRTL ? 'عميل محتمل' : 'Lead'}</span>;
      case 'prospect':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">{isRTL ? 'قيد التفاوض' : 'Prospect'}</span>;
      case 'at_risk':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{isRTL ? 'في خطر' : 'At Risk'}</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{isRTL ? 'غير نشط' : 'Inactive'}</span>;
      default:
        return null;
    }
  };

  const getFollowUpStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-3 h-3" />
          {isRTL ? `متأخر (${Math.abs(diffDays)} يوم)` : `Overdue (${Math.abs(diffDays)}d)`}
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
          <Clock className="w-3 h-3" />
          {isRTL ? 'اليوم' : 'Today'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
        <Calendar className="w-3 h-3 text-slate-400" />
        {isRTL ? `بعد ${diffDays} يوم` : `In ${diffDays}d`}
      </span>
    );
  };

  // If a company profile is selected, render company detail
  if (selectedCompanyId) {
    return (
      <CompanyDetail
        companyId={selectedCompanyId}
        onBack={() => {
          setSelectedCompanyId(null);
          fetchCompanies();
        }}
        onEditCompany={(company: Company) => {
          setEditingCompany(company);
          setIsCompanyModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'إدارة الشركات والعملاء' : 'Companies Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? 'متابعة حسابات الشركات، جهات الاتصال، العقود، والزيارات الدورية في OFIS-SOFT'
              : 'Manage accounts, stakeholders, contracts, and scheduled visits in OFIS-SOFT'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(undefined);
            setIsCompanyModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة شركة جديدة' : 'Add Company'}</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-3 left-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم، الكود، جهة الاتصال، الهاتف...' : 'Search by company, code, contact, phone...'}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Status filter */}
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
              <option value="lead">{isRTL ? 'عميل محتمل' : 'Lead'}</option>
              <option value="prospect">{isRTL ? 'قيد التفاوض' : 'Prospect'}</option>
              <option value="at_risk">{isRTL ? 'في خطر' : 'At Risk'}</option>
              <option value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</option>
            </select>
          </div>

          {/* City filter */}
          {uniqueCities.length > 0 && (
            <div className="w-full md:w-40">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">{isRTL ? 'جميع المدن' : 'All Cities'}</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort */}
          <div className="w-full md:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="name">{isRTL ? 'ترتيب بالاسم' : 'Sort: Name'}</option>
              <option value="followup">{isRTL ? 'ترتيب بالمتابعة' : 'Sort: Next Follow-up'}</option>
              <option value="created">{isRTL ? 'الأحدث أولاً' : 'Sort: Newest'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies count summary */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
        {isRTL
          ? `عرض ${filteredCompanies.length} من إجمالي ${companies.length} شركة`
          : `Showing ${filteredCompanies.length} of ${companies.length} companies`}
      </div>

      {/* Companies Grid / List */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد شركات مسجلة' : 'No Companies Found'}
          description={
            searchTerm || statusFilter !== 'all' || cityFilter !== 'all'
              ? (isRTL ? 'لا توجد نتائج تطابق معايير البحث والفلترة المحددة.' : 'No companies match your search and filter criteria.')
              : (isRTL ? 'ابدأ بإضافة أول شركة أو عميل إلى حسابات OFIS-SOFT الخاصة بك.' : 'Get started by registering your first client company in OFIS-SOFT.')
          }
          icon={Building2}
          actionLabel={isRTL ? 'إضافة شركة الآن' : 'Add First Company'}
          onAction={() => {
            setEditingCompany(undefined);
            setIsCompanyModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 hover:border-sky-300 dark:hover:border-sky-700/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => setSelectedCompanyId(company.id)}
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        {company.name}
                      </h3>
                      {company.code && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {company.code}
                        </span>
                      )}
                    </div>

                    {company.city && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{company.city}{company.address ? `, ${company.address}` : ''}</span>
                      </p>
                    )}
                  </div>

                  {getStatusBadge(company.status)}
                </div>

                {/* Primary Contact */}
                {company.primaryContactName && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {company.primaryContactName}
                      {company.primaryContactRole && (
                        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                          • {company.primaryContactRole}
                        </span>
                      )}
                    </div>
                    {company.phone && (
                      <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {company.phone}
                      </div>
                    )}
                  </div>
                )}

                {/* Next Follow Up & Rating */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">{isRTL ? 'المتابعة القادمة:' : 'Follow-up:'}</span>
                    {company.nextFollowUpDate ? (
                      getFollowUpStatus(company.nextFollowUpDate)
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">{isRTL ? 'غير محدد' : 'Not set'}</span>
                    )}
                  </div>

                  {company.rating && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{company.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  {company.phone && (
                    <>
                      <a
                        href={`tel:${company.phone}`}
                        title={isRTL ? 'اتصال هاتف' : 'Call'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title={isRTL ? 'واتساب' : 'WhatsApp'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      title={isRTL ? 'إرسال بريد' : 'Email'}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}

                  {/* Record quick interaction button */}
                  <button
                    onClick={() => setQuickVisitCompany(company)}
                    title={isRTL ? 'تسجيل زيارة أو مكالمة' : 'Log Visit / Call'}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCompany(company);
                      setIsCompanyModalOpen(true);
                    }}
                    title={isRTL ? 'تعديل' : 'Edit'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company)}
                    title={isRTL ? 'حذف' : 'Delete'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCompanyId(company.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isRTL ? 'الملف' : 'Profile'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Add/Edit Modal */}
      {isCompanyModalOpen && (
        <CompanyModal
          isOpen={isCompanyModalOpen}
          onClose={() => {
            setIsCompanyModalOpen(false);
            setEditingCompany(undefined);
          }}
          onSaved={() => {
            setIsCompanyModalOpen(false);
            setEditingCompany(undefined);
            fetchCompanies();
          }}
          companyToEdit={editingCompany}
        />
      )}

      {/* Quick Interaction Modal */}
      {quickVisitCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {isRTL ? 'تسجيل تفاعل سريع' : 'Log Quick Interaction'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {quickVisitCompany.name}
                </p>
              </div>
              <button
                onClick={() => setQuickVisitCompany(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickVisit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRTL ? 'نوع التفاعل' : 'Interaction Type'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['visit', 'call', 'demo', 'support'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVisitType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-colors ${
                        visitType === type
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type === 'visit' && (isRTL ? 'زيارة' : 'Visit')}
                      {type === 'call' && (isRTL ? 'اتصال' : 'Call')}
                      {type === 'demo' && (isRTL ? 'عرض' : 'Demo')}
                      {type === 'support' && (isRTL ? 'دعم' : 'Support')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRTL ? 'ملاحظات وسير المحادثة' : 'Notes / Interaction Summary'}
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder={isRTL ? 'اكتب ما تم الاتفاق عليه أو ملخص المقابلة...' : 'What was discussed, agreed upon, or next requirements...'}
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRTL ? 'النتيجة' : 'Outcome'}
                  </label>
                  <select
                    value={visitOutcome}
                    onChange={(e) => setVisitOutcome(e.target.value)}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="positive">{isRTL ? 'إيجابي ومثمر' : 'Positive / Productive'}</option>
                    <option value="needs_follow_up">{isRTL ? 'يحتاج متابعة' : 'Needs Follow-up'}</option>
                    <option value="deal_closed">{isRTL ? 'إتمام تعاقد' : 'Deal Closed'}</option>
                    <option value="support_resolved">{isRTL ? 'حل مشكلة الدعم' : 'Issue Resolved'}</option>
                    <option value="neutral">{isRTL ? 'محايد / لا قرار' : 'Neutral / No Decision'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRTL ? 'المتابعة القادمة بعد' : 'Next Follow-up In'}
                  </label>
                  <select
                    value={visitFollowUpDays}
                    onChange={(e) => setVisitFollowUpDays(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={3}>{isRTL ? '3 أيام' : '3 Days'}</option>
                    <option value={7}>{isRTL ? 'أسبوع (7 أيام)' : '1 Week (7 Days)'}</option>
                    <option value={14}>{isRTL ? 'أسبوعين (14 يوم)' : '2 Weeks (14 Days)'}</option>
                    <option value={30}>{isRTL ? 'شهر (30 يوم)' : '1 Month (30 Days)'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickVisitCompany(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingVisit ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ المتابعة' : 'Save & Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
