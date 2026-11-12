import { useEffect, useState } from 'react';
import { ChecklistAPI, ComplianceRecordAPI, FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, paginate, fmtDate } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import Badge from '../../components/Badge';

const STATUSES = [['compliant', 'Compliant'], ['non_compliant', 'Non-Compliant'], ['in_review', 'In Review']];

export default function Compliance() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);

  const [tab, setTab] = useState('records'); // 'records' | 'checklists'
  const [records, setRecords] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [recordModal, setRecordModal] = useState(null);
  const [recordForm, setRecordForm] = useState({ franchise: '', checklist: '', status: 'in_review' });
  const [checklistModal, setChecklistModal] = useState(null);
  const [checklistForm, setChecklistForm] = useState({ title: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [recRes, clRes] = await Promise.all([ComplianceRecordAPI.list(), ChecklistAPI.list()]);
      setRecords(recRes.results || recRes || []);
      setChecklists(clRes.results || clRes || []);
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

  const { slice: recordSlice, total: recordTotal } = paginate(records, page, 8);
  const { slice: checklistSlice, total: checklistTotal } = paginate(checklists, page, 8);

  function openNewRecord() {
    setRecordForm({ franchise: isAdmin ? '' : (currentUser.franchise || ''), checklist: '', status: 'in_review' });
    setRecordModal('new');
  }
  function openEditRecord(row) { setRecordForm({ franchise: row.franchise, checklist: row.checklist, status: row.status }); setRecordModal(row); }

  async function saveRecord() {
    setSaving(true);
    try {
      const payload = { ...recordForm, reviewed_at: new Date().toISOString() };
      if (recordModal === 'new') { await ComplianceRecordAPI.create(payload); toast('Compliance record created', 'success'); }
      else { await ComplianceRecordAPI.update(recordModal.id, payload); toast('Compliance record updated', 'success'); }
      setRecordModal(null);
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  function openNewChecklist() { setChecklistForm({ title: '', description: '', is_active: true }); setChecklistModal('new'); }
  function openEditChecklist(row) { setChecklistForm({ title: row.title, description: row.description, is_active: row.is_active }); setChecklistModal(row); }

  async function saveChecklist() {
    setSaving(true);
    try {
      if (checklistModal === 'new') { await ChecklistAPI.create(checklistForm); toast('Checklist created', 'success'); }
      else { await ChecklistAPI.update(checklistModal.id, checklistForm); toast('Checklist updated', 'success'); }
      setChecklistModal(null);
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function removeChecklist(row) {
    if (!window.confirm(`Delete checklist "${row.title}"?`)) return;
    try { await ChecklistAPI.remove(row.id); toast('Checklist deleted', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); }
  }

  const recordCols = [
    { key: 'franchise_name', label: 'Franchise' },
    { key: 'checklist_title', label: 'Checklist' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'reviewed_at', label: 'Reviewed', render: fmtDate },
    { key: 'created_at', label: 'Created', render: fmtDate },
  ];
  const checklistCols = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', render: (v) => v || '—' },
    { key: 'is_active', label: 'Active', render: (v) => (v ? 'Yes' : 'No') },
    { key: 'items', label: 'Items', render: (v) => (v || []).length },
  ];
  if (isAdmin) {
    checklistCols.push({
      key: 'id', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEditChecklist(row); }}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); removeChecklist(row); }}>Delete</button>
        </div>
      ),
    });
  }

  return (
    <>
      <div className="page-header"><h2>Compliance</h2><p className="text-muted">Franchise compliance tracking and checklists</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className={`btn btn-sm ${tab === 'records' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('records'); setPage(1); }}>Compliance Records</button>
          <button className={`btn btn-sm ${tab === 'checklists' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('checklists'); setPage(1); }}>Checklists</button>
        </div>
        <div className="toolbar-right">
          {tab === 'records' && <button className="btn btn-primary" onClick={openNewRecord}>+ New Record</button>}
          {tab === 'checklists' && isAdmin && <button className="btn btn-primary" onClick={openNewChecklist}>+ New Checklist</button>}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : tab === 'records' ? (
        <>
          <DataTable cols={recordCols} data={recordSlice} onRowClick={openEditRecord} sortable />
          <Pagination page={page} total={recordTotal} onChange={setPage} />
        </>
      ) : (
        <>
          <DataTable cols={checklistCols} data={checklistSlice} sortable />
          <Pagination page={page} total={checklistTotal} onChange={setPage} />
        </>
      )}

      {recordModal && (
        <Modal title={recordModal === 'new' ? 'New Compliance Record' : 'Edit Compliance Record'} onClose={() => setRecordModal(null)} onSave={saveRecord} saving={saving}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Franchise</label>
              <select value={recordForm.franchise} onChange={(e) => setRecordForm({ ...recordForm, franchise: e.target.value })}>
                <option value="">Select franchise...</option>
                {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Checklist</label>
            <select value={recordForm.checklist} onChange={(e) => setRecordForm({ ...recordForm, checklist: e.target.value })}>
              <option value="">Select checklist...</option>
              {checklists.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={recordForm.status} onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {checklistModal && (
        <Modal title={checklistModal === 'new' ? 'New Checklist' : 'Edit Checklist'} onClose={() => setChecklistModal(null)} onSave={saveChecklist} saving={saving}>
          <div className="form-group"><label className="form-label">Title</label><input value={checklistForm.title} onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea rows={2} value={checklistForm.description} onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })} /></div>
          <div className="form-group">
            <label className="form-label">Active</label>
            <select value={checklistForm.is_active ? '1' : '0'} onChange={(e) => setChecklistForm({ ...checklistForm, is_active: e.target.value === '1' })}>
              <option value="1">Yes</option><option value="0">No</option>
            </select>
          </div>
        </Modal>
      )}
    </>
  );
}
