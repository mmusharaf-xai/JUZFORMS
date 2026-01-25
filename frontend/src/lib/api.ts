import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  signup: (data: { first_name: string; last_name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { first_name: string; last_name: string; old_password?: string; new_password?: string }) =>
    api.put('/auth/profile', data),
  deleteAccount: () => api.delete('/auth/account'),
};

// Forms API
export const formsApi = {
  getForms: () => api.get('/forms'),
  getForm: (id: string) => api.get(`/forms/${id}`),
  getPublicForm: (id: string) => api.get(`/forms/public/${id}`),
  createForm: (data: { name: string }) => api.post('/forms', data),
  updateForm: (id: string, data: Partial<{
    name: string;
    fields: unknown[];
    header_config: unknown;
    footer_config: unknown;
    is_published: boolean;
  }>) => api.put(`/forms/${id}`, data),
  deleteForm: (id: string) => api.delete(`/forms/${id}`),
  submitForm: (id: string, data: Record<string, unknown>) =>
    api.post(`/forms/public/${id}/submit`, { data }),
  getFormSubmissions: (id: string) => api.get(`/forms/${id}/submissions`),
  getDeletedForms: (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get(`/forms/archives/deleted?${queryParams.toString()}`);
  },
  restoreForm: (id: string) => api.post(`/forms/${id}/restore`),
  permanentDeleteForm: (id: string) => api.delete(`/forms/${id}/permanent`),
  bulkRestoreForms: (data: { ids?: string[]; selectedAll?: boolean; search: string }) =>
    api.post('/forms/archives/bulk-restore', data),
  bulkDeleteForms: (data: { ids?: string[]; selectedAll?: boolean; search: string }) =>
    api.post('/forms/archives/bulk-delete', data),
};

// Database API
export const databaseApi = {
  getDatabases: () => api.get('/databases'),
  getDatabase: (id: string) => api.get(`/databases/${id}`),
  createDatabase: (data: { name: string }) => api.post('/databases', data),
  updateDatabase: (id: string, data: { name: string }) =>
    api.put(`/databases/${id}`, data),
  deleteDatabase: (id: string) => api.delete(`/databases/${id}`),

  // Columns
  addColumn: (dbId: string, data: { name: string; type: string; is_unique?: boolean }) =>
    api.post(`/databases/${dbId}/columns`, data),
  updateColumn: (dbId: string, colId: string, data: { name?: string; type?: string; is_unique?: boolean }) =>
    api.put(`/databases/${dbId}/columns/${colId}`, data),
  deleteColumn: (dbId: string, colId: string) =>
    api.delete(`/databases/${dbId}/columns/${colId}`),

  // Rows
  getRows: (dbId: string, params?: { sort_by?: string; sort_order?: string; filters?: string }) =>
    api.get(`/databases/${dbId}/rows`, { params }),
  addRow: (dbId: string, data: Record<string, unknown>) =>
    api.post(`/databases/${dbId}/rows`, { data }),
  updateRow: (dbId: string, rowId: string, data: Record<string, unknown>) =>
    api.put(`/databases/${dbId}/rows/${rowId}`, { data }),
  deleteRow: (dbId: string, rowId: string) =>
    api.delete(`/databases/${dbId}/rows/${rowId}`),

  // Archives
  getDeletedDatabases: (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get(`/databases/archives/databases?${queryParams.toString()}`);
  },
  restoreDatabase: (id: string) => api.post(`/databases/${id}/restore`),
  permanentDeleteDatabase: (id: string) => api.delete(`/databases/${id}/permanent`),
  getDatabasesWithDeletedRows: (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get(`/databases/archives/rows/databases?${queryParams.toString()}`);
  },
  getDeletedRows: (params?: { search?: string; page?: number; limit?: number; database_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.database_id) queryParams.append('database_id', params.database_id);
    return api.get(`/databases/archives/rows?${queryParams.toString()}`);
  },
  restoreRow: (id: string) => api.post(`/databases/rows/${id}/restore`),
  permanentDeleteRow: (id: string) => api.delete(`/databases/rows/${id}/permanent`),
  bulkRestoreDatabases: (data: { ids?: string[]; selectedAll?: boolean; search: string }) =>
    api.post('/databases/archives/bulk-restore', data),
  bulkDeleteDatabases: (data: { ids?: string[]; selectedAll?: boolean; search: string }) =>
    api.post('/databases/archives/bulk-delete', data),
  bulkRestoreRows: (data: { ids?: string[]; selectedAll?: boolean; search: string; database_id?: string }) =>
    api.post('/databases/archives/rows/bulk-restore', data),
  bulkDeleteRows: (data: { ids?: string[]; selectedAll?: boolean; search: string; database_id?: string }) =>
    api.post('/databases/archives/rows/bulk-delete', data),
};

// Stats API
export const statsApi = {
  getStats: () => api.get('/stats'),
};
