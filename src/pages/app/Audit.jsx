import { useEffect, useState } from 'react';
import { AuditAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { searchFilter, paginate, fmtDateTime } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

const ACTION_COLORS = { create: 'green', update: 'blue', delete: 'red', login: 'purple', logout: 'gray', export: 'amber', approve: 'green', reject: 'red', other: 'gray' };

export default function Audit() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await AuditAPI.list();
        setList(res.results || res || []);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let filtered = searchFilter(list, query, ['username', 'entity_type', 'description']);
  if (action) filtered = filtered.filter((a) => a.action === action);
  const { slice, total } = paginate(filtered, page, 12);

  const cols = [
    { key: 'timestamp', label: 'Time', render: fmtDateTime },
    { key: 'username', label: 'User', render: (v) => v || 'System' },
    { key: 'action', label: 'Action', render: (v) => <span className={`badge badge-${ACTION_COLORS[v] || 'gray'}`}>{v}</span> },
    { key: 'entity_type', label: 'Entity' },
    { key: 'description', label: 'Description' },
    { key: 'ip_address', label: 'IP', render: (v) => v || '—' },
  ];

  return (
    <>
      <div className="page-header"><h2>Audit Log</h2><p className="text-muted">Immutable record of all significant system actions</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search audit log..." />
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {Object.keys(ACTION_COLORS).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <DataTable cols={cols} data={slice} sortable />
          <Pagination page={page} total={total} onChange={setPage} />
        </>
      )}
    </>
  );
}
