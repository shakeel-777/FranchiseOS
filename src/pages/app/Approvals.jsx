import { useEffect, useState } from 'react';
import { ApprovalAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, searchFilter, paginate, fmtDateTime, fmt } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

const TYPES = [
  ['discount', 'Discount Approval'], ['refund', 'Refund Request'], ['purchase', 'Purchase Order'],
  ['hire', 'Hiring Request'], ['leave', 'Leave Request'], ['other', 'Other'],
];
const EMPTY = { approval_type: 'other', title: '', details: '', amount: '' };

export default function Approvals() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'new' | approval
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await ApprovalAPI.list();
      setList(res.results || res || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let filtered = searchFilter(list, query, ['title', 'requested_by_name']);
  if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() { setForm(EMPTY); setModal('new'); }
  function openReview(row) { setModal(row); }

  async function create() {
    setSaving(true);
    try {
      await ApprovalAPI.create(form);
      toast('Approval request submitted', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function review(id, decision) {
    setSaving(true);
    try {
      await ApprovalAPI.update(id, { status: decision, reviewed_at: new Date().toISOString() });
      toast(`Request ${decision}`, 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const cols = [
    { key: 'approval_type', label: 'Type', render: (v) => TYPES.find((t) => t[0] === v)?.[1] || v },
    { key: 'title', label: 'Title' },
    { key: 'requested_by_name', label: 'Requested By' },
    { key: 'amount', label: 'Amount', render: (v) => (v ? '₹' + fmt(v) : '—') },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'created_at', label: 'Created', render: fmtDateTime },
  ];

  return (
    <>
      <div className="page-header"><h2>Approvals</h2><p className="text-muted">{isAdmin ? 'Review and manage approval requests' : 'Your approval requests'}</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search approvals..." />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New Request</button></div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <DataTable cols={cols} data={slice} onRowClick={openReview} sortable />
          <Pagination page={page} total={total} onChange={setPage} />
        </>
      )}

      {modal === 'new' && (
        <Modal title="New Approval Request" onClose={() => setModal(null)} onSave={create} saving={saving} saveLabel="Submit">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label>
              <select value={form.approval_type} onChange={(e) => setForm({ ...form, approval_type: e.target.value })}>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Amount (₹, optional)</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Details</label><textarea rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
        </Modal>
      )}

      {modal && modal !== 'new' && (
        <Modal
          title={modal.title}
          onClose={() => setModal(null)}
        >
          <p><strong>Type:</strong> {TYPES.find((t) => t[0] === modal.approval_type)?.[1] || modal.approval_type}</p>
          <p><strong>Requested By:</strong> {modal.requested_by_name}</p>
          <p><strong>Status:</strong> <Badge status={modal.status} /></p>
          {modal.amount && <p><strong>Amount:</strong> ₹{fmt(modal.amount)}</p>}
          <p><strong>Details:</strong> {modal.details}</p>
          <p><strong>Submitted:</strong> {fmtDateTime(modal.created_at)}</p>
          {modal.reviewed_by_name && <p><strong>Reviewed By:</strong> {modal.reviewed_by_name} ({fmtDateTime(modal.reviewed_at)})</p>}
          {isAdmin && modal.status === 'pending' && (
            <div className="form-actions">
              <button className="btn btn-danger" disabled={saving} onClick={() => review(modal.id, 'rejected')}>Reject</button>
              <button className="btn btn-success" disabled={saving} onClick={() => review(modal.id, 'approved')}>Approve</button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
