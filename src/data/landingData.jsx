import { Icon } from '../icons';

export const FEATURES = [
  { img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=280&fit=crop&auto=format', title: 'Multi-Location', desc: 'Every franchise unit in one place, with role-based access so each franchisee only sees their own numbers.' },
  { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=280&fit=crop&auto=format', title: 'Live Analytics', desc: 'Revenue trends and sales velocity, updated in real time across the network — not a nightly batch job.' },
  { img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=280&fit=crop&auto=format', title: 'Compliance', desc: 'Regulatory checks and deadline tracking, so filings don\'t slip through the cracks.' },
  { img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=280&fit=crop&auto=format', title: 'Inventory', desc: 'Stock levels and restock alerts, per location.' },
  { img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=280&fit=crop&auto=format', title: 'Sales & Revenue', desc: 'From POS to P&L — transactions, invoices, and payments in one revenue lifecycle.' },
  { img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=280&fit=crop&auto=format', title: 'Approvals', desc: 'Configurable approval chains for expenses, purchase orders, and franchise requests.' },
  { img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=280&fit=crop&auto=format', title: 'Audit Trail', desc: 'Every action and change logged, giving franchisor and franchisee the same transparent history to look back on.' },
];

export const MODULES = [
  { icon: 'building', label: 'Franchises' }, { icon: 'users', label: 'Users' },
  { icon: 'box', label: 'Products' }, { icon: 'chart', label: 'Inventory' },
  { icon: 'dollar', label: 'Sales' }, { icon: 'credit', label: 'Expenses' },
  { icon: 'check', label: 'Approvals' }, { icon: 'shield', label: 'Compliance' },
  { icon: 'megaphone', label: 'Marketing' }, { icon: 'pie', label: 'Reports' },
  { icon: 'bell', label: 'Alerts' }, { icon: 'file', label: 'Audit Log' },
  { icon: 'settings', label: 'Settings' },
];

export const STATS = [
  { value: '200+', label: 'Active Franchises', icon: 'building' },
  { value: '15K+', label: 'Daily Transactions', icon: 'dollar' },
  { value: '99.9%', label: 'Uptime', icon: 'shield' },
];

export const FAQS = [
  { q: 'Can I try FranchiseOS before committing?', a: 'Absolutely. Sign up and get full access for 14 days — no credit card, no sales call required. We want you to see the value firsthand.' },
  { q: 'How does franchisee data isolation work?', a: 'Each franchisee sees only their own data — sales, inventory, staff. The franchisor admin can view all locations. This is enforced server-side, not just hidden in the UI.' },
  { q: 'Does this work on Windows and Linux?', a: 'Yes. The entire platform runs identically on Windows, Linux, and macOS. Development uses the same commands across all three.' },
  { q: 'What about my existing POS or accounting system?', a: 'FranchiseOS provides a REST API. We integrate with most major POS and accounting platforms. Custom integrations available for enterprise plans.' },
  { q: 'Is my data secure?', a: 'All data encrypted in transit and at rest. JWT authentication with role-based access control. Complete audit logging. Regular security audits.' },
];

const ICON_COLORS = ['#4f46e5','#0d9488','#f59e0b','#ef4444','#8b5cf6','#10b981','#6366f1'];

export function renderFeatureCells() {
  return FEATURES.map((f, i) => {
    const isLast = i === FEATURES.length - 1;
    return (
      <div className={`feature-cell${isLast ? ' feature-cell-wide' : ''}`} key={f.title}>
        <div className="feature-img">
          <img src={f.img} alt={f.title} loading="lazy" />
        </div>
        <h4>{f.title}</h4>
        <p>{f.desc}</p>
        {!isLast && <span className="feature-cell-num">0{i + 1}</span>}
      </div>
    );
  });
}
