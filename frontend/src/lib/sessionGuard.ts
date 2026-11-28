import api from '../services/api';
import { clearSession } from './auth';

// If the server says the session is no longer valid (token expired, account deactivated),
// sign out and go to the login page instead of showing "Unauthorized" on every screen.
let installed = false;
if (!installed) {
  installed = true;
  api.interceptors.response.use(
    (res) => res,
    (error) => {
      const url: string = error?.config?.url ?? '';
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
      if (error?.response?.status === 401 && !isAuthCall && window.location.pathname !== '/login') {
        clearSession();
        window.location.assign('/login?expired=1');
      }
      return Promise.reject(error);
    },
  );
}
export {};
