import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

const EMP_ID_COLOR_VARIANTS = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

const getEmpIdBadgeColor = (empId, index = 0) => {
  if (!empId) return EMP_ID_COLOR_VARIANTS[index % EMP_ID_COLOR_VARIANTS.length];
  let hash = 0;
  for (let i = 0; i < empId.length; i++) {
    hash = empId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % EMP_ID_COLOR_VARIANTS.length;
  return EMP_ID_COLOR_VARIANTS[colorIndex];
};

export default function EmployeeManagement({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPerf, setSelectedPerf] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    name: '',
    password: '',
    role: 'employee',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!employees || employees.length === 0) setLoading(true);
    setError('');
    try {
      const [empRes, rolesRes] = await Promise.all([
        fetchApi('/employees'),
        fetchApi('/roles')
      ]);
      setEmployees(empRes.data);
      setRoles(rolesRes.data);
      if (rolesRes.data.length > 0 && !formData.role) {
        setFormData(prev => ({ ...prev, role: rolesRes.data[0].name }));
      }
    } catch (err) {
      if (!employees || employees.length === 0) setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({
        employeeId: '',
        username: '',
        name: '',
        password: '',
        role: roles[0]?.name || 'employee',
        email: '',
        phone: '',
        department: 'Engineering',
        designation: 'Software Engineer',
        joiningDate: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      alert(`Failed to create employee: ${err.message}`);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await fetchApi(`/employees/${editingEmployee._id}`, {
        method: 'PUT',
        body: JSON.stringify(editingEmployee)
      });
      setEditingEmployee(null);
      loadData();
    } catch (err) {
      alert(`Failed to update employee: ${err.message}`);
    }
  };

  const viewPerformance = async (empId) => {
    try {
      const res = await fetchApi(`/employees/${empId}`);
      setSelectedPerf(res.data);
    } catch (err) {
      alert(`Error loading performance: ${err.message}`);
    }
  };

  const toggleEmployeeStatus = async (emp) => {
    const newStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive';
    if (newStatus === 'Inactive' && !window.confirm(`Deactivate employee ${emp.name}?`)) return;
    try {
      await fetchApi(`/employees/${emp._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert(`Error changing employee status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63] transition-all"
          >
            + Add New Employee
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading employee directory..." />
      ) : (
        <>
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {employees.map((emp, idx) => {
              const isInactive = emp.status === 'Inactive';
              const idBadgeStyle = getEmpIdBadgeColor(emp.employeeId, idx);
              return (
                <div key={emp._id} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm space-y-2 text-xs">
                  {/* Card Header: Employee ID + Status */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-md border ${idBadgeStyle}`}>
                      {emp.employeeId || 'EMP-000'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      !isInactive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {emp.status || 'Active'}
                    </span>
                  </div>

                  {/* Card Body: Profile Info & Department */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#20b875] flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0 shadow-2xs">
                      {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-[11px] font-black text-[#09233d] truncate">{emp.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                          emp.role === 'superior' ? 'bg-purple-100 text-purple-800' :
                          emp.role === 'teamlead' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {emp.role}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-gray-400 font-medium truncate mt-0.5">@{emp.username}</p>

                      <div className="mt-1.5 text-[9.5px] font-semibold text-gray-700 flex flex-col gap-0.5 bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1 text-gray-600 text-[9.5px]">
                          <span className="font-bold text-[#09233d]">Dept:</span> {emp.department}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-[9px]">
                          <span className="font-bold text-gray-600">Designation:</span> {emp.designation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1 w-full text-[9.5px]">
                    <button
                      onClick={() => setViewingEmployee(emp)}
                      className="flex-1 py-1 px-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-bold border border-gray-200 flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 text-[9px]"
                    >
                      <Icon name="eye" className="w-3 h-3 text-gray-500 shrink-0" /> View
                    </button>
                    {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
                      <button
                        onClick={() => setEditingEmployee({ ...emp })}
                        className="flex-1 py-1 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold border border-blue-100 flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 text-[9px]"
                      >
                        <Icon name="edit" className="w-3 h-3 text-blue-600 shrink-0" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => viewPerformance(emp._id)}
                      className="flex-1 py-1 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold border border-indigo-200 flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 text-[9px]"
                    >
                      <Icon name="award" className="w-3 h-3 text-indigo-600 shrink-0" /> Perf
                    </button>
                    {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
                      isInactive ? (
                        <button
                          onClick={() => toggleEmployeeStatus(emp)}
                          className="flex-1 py-1 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 text-[9px] truncate"
                        >
                          <Icon name="check" className="w-3 h-3 text-emerald-600 shrink-0" /> Active
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleEmployeeStatus(emp)}
                          className="flex-1 py-1 px-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold border border-red-200 flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 text-[9px] truncate"
                        >
                          Deactive
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Name & Username</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {employees.map((emp, idx) => {
                    const isInactive = emp.status === 'Inactive';
                    const idBadgeStyle = getEmpIdBadgeColor(emp.employeeId, idx);
                    return (
                      <tr key={emp._id} className="hover:bg-gray-50/60">
                        <td className="p-4 font-bold">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${idBadgeStyle}`}>
                            {emp.employeeId || 'EMP-000'}
                          </span>
                        </td>
                        <td className="p-4">
                          <strong className="block text-[#09233d] font-bold">{emp.name}</strong>
                          <span className="text-[11px] text-gray-400">@{emp.username}</span>
                        </td>
                        <td className="p-4 font-medium text-gray-700">
                          {emp.department} <small className="block text-[10px] text-gray-400">{emp.designation}</small>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            emp.role === 'superior' ? 'bg-purple-100 text-purple-800' :
                            emp.role === 'teamlead' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !isInactive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {emp.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setViewingEmployee(emp)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <span className="inline-flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" /> View</span>
                          </button>
                          {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
                            <button
                              onClick={() => setEditingEmployee({ ...emp })}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <span className="inline-flex items-center gap-1"><Icon name="edit" className="w-3.5 h-3.5" /> Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => viewPerformance(emp._id)}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-200 inline-flex items-center gap-1"
                          >
                            <span className="inline-flex items-center gap-1"><Icon name="award" className="w-3.5 h-3.5" /> Performance</span>
                          </button>
                          {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
                            isInactive ? (
                              <button
                                onClick={() => toggleEmployeeStatus(emp)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200"
                              >
                                <span className="inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" /> Activate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleEmployeeStatus(emp)}
                                className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold"
                              >
                                Deactivate
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Employee Modal (Dynamic Roles Dropdown) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Add New Employee</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>{r.label || r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EMPLOYEE DETAILS MODAL */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-[#09233d]">Employee Profile: {viewingEmployee.name}</h3>
              <button onClick={() => setViewingEmployee(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600" aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Employee ID:</span><strong className="text-[#20b875]">{viewingEmployee.employeeId || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Username:</span><strong className="text-gray-800">@{viewingEmployee.username}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Email:</span><strong className="text-gray-800">{viewingEmployee.email || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Phone:</span><strong className="text-gray-800">{viewingEmployee.phone || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Department:</span><strong className="text-gray-800">{viewingEmployee.department}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Designation:</span><strong className="text-gray-800">{viewingEmployee.designation}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Role:</span><span className="font-bold text-purple-700 uppercase">{viewingEmployee.role}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500 font-medium">Account Status:</span><span className="font-bold text-emerald-700">{viewingEmployee.status || 'Active'}</span></div>
            </div>
            <button onClick={() => setViewingEmployee(null)} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">Close</button>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Edit Employee Profile</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={editingEmployee.department || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingEmployee.designation || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingEmployee.phone || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Profile Modal */}
      {selectedPerf && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-[#09233d]">Performance Profile: {selectedPerf.employee?.name}</h3>
              <button onClick={() => setSelectedPerf(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600" aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-gray-500 font-medium block">Performance Score</span>
                <strong className="text-xl font-black text-emerald-700">{selectedPerf.performance?.performanceScore || 100} / 100</strong>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <span className="text-gray-500 font-medium block">Completion Rate</span>
                <strong className="text-xl font-black text-blue-700">{selectedPerf.performance?.completionRate || 0}%</strong>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <span className="text-gray-500 font-medium block">On-Time Rate</span>
                <strong className="text-xl font-black text-purple-700">{selectedPerf.performance?.onTimeRate || 0}%</strong>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-gray-500 font-medium block">Efficiency</span>
                <strong className="text-xl font-black text-amber-700">{selectedPerf.performance?.efficiencyPercentage || 100}%</strong>
              </div>
            </div>
            <button
              onClick={() => setSelectedPerf(null)}
              className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
