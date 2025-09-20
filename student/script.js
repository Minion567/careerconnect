document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
    let collegesFromDB = [];
    let uniqueCities = [];
    let latestQuizResultForSignup = null;
    let latestQuizScores = null;
    let careerMatchChart = null; // To hold the chart instance

    // --- DOM ELEMENT SELECTORS (ALL PAGES) ---
    const userAuthSection = document.getElementById('user-auth-section');
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

    // Career Explorer Page Elements
    const careerFilterButtons = document.querySelectorAll('.filter-btn');
    const careerCards = document.querySelectorAll('#career-grid-container .career-card');
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
    // NOTE: SAMPLE_COLLEGES removed — application now relies solely on Firestore for colleges data.
    const questions = [
        {
            text: "When you have free time, you prefer to:",
            options: [
                { text: "Build or fix things", weights: { Vocational: 2, Science: 1 } },
                { text: "Read a book or write", weights: { Arts: 2 } },
                { text: "Organize your room or plan a budget", weights: { Commerce: 2 } },
                { text: "Watch a documentary or solve puzzles", weights: { Science: 2 } }
            ]
        },
        {
            text: "Which subject do you enjoy most?",
            options: [
                { text: "Physics or Chemistry", weights: { Science: 2 } },
                { text: "History or Literature", weights: { Arts: 2 } },
                { text: "Mathematics or Economics", weights: { Commerce: 2, Science: 1 } },
                { text: "Computer Science or a workshop class", weights: { Vocational: 2, Science: 1 } }
            ]
        },
        {
            text: "How do you prefer to solve a problem?",
            options: [
                { text: "By analyzing data logically", weights: { Science: 2, Commerce: 1 } },
                { text: "By thinking creatively", weights: { Arts: 2 } },
                { text: "By collaborating and managing", weights: { Commerce: 2 } },
                { text: "By taking a hands-on approach", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "Which work environment sounds appealing?",
            options: [
                { text: "A laboratory or a tech company", weights: { Science: 2 } },
                { text: "An art studio or a law firm", weights: { Arts: 2 } },
                { text: "A bank or my own startup", weights: { Commerce: 2 } },
                { text: "A workshop or working on-site", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "When tackling a big project, you most enjoy:",
            options: [
                { text: "Designing experiments and testing ideas", weights: { Science: 2 } },
                { text: "Crafting the narrative or visuals", weights: { Arts: 2 } },
                { text: "Planning the budget and timeline", weights: { Commerce: 2 } },
                { text: "Building prototypes and practical solutions", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "Which of these activities energizes you the most?",
            options: [
                { text: "Solving logic puzzles or coding challenges", weights: { Science: 2 } },
                { text: "Writing, performing, or designing", weights: { Arts: 2 } },
                { text: "Negotiating or selling ideas", weights: { Commerce: 2 } },
                { text: "Hands-on repair or craftsmanship", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "When choosing a career, your top priority is:",
            options: [
                { text: "Intellectual challenge and discovery", weights: { Science: 2 } },
                { text: "Creative freedom and expression", weights: { Arts: 2 } },
                { text: "Financial stability and growth", weights: { Commerce: 2 } },
                { text: "Practical skills and independence", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "How do you prefer to learn new things?",
            options: [
                { text: "Through experiments and data", weights: { Science: 2 } },
                { text: "By reading and reflecting", weights: { Arts: 2 } },
                { text: "By watching case studies and examples", weights: { Commerce: 2 } },
                { text: "By doing practical, hands-on work", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "Which of these problem types do you enjoy most?",
            options: [
                { text: "Technical puzzles or experiments", weights: { Science: 2 } },
                { text: "Ambiguous, open-ended creative briefs", weights: { Arts: 2 } },
                { text: "Business strategy and optimization", weights: { Commerce: 2 } },
                { text: "Fixing machines or constructing things", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "What kind of team role do you prefer?",
            options: [
                { text: "Researcher / Analyst", weights: { Science: 2 } },
                { text: "Creative lead / Storyteller", weights: { Arts: 2 } },
                { text: "Manager / Coordinator", weights: { Commerce: 2 } },
                { text: "Technician / Builder", weights: { Vocational: 2 } }
            ]
        },
        {
            text: "How comfortable are you with numbers and statistics?",
            options: [
                { text: "Very comfortable — I enjoy numbers", weights: { Science: 1, Commerce: 2 } },
                { text: "I use them sometimes for research or art projects", weights: { Arts: 1, Science: 1 } },
                { text: "I use them regularly for planning and finance", weights: { Commerce: 2 } },
                { text: "I prefer practical measurements and hands-on metrics", weights: { Vocational: 1 } }
            ]
        },
        {
            text: "Which outcome matters most to you in a job?",
            options: [
                { text: "Contributing to scientific knowledge or tech innovation", weights: { Science: 2 } },
                { text: "Creating meaningful art or stories", weights: { Arts: 2 } },
                { text: "Driving business results and growth", weights: { Commerce: 2 } },
                { text: "Making useful tangible products or services", weights: { Vocational: 2 } }
            ]
        }
    ];
    
    // ===================================================================
    // ! --- ALL FUNCTIONS DEFINED HERE FIRST ---
    // ===================================================================
    
    // Utility Functions
    function showModal(modal) { if(modal) modal.style.display = 'flex'; }
    function hideModal(modal) { if(modal) modal.style.display = 'none'; }

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
    window.nextSlide = function() {
        const slides = document.querySelectorAll('#carousel-container .carousel-slide');
        if (!slides.length) return;
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    }
    window.previousSlide = function() {
        const slides = document.querySelectorAll('#carousel-container .carousel-slide');
        if (!slides.length) return;
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
    }
    window.goToSlide = function(index) {
        currentSlide = index;
        updateCarousel();
    }

    // SPA Navigation Function
    window.showPage = function(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
        window.scrollTo(0, 0);

        if (pageId === 'homepage-content') {
            if (studentsCount && studentsCount.textContent === "0") {
                animateCounter(studentsCount, 25847);
                animateCounter(careersCount, 180);
                animateCounter(collegesCount, 1200);
            }
        }
        if (pageId === 'colleges-content' && collegesFromDB.length > 0) {
            applyFiltersAndSort();
            try { renderCompareBar(); } catch(e) {}
        }
        if (pageId === 'dashboard-content' && currentUser) {
            loadDashboardData();
        }
    }

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


    // Authentication
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = { uid: user.uid, email: user.email };
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    currentUser.name = doc.data().name;
                    userAuthSection.innerHTML = `
                        <span id="user-display-name">Hi, ${currentUser.name.split(' ')[0]}</span>
                        <button class="btn-outline-light" id="logout-btn">Logout</button>
                    `;
                    document.getElementById('logout-btn').addEventListener('click', () => {
                        auth.signOut();
                    });
                    showPage('dashboard-content');
                } else { auth.signOut(); }
            }).catch(err => {
                console.error("Error fetching user document:", err);
                auth.signOut();
            });
        } else {
            currentUser = null;
            userAuthSection.innerHTML = `<button class="btn-primary" id="login-signup-btn-nav">Login / Signup</button>`;
            const loginBtn = document.getElementById('login-signup-btn-nav');
            if (loginBtn) loginBtn.addEventListener('click', () => showModal(authContainer));
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
                if(showSignupBtn) showSignupBtn.click();
            });
        }
        showModal(resultContainer);
    }
    
    // Colleges Logic
    async function loadCollegesFromFirestore() {
        try {
            const snapshot = await db.collection('colleges').get();
            // If snapshot is empty, show an explicit empty-state and return
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
        try { console.log('Applying filters', { totalColleges: collegesFromDB.length, search: collegeSearchInputMain ? collegeSearchInputMain.value : null, city: cityFilter ? cityFilter.value : null, selectedTypes: Array.from(collegeTypeCheckboxes).filter(cb=>cb.checked).map(cb=>cb.value) }); } catch (e) {}
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
                'engineering': ['b.tech','btech','be','b.e','engineering','computer','cse','ece','ee','it','mechanical','civil','technology','tech','mca'],
                'b.tech': ['b.tech','btech','be','engineering','computer','cse','it','technology'],
                'mbbs': ['mbbs','bds','medical','medicine','nursing','pharmacy','health'],
                'medical': ['mbbs','bds','medical','medicine','nursing','pharmacy','health'],
                'management': ['mba','bba','management','business','commerce','mcom'],
                'mba': ['mba','management','business','commerce']
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
            console.warn('applyFiltersAndSort: no colleges matched filters', { searchTerm, selectedCity: cityFilter ? cityFilter.value : null, selectedTypes: Array.from(collegeTypeCheckboxes).filter(cb=>cb.checked).map(cb=>cb.value) });
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
    function setCompareList(list) { localStorage.setItem('collegeCompare', JSON.stringify(list)); renderCompareBadge(); try { renderCompareBar(); } catch(e) { /* ignore if not ready */ } }
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
        const fmtFee = (f) => f ? `₹${(f/100000).toFixed(1)} L` : 'N/A';
        const fmtPlacement = (p) => p ? `${p}%` : 'N/A';

        // Build a compact table: attributes as rows, each college as a column
        const attributes = [
            { key: 'fee', label: 'Annual Fee', formatter: (c) => (c.fee ? `₹${(c.fee/100000).toFixed(1)} L` : 'N/A'), compare: (a,b) => ( (a||0) - (b||0) ), winner: 'lowest' },
            { key: 'placement', label: 'Placement', formatter: (c) => (c.placement ? `${c.placement}%` : 'N/A'), compare: (a,b) => ( (b||0) - (a||0) ), winner: 'highest' },
            { key: 'courses', label: 'Courses', formatter: (c) => ( (c.courses || []).slice(0,6).join(', ') || 'N/A' ), compare: (a,b) => ( ( (cLength(a)) - (cLength(b)) ) ), winner: 'highest' },
            { key: 'facilities', label: 'Facilities', formatter: (c) => ( (c.facilities || []).slice(0,8).join(', ') || 'N/A' ), compare: (a,b) => ( ( (fLength(a)) - (fLength(b)) ) ), winner: 'highest' }
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
            <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:space-between; align-items:center;">
                <div><button id="clear-compare" class="btn-outline">Clear Comparison</button></div>
                <div style="color:var(--color-text-muted); font-size:0.95rem;">Tip: Click "Remove" below a college name to remove it from comparison.</div>
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
            chip.innerHTML = `<span class="chip-name">${col.name}</span><button class="remove-chip" data-id="${col.id}">✕</button>`;
            chipsContainer.appendChild(chip);
        });
        // wire remove
        chipsContainer.querySelectorAll('.remove-chip').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            setCompareListAndRefresh(getCompareList().filter(c => c.id !== id));
        }));
        const nowBtn = document.getElementById('compare-now');
        if (nowBtn) nowBtn.disabled = list.length < 2;
        // show/hide depending on current page
        showCompareBarIfOnColleges();
    }

    // Render initially
    try { renderCompareBar(); } catch (e) { /* ignore */ }
    
    // Dashboard Logic
    function loadAptitudeResults() {
        if(!currentUser) return;
        const userQuizHistoryRef = db.collection('users').doc(currentUser.uid).collection('quizHistory').orderBy('timestamp', 'desc').limit(1);
        userQuizHistoryRef.onSnapshot(snapshot => {
            if (snapshot.empty) {
                latestResultContent.innerHTML = '<p class="placeholder">Take a test to see your results!</p>';
                if(careerMatchChart) careerMatchChart.destroy();
            } else {
                const latestResult = snapshot.docs[0].data();
                latestQuizScores = latestResult.scores;
                const topMatches = Object.entries(latestQuizScores).sort(([,a],[,b]) => b-a).slice(0, 3);
                latestResultContent.innerHTML = topMatches.map(([stream, score], index) => `<div class="top-match-item match-${index+1}"><div class="match-info">${stream}</div><div class="match-score">${Math.round(score / Object.values(latestQuizScores).reduce((a,b)=>a+b,0) * 100)}% Match</div></div>`).join('');
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
                if(event.type === 'admission') iconClass = 'admission';
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
    
    // AI Counselor Logic
    // === Send message to Gemini AI ===
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
window.sendQuickMessage = async function(message) {
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
        <div class="typing-dot"></div>
    `;
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
            careerFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            careerCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    if(careerSearchInput) {
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
    
    if(clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.querySelectorAll('.filters-sidebar input, .filters-sidebar select').forEach(el => {
                if(el.type === 'checkbox' || el.type === 'radio') el.checked = false;
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
    if(collegeSearchInputMain) collegeSearchInputMain.addEventListener('keyup', applyFiltersAndSort);
    // Wire the hero search button (in colleges hero) - look for a nearby button in the DOM
    try {
        const heroSearchButton = document.querySelector('.college-search-box .btn-primary');
        if (heroSearchButton) heroSearchButton.addEventListener('click', (e) => { e.preventDefault(); applyFiltersAndSort(); showPage('colleges-content'); });
    } catch (e) { /* ignore */ }

    if(aiChatForm) aiChatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessageToAI(); });
    if(chatInput) chatInput.addEventListener('input', () => { chatInput.style.height = 'auto'; chatInput.style.height = (chatInput.scrollHeight) + 'px'; });
    
    document.querySelectorAll('[href="ai_counselor_interface.html"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('ai-counselor-content');
        });
    });

    loadCollegesFromFirestore();
    showPage('homepage-content'); // Start on the homepage
});