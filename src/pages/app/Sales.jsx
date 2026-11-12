import { useEffect, useState } from 'react';
import { SaleAPI, FranchiseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, roleMeets, searchFilter, paginate, fmtDateTime, fmt } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Badge from '../../components/Badge';

const EMPTY_ITEM = { product_name: '', quantity: 1, unit_price: 0 };

export default function Sales() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);
  const canDelete = isAdmin;

  const [list, setList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'new' | 'view'
  const [viewSale, setViewSale] = useState(null);
  const [form, setForm] = useState({ franchise: '', customer_name: '', discount: 0, status: 'completed', notes: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await SaleAPI.list();
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

  let filtered = searchFilter(list, query, ['customer_name', 'franchise_name', 'id']);
  if (status) filtered = filtered.filter((s) => s.status === status);
  const { slice, total } = paginate(filtered, page, 8);

  function openNew() {
    setForm({ franchise: isAdmin ? '' : (currentUser.franchise || ''), customer_name: '', discount: 0, status: 'completed', notes: '' });
    setItems([{ ...EMPTY_ITEM }]);
    setModal('new');
  }
  function openView(row) { setViewSale(row); setModal('view'); }

  function updateItem(i, patch) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() { setItems((its) => [...its, { ...EMPTY_ITEM }]); }
  function removeItem(i) { setItems((its) => its.filter((_, idx) => idx !== i)); }

  const itemsTotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const grandTotal = Math.max(0, itemsTotal - (Number(form.discount) || 0));

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_amount: grandTotal,
        items: items.filter((it) => it.product_name).map((it) => ({
          product_name: it.product_name, quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0, total: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        })),
      };
      await SaleAPI.create(payload);
      toast('Sale recorded', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete sale #${row.id}?`)) return;
    try {
      await SaleAPI.remove(row.id);
      toast('Sale deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const cols = [
    { key: 'id', label: 'Invoice #', render: (v) => `#${v}` },
    ...(isAdmin ? [{ key: 'franchise_name', label: 'Franchise' }] : []),
    { key: 'customer_name', label: 'Customer', render: (v) => v || 'Walk-in' },
    { key: 'total_amount', label: 'Amount', render: (v) => '₹' + fmt(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'sale_date', label: 'Date', render: fmtDateTime },
  ];
  if (canDelete) {
    cols.push({
      key: 'id2', label: '', render: (_, row) => (
        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(row); }}>Delete</button>
      ),
    });
  }

  return (
    <>
      <div className="page-header"><h2>Sales</h2><p className="text-muted">Sales transactions and revenue tracking</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search sales..." />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option><option value="pending">Pending</option>
            <option value="refunded">Refunded</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={openNew}>+ New Sale</button></div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <DataTable cols={cols} data={slice} onRowClick={openView} sortable />
          <Pagination page={page} total={total} onChange={setPage} />
        </>
      )}

      {modal === 'new' && (
        <Modal title="New Sale" onClose={() => setModal(null)} onSave={save} saving={saving} saveLabel="Record Sale">
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
            <div className="form-group"><label className="form-label">Customer Name</label><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="completed">Completed</option><option value="pending">Pending</option>
                <option value="refunded">Refunded</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <label className="form-label">Line Items</label>
          {items.map((it, i) => (
            <div className="form-row-3 form-row" key={i} style={{ alignItems: 'flex-end' }}>
              <div className="form-group"><input placeholder="Product name" value={it.product_name} onChange={(e) => updateItem(i, { product_name: e.target.value })} /></div>
              <div className="form-group"><input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} /></div>
              <div className="form-group" style={{ display: 'flex', gap: '.4rem' }}>
                <input type="number" placeholder="Unit Price" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: e.target.value })} />
                {items.length > 1 && <button type="button" className="btn-icon" onClick={() => removeItem(i)}>&times;</button>}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: '1rem' }}>+ Add Item</button>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Discount (₹)</label><input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Total</label><input value={'₹' + fmt(grandTotal)} disabled /></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </Modal>
      )}

      {modal === 'view' && viewSale && (
        <Modal title={`Sale #${viewSale.id}`} onClose={() => setModal(null)}>
          <p><strong>Franchise:</strong> {viewSale.franchise_name}</p>
          <p><strong>Customer:</strong> {viewSale.customer_name || '—'}</p>
          <p><strong>Status:</strong> <Badge status={viewSale.status} /></p>
          <p><strong>Date:</strong> {fmtDateTime(viewSale.sale_date)}</p>
          <p><strong>Discount:</strong> ₹{fmt(viewSale.discount)}</p>
          <p><strong>Total:</strong> ₹{fmt(viewSale.total_amount)}</p>
          {viewSale.notes && <p><strong>Notes:</strong> {viewSale.notes}</p>}
          <label className="form-label">Line Items</label>
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {(viewSale.items || []).map((it) => (
                <tr key={it.id}><td>{it.product_name}</td><td>{it.quantity}</td><td>₹{fmt(it.unit_price)}</td><td>₹{fmt(it.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}
