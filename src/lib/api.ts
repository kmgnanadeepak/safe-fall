/**
 * REST API client for SafeFall Guardian backend.
 * Replaces Supabase client; all calls go to Express API.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('safefall_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: { message?: string }; status?: number }> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
  });
  const text = await res.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // non-JSON response
    }
  }
  if (!res.ok) {
    const err = (data as { message?: string }) || {};
    return { error: { message: (err as { message?: string }).message || res.statusText }, status: res.status, data };
  }
  return { data: data as T };
}

// --- Auth ---
export const authApi = {
  async login(email: string, password: string) {
    const res = await request<{ user: { id: string; email: string; name: string; role: string }; session: { access_token: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    if (res.error) return { error: new Error((res.error as { message?: string }).message || 'Login failed') };
    const token = res.data!.session.access_token;
    localStorage.setItem('safefall_token', token);
    return { data: { user: res.data!.user, session: res.data!.session }, error: null };
  },

  async register(email: string, password: string, name: string, role: 'patient' | 'hospital') {
    const res = await request<{ user: { id: string; email: string; name: string; role: string }; session: { access_token: string } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name, role }) }
    );
    if (res.error) return { error: new Error((res.error as { message?: string }).message || 'Registration failed') };
    const token = res.data!.session.access_token;
    localStorage.setItem('safefall_token', token);
    return { data: { user: res.data!.user, session: res.data!.session }, error: null };
  },

  async getSession() {
    const res = await request<{ user: { id: string; email: string; name: string; role: string } }>('/api/auth/me');
    if (res.error || !res.data?.user) return { data: { user: null }, error: res.error ? new Error((res.error as { message?: string }).message) : null };
    return { data: { user: res.data.user }, error: null };
  },

  logout() {
    localStorage.removeItem('safefall_token');
    return request('/api/auth/logout', { method: 'POST' });
  },
};

// --- Fall events ---
export const falleventsApi = {
  list() {
    return request<Array<Record<string, unknown>>>('/api/fallevents').then((r) => (r.error ? { data: [], error: r.error } : { data: r.data!, error: null }));
  },

  listHospitalDashboard() {
    return request<Array<Record<string, unknown>>>('/api/fallevents/hospital-dashboard').then((r) =>
      r.error ? { data: [], error: r.error } : { data: r.data!, error: null }
    );
  },

  create(payload: { latitude?: number; longitude?: number; is_emergency?: boolean }) {
    return request<Record<string, unknown>>('/api/fallevents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: Partial<{ is_emergency: boolean; resolved: boolean; resolved_at: string; resolved_by: string; latitude: number; longitude: number; notes: string }>) {
    return request<Record<string, unknown>>(`/api/fallevents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

// --- Sensor data ---
export const sensordataApi = {
  create(payload: {
    accelerometer_x?: number;
    accelerometer_y?: number;
    accelerometer_z?: number;
    gyroscope_x?: number;
    gyroscope_y?: number;
    gyroscope_z?: number;
  }) {
    return request<Record<string, unknown>>('/api/sensordata', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// --- Notifications ---
export const notificationsApi = {
  list() {
    return request<Array<Record<string, unknown>>>('/api/notifications').then((r) =>
      r.error ? { data: [], error: r.error } : { data: r.data!, error: null }
    );
  },

  markRead(id: string) {
    return request(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
  },

  markAllRead() {
    return request('/api/notifications/mark-all-read', { method: 'PATCH' });
  },

  unreadCount() {
    return request<{ count: number }>('/api/notifications/unread-count').then((r) =>
      r.data ? { count: r.data.count } : { count: 0 }
    );
  },

  create(payload: { user_id: string; type: string; title: string; message: string; related_event_id?: string }) {
    return request<Record<string, unknown>>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// --- Health profile ---
export const healthApi = {
  get(userId?: string) {
    const q = userId ? `?user_id=${userId}` : '';
    return request<Record<string, unknown> | null>(`/api/health${q}`);
  },

  put(payload: { age?: number | null; gender?: string | null; blood_group?: string | null; conditions?: string | null; allergies?: string | null; notes?: string | null }) {
    return request<Record<string, unknown>>('/api/health', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

// --- Emergency contacts ---
export const emergencyContactsApi = {
  list() {
    return request<Array<Record<string, unknown>>>('/api/emergency-contacts').then((r) =>
      r.error ? { data: [], error: r.error } : { data: r.data!, error: null }
    );
  },

  create(payload: { name: string; relation: string; phone: string }) {
    return request<Record<string, unknown>>('/api/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: { name?: string; relation?: string; phone?: string }) {
    return request<Record<string, unknown>>(`/api/emergency-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: string) {
    return request(`/api/emergency-contacts/${id}`, { method: 'DELETE' });
  },
};

// --- History (fall events for current user) ---
export const historyApi = {
  list() {
    return request<Array<Record<string, unknown>>>('/api/history').then((r) =>
      r.error ? { data: [], error: r.error } : { data: r.data!, error: null }
    );
  },
};

// --- Analytics ---
export const analyticsApi = {
  get() {
    return request<{
      totalFalls: number;
      emergencies: number;
      falseAlarms: number;
      lastWeekFalls: number;
      avgFallsPerWeek: number;
      mostRecentFall: string | null;
      events: Array<Record<string, unknown>>;
    }>('/api/analytics');
  },
};

export { getToken, API_BASE };
