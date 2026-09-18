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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
            Master Jenis Dokumen (ISO Document Hierarchy)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar klasifikasi dokumen mutu (Level 1 Kebijakan, Level 2 SOP, Level 3 IK/WI, Level 4 Formulir, dan Dokumen Eksternal).
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Jenis Dokumen
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">Kode Singkatan</th>
                <th className="py-3 px-4">Nama Jenis Dokumen</th>
                <th className="py-3 px-4 text-center">Hierarki Mutu (Level)</th>
                <th className="py-3 px-4">Deskripsi / Peruntukan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                    {item.code}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.level === 5
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {item.level === 5 ? 'Dokumen Eksternal' : `Level ${item.level}`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{item.description}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Jenis Dokumen"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus jenis dokumen ${item.code}?`)) {
                            deleteDocumentType(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
