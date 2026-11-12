import { useEffect, useState } from 'react';
import { UserAPI, FranchiseAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { searchFilter, paginate, roleLabel, fmtDate } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

const ROLES = [['admin', 'Corporate Admin'], ['franchise_owner', 'Franchise Owner'], ['store_manager', 'Store Manager'], ['user', 'User']];
const EMPTY_NEW = { username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: 'user', franchise_ids: [] };

export default function Users() {
  const toast = useToast();

  const [list, setList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | profile
  const [newForm, setNewForm] = useState(EMPTY_NEW);
  const [editForm, setEditForm] = useState({ role: '', franchise_ids: [], phone: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [uRes, fRes] = await Promise.all([UserAPI.list(), FranchiseAPI.list()]);
      setList(uRes.results || uRes || []);
      setFranchises(fRes.results || fRes || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let filtered = searchFilter(
    list.map((p) => ({ ...p, username: p.user?.username, full_name: `${p.user?.first_name || ''} ${p.user?.last_name || ''}`, email: p.user?.email })),
    query, ['username', 'full_name', 'email']
  );
  if (roleFilter) filtered = filtered.filter((u) => u.role === roleFilter);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() { setNewForm(EMPTY_NEW); setModal('new'); }
  function openEdit(row) { setEditForm({ role: row.role, franchise_ids: row.franchises || [], phone: row.phone || '' }); setModal(row); }

  async function createUser() {
    setSaving(true);
    try {
      await UserAPI.create(newForm);
      toast('User created', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await UserAPI.update(modal.id, {
        role: editForm.role,
        franchise_ids: editForm.franchise_ids,
        phone: editForm.phone,
      });
      toast('User updated', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const cols = [
    { key: 'full_name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <Badge status={v === 'admin' ? 'compliant' : 'in_review'} label={roleLabel(v)} /> },
    { key: 'franchises', label: 'Franchises', render: (ids, row) => {
      const names = (row.franchises || []).map((fid) => franchises.find((f) => f.id === fid)?.name).filter(Boolean);
      return names.length > 0 ? names.join(', ') : <span className="text-muted">Unassigned</span>;
    }},
    { key: 'created_at', label: 'Joined', render: fmtDate },
    {
      key: 'id', label: '', render: (_, row) => (
        <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Manage</button>
      ),
    },
  ];

  return (
    <>
      <div className="page-header"><h2>Users</h2><p className="text-muted">Manage user accounts, roles, and franchise assignments</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search users..." />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New User</button></div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <DataTable cols={cols} data={slice} sortable />
          <Pagination page={page} total={total} onChange={setPage} />
        </>
      )}

      {modal === 'new' && (
        <Modal title="New User" onClose={() => setModal(null)} onSave={createUser} saving={saving} saveLabel="Create">
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name</label><input value={newForm.first_name} onChange={(e) => setNewForm({ ...newForm, first_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input value={newForm.last_name} onChange={(e) => setNewForm({ ...newForm, last_name: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Username</label><input value={newForm.username} onChange={(e) => setNewForm({ ...newForm, username: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Password</label><input type="password" value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Role</label>
              <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}>
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Franchises</label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '.5rem' }}>
                {franchises.length === 0 && <span className="text-muted" style={{ fontSize: '.75rem' }}>No franchises available</span>}
                {franchises.map((f) => {
                  const checked = newForm.franchise_ids.map(String).includes(String(f.id));
                  return (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem 0', cursor: 'pointer', fontSize: '.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const fid = String(f.id);
                          setNewForm({
                            ...newForm,
                            franchise_ids: e.target.checked
                              ? [...newForm.franchise_ids.map(String), fid]
                              : newForm.franchise_ids.map(String).filter((id) => id !== fid),
                          });
                        }}
                      />
                      {f.name} <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }}>({f.code})</span>
                    </label>
                  );
                })}
              </div>
              <small className="text-muted">{newForm.franchise_ids.length} franchise(s) selected</small>
            </div>
          </div>
        </Modal>
      )}

      {modal && modal !== 'new' && (
        <Modal title={`Manage ${modal.user?.first_name || ''} ${modal.user?.last_name || ''}`} onClose={() => setModal(null)} onSave={saveEdit} saving={saving}>
          <div className="form-group"><label className="form-label">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Franchises</label>
            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '.5rem' }}>
              {franchises.length === 0 && <span className="text-muted" style={{ fontSize: '.75rem' }}>No franchises available</span>}
              {franchises.map((f) => {
                const checked = editForm.franchise_ids.map(String).includes(String(f.id));
                return (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem 0', cursor: 'pointer', fontSize: '.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const fid = String(f.id);
                        setEditForm({
                          ...editForm,
                          franchise_ids: e.target.checked
                            ? [...editForm.franchise_ids.map(String), fid]
                            : editForm.franchise_ids.map(String).filter((id) => id !== fid),
                        });
                      }}
                    />
                    {f.name} <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }}>({f.code})</span>
                  </label>
                );
              })}
            </div>
            <small className="text-muted">{editForm.franchise_ids.length} franchise(s) selected</small>
          </div>
          <div className="form-group"><label className="form-label">Phone</label><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
        </Modal>
      )}
    </>
  );
}
