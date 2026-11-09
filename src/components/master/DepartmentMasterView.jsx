import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Search, User } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DepartmentMasterView() {
  const { departments, employees, addDepartment, updateDepartment, deleteDepartment, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [head, setHead] = useState('');

  const filtered = departments.filter(d =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.head && d.head.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setHead('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setHead(dept.head || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      showToast('Kode dan Nama Departemen wajib diisi!', 'danger');
      return;
    }

    if (cleanCode.length < 2) {
      showToast('Kode Departemen minimal 2 karakter!', 'danger');
      return;
    }

    // Check duplicate code
    const isDuplicate = departments.some(
      d => d.code.toUpperCase() === cleanCode && d.id !== editingDept?.id
    );

    if (isDuplicate) {
      showToast(`Kode departemen "${cleanCode}" sudah digunakan!`, 'danger');
      return;
    }

    const payload = {
      code: cleanCode,
      name: cleanName,
      head: head.trim()
    };

    if (editingDept) {
      updateDepartment(editingDept.id, payload);
    } else {
      addDepartment(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"><Building2 className="h-5 w-5" aria-hidden="true" /></div>
          <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Master Data Departemen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar departemen & divisi operasional yang menjadi segmen penomoran kode dokumen.
          </p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Departemen
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar departemen</h3><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{filtered.length} departemen</p></div>
          <label className="relative w-full sm:w-80"><span className="sr-only">Cari kode, departemen, atau kepala departemen</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" /><input type="search" placeholder="Cari kode, nama, atau kepala" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="py-3 px-4">Kode</th><th className="py-3 px-4">Departemen</th><th className="py-3 px-4">Kepala departemen</th><th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-600 dark:text-slate-300">{searchTerm ? 'Tidak ada departemen yang cocok dengan pencarian.' : 'Belum ada departemen.'}</td></tr> : filtered.map((dept) => (
                <tr key={dept.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/70">
                  <td className="py-4 px-4 font-mono text-xs font-bold text-blue-800 dark:text-blue-300">
                    {dept.code}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900 dark:text-slate-100">{dept.name}</td>
                  <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">{dept.head || 'Belum ditetapkan'}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button" onClick={() => handleOpenEditModal(dept)}
                        className="p-2 text-slate-700 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        title="Edit Departemen"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button" onClick={() => {
                          if (confirm(`Hapus departemen ${dept.code}?`)) {
                            deleteDepartment(dept.id);
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                        title="Hapus Departemen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? "Edit Departemen" : "Tambah Departemen Baru"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Departemen (Singkatan) *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono uppercase font-bold"
                placeholder="Contoh: HRGA, FAT, IT"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Departemen *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium"
                placeholder="Contoh: Human Resource & General Affairs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kepala Departemen / Manager (Referensi Master Karyawan)
              </label>
              <select
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white"
              >
                <option value="------------">-- Belum Ditentukan (------------) --</option>
                {(employees || [])
                  .filter(e => e.status !== 'Nonaktif')
                  .map(emp => (
                    <option key={emp.id || emp.nik} value={emp.name}>
                      {emp.name} — {emp.position} ({emp.department})
                    </option>
                  ))}
                {head && head !== '------------' && !(employees || []).some(e => e.name === head) && (
                  <option value={head}>{head}</option>
                )}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Nama kepala departemen otomatis terhubung langsung dengan profil Master Data Karyawan.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
