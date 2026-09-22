import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, UserCheck, Mail, Shield } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { initialEmployees } from '../../data/initialData';

export default function EmployeeMasterView() {
  const { employees, departments, addEmployee, updateEmployee, deleteEmployee, isAdmin, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form State
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('HRGA');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState('Aktif');

  const safeEmployees = Array.isArray(employees) && employees.length > 0 ? employees : initialEmployees;
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const filteredEmployees = safeEmployees.filter(e => {
    if (!e) return false;
    const term = String(searchTerm || '').toLowerCase().trim();
    if (!term) return true;
    const nameStr = String(e.name || '').toLowerCase();
    const nikStr = String(e.nik || '').toLowerCase();
    const deptStr = String(e.department || '').toLowerCase();
    const posStr = String(e.position || '').toLowerCase();
    return nameStr.includes(term) || nikStr.includes(term) || deptStr.includes(term) || posStr.includes(term);
  });

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setNik('');
    setName('');
    setDepartment('HRGA');
    setPosition('');
    setEmail('');
    setRole('staff');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setNik(emp.nik);
    setName(emp.name);
    setDepartment(emp.department);
    setPosition(emp.position);
    setEmail(emp.email || '');
    setRole(emp.role || 'staff');
    setStatus(emp.status || 'Aktif');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNik = nik.trim();
    const cleanName = name.trim();
    const cleanPosition = position.trim();

    if (!cleanName || !cleanNik || !cleanPosition) {
      showToast('Harap lengkapi semua kolom wajib (Nama, NIK, Jabatan)!', 'danger');
      return;
    }

    // Check duplicate NIK
    const isDuplicateNik = employees.some(
      emp => emp.nik.toLowerCase() === cleanNik.toLowerCase() && emp.id !== editingEmployee?.id
    );

    if (isDuplicateNik) {
      showToast(`NIK ${cleanNik} sudah terdaftar pada karyawan lain!`, 'danger');
      return;
    }

    const payload = {
      nik: cleanNik,
      name: cleanName,
      department,
      position: cleanPosition,
      email: email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@dji-indonesia.com`,
      role,
      status
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, payload);
    } else {
      addEmployee(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Master Data Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar personil otorisasi pembuat, peninjau, dan pengesah dokumen terkendali.
          </p>
        </div>
        {isAdmin ? (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        ) : (
          <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Mode Pratinjau (Admin Only)
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari karyawan berdasarkan nama / NIK / departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Role Akses</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp?.id || emp?.nik || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{String(emp?.nik || '')}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{String(emp?.name || '')}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{String(emp?.department || '')}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{String(emp?.position || '')}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{String(emp?.email || '')}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      emp.department === 'MGMT' || emp.position?.toUpperCase().includes('GENERAL MANAGER') || emp.position?.toUpperCase().includes('DIREKTUR')
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                        : emp.role === 'admin'
                        ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                        : emp.role === 'approver'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                        : emp.role === 'doc_control'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : emp.role === 'reviewer'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                        : emp.role === 'viewer'
                        ? 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {emp.department === 'MGMT' || emp.position?.toUpperCase().includes('GENERAL MANAGER') || emp.position?.toUpperCase().includes('DIREKTUR')
                        ? 'Top Management / MR'
                        : emp.role === 'admin'
                        ? 'System Admin'
                        : emp.role === 'approver'
                        ? '04. APPROVER (MR)'
                        : emp.role === 'doc_control'
                        ? '03. DOC CONTROL'
                        : emp.role === 'reviewer'
                        ? '02. REVIEWER (Atasan)'
                        : emp.role === 'viewer'
                        ? '00. KARYAWAN (Viewer)'
                        : '01. USER (Staff)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      emp.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isAdmin ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus data ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIK *</label>
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono"
                  placeholder="DJI012548"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departemen *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium"
                >
                  {safeDepartments.map(d => (
                    <option key={d?.id || d?.code} value={d?.code}>{d?.code} - {d?.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Contoh: Baban Rachmat"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jabatan *</label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Contoh: HRGA Staff"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Perusahaan</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono"
                placeholder="nama@dji-indonesia.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Akses & Wewenang</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="viewer">00. KARYAWAN (Viewer - Hanya Baca Dokumen Aktif)</option>
                  <option value="staff">01. USER (Staff Pemohon - Inisiator Dokumen)</option>
                  <option value="reviewer">02. REVIEWER (Atasan / Kepala Departemen)</option>
                  <option value="doc_control">03. DOCUMENT CONTROL (DCO - Pengendali Format & Nomor)</option>
                  <option value="approver">04. APPROVER (Management Representative / MR)</option>
                  <option value="admin">System Administrator (Otoritas Sistem & Pengaturan)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Karyawan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Role Explanation Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Matriks Wewenang Role ({role}):
              </div>
              {role === 'viewer' && 'Hanya memiliki hak akses membaca dan mengunduh dokumen terkendali berstatus AKTIF (Controlled Copy). Tidak dapat membuat draft, revisi, atau mengakses master data.'}
              {role === 'staff' && 'Hanya dapat membuat registrasi baru, menyimpan draf, dan mengajukan revisi untuk departemennya.'}
              {role === 'reviewer' && 'Berwenang memeriksa dan memberikan tinjauan teknis (Review Tahap 1) untuk dokumen departemen terkait.'}
              {role === 'doc_control' && 'Dapat mendaftarkan dokumen dari semua departemen, mengelola penomoran, distribusi salinan resmi, dan akses report.'}
              {role === 'approver' && 'Memiliki wewenang memeriksa, menyetujui (Approve), atau menolak (Reject) berkas pada Menunggu Verifikasi.'}
              {role === 'admin' && 'Akses penuh ke semua modul sistem, kelola master data & pengaturan, serta hak khusus menghapus dan membatalkan dokumen.'}
            </div>

            {/* Guide Tip for Top Management */}
            <div className="p-3 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/30 dark:to-purple-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
              <div className="font-bold text-amber-900 dark:text-amber-200 mb-0.5">
                Panduan Role General Manager / Direksi (Departemen MGMT):
              </div>
              <p className="leading-relaxed text-[10px]">
                Pilih Departemen: <strong>MGMT (Top Management & Direksi)</strong> dan Role: <strong>Approver</strong> (atau <strong>Admin</strong> jika merangkap MR).
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
