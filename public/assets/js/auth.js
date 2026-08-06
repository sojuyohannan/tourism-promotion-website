/* ══════════════════════════════════════════════════════════
   SHARED AUTH UTILITY — included on every page
   ════════════════════════════════════════════════════════ */
'use strict';

const Auth = (() => {
    const T_KEY = 'tp_token';
    const U_KEY = 'tp_user';
    const API   = '/api';

    function getToken()  { return localStorage.getItem(T_KEY); }
    function getUser()   { try { return JSON.parse(localStorage.getItem(U_KEY)); } catch { return null; } }
    function isLoggedIn(){ return !!getToken(); }
    function getRole()   { return getUser()?.role || null; }

    function setAuth(token, user) {
        localStorage.setItem(T_KEY, token);
        localStorage.setItem(U_KEY, JSON.stringify(user));
    }

    function clearAuth() {
        localStorage.removeItem(T_KEY);
        localStorage.removeItem(U_KEY);
    }

    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Session logout failed', e);
        }
        clearAuth();
        window.location.href = '/login.html';
    }

    // Redirect if not logged in, or wrong role
    function requireRole(role) {
        if (!isLoggedIn()) { window.location.href = '/login.html'; return false; }
        const r = getRole();
        if (role && r !== role) {
            const map = { admin: '/admin/', user: '/user/', provider: '/provider/' };
            window.location.href = map[r] || '/login.html';
            return false;
        }
        return true;
    }

    // Redirect logged-in users away from login/register
    function redirectIfLoggedIn() {
        if (!isLoggedIn()) return;
        const map = { admin: '/admin/', user: '/user/', provider: '/provider/' };
        window.location.href = map[getRole()] || '/';
    }

    // Authenticated fetch wrapper
    async function authFetch(url, opts = {}) {
        const token = getToken();
        const res = await fetch(url, {
            ...opts,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(opts.headers || {})
            }
        });
        if (res.status === 401) { logout(); return null; }
        return res;
    }

    // Update navbar dynamically on landing page
    function applyLandingNav() {
        const loginBtn  = document.getElementById('navLoginBtn');
        const regBtn    = document.getElementById('navRegBtn');
        const userMenu  = document.getElementById('navUserMenu');
        const userName  = document.getElementById('navUserName');
        const dashLink  = document.getElementById('navDashLink');

        if (!loginBtn) return;

        if (isLoggedIn()) {
            const u = getUser();
            const map = { admin: '/admin/', user: '/user/', provider: '/provider/' };
            loginBtn.classList.add('d-none');
            regBtn.classList.add('d-none');
            if (userMenu)  userMenu.classList.remove('d-none');
            if (userName)  userName.textContent = u?.name || 'Account';
            if (dashLink)  dashLink.href = map[u?.role] || '/';
        }
    }

    return { getToken, getUser, isLoggedIn, getRole, setAuth, clearAuth, logout, requireRole, redirectIfLoggedIn, authFetch, applyLandingNav, API };
})();
