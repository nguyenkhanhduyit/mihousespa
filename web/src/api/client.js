const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const TOKEN_KEY = 'mihouse_admin_token';
const USER_KEY = 'mihouse_admin_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};
export const setStoredUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));

/** Lỗi API có cấu trúc. */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Gọi API. Tự gắn Authorization token.
 * @param {string} path  ví dụ '/news/admin/list'
 * @param {object} opts  { method, body, params, auth }
 */
export async function request(path, opts = {}) {
  const { method = 'GET', body, params, auth = true, signal } = opts;

  let url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.append(k, v);
    });
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng.', 0, null);
  }

  let payload = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const msg = payload?.message || `Lỗi ${res.status}`;
    if (res.status === 401) {
      clearToken();
      if (!location.pathname.startsWith('/admin/login')) {
        location.href = '/admin/login?next=' + encodeURIComponent(location.pathname);
      }
    }
    throw new ApiError(msg, res.status, payload);
  }

  return payload;
}

/* ------------------------------------------------------------------ *
 *  Endpoint helpers
 * ------------------------------------------------------------------ */
export const api = {
  health: () => request('/health', { auth: false }),

  auth: {
    login: (username, password) =>
      request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    changePassword: (current_password, new_password) =>
      request('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  },

  news: {
    list: (params) => request('/news', { params, auth: false }),
    bySlug: (slug, lang) => request(`/news/slug/${encodeURIComponent(slug)}`, { params: { lang }, auth: false }),
    byId: (id) => request(`/news/${id}`, { auth: false }),
    adminList: (params) => request('/news/admin/list', { params }),
    adminGet: (id) => request(`/news/admin/${id}`),
    create: (data) => request('/news/admin', { method: 'POST', body: data }),
    update: (id, data) => request(`/news/admin/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/news/admin/${id}`, { method: 'DELETE' }),
    removeMany: (ids) => request('/news/admin/delete-many', { method: 'POST', body: { ids } }),
  },

  photo: {
    list: (params) => request('/photo', { params, auth: false }),
    types: () => request('/photo/types', { auth: false }),
    adminList: (params) => request('/photo/admin/list', { params }),
    adminGet: (id) => request(`/photo/admin/${id}`),
    create: (data) => request('/photo/admin', { method: 'POST', body: data }),
    update: (id, data) => request(`/photo/admin/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/photo/admin/${id}`, { method: 'DELETE' }),
    removeMany: (ids) => request('/photo/admin/delete-many', { method: 'POST', body: { ids } }),
    reorder: (items) => request('/photo/admin/reorder', { method: 'PUT', body: { items } }),
  },

  gallery: {
    list: (params) => request('/gallery', { params, auth: false }),
    groups: () => request('/gallery/groups', { auth: false }),
  },

  staticContent: {
    list: (params) => request('/static', { params, auth: false }),
    byType: (type) => request(`/static/${encodeURIComponent(type)}`, { auth: false }),
    adminList: () => request('/static/admin/list'),
    adminGet: (id) => request(`/static/admin/${id}`),
    create: (data) => request('/static/admin', { method: 'POST', body: data }),
    update: (id, data) => request(`/static/admin/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/static/admin/${id}`, { method: 'DELETE' }),
  },

  settings: {
    get: () => request('/settings', { auth: false }),
    update: (data) => request('/settings/admin', { method: 'PUT', body: data }),
  },

  seo: {
    list: () => request('/seo', { auth: false }),
    create: (data) => request('/seo/admin', { method: 'POST', body: data }),
    update: (id, data) => request(`/seo/admin/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/seo/admin/${id}`, { method: 'DELETE' }),
  },

  upload: {
    signature: () => request('/upload/signature'),
    gallery: () => request('/upload/gallery'),
    remove: (publicId) =>
      request(`/upload/${Buffer.from(publicId).toString('base64url')}`, { method: 'DELETE' }),
  },

  contact: {
    submit: (dataContact) => request('/contact', { method: 'POST', body: { dataContact }, auth: false }),
    adminList: (params) => request('/contact/admin/list', { params }),
    remove: (id) => request(`/contact/admin/${id}`, { method: 'DELETE' }),
    removeMany: (ids) => request('/contact/admin/delete-many', { method: 'POST', body: { ids } }),
  },
};

export default api;
