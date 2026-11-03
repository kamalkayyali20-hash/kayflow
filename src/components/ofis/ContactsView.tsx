import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Building2,
  Trash2,
  Search,
  CheckCircle2,
  Edit
} from 'lucide-react';
import { db } from '../../db/db';
import { Contact, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const ContactsView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const loadData = async () => {
    try {
      const [cntList, cmpList] = await Promise.all([
        db.contacts.toArray(),
        db.companies.toArray()
      ]);
      setContacts(cntList);
      setCompanies(cmpList);
      if (cmpList.length > 0 && !companyId) {
        setCompanyId(cmpList[0].id);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف جهة الاتصال هذه؟' : 'Delete this contact?')) {
      try {
        await db.contacts.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete contact:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !name) return;

    try {
      const newContact: Contact = {
        id: crypto.randomUUID(),
        companyId,
        name,
        role: role || undefined,
        phone: phone || undefined,
        email: email || undefined,
        isPrimary,
        createdAt: new Date().toISOString()
      };
      await db.contacts.add(newContact);

      // If marked primary, update company's primary contact info
      if (isPrimary) {
        await db.companies.update(companyId, {
          primaryContactName: name,
          primaryContactRole: role,
          phone: phone || undefined,
          email: email || undefined
        });
      }

      setIsModalOpen(false);
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setIsPrimary(false);
      await loadData();
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  const filtered = contacts.filter(c => {
    const comp = companies.find(cp => cp.id === c.companyId);
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCompanyFilter !== 'all' && c.companyId !== selectedCompanyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'دليل جهات الاتصال' : 'Contacts Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة المسؤولين وأصحاب القرار في الشركات والمؤسسات' : 'Stakeholders, IT managers, and company decision makers'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة جهة اتصال' : 'Add Contact'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-64">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">{isRTL ? 'جميع الشركات' : 'All Companies'}</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث بالاسم، المنصب، الهاتف...' : 'Search contacts...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد جهات اتصال' : 'No Contacts Found'}
          description={isRTL ? 'أضف المسؤولين وجهات الاتصال للشركات المتعاقدة.' : 'Add key contacts and account stakeholders.'}
          icon={Users}
          actionLabel={isRTL ? 'إضافة جهة اتصال' : 'Add Contact'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(contact => {
            const comp = companies.find(c => c.id === contact.companyId);

            return (
              <div
                key={contact.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {contact.name}
                        </h3>
                        {contact.isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                            {isRTL ? 'رئيسي' : 'Primary'}
                          </span>
                        )}
                      </div>
                      {contact.role && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {contact.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {comp && (
                    <div className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{comp.name}</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-1 text-xs">
                    {contact.phone && (
                      <div className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {contact.phone && (
                      <>
                        <a
                          href={`tel:${contact.phone}`}
                          title={isRTL ? 'اتصال' : 'Call'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title={isRTL ? 'واتساب' : 'WhatsApp'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        title={isRTL ? 'إرسال بريد' : 'Email'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(contact.id)}
                    title={isRTL ? 'حذف' : 'Delete'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة جهة اتصال جديدة' : 'Add Contact'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشركة التابع لها *' : 'Company *'}
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'اسم المسؤول *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRTL ? 'مثال: أ / أحمد محمود' : 'e.g. John Doe'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'المسمى الوظيفي / الدور' : 'Role / Title'}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isRTL ? 'مدير تقنية المعلومات، المدير المالي...' : 'IT Director, Finance Manager...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'رقم الهاتف / واتساب' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="primaryContactCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isRTL ? 'تعيين كمسؤول اتصال رئيسي للشركة' : 'Set as primary contact for company'}
                </label>
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
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
