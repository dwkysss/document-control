import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Search, User } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DepartmentMasterView() {
  const { departments, addDepartment, updateDepartment, deleteDepartment, showToast } = useDocumentControl();
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Master Data Departemen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar departemen & divisi operasional yang menjadi segmen penomoran kode dokumen.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Departemen
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">Kode Departemen</th>
                <th className="py-3 px-4">Nama Departemen</th>
                <th className="py-3 px-4">Kepala Departemen (Head of Dept)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((dept, idx) => (
                <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {dept.code}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{dept.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{dept.head || '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Departemen"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus departemen ${dept.code}?`)) {
                            deleteDepartment(dept.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kepala Departemen / Manager</label>
              <input
                type="text"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Contoh: Siti Nurhaliza"
              />
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
