import React, { useState } from 'react';
import { BookmarkCheck, Plus, Edit, Trash2, Layers, Search } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DocumentTypeMasterView() {
  const { documentTypes, addDocumentType, updateDocumentType, deleteDocumentType, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState(2);
  const [description, setDescription] = useState('');

  const filtered = documentTypes.filter(t =>
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setLevel(2);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingType(t);
    setCode(t.code);
    setName(t.name);
    setLevel(t.level || 2);
    setDescription(t.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      showToast('Kode Prefix dan Nama Jenis Dokumen wajib diisi!', 'danger');
      return;
    }

    // Check duplicate code
    const isDuplicate = documentTypes.some(
      t => t.code.toUpperCase() === cleanCode && t.id !== editingType?.id
    );

    if (isDuplicate) {
      showToast(`Kode Jenis Dokumen "${cleanCode}" sudah digunakan!`, 'danger');
      return;
    }

    const payload = {
      code: cleanCode,
      name: cleanName,
      level: parseInt(level, 10),
      description: description.trim(),
      prefix: cleanCode
    };

    if (editingType) {
      updateDocumentType(editingType.id, payload);
    } else {
      addDocumentType(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"><BookmarkCheck className="h-5 w-5" aria-hidden="true" /></div>
          <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Master Jenis Dokumen (ISO Document Hierarchy)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar klasifikasi dokumen mutu (Level 1 Kebijakan, Level 2 SOP, Level 3 IK/WI, Level 4 Formulir, dan Dokumen Eksternal).
          </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Jenis Dokumen
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Jenis dokumen</h3><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{filtered.length} jenis terdaftar</p></div>
          <label className="relative w-full sm:w-80"><span className="sr-only">Cari kode atau nama jenis dokumen</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" /><input type="search" placeholder="Cari kode atau jenis dokumen" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left border-collapse text-sm">
            <colgroup><col className="w-[14%]" /><col className="w-[26%]" /><col className="w-[18%]" /><col className="w-[30%]" /><col className="w-[12%]" /></colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="py-3 px-4">Kode</th><th className="py-3 px-4">Jenis dokumen</th><th className="py-3 px-4">Hierarki</th><th className="py-3 px-4">Deskripsi</th><th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-600 dark:text-slate-300">{searchTerm ? 'Tidak ada jenis dokumen yang cocok.' : 'Belum ada jenis dokumen.'}</td></tr> : filtered.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/70">
                  <td className="py-4 px-4 font-mono text-xs font-bold text-blue-800 dark:text-blue-300">
                    {item.code}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.level === 5
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {item.level === 5 ? 'Dokumen Eksternal' : `Level ${item.level}`}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">{item.description || 'Belum ada deskripsi'}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button" onClick={() => handleOpenEditModal(item)}
                        className="p-2 text-slate-700 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        title="Edit Jenis Dokumen"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button" onClick={() => {
                          if (confirm(`Hapus jenis dokumen ${item.code}?`)) {
                            deleteDocumentType(item.id);
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                        title="Hapus"
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
          title={editingType ? "Edit Jenis Dokumen" : "Tambah Jenis Dokumen"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Prefix *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono uppercase font-bold"
                  placeholder="SOP, IK, MEM"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat Mutu (Level)</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                >
                  <option value={1}>Level 1 (Kebijakan / Policy)</option>
                  <option value={2}>Level 2 (Prosedur / SOP)</option>
                  <option value={3}>Level 3 (Instruksi Kerja / IK / WI)</option>
                  <option value={4}>Level 4 (Formulir & Rekaman Mutu)</option>
                  <option value={5}>Level Eksternal (Dokumen Eksternal / External Document)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Jenis Dokumen *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium"
                placeholder="Contoh: Standar Operasional Prosedur"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Dokumen</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Keterangan peruntukan dokumen ini..."
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
