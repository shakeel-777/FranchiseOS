import { useEffect, useState } from 'react';
import { InventoryAPI, ProductAPI, FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, roleMeets, searchFilter, paginate, fmtDateTime } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

export default function Inventory() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);
  const canDelete = isAdmin;

  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ franchise: '', product: '', quantity: 0, low_stock_threshold: 10 });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([InventoryAPI.list(), ProductAPI.list()]);
      setList(invRes.results || invRes || []);
      setProducts(prodRes.results || prodRes || []);
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

  let filtered = searchFilter(list, query, ['product_name', 'product_sku', 'franchise_name']);
  if (lowOnly) filtered = filtered.filter((i) => i.is_low_stock);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() {
    setForm({ franchise: isAdmin ? '' : (currentUser.franchise || ''), product: '', quantity: 0, low_stock_threshold: 10 });
    setModal('new');
  }
  function openEdit(row) {
    setForm({ franchise: row.franchise, product: row.product, quantity: row.quantity, low_stock_threshold: row.low_stock_threshold });
    setModal(row);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, last_restock_date: new Date().toISOString() };
      if (modal === 'new') {
        await InventoryAPI.create(payload);
        toast('Stock record created', 'success');
      } else {
        await InventoryAPI.update(modal.id, payload);
        toast('Stock updated', 'success');
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
    if (!window.confirm(`Delete inventory record for "${row.product_name}"?`)) return;
    try {
      await InventoryAPI.remove(row.id);
      toast('Record deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const cols = [
    { key: 'product_name', label: 'Product' },
    { key: 'product_sku', label: 'SKU' },
    { key: 'franchise_name', label: 'Franchise' },
    { key: 'quantity', label: 'Qty' },
    { key: 'low_stock_threshold', label: 'Threshold' },
    { key: 'is_low_stock', label: 'Status', render: (v) => <Badge status={v ? 'suspended' : 'active'} label={v ? 'Low Stock' : 'OK'} /> },
    { key: 'updated_at', label: 'Updated', render: fmtDateTime },
    {
      key: 'id', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {isAdmin && <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Restock/Edit</button>}
          {canDelete && <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(row); }}>Delete</button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header"><h2>Inventory</h2><p className="text-muted">Stock levels by product and franchise</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search inventory..." />
          <label style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.8125rem' }}>
            <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(1); }} /> Low stock only
          </label>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New Stock Record</button></div>
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
        <Modal title={modal === 'new' ? 'New Stock Record' : `Edit Stock — ${modal.product_name}`} onClose={() => setModal(null)} onSave={save} saving={saving}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Franchise</label>
              <select value={form.franchise} onChange={(e) => setForm({ ...form, franchise: e.target.value })}>
                <option value="">Select franchise...</option>
                {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Product</label>
            <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Low Stock Threshold</label><input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </>
  );
}
