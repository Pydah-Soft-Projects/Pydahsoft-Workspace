import { useEffect, useMemo, useState } from 'react';
import { fetchApi } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

const PAGE_SIZE = 7;

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  };
};

const getActionStyle = (action = '') => {
  const normalizedAction = action.toLowerCase();
  if (normalizedAction.includes('delete') || normalizedAction.includes('remove')) return 'bg-rose-50 text-rose-700';
  if (normalizedAction.includes('approve') || normalizedAction.includes('create')) return 'bg-emerald-50 text-emerald-700';
  if (normalizedAction.includes('submit') || normalizedAction.includes('update')) return 'bg-blue-50 text-blue-700';
  return 'bg-gray-100 text-gray-700';
};

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!logs || logs.length === 0) setLoading(true);
      setError('');
      try {
        const res = await fetchApi('/audit-logs');
        setLogs(res.data);
      } catch (err) {
        if (!logs || logs.length === 0) setError(err.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const actions = useMemo(() => [...new Set(logs.map((log) => log.action).filter(Boolean))].sort(), [logs]);
  const entities = useMemo(() => [...new Set(logs.map((log) => log.entityType).filter(Boolean))].sort(), [logs]);
  const users = useMemo(() => {
    const userMap = new Map();
    logs.forEach((log) => {
      const userId = log.performedBy?._id || log.performedBy?.username;
      if (userId) userMap.set(userId, log.performedBy);
    });
    return [...userMap.values()].sort((firstUser, secondUser) => (firstUser.name || '').localeCompare(secondUser.name || ''));
  }, [logs]);
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const searchableText = [log.action, log.entityType, log.entityId, log.performedBy?.name, log.performedBy?.username].filter(Boolean).join(' ').toLowerCase();
      const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
      return (!query || searchableText.includes(query)) && (!userFilter || (log.performedBy?._id || log.performedBy?.username) === userFilter) && (!actionFilter || log.action === actionFilter) && (!entityFilter || log.entityType === entityFilter) && (!dateFilter || logDate === dateFilter);
    });
  }, [actionFilter, dateFilter, entityFilter, logs, search, userFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const visibleLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((log) => new Date(log.timestamp).toISOString().slice(0, 10) === today).length;
  const deletionCount = logs.filter((log) => log.action?.toLowerCase().includes('delete')).length;
  const activeAdminCount = new Set(logs.filter((log) => ['admin', 'superadmin', 'superior'].includes(log.performedBy?.role?.toLowerCase())).map((log) => log.performedBy?._id || log.performedBy?.username).filter(Boolean)).size;

  useEffect(() => {
    setPage(1);
  }, [search, userFilter, actionFilter, entityFilter, dateFilter]);

  const resetFilters = () => {
    setSearch('');
    setUserFilter('');
    setActionFilter('');
    setEntityFilter('');
    setDateFilter('');
  };

  return (
    <div className="space-y-5">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>}
      {loading ? <LoadingSpinner message="Loading audit trail..." /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[92px]">
              <span className="text-[11px] font-semibold text-gray-500">Total events</span>
              <p className="text-2xl text-[#09233d] mt-2 leading-none">{logs.length.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[92px]">
              <span className="text-[11px] font-semibold text-gray-500">Today</span>
              <p className="text-2xl text-[#09233d] mt-2 leading-none">{todayCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[92px]">
              <span className="text-[11px] font-semibold text-gray-500">Deletions</span>
              <p className="text-2xl text-rose-600 mt-2 leading-none">{deletionCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[92px]">
              <span className="text-[11px] font-semibold text-gray-500">Active admins</span>
              <p className="text-2xl text-[#09233d] mt-2 leading-none">{activeAdminCount}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 pt-5">
            <label className="relative flex-1"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by user, action, or entity id" className="w-full h-9 px-3 border border-gray-300 rounded-sm text-xs text-gray-700 focus:border-[#20b875] focus:outline-none" /></label>
            <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="h-9 lg:w-40 border border-gray-300 rounded-sm px-2 text-xs text-gray-700 focus:border-[#20b875] focus:outline-none"><option value="">All users</option>{users.map((user) => <option key={user._id || user.username} value={user._id || user.username}>{user.name || user.username}</option>)}</select>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-9 lg:w-40 border border-gray-300 rounded-sm px-2 text-xs text-gray-700 focus:border-[#20b875] focus:outline-none"><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{action}</option>)}</select>
            <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)} className="h-9 lg:w-40 border border-gray-300 rounded-sm px-2 text-xs text-gray-700 focus:border-[#20b875] focus:outline-none"><option value="">All entities</option>{entities.map((entity) => <option key={entity} value={entity}>{entity}</option>)}</select>
            <label className="flex items-center gap-2 text-xs text-gray-700 whitespace-nowrap"><span>Date range</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-9 border border-gray-300 rounded-sm px-2 text-xs focus:border-[#20b875] focus:outline-none" /></label>
            {(search || userFilter || actionFilter || entityFilter || dateFilter) && <button type="button" onClick={resetFilters} className="h-9 px-3 text-xs font-bold text-gray-500 hover:text-[#20b875]">Reset</button>}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead><tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500"><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Performed by</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity type</th><th className="px-4 py-3">Entity id</th></tr></thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {visibleLogs.map((log) => {
                    const formattedDate = formatDate(log.timestamp);
                    return <tr key={log._id} className="hover:bg-[#f0faf5] transition-colors"><td className="px-4 py-3 text-gray-700 whitespace-nowrap"><span className="block">{formattedDate.date}</span><span className="text-[10px]">{formattedDate.time}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-[#20b875] text-white text-[10px] font-bold flex items-center justify-center">{(log.performedBy?.name || 'U').slice(0, 2).toUpperCase()}</span><span><strong className="text-[#09233d] font-bold block">{log.performedBy?.name || 'Unknown user'}</strong><span className="text-[10px] text-gray-500">@{log.performedBy?.username || 'unknown'}</span></span></div></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-md font-semibold text-[10px] ${getActionStyle(log.action)}`}>{log.action}</span></td><td className="px-4 py-3 font-medium text-gray-700">{log.entityType}</td><td className="px-4 py-3 font-mono text-[10px] text-gray-600" title={JSON.stringify(log.details || {})}>{log.entityId}</td></tr>;
                  })}
                </tbody>
              </table>
              {visibleLogs.length === 0 && <div className="p-10 text-center text-xs text-gray-500">No audit events match the selected filters.</div>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 text-[11px] text-gray-600"><span>Showing {filteredLogs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length.toLocaleString()} events</span><div className="flex items-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)} className="disabled:text-gray-300 hover:text-[#20b875]">Previous</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 2), page + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`w-8 h-7 rounded-sm font-bold ${pageNumber === page ? 'bg-[#20b875] text-white' : 'hover:bg-emerald-50 text-gray-600'}`}>{pageNumber}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage((currentPage) => currentPage + 1)} className="disabled:text-gray-300 hover:text-[#20b875]">Next</button></div></div>
          </div>
        </>
      )}
    </div>
  );
}
