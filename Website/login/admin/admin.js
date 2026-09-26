/* ===================================
   RAKTechSoftHub — Admin Portal JS
   Multi-User + Role-Based Access
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════
    //  DATA KEYS & DEFAULTS
    // ═══════════════════════════════════
    const KEYS = {
        users: 'rak_admin_users',
        session: 'rak_admin_session',
        inquiries: 'rak_inquiries',
        newsletter: 'rak_newsletter',
        settings: 'rak_site_settings'
    };

    const DEFAULT_SETTINGS = {
        email: 'raktechsofthub@gmail.com',
        phone: '+923343096932',
        whatsapp: '923343096932',
        whatsappMsg: "Hi RAKTechSoftHub! I'm interested in your services.",
        companyDesc: 'Global provider of industrial-grade IT, infrastructure, and digital creative services. Engineering the future, one byte and bolt at a time.',
        copyright: '© 2026 RAKTechSoftHub. All rights reserved.'
    };

    // ═══════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════
    // ═══════════════════════════════════
    //  ROBUST STORAGE UTILITIES (Cookie Fallbacks)
    // ═══════════════════════════════════
    const Storage = {
        isSupported() {
            try {
                const x = '__storage_test__';
                localStorage.setItem(x, x);
                localStorage.removeItem(x);
                return true;
            } catch (e) {
                return false;
            }
        },
        getItem(key) {
            try {
                if (this.isSupported()) {
                    return localStorage.getItem(key);
                }
            } catch (e) {}
            return this.getCookie(key);
        },
        setItem(key, value) {
            try {
                if (this.isSupported()) {
                    localStorage.setItem(key, value);
                    return;
                }
            } catch (e) {}
            this.setCookie(key, value, 365);
        },
        removeItem(key) {
            try {
                if (this.isSupported()) {
                    localStorage.removeItem(key);
                    return;
                }
            } catch (e) {}
            this.eraseCookie(key);
        },
        setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
        },
        getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        },
        eraseCookie(name) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        }
    };

    const SessionStorage = {
        isSupported() {
            try {
                const x = '__storage_test__';
                sessionStorage.setItem(x, x);
                sessionStorage.removeItem(x);
                return true;
            } catch (e) {
                return false;
            }
        },
        getItem(key) {
            try {
                if (this.isSupported()) {
                    return sessionStorage.getItem(key);
                }
            } catch (e) {}
            return this.getCookie(key);
        },
        setItem(key, value) {
            try {
                if (this.isSupported()) {
                    sessionStorage.setItem(key, value);
                    return;
                }
            } catch (e) {}
            this.setCookie(key, value);
        },
        removeItem(key) {
            try {
                if (this.isSupported()) {
                    sessionStorage.removeItem(key);
                    return;
                }
            } catch (e) {}
            this.eraseCookie(key);
        },
        setCookie(name, value) {
            document.cookie = name + "=" + encodeURIComponent(value || "") + "; path=/; SameSite=Lax";
        },
        getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        },
        eraseCookie(name) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        }
    };

    function getUsers() {
        try {
            const users = JSON.parse(Storage.getItem(KEYS.users));
            if (users && users.length > 0) return users;
        } catch {}
        // Default admin user
        const defaultUsers = [
            { id: 'default_admin', username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() }
        ];
        try {
            Storage.setItem(KEYS.users, JSON.stringify(defaultUsers));
        } catch {}
        return defaultUsers;
    }
    function saveUsers(data) {
        try {
            Storage.setItem(KEYS.users, JSON.stringify(data));
        } catch {}
    }
    function getCurrentUser() {
        try { return JSON.parse(SessionStorage.getItem(KEYS.session)); } catch { return null; }
    }
    function setCurrentUser(user) {
        try {
            SessionStorage.setItem(KEYS.session, JSON.stringify({ username: user.username, role: user.role }));
        } catch {}
    }
    function clearSession() {
        try {
            SessionStorage.removeItem(KEYS.session);
        } catch {}
    }
    function isAdmin() {
        const u = getCurrentUser();
        return u && u.role === 'admin';
    }
    function getInquiries() {
        try { return JSON.parse(Storage.getItem(KEYS.inquiries)) || []; }
        catch { return []; }
    }
    function saveInquiries(data) {
        try {
            Storage.setItem(KEYS.inquiries, JSON.stringify(data));
        } catch {}
    }
    function getNewsletter() {
        try { return JSON.parse(Storage.getItem(KEYS.newsletter)) || []; }
        catch { return []; }
    }
    function saveNewsletter(data) {
        try {
            Storage.setItem(KEYS.newsletter, JSON.stringify(data));
        } catch {}
    }
    function getSettings() {
        try {
            const s = JSON.parse(Storage.getItem(KEYS.settings));
            if (s) {
                let migrated = false;
                if (s.email === 'consult@raktech.soft') {
                    s.email = 'raktechsofthub@gmail.com';
                    migrated = true;
                }
                if (s.phone === '+1 (555) 987-6543' || s.phone === '+923092003125') {
                    s.phone = '+923343096932';
                    migrated = true;
                }
                if (s.whatsapp === '923092003125') {
                    s.whatsapp = '923343096932';
                    migrated = true;
                }
                if (migrated) {
                    try { Storage.setItem(KEYS.settings, JSON.stringify(s)); } catch {}
                }
                return { ...DEFAULT_SETTINGS, ...s };
            }
            return { ...DEFAULT_SETTINGS };
        } catch { return { ...DEFAULT_SETTINGS }; }
    }
    function saveSettings(data) {
        try {
            Storage.setItem(KEYS.settings, JSON.stringify(data));
        } catch {}
    }
    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    function isToday(iso) {
        if (!iso) return false;
        const d = new Date(iso);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    // Service label mapping
    const SERVICE_LABELS = {
        'seo': 'SEO Optimization',
        'meta-ads': 'Meta Ads',
        'google-ads': 'Google Ads',
        'social-media': 'Social Media',
        'web-dev': 'Web Design & Dev',
        'mobile-app': 'Mobile App Dev',
        'analytics': 'Analytics & Reporting',
        'creative': 'Creative Media',
        'network': 'Network Setup',
        'routing': 'Routing & Switching',
        'server': 'Server Deployment',
        'security': 'Physical Security',
        'digital': 'Digital & Marketing',
        'infrastructure': 'IT Infrastructure'
    };

    // ═══════════════════════════════════
    //  DOM REFERENCES
    // ═══════════════════════════════════
    const loginScreen = document.getElementById('loginScreen');
    const adminApp = document.getElementById('adminApp');
    const loginForm = document.getElementById('loginForm');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
    const topbarTitle = document.getElementById('topbarTitle');
    const refreshBtn = document.getElementById('refreshBtn');
    const toastContainer = document.getElementById('toastContainer');

    // Dashboard
    const dashTotalInq = document.getElementById('dashTotalInq');
    const dashNewInq = document.getElementById('dashNewInq');
    const dashSubscribers = document.getElementById('dashSubscribers');
    const dashCompleted = document.getElementById('dashCompleted');
    const dashRecentTable = document.getElementById('dashRecentTable');
    const dashViewAll = document.getElementById('dashViewAll');

    // Inquiries
    const inqTableBody = document.getElementById('inqTableBody');
    const inqSearch = document.getElementById('inqSearch');
    const inqFilter = document.getElementById('inqFilter');
    const inqDeleteAll = document.getElementById('inqDeleteAll');
    const inqExport = document.getElementById('inqExport');
    const sidebarInqCount = document.getElementById('sidebarInqCount');

    // Newsletter
    const nlTableBody = document.getElementById('nlTableBody');
    const nlSearch = document.getElementById('nlSearch');
    const nlExport = document.getElementById('nlExport');
    const nlDeleteAll = document.getElementById('nlDeleteAll');

    // Users
    const addUserForm = document.getElementById('addUserForm');
    const newUsername = document.getElementById('newUsername');
    const newPassword = document.getElementById('newPassword');
    const newRole = document.getElementById('newRole');
    const usersTableBody = document.getElementById('usersTableBody');

    // Settings
    const setEmail = document.getElementById('setEmail');
    const setPhone = document.getElementById('setPhone');
    const setWhatsApp = document.getElementById('setWhatsApp');
    const setWhatsAppMsg = document.getElementById('setWhatsAppMsg');
    const setCompanyDesc = document.getElementById('setCompanyDesc');
    const setCopyright = document.getElementById('setCopyright');
    const setCurrentPass = document.getElementById('setCurrentPass');
    const setNewPass = document.getElementById('setNewPass');
    const setConfirmPass = document.getElementById('setConfirmPass');
    const setCurrentUserEl = document.getElementById('setCurrentUser');
    const settingsSave = document.getElementById('settingsSave');
    const settingsCancel = document.getElementById('settingsCancel');
    const setExportAll = document.getElementById('setExportAll');
    const setResetAll = document.getElementById('setResetAll');

    // Modal
    const inqModal = document.getElementById('inqModal');
    const inqModalClose = document.getElementById('inqModalClose');
    const inqModalBody = document.getElementById('inqModalBody');
    const inqModalFooter = document.getElementById('inqModalFooter');

    // Confirm Dialog
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmDesc = document.getElementById('confirmDesc');
    const confirmCancel = document.getElementById('confirmCancel');
    const confirmOk = document.getElementById('confirmOk');
    let confirmCallback = null;

    // ═══════════════════════════════════
    //  TOAST SYSTEM
    // ═══════════════════════════════════
    function showToast(icon, title, message, duration = 3000) {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <strong>${title}</strong>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Close notification">✕</button>
            <div class="toast-progress" style="--duration: ${duration}ms"></div>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
        toastContainer.appendChild(toast);
        setTimeout(() => dismissToast(toast), duration);
    }
    function dismissToast(toast) {
        if (toast.classList.contains('toast-out')) return;
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 400);
    }

    // ═══════════════════════════════════
    //  CONFIRM DIALOG
    // ═══════════════════════════════════
    function showConfirm(title, desc, callback) {
        confirmTitle.textContent = title;
        confirmDesc.textContent = desc;
        confirmCallback = callback;
        confirmDialog.classList.add('active');
    }
    confirmCancel.addEventListener('click', () => {
        confirmDialog.classList.remove('active');
        confirmCallback = null;
    });
    confirmOk.addEventListener('click', () => {
        confirmDialog.classList.remove('active');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });

    // ═══════════════════════════════════
    //  ROLE-BASED ACCESS
    // ═══════════════════════════════════
    function applyRoleAccess() {
        const admin = isAdmin();
        // Users sidebar link — only visible to admin
        sidebarLinks.forEach(link => {
            if (link.dataset.page === 'users') {
                link.style.display = admin ? '' : 'none';
            }
        });
        // Hide destructive buttons for viewers
        if (inqDeleteAll) inqDeleteAll.style.display = admin ? '' : 'none';
        if (nlDeleteAll) nlDeleteAll.style.display = admin ? '' : 'none';
        if (setResetAll) setResetAll.style.display = admin ? '' : 'none';

        // Show current username in settings
        const cur = getCurrentUser();
        if (setCurrentUserEl && cur) setCurrentUserEl.textContent = cur.username;
    }

    // ═══════════════════════════════════
    //  LOGIN / LOGOUT
    // ═══════════════════════════════════
    function checkSession() {
        const user = getCurrentUser();
        if (user) {
            // Verify user still exists
            const users = getUsers();
            const exists = users.find(u => u.username === user.username);
            if (exists) {
                showApp();
                return;
            }
            clearSession();
        }
    }
    function showApp() {
        loginScreen.style.display = 'none';
        adminApp.classList.add('active');
        applyRoleAccess();
        refreshAllData();
    }
    function logout() {
        clearSession();
        adminApp.classList.remove('active');
        loginScreen.style.display = '';
        loginUsername.value = '';
        loginPassword.value = '';
        loginError.textContent = '';
        showToast('👋', 'Logged Out', 'You have been logged out.');
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUsername.value.trim().toLowerCase();
        const password = loginPassword.value;

        const users = getUsers();
        const user = users.find(u => u.username.toLowerCase() === username && u.password === password);

        if (user) {
            setCurrentUser(user);
            loginError.textContent = '';
            showApp();
            showToast('✅', `Welcome, ${user.username}!`, `Logged in as ${user.role}.`);
        } else {
            loginError.textContent = 'Invalid username or password.';
            loginPassword.value = '';
            loginPassword.focus();
        }
    });

    logoutBtn.addEventListener('click', logout);
    checkSession();

    // ═══════════════════════════════════
    //  SIDEBAR NAVIGATION
    // ═══════════════════════════════════
    const pageTitles = {
        dashboard: 'Dashboard',
        inquiries: 'Inquiries',
        newsletter: 'Newsletter',
        users: 'User Management',
        settings: 'Settings'
    };

    function navigateTo(page) {
        // Block non-admins from Users page
        if (page === 'users' && !isAdmin()) {
            showToast('🚫', 'Access Denied', 'Only admins can manage users.');
            return;
        }
        sidebarLinks.forEach(l => l.classList.toggle('active', l.dataset.page === page));
        document.querySelectorAll('.admin-page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });
        topbarTitle.textContent = pageTitles[page] || page;
        closeMobileSidebar();
        refreshAllData();
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    dashViewAll.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('inquiries');
    });

    // Mobile sidebar
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay.classList.toggle('active');
    });
    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    function closeMobileSidebar() {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
    }

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        refreshAllData();
        showToast('🔄', 'Refreshed', 'Data has been refreshed.');
    });

    // ═══════════════════════════════════
    //  REFRESH ALL DATA
    // ═══════════════════════════════════
    function refreshAllData() {
        renderDashboard();
        renderInquiries();
        renderNewsletter();
        renderUsers();
        loadSettings();
        updateBadges();
    }

    // ═══════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════
    function renderDashboard() {
        const inqs = getInquiries();
        const nls = getNewsletter();

        const total = inqs.length;
        const newToday = inqs.filter(i => i.status === 'new' && isToday(i.date)).length;
        const completed = inqs.filter(i => i.status === 'completed').length;
        const subs = nls.length;

        animateNumber(dashTotalInq, total);
        animateNumber(dashNewInq, newToday);
        animateNumber(dashSubscribers, subs);
        animateNumber(dashCompleted, completed);

        const recent = [...inqs].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        if (recent.length === 0) {
            dashRecentTable.innerHTML = `<tr><td colspan="4">
                <div class="empty-state" style="padding:40px 24px">
                    <span class="material-symbols-outlined">inbox</span>
                    <div class="empty-state-title">No inquiries yet</div>
                    <div class="empty-state-desc">When visitors submit the contact form, their inquiries will appear here.</div>
                </div>
            </td></tr>`;
        } else {
            dashRecentTable.innerHTML = recent.map(i => `
                <tr style="cursor:pointer" data-inq-id="${i.id}">
                    <td class="cell-name">${escapeHtml(i.name)}</td>
                    <td>${SERVICE_LABELS[i.service] || escapeHtml(i.service) || '—'}</td>
                    <td class="cell-date">${formatDate(i.date)}</td>
                    <td><span class="status-badge ${i.status}">${i.status === 'in-progress' ? 'In Progress' : i.status}</span></td>
                </tr>
            `).join('');
            dashRecentTable.querySelectorAll('tr[data-inq-id]').forEach(row => {
                row.addEventListener('click', () => openInquiryModal(row.dataset.inqId));
            });
        }
    }

    function animateNumber(el, target) {
        const duration = 600;
        const start = parseInt(el.textContent) || 0;
        if (start === target) { el.textContent = target; return; }
        const startTime = performance.now();
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        }
        requestAnimationFrame(update);
    }

    // ═══════════════════════════════════
    //  INQUIRIES TABLE
    // ═══════════════════════════════════
    function renderInquiries() {
        const inqs = getInquiries();
        const search = inqSearch.value.toLowerCase().trim();
        const filter = inqFilter.value;

        let filtered = inqs;
        if (search) {
            filtered = filtered.filter(i =>
                (i.name || '').toLowerCase().includes(search) ||
                (i.company || '').toLowerCase().includes(search) ||
                (i.email || '').toLowerCase().includes(search) ||
                (i.phone || '').toLowerCase().includes(search) ||
                (i.message || '').toLowerCase().includes(search)
            );
        }
        if (filter !== 'all') {
            filtered = filtered.filter(i => i.status === filter);
        }
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            inqTableBody.innerHTML = `<tr><td colspan="8">
                <div class="empty-state" style="padding:48px 24px">
                    <span class="material-symbols-outlined">inbox</span>
                    <div class="empty-state-title">${search || filter !== 'all' ? 'No matching inquiries' : 'No inquiries yet'}</div>
                    <div class="empty-state-desc">${search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'When visitors submit the contact form, their inquiries will appear here.'}</div>
                </div>
            </td></tr>`;
            return;
        }

        const admin = isAdmin();
        inqTableBody.innerHTML = filtered.map(i => `
            <tr>
                <td class="cell-name">${escapeHtml(i.name)}</td>
                <td>
                    <div style="font-size:12px;color:var(--text-on-surface)">${escapeHtml(i.email || '—')}</div>
                    <div style="font-size:11px;color:var(--outline)">${escapeHtml(i.phone || '—')}</div>
                </td>
                <td>${escapeHtml(i.company) || '—'}</td>
                <td>${SERVICE_LABELS[i.service] || escapeHtml(i.service) || '—'}</td>
                <td class="cell-message" title="${escapeHtml(i.message)}">${escapeHtml(i.message) || '—'}</td>
                <td class="cell-date">${formatDate(i.date)}</td>
                <td>
                    ${admin ? `<select class="filter-select status-select" data-id="${i.id}" style="padding:6px 10px;font-size:11px;border-radius:8px;">
                        <option value="new" ${i.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="in-progress" ${i.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${i.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>` : `<span class="status-badge ${i.status}">${i.status === 'in-progress' ? 'In Progress' : i.status}</span>`}
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn view-inq-btn" data-id="${i.id}" title="View Details">
                            <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
                        </button>
                        ${admin ? `<button class="action-btn delete delete-inq-btn" data-id="${i.id}" title="Delete">
                            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Status change (admin only)
        inqTableBody.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', () => {
                const id = sel.dataset.id;
                const inqs = getInquiries();
                const idx = inqs.findIndex(i => i.id === id);
                if (idx >= 0) {
                    inqs[idx].status = sel.value;
                    saveInquiries(inqs);
                    updateBadges();
                    renderDashboard();
                    showToast('✅', 'Status Updated', `Inquiry marked as "${sel.value}".`);
                }
            });
        });

        // View detail
        inqTableBody.querySelectorAll('.view-inq-btn').forEach(btn => {
            btn.addEventListener('click', () => openInquiryModal(btn.dataset.id));
        });

        // Delete single (admin only)
        inqTableBody.querySelectorAll('.delete-inq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showConfirm('Delete Inquiry?', 'This inquiry will be permanently removed.', () => {
                    const inqs = getInquiries().filter(i => i.id !== btn.dataset.id);
                    saveInquiries(inqs);
                    refreshAllData();
                    showToast('🗑️', 'Deleted', 'Inquiry has been removed.');
                });
            });
        });
    }

    inqSearch.addEventListener('input', renderInquiries);
    inqFilter.addEventListener('change', renderInquiries);

    inqExport.addEventListener('click', () => {
        const inqs = getInquiries();
        if (inqs.length === 0) { showToast('ℹ️', 'No Data', 'There are no inquiries to export.'); return; }
        let csv = 'Name,Email,Phone,Company,Service,Message,Date,Status\n';
        inqs.forEach(i => {
            const serviceLabel = SERVICE_LABELS[i.service] || i.service || '—';
            csv += `"${(i.name || '').replace(/"/g, '""')}","${(i.email || '').replace(/"/g, '""')}","${(i.phone || '').replace(/"/g, '""')}","${(i.company || '').replace(/"/g, '""')}","${serviceLabel.replace(/"/g, '""')}","${(i.message || '').replace(/"/g, '""')}","${formatDate(i.date)}","${i.status}"\n`;
        });
        downloadFile(csv, 'inquiries_export.csv', 'text/csv');
        showToast('📥', 'Exported', `${inqs.length} inquiry(ies) exported as CSV.`);
    });

    inqDeleteAll.addEventListener('click', () => {
        if (!isAdmin()) return;
        const inqs = getInquiries();
        if (inqs.length === 0) { showToast('ℹ️', 'No Data', 'There are no inquiries to delete.'); return; }
        showConfirm('Clear All Inquiries?', `This will permanently delete ${inqs.length} inquiry(ies).`, () => {
            saveInquiries([]);
            refreshAllData();
            showToast('🗑️', 'Cleared', 'All inquiries have been deleted.');
        });
    });

    // ═══════════════════════════════════
    //  INQUIRY DETAIL MODAL
    // ═══════════════════════════════════
    function openInquiryModal(id) {
        const inqs = getInquiries();
        const inq = inqs.find(i => i.id === id);
        if (!inq) return;

        const admin = isAdmin();

        inqModalBody.innerHTML = `
            <div class="modal-field">
                <div class="modal-field-label">Full Name</div>
                <div class="modal-field-value">${escapeHtml(inq.name) || '—'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Email Address</div>
                <div class="modal-field-value">${escapeHtml(inq.email) || '—'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Phone Number</div>
                <div class="modal-field-value">${escapeHtml(inq.phone) || '—'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Company</div>
                <div class="modal-field-value">${escapeHtml(inq.company) || '—'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Service Interest</div>
                <div class="modal-field-value">${SERVICE_LABELS[inq.service] || escapeHtml(inq.service) || '—'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Message</div>
                <div class="modal-field-value" style="white-space:pre-wrap">${escapeHtml(inq.message) || '(No message provided)'}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Submitted</div>
                <div class="modal-field-value" style="font-family:'JetBrains Mono',monospace;font-size:13px;">${formatDate(inq.date)}</div>
            </div>
            <div class="modal-field">
                <div class="modal-field-label">Status</div>
                <div class="modal-field-value"><span class="status-badge ${inq.status}">${inq.status === 'in-progress' ? 'In Progress' : inq.status}</span></div>
            </div>
        `;

        if (admin) {
            inqModalFooter.innerHTML = `
                <button class="btn-outline" id="modalStatusBtn" data-id="${inq.id}">
                    <span class="material-symbols-outlined" style="font-size:16px">${inq.status === 'completed' ? 'refresh' : 'check_circle'}</span>
                    ${inq.status === 'new' ? 'Mark In Progress' : inq.status === 'in-progress' ? 'Mark Completed' : 'Reopen'}
                </button>
                <button class="btn-danger" id="modalDeleteBtn" data-id="${inq.id}">
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                    Delete
                </button>
            `;
            document.getElementById('modalStatusBtn').addEventListener('click', () => {
                const inqs = getInquiries();
                const idx = inqs.findIndex(i => i.id === id);
                if (idx >= 0) {
                    const current = inqs[idx].status;
                    inqs[idx].status = current === 'new' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'new';
                    saveInquiries(inqs);
                    refreshAllData();
                    closeModal();
                    showToast('✅', 'Status Updated', `Inquiry marked as "${inqs[idx].status}".`);
                }
            });
            document.getElementById('modalDeleteBtn').addEventListener('click', () => {
                closeModal();
                showConfirm('Delete Inquiry?', 'This inquiry will be permanently removed.', () => {
                    const inqs = getInquiries().filter(i => i.id !== id);
                    saveInquiries(inqs);
                    refreshAllData();
                    showToast('🗑️', 'Deleted', 'Inquiry has been removed.');
                });
            });
        } else {
            inqModalFooter.innerHTML = '';
        }

        inqModal.classList.add('active');
    }

    function closeModal() { inqModal.classList.remove('active'); }
    inqModalClose.addEventListener('click', closeModal);
    inqModal.addEventListener('click', (e) => { if (e.target === inqModal) closeModal(); });

    // ═══════════════════════════════════
    //  NEWSLETTER TABLE
    // ═══════════════════════════════════
    function renderNewsletter() {
        const nls = getNewsletter();
        const search = nlSearch.value.toLowerCase().trim();
        const admin = isAdmin();

        let filtered = nls;
        if (search) {
            filtered = filtered.filter(n => (n.email || '').toLowerCase().includes(search));
        }
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            nlTableBody.innerHTML = `<tr><td colspan="3">
                <div class="empty-state" style="padding:48px 24px">
                    <span class="material-symbols-outlined">mail</span>
                    <div class="empty-state-title">${search ? 'No matching subscribers' : 'No subscribers yet'}</div>
                    <div class="empty-state-desc">${search ? 'Try adjusting your search.' : 'When visitors subscribe to the newsletter, they will appear here.'}</div>
                </div>
            </td></tr>`;
            return;
        }

        nlTableBody.innerHTML = filtered.map(n => `
            <tr>
                <td class="cell-name">${escapeHtml(n.email)}</td>
                <td class="cell-date">${formatDate(n.date)}</td>
                <td>
                    <div class="actions-cell">
                        ${admin ? `<button class="action-btn delete delete-nl-btn" data-email="${escapeHtml(n.email)}" title="Remove">
                            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                        </button>` : '—'}
                    </div>
                </td>
            </tr>
        `).join('');

        nlTableBody.querySelectorAll('.delete-nl-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.email;
                showConfirm('Remove Subscriber?', `Remove ${email} from the newsletter list?`, () => {
                    const nls = getNewsletter().filter(n => n.email !== email);
                    saveNewsletter(nls);
                    refreshAllData();
                    showToast('🗑️', 'Removed', `${email} has been unsubscribed.`);
                });
            });
        });
    }

    nlSearch.addEventListener('input', renderNewsletter);

    nlExport.addEventListener('click', () => {
        const nls = getNewsletter();
        if (nls.length === 0) { showToast('ℹ️', 'No Data', 'There are no subscribers to export.'); return; }
        let csv = 'Email,Date Subscribed\n';
        nls.forEach(n => { csv += `"${n.email}","${formatDate(n.date)}"\n`; });
        downloadFile(csv, 'newsletter_subscribers.csv', 'text/csv');
        showToast('📥', 'Exported', `${nls.length} subscriber(s) exported as CSV.`);
    });

    nlDeleteAll.addEventListener('click', () => {
        if (!isAdmin()) return;
        const nls = getNewsletter();
        if (nls.length === 0) { showToast('ℹ️', 'No Data', 'There are no subscribers to delete.'); return; }
        showConfirm('Clear All Subscribers?', `This will permanently delete ${nls.length} subscriber(s).`, () => {
            saveNewsletter([]);
            refreshAllData();
            showToast('🗑️', 'Cleared', 'All subscribers have been deleted.');
        });
    });

    // ═══════════════════════════════════
    //  USERS MANAGEMENT (Admin Only)
    // ═══════════════════════════════════
    function renderUsers() {
        if (!isAdmin()) return;
        const users = getUsers();
        const curUser = getCurrentUser();

        usersTableBody.innerHTML = users.map(u => `
            <tr>
                <td class="cell-name">${escapeHtml(u.username)} ${u.username === curUser.username ? '<span style="font-size:10px;padding:2px 8px;background:rgba(142,213,255,0.12);color:var(--primary-dim);border-radius:100px;margin-left:6px;">YOU</span>' : ''}</td>
                <td><span class="status-badge ${u.role === 'admin' ? 'new' : 'in-progress'}" style="text-transform:capitalize">${u.role}</span></td>
                <td class="cell-date">${formatDate(u.createdAt)}</td>
                <td>
                    <div class="actions-cell">
                        ${u.username !== curUser.username ? `<button class="action-btn delete delete-user-btn" data-id="${u.id}" data-name="${escapeHtml(u.username)}" title="Delete User">
                            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                        </button>` : '<span style="font-size:11px;color:var(--outline)">—</span>'}
                    </div>
                </td>
            </tr>
        `).join('');

        // Delete user
        usersTableBody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                showConfirm(`Delete user "${name}"?`, 'This user will be permanently removed and won\'t be able to login.', () => {
                    const users = getUsers().filter(u => u.id !== btn.dataset.id);
                    saveUsers(users);
                    renderUsers();
                    showToast('🗑️', 'User Deleted', `"${name}" has been removed.`);
                });
            });
        });
    }

    // Add new user
    addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin()) { showToast('🚫', 'Access Denied', 'Only admins can add users.'); return; }

        const username = newUsername.value.trim().toLowerCase();
        const password = newPassword.value;
        const role = newRole.value;

        if (username.length < 2) {
            showToast('❌', 'Error', 'Username must be at least 2 characters.'); return;
        }
        const usernameRegex = /^[a-z0-9]+$/;
        if (!usernameRegex.test(username)) {
            showToast('❌', 'Error', 'Username must contain only letters and numbers (no spaces or special characters).'); return;
        }
        if (password.length < 4) {
            showToast('❌', 'Error', 'Password must be at least 4 characters.'); return;
        }

        const users = getUsers();
        if (users.find(u => u.username.toLowerCase() === username)) {
            showToast('❌', 'Error', `Username "${username}" already exists.`); return;
        }

        users.push({
            id: generateId(),
            username: username,
            password: password,
            role: role,
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
        addUserForm.reset();
        renderUsers();
        showToast('✅', 'User Created', `"${username}" has been added as ${role}.`);
    });

    // ═══════════════════════════════════
    //  SETTINGS
    // ═══════════════════════════════════
    function loadSettings() {
        const s = getSettings();
        setEmail.value = s.email;
        setPhone.value = s.phone;
        setWhatsApp.value = s.whatsapp;
        setWhatsAppMsg.value = s.whatsappMsg;
        setCompanyDesc.value = s.companyDesc;
        setCopyright.value = s.copyright;
        setCurrentPass.value = '';
        setNewPass.value = '';
        setConfirmPass.value = '';
        // Show current user in password section
        const cur = getCurrentUser();
        if (setCurrentUserEl && cur) setCurrentUserEl.textContent = cur.username;
    }

    settingsSave.addEventListener('click', () => {
        const admin = isAdmin();

        // Save site settings (admin only can change site settings)
        if (admin) {
            const s = {
                email: setEmail.value.trim() || DEFAULT_SETTINGS.email,
                phone: setPhone.value.trim() || DEFAULT_SETTINGS.phone,
                whatsapp: setWhatsApp.value.trim() || DEFAULT_SETTINGS.whatsapp,
                whatsappMsg: setWhatsAppMsg.value.trim() || DEFAULT_SETTINGS.whatsappMsg,
                companyDesc: setCompanyDesc.value.trim() || DEFAULT_SETTINGS.companyDesc,
                copyright: setCopyright.value.trim() || DEFAULT_SETTINGS.copyright
            };
            saveSettings(s);
        }

        // Handle password change (any user can change their own password)
        const curPass = setCurrentPass.value;
        const newPass = setNewPass.value;
        const confPass = setConfirmPass.value;

        let passwordChanged = false;
        if (curPass || newPass || confPass) {
            const curUser = getCurrentUser();
            const users = getUsers();
            const userIdx = users.findIndex(u => u.username === curUser.username);

            if (userIdx < 0) {
                showToast('❌', 'Error', 'User not found.'); return;
            }
            if (curPass !== users[userIdx].password) {
                showToast('❌', 'Error', 'Current password is incorrect.'); return;
            }
            if (newPass.length < 4) {
                showToast('❌', 'Error', 'New password must be at least 4 characters.'); return;
            }
            if (newPass !== confPass) {
                showToast('❌', 'Error', 'New passwords do not match.'); return;
            }
            users[userIdx].password = newPass;
            saveUsers(users);
            showToast('🔒', 'Password Changed', 'Your password has been updated.');
            passwordChanged = true;
        }

        loadSettings();
        if (!passwordChanged && !admin) {
            showToast('✅', 'Settings Saved', 'Settings saved successfully.');
        } else if (admin && !passwordChanged) {
            showToast('✅', 'Settings Saved', 'Site settings updated. Changes will reflect on the main website.');
        }
    });

    settingsCancel.addEventListener('click', loadSettings);

    // Export All Data (admin only)
    setExportAll.addEventListener('click', () => {
        const data = {
            inquiries: getInquiries(),
            newsletter: getNewsletter(),
            settings: getSettings(),
            users: isAdmin() ? getUsers().map(u => ({ ...u, password: '***' })) : [],
            exportedAt: new Date().toISOString()
        };
        downloadFile(JSON.stringify(data, null, 2), 'raktechsofthub_data.json', 'application/json');
        showToast('📥', 'Data Exported', 'All data has been exported as JSON.');
    });

    // Reset All Data (admin only)
    setResetAll.addEventListener('click', () => {
        if (!isAdmin()) return;
        showConfirm('Reset ALL Data?', 'This will delete all inquiries, subscribers, and reset settings. Users will NOT be deleted. This cannot be undone.', () => {
            Storage.removeItem(KEYS.inquiries);
            Storage.removeItem(KEYS.newsletter);
            Storage.removeItem(KEYS.settings);
            refreshAllData();
            showToast('🗑️', 'Data Reset', 'Inquiries, subscribers, and settings have been reset.');
        });
    });

    // ═══════════════════════════════════
    //  BADGE UPDATES
    // ═══════════════════════════════════
    function updateBadges() {
        const inqs = getInquiries();
        const newCount = inqs.filter(i => i.status === 'new').length;
        sidebarInqCount.textContent = newCount;
        sidebarInqCount.style.display = newCount > 0 ? '' : 'none';
    }

    // ═══════════════════════════════════
    //  DOWNLOAD HELPER
    // ═══════════════════════════════════
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    // ═══════════════════════════════════
    //  KEYBOARD SHORTCUTS
    // ═══════════════════════════════════
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            confirmDialog.classList.remove('active');
            closeMobileSidebar();
        }
    });

    console.log('%c🔧 RAKTechSoftHub Admin — Multi-User Control Panel', 'color: #88cff9; font-size: 14px; font-weight: bold;');
});
