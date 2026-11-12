// FranchiseOS — Real API Client (Django REST Framework)
// Allow an explicit override (set window.FOS_API_BASE before this loads, e.g.
// via a small env/config), otherwise fall back to same-origin '/api' when this
// page isn't served from localhost/127.0.0.1, and to the Django dev server's
// default port when it is.
export const API =
  window.FOS_API_BASE ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:8001/api'
    : window.location.origin + '/api');

export function getToken() {
  // sessionStorage is per-tab — prevents cross-tab token sharing
  // that would make admin messages appear as a different user
  return sessionStorage.getItem('fos_token') || localStorage.getItem('fos_token');
}
export function setToken(t) {
  sessionStorage.setItem('fos_token', t);
  localStorage.setItem('fos_token', t);
}
export function clearToken() {
  sessionStorage.removeItem('fos_token');
  localStorage.removeItem('fos_token');
}

export async function apiFetch(path, opts = {}) {
  const headers = { ...opts.headers };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (opts.body) {
    if (typeof opts.body === 'object') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    } else if (typeof opts.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }
  if (!navigator.onLine) throw new Error('You are offline. Please check your connection and try again.');
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers });
  } catch (netErr) {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }
  if (res.status === 204) return null;
  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && (data.detail || JSON.stringify(data))) || 'Request failed (' + res.status + ')');
  }
  return data;
}

// Auth
export const AuthAPI = {
  login: (username, password) => apiFetch('/token/', { method: 'POST', body: { username, password } }),
  register: (data) => apiFetch('/auth/register/', { method: 'POST', body: data }),
  me: () => apiFetch('/auth/me/'),
  dashboard: () => apiFetch('/auth/dashboard/'),
};

// CRUD helpers returning { list, get, create, update, remove }
export function crud(path) {
  return {
    list: (params = '') => apiFetch(path + '/' + (params ? '?' + new URLSearchParams(params).toString() : '')),
    get: (id) => apiFetch(path + '/' + id + '/'),
    create: (data) => apiFetch(path + '/', { method: 'POST', body: data }),
    update: (id, data) => apiFetch(path + '/' + id + '/', { method: 'PATCH', body: data }),
    remove: (id) => apiFetch(path + '/' + id + '/', { method: 'DELETE' }),
  };
}

export const FranchiseAPI = crud('/franchises');
export const ProductAPI = crud('/products');
export const InventoryAPI = crud('/inventory');
export const SaleAPI = crud('/sales');
export const ExpenseAPI = crud('/expenses');
export const ApprovalAPI = crud('/approvals');
export const ChecklistAPI = crud('/compliance/checklists');
export const ComplianceRecordAPI = crud('/compliance/records');
export const CampaignAPI = crud('/marketing');
export const ReportAPI = crud('/reports');
export const NotificationAPI = crud('/notifications');
export const AuditAPI = crud('/audit');

// Public marketing "Get In Touch" leads (create is public/unauthenticated;
// list/retrieve is staff-only, enforced server-side).
export const LeadAPI = crud('/marketing/leads');

// Users — not a plain DRF router (list/create/detail live on separate
// paths), so this is hand-rolled rather than crud().
export const UserAPI = {
  list: () => apiFetch('/users/'),
  create: (data) => apiFetch('/users/create/', { method: 'POST', body: data }),
  get: (id) => apiFetch('/users/' + id + '/'),
  update: (id, data) => apiFetch('/users/' + id + '/', { method: 'PATCH', body: data }),
};

export const NotificationActions = {
  markRead: (id) => apiFetch('/notifications/' + id + '/mark_read/', { method: 'POST' }),
  markAllRead: () => apiFetch('/notifications/mark_all_read/', { method: 'POST' }),
};

export const ProfileAPI = {
  update: (data) => apiFetch('/auth/profile/', { method: 'PATCH', body: data }),
  changePassword: (data) => apiFetch('/auth/change-password/', { method: 'POST', body: data }),
};
