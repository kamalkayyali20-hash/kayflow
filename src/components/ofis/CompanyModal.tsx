import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, Mail, MessageSquare, MapPin, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { Company, Contact, Contract, CompanyStatus, PriorityLevel, FollowUpFrequency } from '../../types';
import { Modal } from '../common/Modal';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  companyToEdit?: Company | null;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  companyToEdit,
}) => {
  const { t, isRTL, reportingCurrency } = useApp();

  // Basic Information
  const [name, setName] = useState('');
  const [businessActivity, setBusinessActivity] = useState('');
  const [industry, setIndustry] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<CompanyStatus>('prospect');
  const [accountPriority, setAccountPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState('');

  // Follow-up Info
  const [lastVisitDate, setLastVisitDate] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpFrequency, setFollowUpFrequency] = useState<FollowUpFrequency>('14_days');

  // Contacts embedded list
  interface ContactDraft {
    name: string;
    position: string;
    phone: string;
    whatsapp: string;
    email: string;
    isPrimary: boolean;
    notes: string;
  }
  const [contacts, setContacts] = useState<ContactDraft[]>([
    { name: '', position: '', phone: '', whatsapp: '', email: '', isPrimary: true, notes: '' },
  ]);

  // Optional Contract Info
  const [hasContract, setHasContract] = useState(false);
  const [contractNumber, setContractNumber] = useState('');
  const [contractType, setContractType] = useState<any>('erp_implementation');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractEndDate, setContractEndDate] = useState('');
  const [contractValue, setContractValue] = useState<number>(0);
  const [contractCurrency, setContractCurrency] = useState(reportingCurrency);
  const [servicesModules, setServicesModules] = useState('');
  const [supportAgreement, setSupportAgreement] = useState('');

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name);
      setBusinessActivity(companyToEdit.businessActivity || '');
      setIndustry(companyToEdit.industry || '');
      setArea(companyToEdit.area || '');
      setCity(companyToEdit.city || '');
      setFullAddress(companyToEdit.fullAddress || '');
      setGoogleMapsUrl(companyToEdit.googleMapsUrl || '');
      setWebsite(companyToEdit.website || '');
      setStatus(companyToEdit.status);
      setAccountPriority(companyToEdit.accountPriority);
      setLastVisitDate(companyToEdit.lastVisitDate || '');
      setNextFollowUpDate(companyToEdit.nextFollowUpDate || '');
      setFollowUpFrequency(companyToEdit.followUpFrequency || '14_days');
      setNotes(companyToEdit.notes || '');

      // Load existing contacts
      db.contacts.where('companyId').equals(companyToEdit.id).toArray().then((existing) => {
        if (existing.length > 0) {
          setContacts(
            existing.map((c) => ({
              name: c.name,
              position: c.position || '',
              phone: c.phone || '',
              whatsapp: c.whatsapp || '',
              email: c.email || '',
              isPrimary: !!c.isPrimary,
              notes: c.notes || '',
            }))
          );
        }
      });
    } else {
      setName('');
      setBusinessActivity('');
      setIndustry('');
      setArea('');
      setCity('');
      setFullAddress('');
      setGoogleMapsUrl('');
      setWebsite('');
      setStatus('prospect');
      setAccountPriority('medium');
      setLastVisitDate('');
      setNextFollowUpDate('');
      setFollowUpFrequency('14_days');
      setNotes('');
      setContacts([
        { name: '', position: '', phone: '', whatsapp: '', email: '', isPrimary: true, notes: '' },
      ]);
      setHasContract(false);
    }
  }, [companyToEdit, isOpen, reportingCurrency]);

  const handleAddContactRow = () => {
    setContacts([
      ...contacts,
      { name: '', position: '', phone: '', whatsapp: '', email: '', isPrimary: false, notes: '' },
    ]);
  };

  const handleRemoveContactRow = (index: number) => {
    if (contacts.length <= 1) return;
    setContacts(contacts.filter((_, idx) => idx !== index));
  };

  const handleContactChange = (index: number, field: keyof ContactDraft, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const companyId = companyToEdit?.id || `comp-${Date.now()}`;

    // Auto-calculate next follow up if not entered and frequency chosen
    let calculatedNextFollowUp = nextFollowUpDate;
    if (!calculatedNextFollowUp && followUpFrequency) {
      const days =
        followUpFrequency === '7_days'
          ? 7
          : followUpFrequency === '14_days'
          ? 14
          : followUpFrequency === '30_days'
          ? 30
          : 14;
      const baseDate = lastVisitDate ? new Date(lastVisitDate) : new Date();
      calculatedNextFollowUp = new Date(baseDate.getTime() + days * 86400000)
        .toISOString()
        .split('T')[0];
    }

    const companyData: Company = {
      id: companyId,
      name: name.trim(),
      businessActivity: businessActivity.trim() || undefined,
      industry: industry.trim() || undefined,
      area: area.trim() || undefined,
      city: city.trim() || undefined,
      fullAddress: fullAddress.trim() || undefined,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      website: website.trim() || undefined,
      status,
      accountPriority,
      workspaceId: 'ofis-soft',
      lastVisitDate: lastVisitDate || undefined,
      nextFollowUpDate: calculatedNextFollowUp || undefined,
      followUpFrequency,
      notes: notes.trim() || undefined,
      createdAt: companyToEdit?.createdAt || now,
      updatedAt: now,
    };

    await db.transaction('rw', [db.companies, db.contacts, db.contracts, db.followUps], async () => {
      await db.companies.put(companyData);

      // Save contacts
      if (companyToEdit) {
        await db.contacts.where('companyId').equals(companyId).delete();
      }
      for (const c of contacts) {
        if (c.name.trim()) {
          const newContact: Contact = {
            id: `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            companyId,
            name: c.name.trim(),
            position: c.position.trim() || undefined,
            phone: c.phone.trim() || undefined,
            whatsapp: c.whatsapp.trim() || undefined,
            email: c.email.trim() || undefined,
            isPrimary: c.isPrimary,
            notes: c.notes.trim() || undefined,
            workspaceId: 'ofis-soft',
            createdAt: now,
          };
          await db.contacts.add(newContact);
        }
      }

      // Save contract if checked
      if (hasContract && contractNumber.trim()) {
        const newContract: Contract = {
          id: `ctr-${Date.now()}`,
          companyId,
          contractNumber: contractNumber.trim(),
          type: contractType,
          startDate: contractStartDate,
          endDate: contractEndDate || undefined,
          contractValue: Number(contractValue) || 0,
          currency: contractCurrency,
          servicesModules: servicesModules.trim() || undefined,
          supportAgreement: supportAgreement.trim() || undefined,
          status: 'active',
          workspaceId: 'ofis-soft',
          createdAt: now,
        };
        await db.contracts.add(newContract);
      }

      // Automatically create follow-up reminder if next follow-up date exists
      if (calculatedNextFollowUp) {
        await db.followUps.add({
          id: `fu-${Date.now()}`,
          companyId,
          title: `Follow up with ${name.trim()}`,
          dueDate: calculatedNextFollowUp,
          status: 'pending',
          workspaceId: 'ofis-soft',
          createdAt: now,
        });
      }
    });

    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={companyToEdit ? (isRTL ? 'تعديل بيانات الشركة' : 'Edit Company') : t.addCompany}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Section 1: Basic Information */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
            {isRTL ? '1. البيانات الأساسية' : '1. Basic Information'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'اسم الشركة / العميل *' : 'Company Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Al-Farabi Medical Supplies"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.businessActivity}
              </label>
              <input
                type="text"
                value={businessActivity}
                onChange={(e) => setBusinessActivity(e.target.value)}
                placeholder="e.g. Pharmaceutical Distribution"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.industry}
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Retail"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.city}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Cairo, Alexandria"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.area}
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Nasr City, Maadi"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.status}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="active">{isRTL ? 'عميل نشط (Active)' : 'Active Client'}</option>
                <option value="prospect">{isRTL ? 'عميل محتمل (Prospect)' : 'Prospect'}</option>
                <option value="lead">{isRTL ? 'فرصة جديدة (Lead)' : 'New Lead'}</option>
                <option value="dormant">{isRTL ? 'غير متفاعل (Dormant)' : 'Dormant'}</option>
                <option value="lost">{isRTL ? 'مفقود (Lost)' : 'Lost'}</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.accountPriority}
              </label>
              <select
                value={accountPriority}
                onChange={(e) => setAccountPriority(e.target.value as PriorityLevel)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="high">{isRTL ? 'أولوية قصوى (VIP / High)' : 'VIP / High Priority'}</option>
                <option value="medium">{isRTL ? 'أولوية عادية (Medium)' : 'Medium'}</option>
                <option value="low">{isRTL ? 'أولوية منخفضة (Low)' : 'Low'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.googleMapsLink}
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.website}
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contacts (Multi-contact support) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              {isRTL ? '2. جهات الاتصال والأشخاص المعنيين' : '2. Key Contacts'}
            </h4>
            <button
              type="button"
              onClick={handleAddContactRow}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addAnotherContact}</span>
            </button>
          </div>

          <div className="space-y-3">
            {contacts.map((contact, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    {isRTL ? `جهة اتصال #${idx + 1}` : `Contact #${idx + 1}`}
                  </span>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContactRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                    placeholder={isRTL ? 'الاسم الكامل *' : 'Contact Name *'}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={contact.position}
                    onChange={(e) => handleContactChange(idx, 'position', e.target.value)}
                    placeholder={isRTL ? 'المنصب / الصفة (مثال: المدير المالي)' : 'Position (e.g. IT Manager, CFO)'}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                    placeholder={isRTL ? 'الهاتف' : 'Phone'}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="tel"
                    value={contact.whatsapp}
                    onChange={(e) => handleContactChange(idx, 'whatsapp', e.target.value)}
                    placeholder={isRTL ? 'واتساب' : 'WhatsApp'}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Follow-up & Visits Logic */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
            {isRTL ? '3. المتابعات ومواعيد الزيارات' : '3. Follow-up & Visits Frequency'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.lastVisit}
              </label>
              <input
                type="date"
                value={lastVisitDate}
                onChange={(e) => setLastVisitDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.followUpFrequency}
              </label>
              <select
                value={followUpFrequency}
                onChange={(e) => setFollowUpFrequency(e.target.value as FollowUpFrequency)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="7_days">{isRTL ? 'كل 7 أيام (أسبوعياً)' : 'Every 7 Days'}</option>
                <option value="14_days">{isRTL ? 'كل 14 يوماً (أسبوعين)' : 'Every 14 Days'}</option>
                <option value="30_days">{isRTL ? 'كل 30 يوماً (شهرياً)' : 'Every 30 Days'}</option>
                <option value="custom">{isRTL ? 'مخصص' : 'Custom'}</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.nextFollowUp}
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Optional Initial Contract */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={hasContract}
              onChange={(e) => setHasContract(e.target.checked)}
              className="rounded-sm text-blue-600"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isRTL ? 'إضافة عقد أولي مع الشركة الآن (اختياري)' : 'Add Contract Information (Optional)'}
            </span>
          </label>

          {hasContract && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isRTL ? 'رقم العقد *' : 'Contract Number *'}
                  </label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="e.g. CTR-2026-088"
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.contractValue}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={contractValue || ''}
                    onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.erpModules}
                </label>
                <input
                  type="text"
                  value={servicesModules}
                  onChange={(e) => setServicesModules(e.target.value)}
                  placeholder="e.g. Accounting, Inventory, HR, POS"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-5 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
          >
            {t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
};
