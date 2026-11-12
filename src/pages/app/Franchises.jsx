import { useEffect, useState } from 'react';
import { FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, searchFilter, paginate, fmtDate } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

const EMPTY = {
  name: '', code: '', owner_name: '', email: '', phone: '', address: '',
  city: '', state: '', country: 'India', status: 'active', revenue_share_pct: 10,
};

export default function Franchises() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'new' | franchise object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await FranchiseAPI.list();
      setList(res.results || res || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = searchFilter(list, query, ['name', 'code', 'owner_name', 'city']);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() { setForm(EMPTY); setModal('new'); }
  function openEdit(row) { setForm({ ...row }); setModal(row); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'new') {
        await FranchiseAPI.create(form);
        toast('Franchise created', 'success');
      } else {
        await FranchiseAPI.update(modal.id, form);
        toast('Franchise updated', 'success');
      }
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete franchise "${row.name}"?`)) return;
    try {
      await FranchiseAPI.remove(row.id);
      toast('Franchise deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'owner_name', label: 'Owner' },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'user_count', label: 'Users' },
    { key: 'created_at', label: 'Created', render: fmtDate },
  ];
  if (isAdmin) {
    cols.push({
      key: 'id', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(row); }}>Delete</button>
        </div>
      ),
    });
  }

  return (
    <>
      <div className="page-header">
        <h2>Franchises</h2>
        <p className="text-muted">{isAdmin ? 'Manage all franchise locations' : 'Your franchise location'}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left"><SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search franchises..." /></div>
        {isAdmin && <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New Franchise</button></div>}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <DataTable cols={cols} data={slice} sortable />
          <Pagination page={page} total={total} onChange={setPage} />
        </>
      )}

      {modal && (
        <Modal
          title={modal === 'new' ? 'New Franchise' : `Edit ${modal.name}`}
          onClose={() => setModal(null)}
          onSave={save}
          saving={saving}
        >
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Owner Name</label><input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Approval</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
          <div className="form-row-3 form-row">
            <div className="form-group"><label className="form-label">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">State</label><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Country</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Revenue Share %</label><input type="number" step="0.01" value={form.revenue_share_pct} onChange={(e) => setForm({ ...form, revenue_share_pct: e.target.value })} /></div>
        </Modal>
      )}
    </>
  );
}
