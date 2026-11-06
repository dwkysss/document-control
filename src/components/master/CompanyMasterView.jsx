import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Search, FileText, CheckCircle2, Shield } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function CompanyMasterView() {
  const { companies, documents, addCompany, updateCompany, deleteCompany, isAdmin, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');

  const filtered = (companies || []).filter(c =>
    (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tagline || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setCode('');
    setName('');
    setTagline('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp) => {
    setEditingCompany(comp);
    setCode(comp.code || '');
    setName(comp.name || '');
    setTagline(comp.tagline || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      showToast('Kode dan Nama Perusahaan wajib diisi!', 'danger');
      return;
    }

    if (cleanCode.length < 2) {
      showToast('Kode Perusahaan minimal 2 karakter!', 'danger');
      return;
    }

    // Check duplicate code
    const isDuplicate = companies.some(
      c => c.code.toUpperCase() === cleanCode && c.id !== editingCompany?.id
    );

    if (isDuplicate) {
      showToast(`Kode perusahaan "${cleanCode}" sudah digunakan!`, 'danger');
      return;
    }

    if (editingCompany) {
      updateCompany(editingCompany.id, {
        code: cleanCode,
        name: cleanName,
        tagline: tagline.trim()
      });
    } else {
      addCompany({
        code: cleanCode,
        name: cleanName,
        tagline: tagline.trim(),
        color: cleanCode === 'DJI' ? 'blue' : cleanCode === 'UMI' ? 'indigo' : 'emerald'
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (comp) => {
    const docCount = (documents || []).filter(
      d => (d.companyCode || d.docNumber?.split('-')[0]) === comp.code
    ).length;

    if (docCount > 0) {
      showToast(`Tidak dapat menghapus! Terdapat ${docCount} dokumen yang terdaftar di bawah perusahaan ${comp.code}.`, 'danger');
      return;
    }

    if (confirm(`Yakin ingin menghapus perusahaan ${comp.name} (${comp.code})?`)) {
      deleteCompany(comp.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Master Data Perusahaan (Multi-Company)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar 3 entitas bisnis dalam naungan grup yang memiliki sistem pengendalian dokumen ISO 9001:2015.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari perusahaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Perusahaan
            </button>
          )}
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((comp) => {
          const docCount = (documents || []).filter(
            d => (d.companyCode || d.docNumber?.split('-')[0]) === comp.code
          ).length;

          const activeCount = (documents || []).filter(
            d => (d.companyCode || d.docNumber?.split('-')[0]) === comp.code && d.status === 'AKTIF'
          ).length;

          return (
            <div
              key={comp.id}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden transition hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-sm ${
                    comp.code === 'DJI'
                      ? 'bg-blue-600'
                      : comp.code === 'UMI'
                      ? 'bg-indigo-600'
                      : 'bg-emerald-600'
                  }`}>
                    {comp.code}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(comp)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Perusahaan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(comp)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Hapus Perusahaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                      PREFIX: {comp.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Entitas Aktif
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                    {comp.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {comp.tagline || 'Unit usaha operasional di bawah holding.'}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {docCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Dokumen
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {activeCount}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    Dokumen Aktif
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? `Edit Perusahaan: ${editingCompany.name}` : 'Tambah Perusahaan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kode Singkatan Perusahaan (Prefix) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: DJI, UMI, IMK"
              className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 uppercase font-mono font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Kode ini akan digunakan sebagai awalan otomatis penomoran dokumen (misal: {code || 'CODE'}-SOP-HRGA-01-00).
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Perusahaan *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PT Ultimo Moda Indotex"
              className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tagline / Deskripsi Perusahaan
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Contoh: Excellence in Textile & Garment Manufacturing"
              className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-bold"
            >
              {editingCompany ? 'Simpan Perubahan' : 'Tambah Perusahaan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
