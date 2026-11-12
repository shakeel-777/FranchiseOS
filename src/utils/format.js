// FranchiseOS — Shared formatting & role helpers (mirrors the original js/utils.js)

export const ROLE_RANK = { user: 1, store_manager: 2, franchise_owner: 3, admin: 4 };

// Which roles may open which page. Missing from this map = every signed-in role can open it.
export const ROUTE_MIN_ROLE = {
  users: 'admin',
  audit: 'admin',
};

// Pages that need real franchise operations data. A brand-new sign-up has no
// franchise until an admin approves/assigns one, so these stay locked until then.
export const FRANCHISE_REQUIRED_ROUTES = [
  'franchises', 'products', 'inventory', 'sales', 'expenses',
  'approvals', 'compliance', 'marketing', 'reports',
];

export function myRole(currentUser) {
  return (currentUser && (currentUser.role || (currentUser.user && currentUser.user.role))) || 'user';
}
export function roleMeets(currentUser, minRole) {
  return (ROLE_RANK[myRole(currentUser)] || 0) >= (ROLE_RANK[minRole] || 0);
}
export function isAdminUser(currentUser) {
  return !!(currentUser && (currentUser.is_admin || myRole(currentUser) === 'admin'));
}
export function hasFranchiseAccess(currentUser) {
  if (!currentUser) return false;
  if (isAdminUser(currentUser)) return true;
  return !!(currentUser.franchise || (currentUser.franchises && currentUser.franchises.length > 0));
}
export function canOpenRoute(currentUser, hash) {
  const min = ROUTE_MIN_ROLE[hash];
  if (min && !roleMeets(currentUser, min)) return false;
  if (FRANCHISE_REQUIRED_ROUTES.includes(hash) && !hasFranchiseAccess(currentUser)) return false;
  return true;
}

export function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}
export function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
export function roleLabel(r) {
  const m = {
    admin: 'Corporate Admin',
    franchise_owner: 'Franchise Owner',
    store_manager: 'Store Manager',
    user: 'User',
  };
  return m[r] || r;
}
export function badgeClass(s) {
  const m = {
    active: 'green', pending: 'amber', suspended: 'red', inactive: 'gray', paid: 'green', partial: 'amber',
    refunded: 'red', approved: 'green', rejected: 'red', cancelled: 'gray', pass: 'green', fail: 'red',
    completed: 'green', in_progress: 'blue', planned: 'amber', compliant: 'green', non_compliant: 'red',
    in_review: 'amber', draft: 'gray', paused: 'amber',
  };
  return 'badge badge-' + (m[s] || 'gray');
}
export function searchFilter(data, query, fields) {
  if (!query) return data;
  const q = query.toLowerCase();
  return data.filter((item) => fields.some((f) => String(item[f] || '').toLowerCase().includes(q)));
}
export function paginate(data, page, perPage = 8) {
  page = page || 1;
  const total = Math.ceil(data.length / perPage) || 1;
  const slice = data.slice((page - 1) * perPage, page * perPage);
  return { slice, total, page };
}
