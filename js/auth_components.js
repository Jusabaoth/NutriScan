
const AUTH_COMPONENTS_HTML = `
    <!-- HERO SECTION -->
    <section class="hero">
        <h1>AI-Powered Nutrition Analysis untuk Kesehatan Indonesia</h1>
        <p>Scan label, tahu nutrisi, hidup lebih sehat</p>
        <button class="cta-button"
            onclick="document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' }); toggleAuth('signup');">Daftar
            Sekarang</button>
    </section>

    <!-- FEATURES SHOWCASE -->
    <section class="features">
        <h2 class="section-title">Kenapa Memilih NutriScan?</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <h3>Scan Cerdas</h3>
                <p>AI analisis label dalam 30 detik dengan akurasi 92%. Teknologi OCR terkini untuk hasil instan dan
                    akurat.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👤</div>
                <h3>Personal</h3>
                <p>Rekomendasi sesuai kondisi kesehatan Anda. Khusus untuk diabetes, hipertensi, kolesterol, dan
                    alergi.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>Edukasi</h3>
                <p>Literasi gizi berbasis data BPOM. Pahami label nutrisi dengan mudah dan tingkatkan kesadaran gizi
                    Anda.</p>
            </div>
        </div>
    </section>

    <!-- VISION & MISSION -->
    <section class="vision-mission">
        <div class="vm-container">
            <div class="vision">
                <h2>🎯 Visi Kami</h2>
                <p>Meningkatkan literasi gizi Indonesia melalui teknologi AI, mendukung masyarakat hidup lebih sehat
                    dengan informasi nutrisi yang akurat dan mudah dipahami.</p>
            </div>
            <div class="mission">
                <h2>🚀 Misi Kami</h2>
                <div class="mission-list">
                    <div class="mission-item">
                        <div class="mission-number">1</div>
                        <p>Membuat analisis nutrisi mudah diakses oleh seluruh masyarakat Indonesia melalui platform
                            digital gratis</p>
                    </div>
                    <div class="mission-item">
                        <div class="mission-number">2</div>
                        <p>Membantu penderita PTM agar dapat mengendalikan kondisi kesehatan mereka</p>
                    </div>
                    <div class="mission-item">
                        <div class="mission-number">3</div>
                        <p>Mendukung target RPJMN penurunan 15% beban PTM melalui edukasi gizi digital</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- AUTH SECTION -->
    <section class="auth-section" id="authSection">
        <h2 class="section-title">Mulai Perjalanan Sehat Anda</h2>
        <div class="auth-container">
            <div class="auth-toggle">
                <button class="toggle-btn active" id="signupToggle" onclick="toggleAuth('signup')">Sign Up</button>
                <button class="toggle-btn" id="loginToggle" onclick="toggleAuth('login')">Login</button>
            </div>

            <!-- SIGNUP FORM -->
            <form id="signupForm" onsubmit="handleSignup(event)">
                <div id="signupError" class="error-message" style="display: none;"></div>
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="signupName" placeholder="Masukkan nama lengkap" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="signupEmail" placeholder="email@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="signupPassword" placeholder="Minimal 8 karakter" required
                        minlength="8">
                </div>
                <div class="form-group">
                    <label>Konfirmasi Password</label>
                    <input type="password" id="signupConfirmPassword" placeholder="Ulangi password" required>
                </div>
                <button type="submit" class="btn-submit">Daftar</button>
            </form>

            <!-- LOGIN FORM -->
            <form id="loginForm" style="display: none;" onsubmit="handleLogin(event)">
                <div id="loginError" class="error-message" style="display: none;"></div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" placeholder="email@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" placeholder="Masukkan password" required>
                </div>
                <button type="submit" class="btn-submit">Masuk</button>
            </form>
        </div>
    </section>
`;

/**
 * Commands to control Authentication UI
 */
const AuthCommand = {
    show: function (mode = 'signup') {
        const container = document.getElementById('preLoginContent');
        if (!container) return;

        // Inject content if not present
        if (!container.innerHTML.trim()) {
            container.innerHTML = AUTH_COMPONENTS_HTML;
        }

        // Show the container
        document.getElementById('preLoginContent').style.display = 'block';
        document.getElementById('postLoginContent').classList.remove('active');
        document.getElementById('userProfile').style.display = 'none';

        // Disable nav links
        const navLinks = ['scannerLink', 'mealplannerLink', 'historyLink'];
        navLinks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('disabled');
        });

        // If specific mode requested, toggle it
        if (mode && typeof window.toggleAuth === 'function') {
            // Wait for DOM update
            setTimeout(() => {
                window.toggleAuth(mode);
                const authSection = document.getElementById('authSection');
                if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },

    /**
     * Hide prelogin state
     */
    hide: function () {
        const container = document.getElementById('preLoginContent');
        if (container) {
            container.style.display = 'none';
        }

        // Show dashboard/post-login content as fallback
        const postLogin = document.getElementById('postLoginContent');
        if (postLogin) postLogin.classList.add('active');

        // Note: Enabling links is handled by showPostLoginContent (via checkAuthStatus)
        // or manually if needed, but we rely on the main app logic for that state now
        // to support the 'Locked Mode' properly.
    }
};

// ==========================================
// AUTH CSS
// ==========================================
const AUTH_CSS = `
/* AUTH FORMS */
.auth-section {
    padding: 4rem 5%;
    background: white;
    display: block;
}

.auth-section.hidden {
    display: none;
}

.auth-container {
    max-width: 500px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f1f8f4 0%, white 100%);
    padding: 3rem;
    border-radius: 25px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.auth-toggle {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.toggle-btn {
    flex: 1;
    padding: 1rem;
    border: none;
    background: #e0e0e0;
    color: #666;
    font-weight: 600;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s;
}

.toggle-btn.active {
    background: linear-gradient(135deg, #00e676, #00c853);
    color: white;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #00c853;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.checkbox-group input[type="checkbox"] {
    width: 20px;
    height: 20px;
}

.btn-submit {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #00e676, #00c853);
    color: white;
    border: none;
    border-radius: 15px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 230, 118, 0.4);
}

.error-message {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
    border-left: 4px solid #c62828;
    font-size: 0.9rem;
}

.success-message {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
    border-left: 4px solid #2e7d32;
    font-size: 0.9rem;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = AUTH_CSS;
document.head.appendChild(style);


// ==========================================
// AUTH LOGIC
// ==========================================

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if email already exists
function emailExists(email) {
    if (typeof getAllUsers === 'function') {
        const users = getAllUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }
    // Fallback if getAllUsers is not available globally yet (should be in Index.html or moved)
    return false;
}

// Show error message
function showError(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
}

// Show success message
function showSuccess(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.className = 'success-message';
    errorDiv.style.display = 'block';
}

// Toggle between signup and login forms
window.toggleAuth = function (type) {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const signupToggle = document.getElementById('signupToggle');
    const loginToggle = document.getElementById('loginToggle');
    const signupError = document.getElementById('signupError');
    const loginError = document.getElementById('loginError');

    // Hide error messages
    if (signupError) signupError.style.display = 'none';
    if (loginError) loginError.style.display = 'none';

    if (type === 'signup') {
        if (signupForm) signupForm.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        if (signupToggle) signupToggle.classList.add('active');
        if (loginToggle) loginToggle.classList.remove('active');
    } else {
        if (signupForm) signupForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (signupToggle) signupToggle.classList.remove('active');
        if (loginToggle) loginToggle.classList.add('active');
    }
};

// Handle Signup
window.handleSignup = function (event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const errorDiv = document.getElementById('signupError');

    // Validation
    if (!name || name.length < 3) {
        showError(errorDiv, 'Nama lengkap minimal 3 karakter');
        return;
    }

    if (!email || !isValidEmail(email)) {
        showError(errorDiv, 'Email tidak valid');
        return;
    }

    if (emailExists(email)) {
        showError(errorDiv, 'Email sudah terdaftar. Silakan gunakan email lain atau login.');
        return;
    }

    if (password.length < 8) {
        showError(errorDiv, 'Password minimal 8 karakter');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, 'Password dan konfirmasi password tidak cocok');
        return;
    }

    // Save user
    if (typeof getAllUsers === 'function' && typeof saveUsers === 'function') {
        const users = getAllUsers();
        const newUser = {
            email: email,
            name: name,
            password: password, // In production, this should be hashed
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        // Create user data storage
        const userData = {
            email: email,
            name: name,
            totalScans: 0,
            healthConditions: [],
            riskLevel: '-',
            createdAt: new Date().toISOString()
        };
        saveUserData(email, userData);

        // Set as current user
        localStorage.setItem('nutriscan_current_user', email);

        // Show success and redirect
        showSuccess(errorDiv, 'Pendaftaran berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => {
            if (typeof showPostLoginContent === 'function') {
                showPostLoginContent(userData);
            } else {
                location.reload();
            }
        }, 1000);
    } else {
        console.error("Storage functions not found");
    }
}

// Handle Login
window.handleLogin = function (event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Validation
    if (!email || !isValidEmail(email)) {
        showError(errorDiv, 'Email tidak valid');
        return;
    }

    if (!password) {
        showError(errorDiv, 'Password tidak boleh kosong');
        return;
    }

    // Check if user exists
    if (!emailExists(email)) {
        showError(errorDiv, 'Email belum terdaftar. Silakan daftar terlebih dahulu.');
        return;
    }

    // Verify password
    if (typeof getAllUsers === 'function') {
        const users = getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user || user.password !== password) {
            showError(errorDiv, 'Email atau password salah');
            return;
        }

        // Get user data
        let userData = getUserData(email);
        if (!userData) {
            // Create user data if doesn't exist (for old users)
            userData = {
                email: email,
                name: user.name,
                totalScans: 0,
                healthConditions: [],
                riskLevel: '-',
                createdAt: user.createdAt || new Date().toISOString()
            };
            saveUserData(email, userData);
        }

        // Set as current user
        localStorage.setItem('nutriscan_current_user', email);

        // Show success and redirect
        showSuccess(errorDiv, 'Login berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => {
            if (typeof showPostLoginContent === 'function') {
                showPostLoginContent(userData);
            } else {
                location.reload();
            }
        }, 1000);
    }
}

// Expose globally
window.AuthCommand = AuthCommand;
