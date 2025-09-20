document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
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
    const questions = [
        // Your questions array remains here...
    ];
    
    // ===================================================================
    // ! --- ALL FUNCTIONS DEFINED HERE FIRST ---
    // ===================================================================
    
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
        }, 5000); // 5000 milliseconds = 5 seconds
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

    // ... The rest of your script.js file remains unchanged (handleSignup, handleLogin, Quiz Logic, etc.) ...
    
    // --- INITIAL LOAD ---
    // Note: The automatic redirect timer from the previous request has been removed as this new UI element is a better approach.
    // If you still want the redirect, you can add the setTimeout code back here.
    
    loadCollegesFromFirestore();
    showPage('homepage-content'); // Start on the homepage
});