import { useEffect, useState } from 'react';
import { ExpenseAPI, FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, roleMeets, searchFilter, paginate, fmtDate, fmt } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

const CATEGORIES = [
  ['rent', 'Rent'], ['utilities', 'Utilities'], ['salaries', 'Salaries'], ['supplies', 'Supplies'],
  ['marketing', 'Marketing'], ['maintenance', 'Maintenance'], ['other', 'Other'],
];
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { franchise: '', category: 'other', amount: '', description: '', receipt_url: '', expense_date: today() };

export default function Expenses() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);
  const canDelete = isAdmin;

  const [list, setList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await ExpenseAPI.list();
      setList(res.results || res || []);
      if (isAdmin) {
        const fRes = await FranchiseAPI.list();
        setFranchises(fRes.results || fRes || []);
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let filtered = searchFilter(list, query, ['description', 'franchise_name']);
  if (category) filtered = filtered.filter((e) => e.category === category);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() {
    setForm({ ...EMPTY, franchise: isAdmin ? '' : (currentUser.franchise || '') });
    setModal('new');
  }
  function openEdit(row) { setForm({ ...row, expense_date: row.expense_date }); setModal(row); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'new') {
        await ExpenseAPI.create(form);
        toast('Expense recorded', 'success');
      } else {
        await ExpenseAPI.update(modal.id, form);
        toast('Expense updated', 'success');
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
    if (!window.confirm('Delete this expense?')) return;
    try {
      await ExpenseAPI.remove(row.id);
      toast('Expense deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const cols = [
    { key: 'category', label: 'Category', render: (v) => CATEGORIES.find((c) => c[0] === v)?.[1] || v },
    { key: 'franchise_name', label: 'Franchise' },
    { key: 'amount', label: 'Amount', render: (v) => '₹' + fmt(v) },
    { key: 'description', label: 'Description', render: (v) => v || '—' },
    { key: 'expense_date', label: 'Date', render: fmtDate },
    { key: 'recorded_by_name', label: 'Recorded By' },
    {
      key: 'id', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {isAdmin && <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</button>}
          {canDelete && <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(row); }}>Delete</button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header"><h2>Expenses</h2><p className="text-muted">Operational expense tracking</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search expenses..." />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ Record Expense</button></div>
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
        <Modal title={modal === 'new' ? 'Record Expense' : 'Edit Expense'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Franchise</label>
              <select value={form.franchise} onChange={(e) => setForm({ ...form, franchise: e.target.value })}>
                <option value="">Select franchise...</option>
                {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Expense Date</label><input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Receipt URL</label><input value={form.receipt_url} onChange={(e) => setForm({ ...form, receipt_url: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </Modal>
      )}
    </>
  );
}
