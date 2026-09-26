import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [roles, setRoles] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setRoles(data.data);
        if (!role) setRole(data.data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, role })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`User "${name}" created successfully!`);
        setName('');
        setUsername('');
        setPassword('');
        setRole('employee');
        fetchUsers();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Unable to reach backend API');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[#09233d]">User Creation & Management</h2>

      {/* User Creation Form */}
      <div className="bg-white p-6 rounded border border-gray-300 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-[#09233d]">Create New User</h3>

        {message && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-semibold rounded">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-semibold rounded">{error}</div>}

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.name} value={r.name}>{r.label || r.name}</option>
                ))
              ) : (
                <option value="employee">Employee</option>
              )}
            </select>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="bg-[#20b875] text-white font-bold px-5 py-2 rounded text-sm hover:bg-[#159e63]"
            >
              Create User
            </button>
          </div>
        </form>
      </div>

      {/* Users List Table */}
      <div className="bg-white p-6 rounded border border-gray-300 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-[#09233d]">Registered Users ({users.length})</h3>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users found. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-3 font-bold">Name</th>
                  <th className="p-3 font-bold">Username</th>
                  <th className="p-3 font-bold">Role</th>
                  <th className="p-3 font-bold">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 font-semibold">{u.name}</td>
                    <td className="p-3 text-gray-600">{u.username}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
