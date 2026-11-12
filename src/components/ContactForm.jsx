import { useState } from 'react';
import { LeadAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../icons';

const SCALE_OPTIONS = ['1–5 locations', '6–20 locations', '21–100 locations', '100+ locations'];
const SCALE_MAP = { '1–5 locations': '1-5', '6–20 locations': '6-20', '21–100 locations': '21-100', '100+ locations': '100+' };

export default function ContactForm({ withScale = false, plain = false }) {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', scale: '', message: '' });

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await LeadAPI.create({
        full_name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        scale: SCALE_MAP[form.scale] || '',
        message: form.message,
      });
      setSent(true);
      toast(`Thanks, ${form.name}! We'll be in touch.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not send your message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setForm({ name: '', email: '', company: '', phone: '', scale: '', message: '' });
    setSent(false);
  }

  if (sent) {
    return (
      <div className="contact-success" style={plain ? { textAlign: 'center', padding: '1rem 0' } : undefined}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--success-light)', marginBottom: '.75rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', fontWeight: 600 }}>Message Sent</h3>
        <p className="text-muted" style={{ fontSize: '.8125rem' }}>We'll get back to you soon.</p>
        <button className={plain ? 'btn btn-secondary btn-sm' : 'btn-primary-hero'} onClick={reset} style={plain ? { marginTop: '.75rem' } : { marginTop: '1rem' }}>Send Another</button>
      </div>
    );
  }

  return (
    <div className={plain ? '' : 'contact-form-card'}>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full Name</label><input type="text" required placeholder="John Doe" value={form.name} onChange={set('name')} /></div>
          <div className="form-group"><label className="form-label">Email</label><input type="email" required placeholder="you@company.com" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Company</label><input type="text" placeholder="Your Company" value={form.company} onChange={set('company')} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} /></div>
        </div>
        {withScale && (
          <div className="form-group">
            <label className="form-label">Franchise Locations</label>
            <select value={form.scale} onChange={set('scale')}>
              <option value="">Select scale…</option>
              {SCALE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea rows="4" required placeholder="Tell us about your franchise and what you're looking for…" value={form.message} onChange={set('message')} />
        </div>
        <button type="submit" className={plain ? 'btn btn-primary' : 'btn-submit'} disabled={sending} style={plain ? { width: '100%', justifyContent: 'center', padding: '.625rem' } : undefined}>{sending ? 'Sending...' : 'Send Message'}</button>
      </form>
    </div>
  );
}
