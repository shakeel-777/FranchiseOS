import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { isAdminUser } from '../../utils/format';

const CATEGORY_LABELS = { food: '🍽️ Food & Beverage', retail: '🛍️ Retail', service: '🔧 Service', digital: '💻 Digital', other: '📦 Other' };

export default function Directory() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const [chatMsg, setChatMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Admins manage franchises — they don't need the discovery page
  if (isAdminUser(currentUser)) return <Navigate to="/dashboard" replace />;

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/franchises/public/');
      setFranchises(data || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract unique cities for filter
  const cities = useMemo(() => {
    const citySet = new Set(franchises.map((f) => f.city).filter(Boolean));
    return [...citySet].sort();
  }, [franchises]);

  // Filter franchises by city and product search
  const filteredFranchises = useMemo(() => {
    let result = franchises;
    if (cityFilter) result = result.filter((f) => f.city === cityFilter);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter((f) =>
        f.products.some((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [franchises, cityFilter, productSearch]);

  function toggleProduct(franchiseId, product) {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.productId === product.id);
      if (exists) return prev.filter((p) => p.productId !== product.id);
      return [...prev, {
        franchiseId, franchiseName: franchises.find((f) => f.id === franchiseId)?.name,
        productId: product.id, productName: product.name, price: product.price, quantity: 1,
      }];
    });
  }

  function updateQuantity(productId, qty) {
    setSelectedProducts((prev) =>
      prev.map((p) => p.productId === productId ? { ...p, quantity: Math.max(1, parseInt(qty) || 1) } : p)
    );
  }

  function openInquiry(franchise) {
    const selected = selectedProducts.filter((p) => p.franchiseId === franchise.id);
    const productList = selected.length > 0
      ? `\n\nProducts I need:\n${selected.map((p) => {
        const lineTotal = parseFloat(p.price) * p.quantity;
        return `- ${p.productName} × ${p.quantity} = ₹${lineTotal.toLocaleString('en-IN')} (₹${parseFloat(p.price).toLocaleString('en-IN')} each)`;
      }).join('\n')}\nEstimated total: ₹${selected.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0).toLocaleString('en-IN')}`
      : '';
    setChatOpen(franchise.id);
    setChatMsg(`Hi, I'm interested in ${franchise.name} franchise at ${franchise.city}, ${franchise.state}.${productList}\n\nCan you share more details about franchise pricing, availability, and next steps?`);
  }

  async function startChat(franchise) {
    if (!chatMsg.trim()) return;
    setSending(true);
    try {
      const conv = await apiFetch('/chat/conversations/', {
        method: 'POST',
        body: { franchise: franchise.id, subject: `Inquiry about ${franchise.name}` },
      });
      await apiFetch(`/chat/conversations/${conv.id}/send/`, {
        method: 'POST',
        body: { content: chatMsg },
      });
      toast(`Message sent! ${franchise.name} team will respond soon.`, 'success');
      setChatOpen(null);
      setChatMsg('');
      setSelectedProducts((prev) => prev.filter((p) => p.franchiseId !== franchise.id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>Discover Franchises</h2>
        <p className="text-muted">Browse available franchise locations and their product catalogs</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">📍 Location</label>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">All Locations ({franchises.length} franchises)</option>
              {cities.map((c) => {
                const count = franchises.filter((f) => f.city === c).length;
                return <option key={c} value={c}>{c} ({count})</option>;
              })}
            </select>
          </div>
          <div style={{ flex: '2', minWidth: '250px' }}>
            <label className="form-label">🔍 Search Products</label>
            <input
              type="text"
              placeholder="Search by product name or description..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          {selectedProducts.length > 0 && (
            <div style={{ alignSelf: 'flex-end' }}>
              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                🛒 {selectedProducts.length} product(s) selected
              </span>
            </div>
          )}
        </div>
      </div>

      {filteredFranchises.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No franchises match your filters. Try a different location or product search.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {filteredFranchises.map((f) => {
          const franchiseSelected = selectedProducts.filter((p) => p.franchiseId === f.id);
          return (
            <div className="card" key={f.id} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Franchise header */}
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', padding: '1.25rem 1.5rem',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '.15rem', fontSize: '1.05rem' }}>{f.name}</h3>
                  <div style={{ fontSize: '.75rem', opacity: .9 }}>
                    📍 {[f.city, f.state, f.country].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ fontSize: '.7rem', opacity: .7, marginTop: '.15rem' }}>Code: {f.code}</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,.2)', borderRadius: '50%',
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', fontWeight: 700,
                }}>
                  {f.name.charAt(0)}
                </div>
              </div>

              {/* Franchise details */}
              <div style={{ padding: '.75rem 1.5rem', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1.5rem', fontSize: '.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Revenue Share:</span>{' '}
                  <strong>{f.revenue_share_pct}%</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Products:</span>{' '}
                  <strong>{f.products.length}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Owner:</span>{' '}
                  <strong>{f.owner_name}</strong>
                </div>
              </div>

              {/* Products */}
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    📦 Products
                  </span>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  >
                    {expanded === f.id ? 'Collapse' : 'View All'}
                  </button>
                </div>

                {(expanded === f.id ? f.products : f.products.slice(0, 3)).map((p) => {
                  const isSelected = selectedProducts.some((s) => s.productId === p.id);
                  return (
                    <div key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '.8125rem',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      borderRadius: '4px', paddingLeft: isSelected ? '.5rem' : 0, paddingRight: isSelected ? '.5rem' : 0,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>
                          {CATEGORY_LABELS[p.category] || p.category} — {p.sku}
                        </div>
                        {p.description && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginTop: '.15rem' }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(p.price).toLocaleString('en-IN')}
                        </span>
                        <button
                          className="btn btn-sm"
                          onClick={() => toggleProduct(f.id, p)}
                          title={isSelected ? 'Remove from selection' : 'Add to inquiry'}
                          style={{
                            background: isSelected ? 'var(--primary)' : 'var(--surface)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            padding: '.15rem .4rem', fontSize: '.65rem', minWidth: '24px',
                          }}
                        >
                          {isSelected ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {f.products.length > 3 && expanded !== f.id && (
                  <div style={{ textAlign: 'center', padding: '.5rem 0 0', color: 'var(--text-muted)', fontSize: '.75rem' }}>
                    +{f.products.length - 3} more products — click "View All"
                  </div>
                )}

                {/* Selected products summary */}
                {franchiseSelected.length > 0 && (
                  <div style={{ marginTop: '.75rem', padding: '.75rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 600, marginBottom: '.5rem', color: 'var(--primary)' }}>
                      🛒 Selected Products ({franchiseSelected.length})
                    </div>
                    {franchiseSelected.map((sp) => (
                      <div key={sp.productId} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem 0', fontSize: '.75rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ flex: 1, fontWeight: 500 }}>{sp.productName}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '.7rem', whiteSpace: 'nowrap' }}>₹{parseFloat(sp.price).toLocaleString('en-IN')}</span>
                        <span style={{ color: 'var(--text-muted)' }}>×</span>
                        <input
                          type="number"
                          min="1"
                          value={sp.quantity}
                          onChange={(e) => updateQuantity(sp.productId, e.target.value)}
                          style={{ width: '50px', height: '28px', padding: '0 .25rem', textAlign: 'center', fontSize: '.75rem' }}
                        />
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: '60px', textAlign: 'right' }}>
                          ₹{(parseFloat(sp.price) * sp.quantity).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => toggleProduct(f.id, { id: sp.productId, name: sp.productName, price: sp.price })}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.8rem', padding: '0 .2rem' }}
                          title="Remove"
                        >×</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem', paddingTop: '.4rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, fontSize: '.8rem' }}>
                      <span>Estimated Total</span>
                      <span style={{ color: 'var(--primary)' }}>
                        ₹{franchiseSelected.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Inquire button */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                  onClick={() => openInquiry(f)}
                >
                  {franchiseSelected.length > 0
                    ? `💬 Send Inquiry (${franchiseSelected.length} product${franchiseSelected.length > 1 ? 's' : ''})`
                    : `💬 Inquire About ${f.name}`}
                </button>
              </div>

              {/* Inline chat popup */}
              {chatOpen === f.id && (
                <div style={{ padding: '0 1.5rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <div style={{ padding: '.75rem 0', fontSize: '.8125rem', fontWeight: 600, color: 'var(--text)' }}>
                    Send inquiry to {f.name}
                  </div>
                  {franchiseSelected.length > 0 && (
                    <div style={{ marginBottom: '.5rem', padding: '.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-xs)', fontSize: '.75rem', color: 'var(--text)' }}>
                      <strong>🛒 Your Order:</strong>
                      {franchiseSelected.map((p) => (
                        <div key={p.productId} style={{ paddingLeft: '.5rem', marginTop: '.15rem' }}>
                          {p.productName} × {p.quantity} = ₹{(parseFloat(p.price) * p.quantity).toLocaleString('en-IN')}
                        </div>
                      ))}
                      <div style={{ marginTop: '.3rem', fontWeight: 600 }}>
                        Total: ₹{franchiseSelected.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                  <textarea
                    rows={4}
                    style={{ minHeight: '90px' }}
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    placeholder={`Ask about ${f.name} products, pricing, or franchise opportunities...`}
                  />
                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => setChatOpen(null)}
                      style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 500 }}
                    >Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => startChat(f)} disabled={sending || !chatMsg.trim()}>
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
