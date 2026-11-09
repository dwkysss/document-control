import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, UserCheck, Mail, Shield } from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { initialEmployees } from '../../data/initialData';

export default function EmployeeMasterView() {
  const { employees, departments, companies, selectedCompanyFilter, currentUser, addEmployee, updateEmployee, deleteEmployee, isAdmin, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form State
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState(() => (
    currentUser?.companyCode && currentUser.companyCode !== 'ALL'
      ? currentUser.companyCode
      : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'DJI')
  ));
  const [department, setDepartment] = useState('HRGA');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState('Aktif');

  const safeEmployees = Array.isArray(employees) && employees.length > 0 ? employees : initialEmployees;
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const filteredEmployees = safeEmployees.filter(e => {
    if (!e) return false;
    const nik = String(e.nik || '').trim().toUpperCase();
    const employeeCompany = String(
      nik.startsWith('UMI') ? 'UMI' : nik.startsWith('IMK') ? 'IMK' : nik === '123463' ? 'ALL' : (e.companyCode || e.company_code || 'DJI')
    ).toUpperCase();
    const selectedCompany = String(selectedCompanyFilter || 'ALL').toUpperCase();
    if (selectedCompany !== 'ALL' && employeeCompany !== selectedCompany && employeeCompany !== 'ALL') return false;
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
    setCompanyCode(currentUser?.companyCode && currentUser.companyCode !== 'ALL' ? currentUser.companyCode : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'DJI'));
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
    setCompanyCode(emp.companyCode || (emp.nik?.startsWith('UMI') ? 'UMI' : emp.nik?.startsWith('IMK') ? 'IMK' : (emp.nik === '123463' ? 'ALL' : 'DJI')));
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

    const matchedCompany = (companies || []).find(c => c.code === companyCode);
    const companyName = matchedCompany?.name || (companyCode === 'ALL' ? 'Holding (Multi-Company)' : companyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : companyCode === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');

    const payload = {
      nik: cleanNik,
      name: cleanName,
      companyCode,
      companyName,
      department,
      position: cleanPosition,
      email: email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@${companyCode === 'UMI' ? 'ultimo-moda.com' : companyCode === 'IMK' ? 'imk-textile.com' : 'dji-indonesia.com'}`,
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
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"><Users className="h-5 w-5" aria-hidden="true" /></div>
          <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Master Data Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar personil otorisasi pembuat, peninjau, dan pengesah dokumen terkendali.
          </p>
          </div>
        </div>
        {isAdmin ? (
          <button
            type="button" onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar karyawan</h3><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{filteredEmployees.length} karyawan ditampilkan</p></div>
          <label className="relative w-full sm:w-96"><span className="sr-only">Cari karyawan berdasarkan nama, NIK, atau departemen</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" /><input type="search" placeholder="Cari nama, NIK, departemen, atau jabatan" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-left border-collapse text-sm">
            <colgroup><col className="w-[21%]" /><col className="w-[8%]" /><col className="w-[9%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[17%]" /><col className="w-[7%]" /><col className="w-[6%]" /></colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="py-3 px-4">Karyawan</th><th className="py-3 px-3">PT</th><th className="py-3 px-3">Dept.</th><th className="py-3 px-3">Jabatan</th><th className="py-3 px-3">Email</th><th className="py-3 px-3">Role akses</th><th className="py-3 px-3">Status</th><th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-600 dark:text-slate-300">{searchTerm ? 'Tidak ada karyawan yang cocok dengan pencarian.' : 'Belum ada karyawan untuk perusahaan ini.'}</td></tr> : filteredEmployees.map((emp, idx) => {
                const empNik = String(emp.nik || '').trim().toUpperCase();
                const empComp = String(empNik.startsWith('UMI') ? 'UMI' : empNik.startsWith('IMK') ? 'IMK' : empNik === '123463' ? 'ALL' : (emp.companyCode || emp.company_code || 'DJI')).toUpperCase();
                return (
                <tr key={emp?.id || emp?.nik || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4"><div className="font-semibold text-slate-900 dark:text-slate-100">{String(emp?.name || '')}</div><div className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">{String(emp?.nik || '')}</div></td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      empComp === 'UMI'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                        : empComp === 'IMK'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : empComp === 'ALL'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {empComp}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{String(emp?.department || '')}</td>
                  <td className="py-4 px-3 text-xs text-slate-700 dark:text-slate-300"><span className="block line-clamp-2" title={emp?.position}>{String(emp?.position || '')}</span></td>
                  <td className="py-4 px-3 font-mono text-xs text-slate-700 dark:text-slate-300"><span className="block break-words" title={emp?.email}>{String(emp?.email || '')}</span></td>
                  <td className="py-4 px-3">
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
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      emp.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2 text-slate-700 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus data ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
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
                );
              })}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIK *</label>
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono text-xs"
                  placeholder="DJI012548"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Perusahaan *</label>
                <select
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  disabled={currentUser?.companyCode && currentUser.companyCode !== 'ALL'}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(companies || []).map((c) => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                  {(!currentUser?.companyCode || currentUser.companyCode === 'ALL') && (
                    <option value="ALL">ALL - Holding</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departemen *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs"
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
