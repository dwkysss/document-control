import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function VerifierTeamMasterView() {
  const { verifierTeams, employees, addVerifierTeam, updateVerifierTeam, deleteVerifierTeam, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [description, setDescription] = useState('');

  const filtered = verifierTeams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingTeam(null);
    setName('');
    setLeader(employees[0]?.name || '');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTeam(t);
    setName(t.name);
    setLeader(t.leader);
    setDescription(t.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanLeader = leader.trim();

    if (!cleanName || !cleanLeader) {
      showToast('Nama Tim dan Ketua Verifikator wajib diisi!', 'danger');
      return;
    }

    // Check duplicate team name
    const isDuplicate = verifierTeams.some(
      t => t.name.toLowerCase() === cleanName.toLowerCase() && t.id !== editingTeam?.id
    );

    if (isDuplicate) {
      showToast(`Nama Tim Verifikator "${cleanName}" sudah ada!`, 'danger');
      return;
    }

    const payload = {
      name: cleanName,
      leader: cleanLeader,
      members: [cleanLeader, 'Hendra Wijaya'],
      description: description.trim()
    };

    if (editingTeam) {
      updateVerifierTeam(editingTeam.id, payload);
    } else {
      addVerifierTeam(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Master Tim Verifikator (Review Board Matrix)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelompok peninjau dan dewan verifikator yang bertugas menguji kelayakan dokumen sebelum disahkan.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Tim Verifikator
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">Nama Tim Verifikator</th>
                <th className="py-3 px-4">Ketua / Lead Verifier</th>
                <th className="py-3 px-4">Cakupan / Deskripsi Verifikasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((team, idx) => (
                <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{team.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400">{team.leader}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{team.description}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(team)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Tim"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus tim verifikator ${team.name}?`)) {
                            deleteVerifierTeam(team.id);
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
          title={editingTeam ? "Edit Tim Verifikator" : "Tambah Tim Verifikator"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Tim Verifikator *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium"
                placeholder="Contoh: Document Control Team"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ketua Tim (Lead Verifier) *</label>
              <select
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Ruang Lingkup Verifikasi</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Tuliskan spesialisasi dokumen yang ditangani tim ini..."
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
