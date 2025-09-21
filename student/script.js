document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
    // Stats unsubscribe handles (module-level)
    let statsUnsubs = { users: null, careers: null, colleges: null };
    // Last seen stats to prevent re-animation jitter
    let lastStats = { students: null, careers: null, colleges: null };
    let collegesFromDB = [];
    let uniqueCities = [];
    let latestQuizResultForSignup = null;
    let latestQuizScores = null;
    let careerMatchChart = null; // To hold the chart instance

    // --- DOM ELEMENT SELECTORS (ALL PAGES) ---
    const pages = document.querySelectorAll('.page-content');
    const navLinks = document.querySelectorAll('#main-nav-links a');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainNavLinks = document.getElementById('main-nav-links');

    // Modals & Auth
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const closeModalBtns = document.querySelectorAll('.close-btn');

    // Quiz Elements
    const startQuizBtnHero = document.getElementById('start-quiz-btn-hero');
    const startQuizBtnAssessment = document.getElementById('start-quiz-btn-assessment');
    const retakeQuizBtn = document.getElementById('retake-quiz-btn');
    const retakeQuizBtnDashboard = document.getElementById('retake-quiz-btn-dashboard');
    const quizContainer = document.getElementById('quiz-container');
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const currentQuestionNum = document.getElementById('current-question-num');
    const totalQuestionsNum = document.getElementById('total-questions-num');

    // Homepage Elements
    const carouselContainer = document.getElementById('carousel-container');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const studentsCount = document.getElementById('students-count');
    const careersCount = document.getElementById('careers-count');
    const collegesCount = document.getElementById('colleges-count');
    // Career-hero stat boxes (the larger header numbers on career-explorer page)
    const studentsCountCareerBox = document.getElementById('students-count-career');
    const careersCountCareerBox = document.getElementById('careers-count-career');
    const collegesCountCareerBox = document.getElementById('colleges-count-career');

    // Career Explorer Page Elements
    const careerFilterButtons = document.querySelectorAll('.filter-btn');
    // DO NOT query career cards once here; they are dynamically rendered. Use runtime queries when filtering.
    const careerSearchInput = document.getElementById('career-search-input');

    // Colleges Page Elements
    const collegeListContainer = document.getElementById('college-list-container');
    const cityFilter = document.getElementById('city-filter');
    const collegeTypeCheckboxes = document.querySelectorAll('input[name="collegeType"]');
    const feeRangeRadios = document.querySelectorAll('input[name="feeRange"]');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const collegeSearchInputMain = document.getElementById('college-search-input-main');
    const streamFilterMain = document.getElementById('stream-filter-main');
    const sortByDropdown = document.getElementById('sort-by');
    const resultsCountSpan = document.getElementById('results-count');

    // Dashboard Elements
    const welcomeMessage = document.getElementById('welcome-message');
    const latestResultContent = document.getElementById('latest-result-content');
    const timelineWidgetContainer = document.getElementById('timeline-widget-container');

    // AI Counselor Elements
    const aiChatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');

    // --- STATIC DATA ---
    // 12 personality-oriented assessment questions. Each option assigns weights to
    // the four streams used by the existing quiz logic: Science, Arts, Commerce, Vocational.
    const questions = [
        {
            text: 'When solving a problem, you prefer to:',
            options: [
                { text: 'Break it down logically and use formulas', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Consider people and feelings involved', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Look for cost/benefit and practical outcomes', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Try a hands-on prototype or experiment', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'You get energy from:',
            options: [
                { text: 'Learning technical systems and how things work', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Creating stories, art, or music', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Negotiating deals or organizing projects', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Working with tools or physical materials', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'Your preferred learning style is:',
            options: [
                { text: 'Theoretical and conceptual', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Observational and reflective', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Case-based and practical business examples', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Hands-on, learn-by-doing', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'In a team, you often act as the:',
            options: [
                { text: 'Analyst / specialist', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Communicator / storyteller', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Coordinator / planner', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Implementer / builder', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'You judge success by:',
            options: [
                { text: 'Accuracy, correctness, and evidence', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Expression, aesthetics, and impact', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Profitability, efficiency, and results', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Practical usefulness and durability', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'You enjoy tasks that are:',
            options: [
                { text: 'Abstract and logical', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Open-ended and interpretive', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Structured with clear objectives', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Tactile and kinaesthetic', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'When you face a challenge, you first:',
            options: [
                { text: 'Gather data and run experiments', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Reflect on meaning and context', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Check budgets and stakeholder needs', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Sketch or prototype a quick solution', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'Which description fits you best?',
            options: [
                { text: 'Precise, curious, methodical', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Imaginative, empathetic, expressive', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Practical, strategic, organised', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Resourceful, hands-on, craft-oriented', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'If you had a free project, you would pick:',
            options: [
                { text: 'Build a data tool or experiment', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Write a short film or design a poster', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Start a small online business', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Make furniture or restore a gadget', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'You prefer feedback that is:',
            options: [
                { text: 'Technical and detail-oriented', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Emotional and narrative-based', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Business-focused and measurable', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Practical tips you can apply immediately', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'Your ideal workplace rhythm is:',
            options: [
                { text: 'Deep focused sprints (research/code)', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Flexible creative bursts', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Fast-paced, goal-driven days', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Hands-on workshops and building', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        },
        {
            text: 'What matters most when choosing a career?',
            options: [
                { text: 'Intellectual challenge and growth', weights: { Science: 3, Arts: 0, Commerce: 0, Vocational: 0 } },
                { text: 'Meaningful expression or social impact', weights: { Science: 0, Arts: 3, Commerce: 0, Vocational: 0 } },
                { text: 'Stability and earning potential', weights: { Science: 0, Arts: 0, Commerce: 3, Vocational: 0 } },
                { text: 'Practical skill and autonomy', weights: { Science: 0, Arts: 0, Commerce: 0, Vocational: 3 } }
            ]
        }
    ];

    // ===================================================================
    // ! --- ALL FUNCTIONS DEFINED HERE FIRST ---
    // ===================================================================

    // --- Careers: load from Firestore for student-facing explorer ---
    let careersFromDB = [];
    function loadCareersFromFirestore() {
        if (!db) return;
        db.collection('careers').orderBy('career').get().then(snapshot => {
            careersFromDB = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderCareerGrid(careersFromDB);
        }).catch(err => {
            console.error('Failed to load careers for explorer', err);
        });
    }

    function getCareerCompareList() {
        try { return JSON.parse(localStorage.getItem('careerCompare') || '[]'); } catch (e) { return []; }
    }
    function setCareerCompareList(list) { localStorage.setItem('careerCompare', JSON.stringify(list)); renderCareerCompareBadge(); }
    function setCareerCompareListAndRefresh(list) { setCareerCompareList(list); renderCareerGrid(careersFromDB); }

    function toggleCompareCareer(career) {
        const list = getCareerCompareList();
        const exists = list.find(i => i.id === career.id);
        if (exists) {
            const newList = list.filter(i => i.id !== career.id);
            setCareerCompareListAndRefresh(newList);
        } else {
            if (list.length >= 3) return alert('You can compare up to 3 careers only.');
            list.push(career);
            setCareerCompareListAndRefresh(list);
        }
    }

    function renderCareerCompareBadge() {
        const el = document.getElementById('career-compare-badge');
        if (!el) return;
        const count = getCareerCompareList().length;
        el.textContent = count > 0 ? `Compare (${count})` : 'Compare';
    }

    function renderCareerGrid(list) {
        const container = document.getElementById('career-grid-container');
        if (!container) return;
        // If no dynamic data, keep existing static markup
        if (!list || list.length === 0) return;
        container.innerHTML = '';
        const compareList = getCareerCompareList();
        list.forEach(c => {
            const card = document.createElement('div');
            const category = (c.type||'').toString().toLowerCase();
            card.className = 'career-card';
            card.dataset.category = category;
            card.innerHTML = `
                <div class="image-wrapper"><img src="${c.image||'https://via.placeholder.com/400x200'}" class="career-image" alt="${escapeHtml(c.career)}"></div>
                <div class="content">
                    <h3>${escapeHtml(c.career)}</h3>
                    <p class="description">${escapeHtml((c.description||'').slice(0,250))}</p>
                    <div class="info-grid">
                        <div class="info-item"><div class="label">Salary</div><div class="value">${escapeHtml(c.avgSalary || 'N/A')}</div></div>
                        <div class="info-item"><div class="label">Education</div><div class="value dark">${escapeHtml(c.educationRequired || 'N/A')}</div></div>
                    </div>
                    <div class="career-meta"><div class="value job-type">${escapeHtml(c.type || '')}</div></div>
                    <div class="career-card-actions"><button class="btn-outline career-compare-btn ${compareList.some(x=>x.id===c.id)?'selected':''}" data-career='${JSON.stringify({ id: c.id, career: c.career, avgSalary: c.avgSalary, educationRequired: c.educationRequired, type: c.type })}'>${compareList.some(x=>x.id===c.id)?'Selected':'Compare'}</button></div>
                </div>
            `;
            container.appendChild(card);
        });
        // wire compare buttons
        document.querySelectorAll('.career-compare-btn').forEach(btn => btn.addEventListener('click', (e) => {
            try { const payload = JSON.parse(e.currentTarget.dataset.career); toggleCompareCareer(payload); } catch (err) { console.error('Failed to parse career payload', err); }
        }));
    }

    function ensureCareerCompareModal() {
        if (document.getElementById('career-compare-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'career-compare-modal';
        modal.className = 'modal-wrapper';
        modal.style.display = 'none';
        modal.innerHTML = `<div class="modal-box"><button class="close-btn" id="close-career-compare"><i class="fa-solid fa-times"></i></button><h2 style="text-align:center;">Compare Careers</h2><div id="career-compare-contents"></div></div>`;
        document.body.appendChild(modal);
        document.getElementById('close-career-compare').addEventListener('click', () => { modal.style.display = 'none'; });
    }

    function showCareerCompareModal() {
        ensureCareerCompareModal();
        const modal = document.getElementById('career-compare-modal');
        const contents = document.getElementById('career-compare-contents');
        const list = getCareerCompareList();
        if (!list || list.length === 0) {
            contents.innerHTML = '<p style="text-align:center;">No careers selected for comparison.</p>';
            modal.style.display = 'flex';
            return;
        }
        let table = `<table class="compare-table"><thead><tr><th>Attribute</th>${list.map(c => `<th>${escapeHtml(c.career)}</th>`).join('')}</tr></thead><tbody>`;
        const attrs = [
            { key: 'type', label: 'Type', fmt: c => escapeHtml(c.type || 'N/A') },
            { key: 'avgSalary', label: 'Average Salary', fmt: c => escapeHtml(c.avgSalary || 'N/A') },
            { key: 'educationRequired', label: 'Education Required', fmt: c => escapeHtml(c.educationRequired || 'N/A') }
        ];
        attrs.forEach(attr => {
            table += `<tr><td class="attr-name">${attr.label}</td>`;
            list.forEach(c => { table += `<td data-label="${attr.label}">${attr.fmt(c)}</td>`; });
            table += `</tr>`;
        });
        table += `</tbody></table>`;
        contents.innerHTML = `<div>${table}</div><div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:space-between; align-items:center;"><div id="career-compare-result" style="flex:1; color:var(--color-text-secondary);"></div><div style="display:flex; gap:0.5rem;"><button id="clear-career-compare" class="btn-outline">Clear</button><button id="career-compare-see-result" class="btn-primary" ${list.length < 2 ? 'disabled' : ''}>See result</button></div></div>`;
        modal.style.display = 'flex';
        document.getElementById('clear-career-compare').addEventListener('click', () => { setCareerCompareList([]); modal.style.display = 'none'; renderCareerGrid(careersFromDB); });
        const seeBtn = document.getElementById('career-compare-see-result');
        const resultDiv = document.getElementById('career-compare-result');
        if (seeBtn) seeBtn.addEventListener('click', () => {
            const listNow = getCareerCompareList();
            if (!listNow || listNow.length < 2) { alert('Select at least 2 careers to see a comparison result.'); return; }
            // compute numeric avgSalary where possible
            const vals = listNow.map(c => {
                try { const num = parseFloat((c.avgSalary || '').toString().replace(/[^0-9.]/g, '')); return isNaN(num) ? 0 : num; } catch (e) { return 0; }
            });
            let topIndex = 0; let max = -Infinity;
            vals.forEach((v,i) => { if (v > max) { max = v; topIndex = i; } });
            // remove previous highlights
            try { document.querySelectorAll('#career-compare-contents .compare-winner').forEach(el => el.classList.remove('compare-winner')); } catch (e) { }
            // highlight header cell for top career
            try {
                const ths = contents.querySelectorAll('table.compare-table thead th');
                if (ths && ths.length > topIndex + 1) ths[topIndex + 1].classList.add('compare-winner');
            } catch (e) { }
            // show summary text
            try {
                resultDiv.innerHTML = `<div>Top by average salary: <strong>${escapeHtml(listNow[topIndex].career)}</strong> (${escapeHtml(listNow[topIndex].avgSalary || 'N/A')})</div>`;
            } catch (e) { resultDiv.textContent = ''; }
        });
    }

    // Wire compare badge click
    const careerCompareBadgeBtn = document.getElementById('career-compare-badge');
    if (careerCompareBadgeBtn) careerCompareBadgeBtn.addEventListener('click', showCareerCompareModal);

    // Utility Functions
    function showModal(modal) { if (modal) modal.style.display = 'flex'; }
    function hideModal(modal) { if (modal) modal.style.display = 'none'; }

    // Dashboard data loading function
    function loadDashboardData() {
        if (!currentUser || !welcomeMessage) return;
        welcomeMessage.textContent = `Welcome back, ${currentUser.name.split(' ')[0]}!`;
        loadAptitudeResults();
        loadTimelineWidget();
    }

    // Carousel Functions
    let currentSlide = 0;
    function updateCarousel() {
        if (carouselContainer) {
            const indicators = indicatorsContainer.querySelectorAll('.indicator-btn');
            carouselContainer.style.transform = `translateX(${-currentSlide * 100}%)`;
            indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentSlide));
        }
    }
    window.nextSlide = function () {
        const slides = document.querySelectorAll('#carousel-container .carousel-slide');
        if (!slides.length) return;
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    }
    window.previousSlide = function () {
        const slides = document.querySelectorAll('#carousel-container .carousel-slide');
        if (!slides.length) return;
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
    }
    window.goToSlide = function (index) {
        currentSlide = index;
        updateCarousel();
    }

    window.showPage = function (pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
        window.scrollTo(0, 0);



        if (pageId === 'homepage-content') {
            if (studentsCount && studentsCount.textContent === "0") {
                animateCounter(studentsCount, 11);
                animateCounter(careersCount, 12);
                animateCounter(collegesCount, 20);
            }
        }
        // Start/stop career-explorer specific listeners
        if (pageId === 'career-explorer-content') {
            try { loadCareerExplorerStats(); } catch (e) { console.error('Failed to start career explorer stats', e); }
        } else {
            try { cleanupCareerExplorerStats(); } catch (e) { /* ignore */ }
        }
        if (pageId === 'colleges-content' && collegesFromDB.length > 0) {
            applyFiltersAndSort();
            try { renderCompareBar(); } catch (e) { }
        }
        // If user attempts to open Dashboard without being logged in, show auth modal
        if (pageId === 'dashboard-content' && !currentUser) {
            // show login/signup modal instead of the dashboard
            try { showModal(authContainer); } catch (e) { console.error('Failed to open auth modal', e); }
            // ensure nav active state still highlights Dashboard link
            navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
            return;
        }

        if (pageId === 'dashboard-content' && currentUser) {
            loadDashboardData();
        }
        // Ensure compare bar visibility is updated whenever the page changes
        try { showCompareBarIfOnColleges(); } catch (e) { /* ignore if compare functions not ready */ }
    }
    
    // All your other functions like showModal, loadDashboardData, etc., remain here...

    // ===================================================================
    // ! --- MAIN APP LOGIC ---
    // ===================================================================

    // Hamburger Menu Logic
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            mainNavLinks.classList.toggle('nav-active');
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNavLinks.classList.contains('nav-active')) {
                    mainNavLinks.classList.remove('nav-active');
                }
            });
        });
    }

    // --- Floating Feedback Card Logic ---
    const feedbackCard = document.getElementById('feedback-card');
    const closeFeedbackCardBtn = document.getElementById('close-feedback-card');

    // Check if the card was already dismissed in this session
    if (sessionStorage.getItem('feedbackCardDismissed') !== 'true') {
        // Show the card after a 5-second delay
        setTimeout(() => {
            if (feedbackCard) {
                feedbackCard.classList.remove('hidden');
            }
        }, 11000); // 5000 milliseconds = 5 seconds
    }

    // Logic to close the card
    if (closeFeedbackCardBtn && feedbackCard) {
        closeFeedbackCardBtn.addEventListener('click', () => {
            feedbackCard.classList.add('hidden');
            // Remember that the user closed it for this session
            sessionStorage.setItem('feedbackCardDismissed', 'true');
        });
    }

    // Authentication
    auth.onAuthStateChanged(user => {
        const authSections = document.querySelectorAll('.user-auth-section-desktop, .user-auth-section-mobile');

        if (user) {
            currentUser = { uid: user.uid, email: user.email };
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    currentUser.name = doc.data().name;
                    const loggedInHTML = `
                        <span id="user-display-name">Hi, ${currentUser.name.split(' ')[0]}</span>
                        <button class="btn-outline-light logout-btn">Logout</button>
                    `;
                    authSections.forEach(section => section.innerHTML = loggedInHTML);
                    
                    document.querySelectorAll('.logout-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            auth.signOut();
                        });
                    });

                    showPage('dashboard-content');
                } else { auth.signOut(); }
            }).catch(err => {
                console.error("Error fetching user document:", err);
                auth.signOut();
            });
        } else {
            currentUser = null;
            const loggedOutHTML = `<button class="btn-primary login-signup-btn">Login / Signup</button>`;
            authSections.forEach(section => section.innerHTML = loggedOutHTML);
            
            document.querySelectorAll('.login-signup-btn').forEach(btn => {
                btn.addEventListener('click', () => showModal(authContainer));
            });

            showPage('homepage-content');
        }
    });

    function handleSignup(e) {
        e.preventDefault();
        const name = signupForm.querySelector('#signup-name').value;
        const phone = signupForm.querySelector('#signup-phone').value;
        const city = signupForm.querySelector('#signup-city').value;
        const email = signupForm.querySelector('#signup-email').value;
        const password = signupForm.querySelector('#signup-password').value;
        signupError.textContent = '';
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                const userDocRef = db.collection('users').doc(user.uid);
                userDocRef.set({ name, email, phone, city, createdAt: new Date() });
                if (latestQuizResultForSignup) {
                    userDocRef.collection('quizHistory').add(latestQuizResultForSignup);
                    latestQuizResultForSignup = null;
                }
            })
            .then(() => { hideModal(authContainer); signupForm.reset(); })
            .catch(error => signupError.textContent = error.message);
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = loginForm.querySelector('#login-email').value;
        const password = loginForm.querySelector('#login-password').value;
        loginError.textContent = '';
        auth.signInWithEmailAndPassword(email, password)
            .then(() => hideModal(authContainer))
            .catch(error => loginError.textContent = error.message);
    }
    let currentQuestionIndex = 0;
    let scores = { Science: 0, Arts: 0, Commerce: 0, Vocational: 0 };
    function startQuiz() {
        currentQuestionIndex = 0;
        scores = { Science: 0, Arts: 0, Commerce: 0, Vocational: 0 };
        showModal(quizContainer);
        displayQuestion();
    }
    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionText.textContent = question.text;
            optionsContainer.innerHTML = '';
            question.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option.text;
                button.classList.add('option');
                button.onclick = () => selectOption(option.weights);
                optionsContainer.appendChild(button);
            });
            currentQuestionNum.textContent = currentQuestionIndex + 1;
            totalQuestionsNum.textContent = questions.length;
        } else {
            showResult();
        }
    }
    function selectOption(weights) {
        for (const stream in weights) { scores[stream] = (scores[stream] || 0) + weights[stream]; }
        currentQuestionIndex++;
        displayQuestion();
    }
    function showResult() {
        hideModal(quizContainer);
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const percentages = {};
        for (const stream in scores) {
            percentages[stream] = totalScore === 0 ? 0 : Math.round((scores[stream] / totalScore) * 100);
        }
        const sortedScores = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
        const bestStream = sortedScores.length > 0 ? sortedScores[0][0] : "Not determined";
        const resultData = { recommendedStream: bestStream, scores: scores, timestamp: new Date() };
        latestQuizScores = scores;
        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('quizHistory').add(resultData);
            resultContent.innerHTML = `<h3>Result Saved!</h3><p>Your top recommendation is <strong>${bestStream}</strong>. Check your dashboard for details.</p>`;
            setTimeout(() => {
                hideModal(resultContainer);
                showPage('dashboard-content');
            }, 2000);
        } else {
            latestQuizResultForSignup = resultData;
            resultContent.innerHTML = `<h3>Your top recommendation is ${bestStream}!</h3><p>Sign up to save your results and get personalized recommendations.</p><div class="result-actions"><button class="cta-button" id="signup-from-result-btn">Signup to Save</button></div>`;
            document.getElementById('signup-from-result-btn').addEventListener('click', () => {
                hideModal(resultContainer);
                showModal(authContainer);
                if (showSignupBtn) showSignupBtn.click();
            });
        }
        showModal(resultContainer);
    }


    async function loadCollegesFromFirestore() {
        try {
            const snapshot = await db.collection('colleges').get();

            if (!snapshot || !snapshot.docs || snapshot.docs.length === 0) {
                collegesFromDB = [];
                uniqueCities = [];
                if (collegeListContainer) {
                    collegeListContainer.innerHTML = `
                        <div class="empty-state">
                            <h3>No colleges found</h3>
                            <p>The Firestore collection <code>colleges</code> is empty or could not be read. Please add documents to the collection or contact the administrator.</p>
                        </div>`;
                }
                if (resultsCountSpan) resultsCountSpan.textContent = '0';
                console.warn('Firestore collection "colleges" is empty or unreadable.');
                return;
            }

            // Map Firestore docs to plain objects and use ONLY Firestore data.
            collegesFromDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            uniqueCities = [...new Set(collegesFromDB.map(c => c.city).filter(Boolean))].sort();

            // Populate city filter select with unique cities
            if (cityFilter) {
                try {
                    cityFilter.innerHTML = '<option value="">All Cities</option>' + uniqueCities.map(city => `<option value="${city}">${city}</option>`).join('');
                } catch (e) { console.warn('Error populating city filter', e); }
            }

            // Ensure the stream dropdown triggers filtering when changed
            if (streamFilterMain) streamFilterMain.addEventListener('change', applyFiltersAndSort);

            // Initial render and setup
            applyFiltersAndSort();
            console.info('Loaded', collegesFromDB.length, 'colleges from Firestore.');
        } catch (err) {
            console.error('Error reading colleges from Firestore:', err);
            // Show empty state on error
            if (collegeListContainer) {
                collegeListContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>Cannot load colleges</h3>
                        <p>There was an error reading from Firestore. Check your internet connection and Firestore rules.</p>
                    </div>`;
            }
            if (resultsCountSpan) resultsCountSpan.textContent = '0';
        }
    }
    function applyFiltersAndSort() {
        if (!collegesFromDB) return;
        let filteredColleges = [...collegesFromDB];
        // Debug: show current filter state
        try { console.log('Applying filters', { totalColleges: collegesFromDB.length, search: collegeSearchInputMain ? collegeSearchInputMain.value : null, city: cityFilter ? cityFilter.value : null, selectedTypes: Array.from(collegeTypeCheckboxes).filter(cb => cb.checked).map(cb => cb.value) }); } catch (e) { }
        const searchTerm = (collegeSearchInputMain && collegeSearchInputMain.value) ? collegeSearchInputMain.value.toLowerCase() : '';
        if (searchTerm) {
            filteredColleges = filteredColleges.filter(c => {
                const name = (c.name || '').toString().toLowerCase();
                const city = (c.city || '').toString().toLowerCase();
                const courses = (c.courses || []).join(' ').toString().toLowerCase();
                return name.includes(searchTerm) || city.includes(searchTerm) || courses.includes(searchTerm);
            });
        }
        const selectedCity = cityFilter.value;
        if (selectedCity) { filteredColleges = filteredColleges.filter(c => c.city === selectedCity); }
        // Stream / All Streams filter (map visible stream names to course keywords)
        const selectedStream = (streamFilterMain && streamFilterMain.value) ? streamFilterMain.value.toString().trim() : '';
        if (selectedStream) {
            const s = selectedStream.toLowerCase();
            const streamKeywordsMap = {
                'engineering': ['b.tech', 'btech', 'be', 'b.e', 'engineering', 'computer', 'cse', 'ece', 'ee', 'it', 'mechanical', 'civil', 'technology', 'tech', 'mca'],
                'b.tech': ['b.tech', 'btech', 'be', 'engineering', 'computer', 'cse', 'it', 'technology'],
                'mbbs': ['mbbs', 'bds', 'medical', 'medicine', 'nursing', 'pharmacy', 'health'],
                'medical': ['mbbs', 'bds', 'medical', 'medicine', 'nursing', 'pharmacy', 'health'],
                'management': ['mba', 'bba', 'management', 'business', 'commerce', 'mcom'],
                'mba': ['mba', 'management', 'business', 'commerce']
            };
            let keywords = streamKeywordsMap[s] || [s];
            // Lowercased haystack: courses, name, stream, type
            filteredColleges = filteredColleges.filter(c => {
                const coursesText = Array.isArray(c.courses) ? c.courses.join(' ') : (c.courses || '');
                const hay = (`${coursesText} ${c.name || ''} ${c.stream || ''} ${c.type || ''}`).toLowerCase();
                return keywords.some(kw => hay.includes(kw));
            });
        }
        // Normalize selected types to lowercase to avoid case/whitespace mismatches
        const selectedTypes = Array.from(collegeTypeCheckboxes).filter(cb => cb.checked).map(cb => (cb.value || '').toString().trim().toLowerCase());
        if (selectedTypes.length > 0) {
            // helper to robustly match college type variants
            const matchesType = (collegeTypeRaw, collegeNameRaw, wanted) => {
                const t = (collegeTypeRaw || '').toString().trim().toLowerCase();
                const name = (collegeNameRaw || '').toString().trim().toLowerCase();
                if (wanted === 'government') {
                    return t.includes('gov') || t.includes('government') || name.includes('government') || name.includes('govt');
                }
                if (wanted === 'private') {
                    // consider common variants and treat unknown/empty types as private only if not clearly government
                    if (t.length === 0) return !name.includes('government') && !name.includes('govt');
                    return t.includes('priv') || t.includes('pvt') || t.includes('private') || (!t.includes('gov') && !t.includes('government'));
                }
                return t === wanted;
            };
            filteredColleges = filteredColleges.filter(c => {
                // if any selected type matches this college, include it
                return selectedTypes.some(sel => matchesType(c.type, c.name, sel));
            });
        }
        const selectedFee = Array.from(feeRangeRadios).find(rb => rb.checked);
        if (selectedFee) {
            const maxFee = parseInt(selectedFee.value);
            if (maxFee === 50000) filteredColleges = filteredColleges.filter(c => c.fee <= 50000);
            else if (maxFee === 100000) filteredColleges = filteredColleges.filter(c => c.fee > 50000 && c.fee <= 100000);
            else if (maxFee === 200000) filteredColleges = filteredColleges.filter(c => c.fee > 100000 && c.fee <= 200000);
            else filteredColleges = filteredColleges.filter(c => c.fee > 200000);
        }
        const sortBy = sortByDropdown.value;
        if (sortBy === 'fee-low-high') { filteredColleges.sort((a, b) => (a.fee || 0) - (b.fee || 0)); }
        else if (sortBy === 'fee-high-low') { filteredColleges.sort((a, b) => (b.fee || 0) - (a.fee || 0)); }
        renderColleges(filteredColleges);
        if (resultsCountSpan) resultsCountSpan.textContent = filteredColleges.length;
        if (filteredColleges.length === 0) {
            console.warn('applyFiltersAndSort: no colleges matched filters', { searchTerm, selectedCity: cityFilter ? cityFilter.value : null, selectedTypes: Array.from(collegeTypeCheckboxes).filter(cb => cb.checked).map(cb => cb.value) });
        }
    }
    function renderColleges(collegesToRender) {
        if (!collegeListContainer) return;
        collegeListContainer.innerHTML = '';
        if (!collegesToRender || collegesToRender.length === 0) {
            collegeListContainer.innerHTML = '<p>No colleges match your criteria.</p>';
            return;
        }
        collegesToRender.forEach(college => {
            const card = document.createElement('div');
            card.className = 'college-card';
            const coursesHtml = (college.courses || []).map(course => `<span class="course-tag">${course}</span>`).join('');
            const imageUrl = college.image || 'https://via.placeholder.com/400x200';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${college.name || 'College'}" class="college-card-image">
                <div class="college-card-content">
                    <div class="college-card-header">
                        <div>
                            <h3>${college.name || 'Unnamed College'}</h3>
                            <div class="college-card-location"><i class="fas fa-map-marker-alt"></i><span>${college.city || ''}</span></div>
                        </div>
                        <div class="college-card-tags">
                            ${college.nirf ? `<span class="tag nirf">NIRF #${college.nirf}</span>` : ''}
                            <span class="tag type">${college.type || 'Private'}</span>
                        </div>
                    </div>
                    <div class="college-card-info">
                        <div class="info-item"><div class="label">Annual Fee</div><div class="value">${college.fee ? `₹${(college.fee / 100000).toFixed(1)} L` : 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Placement</div><div class="value">${college.placement || 'N/A'}%</div></div>
                        <div class="info-item"><div class="label">Avg. Package</div><div class="value">${college.package ? `₹${college.package} LPA` : 'N/A'}</div></div>
                    </div>
                    <div class="college-card-courses"><div class="label">Popular Courses</div><div class="course-tags">${coursesHtml}</div></div>
                    <div class="college-card-actions">
                        ${college.website ? `<a class="btn-primary" href="${college.website}" target="_blank" rel="noreferrer">View Details</a>` : `<button class="btn-primary" disabled>View Details</button>`}
                        ${(() => {
                    const idVal = college.id || college.name;
                    const selected = getCompareList().some(i => i.id === idVal);
                    const payload = JSON.stringify({ id: idVal, name: college.name, fee: college.fee, placement: college.placement, facilities: college.facilities || [], courses: college.courses || [], website: college.website || '' });
                    return `<button class="btn-outline compare-btn ${selected ? 'selected' : ''}" aria-pressed="${selected}" data-college='${payload}'>${selected ? 'Selected' : 'Compare'}</button>`;
                })()}
                    </div>
                </div>`;
            collegeListContainer.appendChild(card);
        });
        // Attach compare button handlers
        document.querySelectorAll('.compare-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                try {
                    const payload = JSON.parse(e.currentTarget.dataset.college);
                    toggleCompareCollege(payload);
                } catch (err) { console.error('Failed to parse compare payload', err); }
            });
        });
        // Ensure compare modal exists
        ensureCompareModal();
    }

    // ----------------- Compare Utilities -----------------
    function getCompareList() {
        try { return JSON.parse(localStorage.getItem('collegeCompare') || '[]'); } catch (e) { return []; }
    }
    // Persist compare list, update header badge and compare bar
    function setCompareList(list) { localStorage.setItem('collegeCompare', JSON.stringify(list)); renderCompareBadge(); try { renderCompareBar(); } catch (e) { /* ignore if not ready */ } }
    // Persist compare list and refresh rendered college cards so button states update
    function setCompareListAndRefresh(list) { setCompareList(list); try { applyFiltersAndSort(); } catch (e) { /* ignore */ } }
    function toggleCompareCollege(col) {
        const list = getCompareList();
        const exists = list.find(i => i.id === col.id);
        if (exists) {
            const newList = list.filter(i => i.id !== col.id);
            setCompareListAndRefresh(newList);
        } else {
            if (list.length >= 3) return alert('You can compare up to 3 colleges only.');
            list.push(col);
            setCompareListAndRefresh(list);
        }
        // Show/hide compare bar depending on page. If user isn't on colleges page, take them there so they see selections.
        const collegesPage = document.getElementById('colleges-content');
        const isOnColleges = collegesPage && collegesPage.classList.contains('active');
        try {
            if (!isOnColleges) {
                // navigate to colleges page; renderCompareBar will be called in showPage
                showPage('colleges-content');
            } else {
                // refresh bar immediately
                renderCompareBar();
            }
        } catch (e) { /* ignore */ }
    }
    function renderCompareBadge() {
        const el = document.getElementById('compare-badge');
        if (!el) return;
        const count = getCompareList().length;
        el.textContent = count > 0 ? `Compare (${count})` : 'Compare';
    }

    function ensureCompareModal() {
        if (document.getElementById('compare-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'compare-modal';
        modal.className = 'modal-wrapper';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-box compare-modal">
                <button id="close-compare-modal" class="close-btn"><i class="fa-solid fa-times"></i></button>
                <h2 style="text-align:center;">Compare Colleges</h2>
                <div id="compare-contents"></div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-compare-modal').addEventListener('click', () => { modal.style.display = 'none'; });
    }

    function showCompareModal() {
        ensureCompareModal();
        const modal = document.getElementById('compare-modal');
        const contents = document.getElementById('compare-contents');
        const list = getCompareList();
        if (list.length === 0) {
            contents.innerHTML = '<p style="text-align:center;">No colleges selected for comparison.</p>';
            modal.style.display = 'flex'; renderCompareBadge(); return;
        }

        // Helper to format fee and placement consistently
        const fmtFee = (f) => f ? `₹${(f / 100000).toFixed(1)} L` : 'N/A';
        const fmtPlacement = (p) => p ? `${p}%` : 'N/A';

        // Build a compact table: attributes as rows, each college as a column
        const attributes = [
            { key: 'fee', label: 'Annual Fee', formatter: (c) => (c.fee ? `₹${(c.fee / 100000).toFixed(1)} L` : 'N/A'), compare: (a, b) => ((a || 0) - (b || 0)), winner: 'lowest' },
            { key: 'placement', label: 'Placement', formatter: (c) => (c.placement ? `${c.placement}%` : 'N/A'), compare: (a, b) => ((b || 0) - (a || 0)), winner: 'highest' },
            { key: 'courses', label: 'Courses', formatter: (c) => ((c.courses || []).slice(0, 6).join(', ') || 'N/A'), compare: (a, b) => (((cLength(a)) - (cLength(b)))), winner: 'highest' },
            { key: 'facilities', label: 'Facilities', formatter: (c) => ((c.facilities || []).slice(0, 8).join(', ') || 'N/A'), compare: (a, b) => (((fLength(a)) - (fLength(b)))), winner: 'highest' }
        ];

        // helpers for lengths
        const cLength = (col) => Array.isArray(col.courses) ? col.courses.length : (col.courses ? col.courses.toString().split(',').length : 0);
        const fLength = (col) => Array.isArray(col.facilities) ? col.facilities.length : (col.facilities ? col.facilities.toString().split(',').length : 0);

        // Prepare head (college names)
        const headCols = list.map((col, idx) => `<th>${col.name}${col.website ? ` <a href="${col.website}" target="_blank" rel="noreferrer" title="Visit website">🔗</a>` : ''}<div style="margin-top:6px;"><button class=\"remove-compare-btn\" data-id=\"${col.id}\">Remove</button></div></th>`).join('');

        // Compute winners per attribute
        const winners = {};
        attributes.forEach(attr => {
            let bestIndex = 0;
            let bestValue = null;
            list.forEach((col, idx) => {
                let val;
                if (attr.key === 'fee') val = col.fee || 0;
                else if (attr.key === 'placement') val = col.placement || 0;
                else if (attr.key === 'courses') val = cLength(col);
                else if (attr.key === 'facilities') val = fLength(col);
                if (bestValue === null) { bestValue = val; bestIndex = idx; }
                else {
                    // choose based on winner direction
                    if (attr.winner === 'highest' && val > bestValue) { bestValue = val; bestIndex = idx; }
                    if (attr.winner === 'lowest' && val < bestValue) { bestValue = val; bestIndex = idx; }
                }
            });
            winners[attr.key] = bestIndex;
        });

        // Build table HTML
        let table = `<table class="compare-table"><thead><tr><th class="attr-name">Attribute</th>${list.map((c, i) => `<th>${c.name}</th>`).join('')}</tr></thead><tbody>`;
        attributes.forEach(attr => {
            table += `<tr><td class="attr-name">${attr.label}</td>`;
            list.forEach((col, idx) => {
                let cellValue = attr.formatter(col);
                const isWinner = winners[attr.key] === idx;
                const cellClass = isWinner ? 'compare-winner' : '';
                table += `<td class="${cellClass}" data-label="${attr.label}">${cellValue}</td>`;
            });
            table += `</tr>`;
        });
        table += `</tbody></table>`;

        contents.innerHTML = `
            <div>${table}</div>
            <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end; align-items:center;">
                <div><button id="clear-compare" class="btn-outline">Clear Comparison</button></div>
            </div>
        `;

        modal.style.display = 'flex';

        // Wire Clear and Remove buttons inside new table layout
        const clearBtn = document.getElementById('clear-compare');
        if (clearBtn) clearBtn.addEventListener('click', () => { setCompareList([]); document.getElementById('compare-modal').style.display = 'none'; });
        document.querySelectorAll('.remove-compare-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const newList = getCompareList().filter(i => i.id !== id);
            setCompareListAndRefresh(newList);
            // Re-open modal with updated list (or close if empty)
            if (getCompareList().length > 0) showCompareModal(); else document.getElementById('compare-modal').style.display = 'none';
        }));

        renderCompareBadge();
    }

    // Header compare button removed from HTML; keep badge rendering harmlessly guarded.
    // renderCompareBadge() will no-op when element is absent.
    renderCompareBadge();
    // Create and attach compare selection bar (sticky) to the DOM
    // Create the compare bar but only attach it when on the colleges page
    function createCompareBar() {
        if (document.getElementById('compare-bar')) return;
        const bar = document.createElement('div');
        bar.id = 'compare-bar';
        bar.style.display = 'none'; // start hidden until explicitly shown on colleges page with items
        bar.innerHTML = `
            <div class="compare-inner">
                <div id="compare-chips" class="compare-chips"></div>
                <div class="compare-actions">
                    <button id="compare-clear" class="btn-outline">Clear</button>
                    <button id="compare-now" class="compare-now-btn btn-primary" disabled>Compare Now</button>
                </div>
            </div>
        `;
        document.body.appendChild(bar);
        document.getElementById('compare-clear').addEventListener('click', () => { setCompareListAndRefresh([]); hideCompareBar(); });
        document.getElementById('compare-now').addEventListener('click', () => { showCompareModal(); });
    }

    function hideCompareBar() {
        const b = document.getElementById('compare-bar'); if (b) b.style.display = 'none';
    }

    function showCompareBarIfOnColleges() {
        const b = document.getElementById('compare-bar');
        if (!b) return;
        // only show if colleges page is active
        const collegesPage = document.getElementById('colleges-content');
        const isActive = collegesPage && collegesPage.classList.contains('active');
        const list = getCompareList();
        if (isActive && list.length > 0) b.style.display = 'flex'; else b.style.display = 'none';
    }

    function renderCompareBar() {
        createCompareBar();
        const chipsContainer = document.getElementById('compare-chips');
        const list = getCompareList();
        chipsContainer.innerHTML = '';
        list.forEach(col => {
            const chip = document.createElement('div');
            chip.className = 'compare-chip';
            chip.innerHTML = `<span class="chip-name">${escapeHtml(col.name)}</span><button class="remove-chip" data-id="${col.id}" title="Remove ${escapeHtml(col.name)}" aria-label="Remove ${escapeHtml(col.name)}">✕</button>`;
            chipsContainer.appendChild(chip);
        });
        chipsContainer.querySelectorAll('.remove-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                setCompareListAndRefresh(getCompareList().filter(c => c.id !== id));
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                }
            });
        });
        const nowBtn = document.getElementById('compare-now');
        if (nowBtn) nowBtn.disabled = list.length < 2;
        showCompareBarIfOnColleges();

    }

    try { renderCompareBar(); } catch (e) { /* ignore */ }

    // Dashboard Logic
    function loadAptitudeResults() {
        if (!currentUser) return;
        const userQuizHistoryRef = db.collection('users').doc(currentUser.uid).collection('quizHistory').orderBy('timestamp', 'desc').limit(1);
        userQuizHistoryRef.onSnapshot(snapshot => {
            if (snapshot.empty) {
                latestResultContent.innerHTML = '<p class="placeholder">Take a test to see your results!</p><div style="margin-top:1rem;"><button id="dashboard-take-test" class="btn-primary">Take Test</button></div>';
                // Wire CTA to lead to assessment
                setTimeout(() => {
                    const btn = document.getElementById('dashboard-take-test');
                    if (btn) btn.addEventListener('click', () => { showPage('assessment-content'); });
                }, 50);
                if (careerMatchChart) careerMatchChart.destroy();
            } else {
                const latestResult = snapshot.docs[0].data();
                latestQuizScores = latestResult.scores;
                const topMatches = Object.entries(latestQuizScores).sort(([, a], [, b]) => b - a).slice(0, 3);
                latestResultContent.innerHTML = topMatches.map(([stream, score], index) => `<div class="top-match-item match-${index + 1}"><div class="match-info">${stream}</div><div class="match-score">${Math.round(score / Object.values(latestQuizScores).reduce((a, b) => a + b, 0) * 100)}% Match</div></div>`).join('');
                renderRadarChart(latestQuizScores);
            }
        });
    }
    function renderRadarChart(scores) {
        const ctx = document.getElementById('career-match-chart');
        if (!ctx || !scores) return;
        if (careerMatchChart) careerMatchChart.destroy();
        const data = {
            labels: Object.keys(scores),
            datasets: [{
                label: 'Your Aptitude', data: Object.values(scores), fill: true,
                backgroundColor: 'rgba(30, 64, 175, 0.2)', borderColor: 'rgb(30, 64, 175)',
                pointBackgroundColor: 'rgb(30, 64, 175)', pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff', pointHoverBorderColor: 'rgb(30, 64, 175)'
            }]
        };
        careerMatchChart = new Chart(ctx, {
            type: 'radar', data: data,
            options: {
                elements: { line: { borderWidth: 3 } },
                scales: { r: { suggestedMin: 0, ticks: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }
    function loadTimelineWidget() {
        db.collection('timelineEvents').orderBy('deadline').limit(3).onSnapshot(snapshot => {
            if (snapshot.empty) { timelineWidgetContainer.innerHTML = '<p class="placeholder">No upcoming deadlines.</p>'; return; }
            const now = new Date();
            timelineWidgetContainer.innerHTML = snapshot.docs.map(doc => {
                const event = doc.data();
                const deadline = new Date(event.deadline);
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                let countdownHTML = daysLeft > 0 ? `<p>${daysLeft} days left</p>` : `<p>Deadline passed</p>`;
                let iconClass = 'exam';
                if (event.type === 'admission') iconClass = 'admission';
                return `<div class="timeline-item"><div class="icon ${iconClass}"><i class="fas fa-calendar-alt"></i></div><div><h3>${event.title}</h3>${countdownHTML}</div></div>`;
            }).join('');
        });
    }

    // Homepage Animations
    function animateCounter(element, target) {
        let current = 0;
        const increment = Math.max(1, target / 100);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 20);
    }
    // --- Testimonials (homepage) ---
    let testimonialUnsub = null;
    function renderTestimonialsList(docs) {
        const container = document.getElementById('carousel-container');
        const indicators = document.getElementById('carousel-indicators');
        if (!container) return;
        container.innerHTML = '';
        if (indicators) indicators.innerHTML = '';
        if (!docs || docs.length === 0) {
            container.innerHTML = `<div class="carousel-slide"><div class="card story-card"><p>No testimonials yet.</p></div></div>`;
            return;
        }
        docs.forEach((doc, i) => {
            const t = doc.data();
            const img = t.img || 'https://via.placeholder.com/120';
            const name = t.name || 'Anonymous';
            const message = t.message || t.text || '';
            const rating = t.rating || 0;
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `
                <div class="card story-card">
                    <img src="${img}" class="story-image" alt="${name}">
                    <div>
                        <div class="story-rating">${'★'.repeat(rating)}${rating ? '' : ''}</div>
                        <blockquote>${escapeHtml(message)}</blockquote>
                        <div class="student-name">${escapeHtml(name)}</div>
                    </div>
                </div>
            `;
            container.appendChild(slide);
            if (indicators) {
                const btn = document.createElement('button'); btn.className = 'indicator-btn'; if (i === 0) btn.classList.add('active'); btn.onclick = () => goToSlide(i);
                indicators.appendChild(btn);
            }
        });
        // restart auto-rotate
        currentSlide = 0; updateCarousel();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function loadTestimonialsForHomepage() {
        if (testimonialUnsub) return;
        try {
            testimonialUnsub = db.collection('testimonials').where('visible', '==', true).orderBy('createdAt', 'desc').onSnapshot(snap => {
                renderTestimonialsList(snap.docs);
            }, err => {
                console.error('Testimonials listener failed', err);
                // Show a helpful message in the carousel so the public site indicates what's wrong
                const container = document.getElementById('carousel-container');
                if (container) {
                    const errMsg = err && err.message ? err.message : 'Permission denied or network blocked';
                    let extra = 'Please ensure Firestore rules allow public reads on <code>/testimonials</code> or disable ad-blockers.';
                    // If Firestore tells us a composite index is required, include the console link to create it.
                    const indexLink = 'https://console.firebase.google.com/v1/r/project/careeradvisorhackathon/firestore/indexes?create_composite=Cltwcm9qZWN0cy9jYXJlZXJhZHZpc29yaGFja2F0aG9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90ZXN0aW1vbmlhbHMvaW5kZXhlcy9fEAEaCwoHdmlzaWJsZRABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI';
                    if (errMsg.indexOf('requires an index') !== -1 || errMsg.indexOf('index') !== -1) {
                        extra += ` You can create the required index <a href="${indexLink}" target="_blank" rel="noopener">here</a>.`;
                    }
                    container.innerHTML = `<div class="carousel-slide"><div class="card story-card"><p style="color:#a00;">Unable to load testimonials: ${escapeHtml(errMsg)}.</p><p>${extra}</p></div></div>`;
                }
            });
        } catch (err) { console.error('Failed to attach testimonials listener', err); }
    }

    // --- Real-time Stats (listeners) ---
    function loadDynamicStats() {
        // avoid duplicate listeners
        if (statsUnsubs.users || statsUnsubs.careers || statsUnsubs.colleges) return;

        // Users count (exclude admin)
        statsUnsubs.users = db.collection('users').onSnapshot(snap => {
            try {
                const nonAdmin = snap.docs.filter(d => ((d.data() && d.data().email) || '').toString().toLowerCase() !== 'admin@careerconnect.com');
                const count = nonAdmin.length;
                const el = document.getElementById('students-count');
                if (el && lastStats.students !== count) { animateCounter(el, count); lastStats.students = count; }
            } catch (err) { console.error('Error in users stats listener', err); }
        }, console.error);

        // Career paths (unique recommendedStream from any user's quizHistory)
        statsUnsubs.careers = db.collectionGroup('quizHistory').onSnapshot(snap => {
            try {
                const unique = new Set();
                snap.forEach(doc => {
                    const rs = (doc.data && doc.data().recommendedStream) ? doc.data().recommendedStream : null;
                    if (rs) unique.add(rs);
                });
                const el = document.getElementById('careers-count');
                if (el && lastStats.careers !== unique.size) { animateCounter(el, unique.size); lastStats.careers = unique.size; }
            } catch (err) { console.error('Error in careers stats listener', err); }
        }, console.error);

        // Colleges count
        statsUnsubs.colleges = db.collection('colleges').onSnapshot(snap => {
            try {
                const el = document.getElementById('colleges-count');
                if (el && lastStats.colleges !== snap.size) { animateCounter(el, snap.size); lastStats.colleges = snap.size; }
                // also update career-hero small box if present
                try {
                    if (collegesCountCareerBox) {
                        const txt = `${snap.size}+`;
                        collegesCountCareerBox.querySelector('.number').textContent = txt;
                    }
                } catch (e) { /* ignore */ }
            } catch (err) { console.error('Error in colleges stats listener', err); }
        }, console.error);
    }

    // Homepage counters driven by Firestore (users, careers, colleges)
    let homepageStatsUnsub = { users: null, careers: null, colleges: null };
    function loadHomepageStats() {
        if (!db) return;
        if (!homepageStatsUnsub.users) homepageStatsUnsub.users = db.collection('users').onSnapshot(snap => {
            try {
                const nonAdmin = snap.docs.filter(d => ((d.data() && d.data().email) || '').toString().toLowerCase() !== 'admin@careerconnect.com');
                const count = nonAdmin.length;
                if (studentsCount) animateCounter(studentsCount, count);
            } catch (e) { console.error('Error updating homepage students stat', e); }
        }, err => console.error('Homepage users stats listener failed', err));

        if (!homepageStatsUnsub.careers) homepageStatsUnsub.careers = db.collection('careers').onSnapshot(snap => {
            try { if (careersCount) animateCounter(careersCount, snap.size); } catch (e) { console.error('Error updating homepage careers stat', e); }
        }, err => console.error('Homepage careers stats listener failed', err));

        if (!homepageStatsUnsub.colleges) homepageStatsUnsub.colleges = db.collection('colleges').onSnapshot(snap => {
            try { if (collegesCount) animateCounter(collegesCount, snap.size); } catch (e) { console.error('Error updating homepage colleges stat', e); }
        }, err => console.error('Homepage colleges stats listener failed', err));
        // One-time fetch fallback in case listeners don't fire (helpful for debugging / permissions issues)
        try {
            // Users count fallback
            db.collection('users').get().then(snap => {
                try {
                    const nonAdmin = snap.docs.filter(d => ((d.data() && d.data().email) || '').toString().toLowerCase() !== 'admin@careerconnect.com');
                    const count = nonAdmin.length;
                    if (studentsCount) animateCounter(studentsCount, count);
                } catch (e) { console.warn('Homepage users fallback failed', e); }
            }).catch(err => console.warn('Homepage users fallback get() failed', err));

            // Careers count fallback
            db.collection('careers').get().then(snap => {
                try { if (careersCount) animateCounter(careersCount, snap.size); } catch (e) { console.warn('Homepage careers fallback failed', e); }
            }).catch(err => console.warn('Homepage careers fallback get() failed', err));

            // Colleges count fallback
            db.collection('colleges').get().then(snap => {
                try { if (collegesCount) animateCounter(collegesCount, snap.size); } catch (e) { console.warn('Homepage colleges fallback failed', e); }
            }).catch(err => console.warn('Homepage colleges fallback get() failed', err));
        } catch (e) { console.warn('Homepage stats fallback aborted', e); }
    }

    function cleanupHomepageStats() {
        try {
            if (homepageStatsUnsub.users) { homepageStatsUnsub.users(); homepageStatsUnsub.users = null; }
            if (homepageStatsUnsub.careers) { homepageStatsUnsub.careers(); homepageStatsUnsub.careers = null; }
            if (homepageStatsUnsub.colleges) { homepageStatsUnsub.colleges(); homepageStatsUnsub.colleges = null; }
        } catch (e) { console.error('Error cleaning up homepage stats', e); }
    }

    // Single listener for career-explorer header stats
    // Computes: total career paths, government jobs (type === 'government'), and emerging fields (avgSalary > 20 LPA)
    let explorerStatsUnsub = { careers: null };
    function parseAvgSalaryToLPA(raw) {
        // raw may be a number (LPA) or a string like "₹4-25 LPA" or "20 LPA". Return numeric LPA (highest number found) or 0.
        if (raw == null) return 0;
        if (typeof raw === 'number') return raw;
        try {
            const s = raw.toString();
            const matches = s.match(/\d+(?:\.\d+)?/g);
            if (!matches || matches.length === 0) return 0;
            // convert to numbers and take the largest (handles ranges like 4-25)
            const nums = matches.map(m => parseFloat(m)).filter(n => !isNaN(n));
            if (nums.length === 0) return 0;
            return Math.max(...nums);
        } catch (e) { return 0; }
    }

    function loadCareerExplorerStats() {
        if (!db) return;
        if (explorerStatsUnsub.careers) return; // already listening
        explorerStatsUnsub.careers = db.collection('careers').onSnapshot(snap => {
            try {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const total = docs.length;
                // Count government-type careers (case-insensitive match)
                const governmentCount = docs.filter(d => (d.type || '').toString().toLowerCase() === 'government').length;
                // Emerging fields: avgSalary numeric (LPA) > 20
                const emergingCount = docs.filter(d => {
                    const val = parseAvgSalaryToLPA(d.avgSalary);
                    return val > 20;
                }).length;

                if (studentsCountCareerBox) {
                    try { studentsCountCareerBox.querySelector('.number').textContent = `${total}+`; } catch (e) { studentsCountCareerBox.textContent = `${total}+`; }
                }
                if (careersCountCareerBox) {
                    try { careersCountCareerBox.querySelector('.number').textContent = `${governmentCount}+`; } catch (e) { careersCountCareerBox.textContent = `${governmentCount}+`; }
                }
                if (collegesCountCareerBox) {
                    try { collegesCountCareerBox.querySelector('.number').textContent = `${emergingCount}+`; } catch (e) { collegesCountCareerBox.textContent = `${emergingCount}+`; }
                }
            } catch (e) { console.error('Error processing career-explorer stats', e); }
        }, err => { console.error('Explorer careers stats listener failed', err); });
    }

    function cleanupCareerExplorerStats() {
        try {
            if (explorerStatsUnsub.students) { explorerStatsUnsub.students(); explorerStatsUnsub.students = null; }
            if (explorerStatsUnsub.careers) { explorerStatsUnsub.careers(); explorerStatsUnsub.careers = null; }
            if (explorerStatsUnsub.colleges) { explorerStatsUnsub.colleges(); explorerStatsUnsub.colleges = null; }
        } catch (err) { console.error('Error cleaning up explorer stats', err); }
    }

    function cleanupDynamicStats() {
        try {
            if (statsUnsubs.users) { statsUnsubs.users(); statsUnsubs.users = null; }
            if (statsUnsubs.careers) { statsUnsubs.careers(); statsUnsubs.careers = null; }
            if (statsUnsubs.colleges) { statsUnsubs.colleges(); statsUnsubs.colleges = null; }
            lastStats = { students: null, careers: null, colleges: null };
        } catch (err) { console.error('Error cleaning up stats listeners', err); }
    }

    async function sendMessageToAI() {
        const message = chatInput.value.trim();
        if (message === '') return;

        appendMessage(message, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';

        showTypingIndicator();
        try {
            const aiResponse = await generateAIResponse(message);
            hideTypingIndicator();
            appendMessage(aiResponse, 'ai');
        } catch (err) {
            hideTypingIndicator();
            appendMessage("⚠️ Error: " + err.message, 'ai');
        }
    }

    // === Append chat bubbles ===
    function appendMessage(text, type) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.textContent = text;
        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // === Quick message shortcuts ===
    window.sendQuickMessage = async function (message) {
        appendMessage(message, 'user');
        showTypingIndicator();
        try {
            const aiResponse = await generateAIResponse(message);
            hideTypingIndicator();
            appendMessage(aiResponse, 'ai');
        } catch (err) {
            hideTypingIndicator();
            appendMessage("⚠️ Error: " + err.message, 'ai');
        }
    }

    // === Typing indicator ===
    function showTypingIndicator() {
        const typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble ai typing-indicator';
        typingBubble.id = 'typing-indicator';
        typingBubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>`;
        chatWindow.appendChild(typingBubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

async function generateAIResponse(userMessage) {
    const API_KEY = "YOUR_GEMINI_API_KEY"; 
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

        const body = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                }
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error("Gemini API error: " + err);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No reply from AI.";
    }



    startQuizBtnHero.addEventListener('click', startQuiz);
    startQuizBtnAssessment.addEventListener('click', startQuiz);
    retakeQuizBtnDashboard.addEventListener('click', startQuiz);
    retakeQuizBtn.addEventListener('click', startQuiz);

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    showLoginBtn.addEventListener('click', () => { signupForm.style.display = 'none'; loginForm.style.display = 'flex'; showLoginBtn.classList.add('active'); showSignupBtn.classList.remove('active'); });
    showSignupBtn.addEventListener('click', () => { loginForm.style.display = 'none'; signupForm.style.display = 'flex'; showSignupBtn.classList.add('active'); showLoginBtn.classList.remove('active'); });
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(document.getElementById(e.currentTarget.dataset.target))));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { Object.values(document.querySelectorAll('.modal-wrapper')).forEach(hideModal); } });

    if (carouselContainer) {
        const slides = carouselContainer.querySelectorAll('.carousel-slide');
        if (slides.length > 0) {
            for (let i = 0; i < slides.length; i++) {
                const button = document.createElement('button');
                button.className = 'indicator-btn';
                if (i === 0) button.classList.add('active');
                button.onclick = () => goToSlide(i);
                indicatorsContainer.appendChild(button);
            }
            setInterval(window.nextSlide, 5000);
        }
    }

    careerFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // toggle active class for UI
            careerFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = (button.dataset.filter || 'all').toString().toLowerCase();
            // query current cards at runtime
            const currentCards = document.querySelectorAll('#career-grid-container .career-card');
            currentCards.forEach(card => {
                const cat = (card.dataset.category || '').toString().toLowerCase();
                if (filter === 'all' || cat === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    if (careerSearchInput) {
        careerSearchInput.addEventListener('keyup', () => {
            const searchTerm = careerSearchInput.value.toLowerCase();
            careerCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('.description').textContent.toLowerCase();
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.querySelectorAll('.filters-sidebar input, .filters-sidebar select').forEach(el => {
                if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                else el.value = '';
            });
            if (collegeSearchInputMain) collegeSearchInputMain.value = '';
            if (streamFilterMain) streamFilterMain.value = '';
            applyFiltersAndSort();
        });
    }
    document.querySelectorAll('#college-search-input-main, #city-filter, #sort-by').forEach(el => el.addEventListener('change', applyFiltersAndSort));
    collegeTypeCheckboxes.forEach(el => el.addEventListener('change', applyFiltersAndSort));
    feeRangeRadios.forEach(el => el.addEventListener('change', applyFiltersAndSort));
    if (collegeSearchInputMain) collegeSearchInputMain.addEventListener('keyup', applyFiltersAndSort);
    // Wire the hero search button (in colleges hero) - look for a nearby button in the DOM
    try {
        const heroSearchButton = document.querySelector('.college-search-box .btn-primary');
        if (heroSearchButton) heroSearchButton.addEventListener('click', (e) => { e.preventDefault(); applyFiltersAndSort(); showPage('colleges-content'); });
    } catch (e) { /* ignore */ }

    if (aiChatForm) aiChatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessageToAI(); });
    if (chatInput) chatInput.addEventListener('input', () => { chatInput.style.height = 'auto'; chatInput.style.height = (chatInput.scrollHeight) + 'px'; });

    document.querySelectorAll('[href="ai_counselor_interface.html"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('ai-counselor-content');
        });
    });

    
    
    loadCollegesFromFirestore();
    try { loadCareersFromFirestore(); } catch (e) { console.error('Failed to load careers', e); }
    try { loadDynamicStats(); } catch (e) { console.error('Failed to start dynamic stats', e); }
    try { loadTestimonialsForHomepage(); } catch (e) { console.error('Failed to start testimonials listener', e); }
    try { loadHomepageStats(); } catch (e) { console.error('Failed to start homepage stats', e); }
    showPage('homepage-content'); // Start on the homepage
});