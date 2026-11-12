import { useEffect, useState } from 'react';
import { CampaignAPI, LeadAPI, FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, roleMeets, searchFilter, paginate, fmtDate, fmt } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { name: '', description: '', budget: '', spent: 0, reach: 0, status: 'draft', start_date: today(), end_date: today() };

export default function Marketing() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);
  const canManage = roleMeets(currentUser, 'franchise_owner');
  const canViewLeads = isAdmin;

  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const cRes = await CampaignAPI.list();
      setCampaigns(cRes.results || cRes || []);
      if (isAdmin) {
        const fRes = await FranchiseAPI.list();
        setFranchises(fRes.results || fRes || []);
      }
      if (canViewLeads) {
        try {
          const lRes = await LeadAPI.list();
          setLeads(lRes.results || lRes || []);
        } catch (_) { /* staff without lead access */ }
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCampaigns = searchFilter(campaigns, query, ['name']);
  const { slice: campaignSlice, total: campaignTotal } = paginate(filteredCampaigns, page, 8);
  const filteredLeads = searchFilter(leads, query, ['full_name', 'email', 'company']);
  const { slice: leadSlice, total: leadTotal } = paginate(filteredLeads, page, 8);

  function openNew() {
    setForm({ ...EMPTY, franchise: isAdmin ? '' : (currentUser.franchise || '') });
    setModal('new');
  }
  function openEdit(row) { setForm({ ...row }); setModal(row); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'new') { await CampaignAPI.create(form); toast('Campaign created', 'success'); }
      else { await CampaignAPI.update(modal.id, form); toast('Campaign updated', 'success'); }
      setModal(null);
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete campaign "${row.name}"?`)) return;
    try { await CampaignAPI.remove(row.id); toast('Campaign deleted', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); }
  }

  const campaignCols = [
    { key: 'name', label: 'Name' },
    { key: 'franchise_name', label: 'Franchise', render: (v) => v || 'Corporate' },
    { key: 'budget', label: 'Budget', render: (v) => '₹' + fmt(v) },
    { key: 'spent', label: 'Spent', render: (v) => '₹' + fmt(v) },
    { key: 'reach', label: 'Reach' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'end_date', label: 'Ends', render: fmtDate },
  ];
  if (canManage) {
    campaignCols.push({
      key: 'id', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(row); }}>Delete</button>
        </div>
      ),
    });
  }
  async function toggleReviewed(lead) {
    try {
      await LeadAPI.update(lead.id, { is_reviewed: !lead.is_reviewed });
      load();
      toast(lead.is_reviewed ? 'Marked as new' : 'Marked as reviewed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const leadCols = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'company', label: 'Company', render: (v) => v || '—' },
    { key: 'message', label: 'Message', render: (v) => v ? (v.length > 80 ? v.slice(0, 80) + '…' : v) : '—' },
    { key: 'is_reviewed', label: 'Status', render: (v) => <Badge status={v ? 'approved' : 'pending'} label={v ? 'Reviewed' : 'New'} /> },
    { key: 'created_at', label: 'Date', render: fmtDate },
  ];

  return (
    <>
      <div className="page-header"><h2>Marketing</h2><p className="text-muted">Campaigns and inbound leads</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className={`btn btn-sm ${tab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('campaigns'); setPage(1); }}>Campaigns</button>
          {canViewLeads && <button className={`btn btn-sm ${tab === 'leads' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('leads'); setPage(1); }}>Leads</button>}
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search..." />
        </div>
        {tab === 'campaigns' && canManage && <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New Campaign</button></div>}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : tab === 'campaigns' ? (
        <>
          <DataTable cols={campaignCols} data={campaignSlice} sortable />
          <Pagination page={page} total={campaignTotal} onChange={setPage} />
        </>
      ) : (
        <>
          <DataTable cols={leadCols} data={leadSlice} sortable onRowClick={(row) => setModal({ ...row, _isLead: true })} />
          <Pagination page={page} total={leadTotal} onChange={setPage} />
        </>
      )}

      {modal && !modal._isLead && (
        <Modal title={modal === 'new' ? 'New Campaign' : `Edit ${modal.name}`} onClose={() => setModal(null)} onSave={save} saving={saving}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Franchise (optional — leave blank for corporate)</label>
              <select value={form.franchise || ''} onChange={(e) => setForm({ ...form, franchise: e.target.value || null })}>
                <option value="">Corporate</option>
                {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group"><label className="form-label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Budget (₹)</label><input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Spent (₹)</label><input type="number" step="0.01" value={form.spent} onChange={(e) => setForm({ ...form, spent: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Reach</label><input type="number" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </Modal>
      )}

      {/* Lead detail modal */}
      {modal && modal._isLead && (
        <Modal title={`📬 Inquiry from ${modal.full_name}`} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Name</strong><div>{modal.full_name}</div></div>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Email</strong><div><a href={`mailto:${modal.email}`}>{modal.email}</a></div></div>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Company</strong><div>{modal.company || '—'}</div></div>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Phone</strong><div>{modal.phone || '—'}</div></div>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Scale</strong><div>{modal.scale || '—'}</div></div>
            <div><strong style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Date</strong><div>{fmtDate(modal.created_at)}</div></div>
          </div>
          <div style={{ background: 'var(--bg)', padding: '.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <strong style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Message</strong>
            <div style={{ fontSize: '.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{modal.message}</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => toggleReviewed(modal)}>
              {modal.is_reviewed ? 'Mark as New' : '✓ Mark Reviewed'}
            </button>
            <a href={`mailto:${modal.email}?subject=Re: FranchiseOS Inquiry`} className="btn btn-primary btn-sm">📧 Reply via Email</a>
          </div>
        </Modal>
      )}
    </>
  );
}
