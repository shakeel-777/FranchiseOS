import { useEffect, useState } from 'react';
import { ProductAPI, FranchiseAPI, apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminUser, searchFilter, paginate, fmt } from '../../utils/format';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

const EMPTY = { name: '', sku: '', category: 'retail', price: '', cost_price: '', description: '', is_active: true, franchise: '' };
const REQ_EMPTY = { product_name: '', category: 'retail', quantity: 10, notes: '' };
const CATEGORIES = [
  ['food', 'Food & Beverage'], ['retail', 'Retail'], ['service', 'Service'], ['digital', 'Digital'], ['other', 'Other'],
];

export default function Products() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);

  const [list, setList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [reqForm, setReqForm] = useState(REQ_EMPTY);
  const [reqSaving, setReqSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await ProductAPI.list();
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

  let filtered = searchFilter(list, query, ['name', 'sku']);
  if (category) filtered = filtered.filter((p) => p.category === category);
  const { slice, total } = paginate(filtered, page, 15);

  function openNew() { setForm({ ...EMPTY }); setModal('new'); }
  function openEdit(row) { setForm({ ...row, franchise: row.franchise || '' }); setModal(row); }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        franchise: form.franchise || null,
        price: form.price || 0,
        cost_price: form.cost_price || 0,
      };
      if (modal === 'new') {
        await ProductAPI.create(payload);
        toast('Product created', 'success');
      } else {
        await ProductAPI.update(modal.id, payload);
        toast('Product updated', 'success');
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
    if (!window.confirm(`Delete product "${row.name}"?`)) return;
    try {
      await ProductAPI.remove(row.id);
      toast('Product deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function submitRequest() {
    if (!reqForm.product_name.trim()) { toast('Product name is required', 'error'); return; }
    setReqSaving(true);
    try {
      const franchiseName = currentUser?.franchise_name || currentUser?.franchise_names?.join(', ') || 'your franchise';
      // Create an approval request for the product
      await apiFetch('/approvals/', {
        method: 'POST',
        body: {
          approval_type: 'purchase',
          title: `Product Request: ${reqForm.product_name}`,
          details: `Product: ${reqForm.product_name}\nCategory: ${CATEGORIES.find(c => c[0] === reqForm.category)?.[1] || reqForm.category}\nQuantity: ${reqForm.quantity}\nFranchise: ${franchiseName}\nNotes: ${reqForm.notes || 'N/A'}`,
          status: 'pending',
        },
      });
      toast('Product request submitted! Admin will review and add the product to your catalog.', 'success');
      setModal(null);
      setReqForm(REQ_EMPTY);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setReqSaving(false);
    }
  }

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category', render: (v) => CATEGORIES.find((c) => c[0] === v)?.[1] || v },
  ];
  if (isAdmin) {
    cols.push({ key: 'franchise_name', label: 'Franchise', render: (v) => v || 'Global' });
  }
  cols.push(
    { key: 'price', label: 'Price', render: (v) => '₹' + fmt(v) },
    { key: 'is_active', label: 'Active', render: (v) => (v ? 'Yes' : 'No') },
  );
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
      <div className="page-header"><h2>Products</h2><p className="text-muted">Product catalog — each franchise has its own products</p></div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search products..." />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          {isAdmin ? (
            <button className="btn btn-primary" onClick={openNew}>+ New Product</button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setReqForm(REQ_EMPTY); setModal('request'); }}>
              📦 Request Products
            </button>
          )}
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

      {modal === 'request' && (
        <Modal title="📦 Request Products" onClose={() => setModal(null)} onSave={submitRequest} saving={reqSaving} saveLabel="Submit Request">
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.8125rem' }}>
            Request products for your franchise. Admin will review and add them to your catalog.
          </p>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input value={reqForm.product_name} onChange={(e) => setReqForm({ ...reqForm, product_name: e.target.value })} placeholder="e.g. Cheese Burst Pizza" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Needed</label>
              <input type="number" min="1" value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea rows={3} value={reqForm.notes} onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })} placeholder="Any specific requirements, pricing expectations, or urgency..." />
          </div>
        </Modal>
      )}

      {modal && modal !== 'request' && (
        <Modal title={modal === 'new' ? 'New Product' : `Edit ${modal.name}`} onClose={() => setModal(null)} onSave={save} saving={saving}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Franchise</label>
              <select value={form.franchise} onChange={(e) => setForm({ ...form, franchise: e.target.value })}>
                <option value="">Global (no franchise)</option>
                {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Active</label>
              <select value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}>
                <option value="1">Yes</option><option value="0">No</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Price (₹)</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Cost Price (₹)</label><input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </Modal>
      )}
    </>
  );
}
