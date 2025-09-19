document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTORS ---
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('admin-login-error');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const studentsTableBody = document.querySelector('#students-table tbody');
    const collegesTableBody = document.querySelector('#colleges-table tbody');
    const eventsTableBody = document.querySelector('#events-table tbody');

    // Dashboard Elements
    const studentCountEl = document.getElementById('student-count');
    const collegeCountEl = document.getElementById('college-count');
    const eventCountEl = document.getElementById('event-count');
    const welcomeHeader = document.getElementById('welcome-header');
    const recentActivityFeed = document.getElementById('recent-activity-feed');
    
    // Sidebar Menu
    const menuItems = document.querySelectorAll('.menu-item');
    const widgets = document.querySelectorAll('.dashboard-widget');

    // Modal Elements
    const formModal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addCollegeBtnMain = document.getElementById('add-college-btn-main');
    const addEventBtnMain = document.getElementById('add-event-btn-main');
    const addEventBtnHeader = document.getElementById('add-event-btn-header');
    const addCollegeBtnQuick = document.getElementById('add-college-btn-quick');
    const seedCollegesBtn = document.getElementById('seed-colleges-btn');
    const seedTimelineBtn = document.getElementById('seed-timeline-btn');

    const ADMIN_EMAIL = "admin@careerconnect.com"; 
    let signupsChartInstance = null;
    let streamsChartInstance = null;

    // --- AUTHENTICATION ---
    auth.onAuthStateChanged(user => {
        if (user && user.email === ADMIN_EMAIL) {
            loginView.style.display = 'none';
            dashboardView.style.display = 'flex';
            welcomeHeader.textContent = `Welcome back, Admin!`;
            loadDashboardData();
        } else {
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
            if (user) { auth.signOut(); }
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = loginForm['admin-email'].value;
        const password = loginForm['admin-password'].value;
        if (email !== ADMIN_EMAIL) {
            loginError.textContent = "This email is not authorized for admin access.";
            return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .catch(err => loginError.textContent = err.message);
    });

    logoutBtn.addEventListener('click', () => auth.signOut());

    // --- DASHBOARD NAVIGATION ---
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove('active'));
            widgets.forEach(w => w.classList.remove('active'));

            item.classList.add('active');
            const targetWidget = document.getElementById(item.dataset.target);
            if(targetWidget) targetWidget.classList.add('active');
        });
    });

    // --- DATA LOADING & CHARTS ---
    function loadDashboardData() {
        loadStudentsAndRenderCharts();
        loadColleges();
        loadEvents();
        loadRecentActivity();
    }

    async function loadStudentsAndRenderCharts() {
        db.collection('users').onSnapshot(async (snapshot) => {
            const userDocs = snapshot.docs.filter(doc => doc.data().email !== ADMIN_EMAIL);
            studentCountEl.textContent = userDocs.length;
            studentsTableBody.innerHTML = '';
            
            const allQuizHistories = [];
            for (const doc of userDocs) {
                const user = doc.data();
                const quizHistoryRef = db.collection('users').doc(doc.id).collection('quizHistory').orderBy('timestamp', 'desc').limit(1);
                const quizSnapshot = await quizHistoryRef.get();
                const latestResult = quizSnapshot.empty ? { recommendedStream: 'No Test Taken' } : quizSnapshot.docs[0].data();
                allQuizHistories.push(latestResult);
                
                const row = document.createElement('tr');
                row.innerHTML = `<td>${user.name || ''}</td><td>${user.email || ''}</td><td>${user.phone || ''}</td><td>${user.city || ''}</td><td><strong>${latestResult.recommendedStream}</strong></td>`;
                studentsTableBody.appendChild(row);
            }
            renderSignupsChart(userDocs);
            renderStreamsChart(allQuizHistories);
        });
    }

    function renderSignupsChart(users) {
        const ctx = document.getElementById('signupsChart').getContext('2d');
        const last7Days = Array(7).fill(0);
        const labels = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse();

        users.forEach(userDoc => {
            const user = userDoc.data();
            if (user.createdAt && user.createdAt.toDate) {
                const signupDate = user.createdAt.toDate();
                const today = new Date();
                const diffTime = today - signupDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                    last7Days[6 - diffDays]++;
                }
            }
        });
        
        if (signupsChartInstance) signupsChartInstance.destroy();
        signupsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Signups',
                    data: last7Days,
                    backgroundColor: 'rgba(74, 71, 226, 0.7)',
                    borderColor: 'rgba(74, 71, 226, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
    
    function renderStreamsChart(quizHistories) {
        const ctx = document.getElementById('streamsChart').getContext('2d');
        const streamCounts = { 'Science': 0, 'Arts': 0, 'Commerce': 0, 'Vocational': 0 };
        quizHistories.forEach(history => {
            if (streamCounts.hasOwnProperty(history.recommendedStream)) {
                streamCounts[history.recommendedStream]++;
            }
        });

        if (streamsChartInstance) streamsChartInstance.destroy();
        streamsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(streamCounts),
                datasets: [{
                    label: 'Stream Distribution',
                    data: Object.values(streamCounts),
                    backgroundColor: ['#3B82F6', '#F97316', '#10B981', '#8B5CF6'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    function loadColleges() {
        db.collection('colleges').onSnapshot(snapshot => {
            collegeCountEl.textContent = snapshot.size;
            collegesTableBody.innerHTML = '';
            snapshot.forEach(doc => {
                const college = doc.data();
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${college.name || ''}</td><td>${college.city || ''}</td><td><button class="edit-btn" data-id="${doc.id}">Edit</button> <button class="delete-btn" data-id="${doc.id}">Delete</button></td>`;
                collegesTableBody.appendChild(row);
            });
        });
    }

    function loadEvents() {
        db.collection('timelineEvents').orderBy('deadline').onSnapshot(snapshot => {
            eventCountEl.textContent = snapshot.size;
            eventsTableBody.innerHTML = '';
            snapshot.forEach(doc => {
                const event = doc.data();
                const row = document.createElement('tr');
                const deadlineDate = new Date(event.deadline + 'T00:00:00');
                const formattedDate = deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'});
                row.innerHTML = `<td>${event.title}</td><td>${event.type}</td><td>${formattedDate}</td><td><button class="delete-btn" data-id="${doc.id}">Delete</button></td>`;
                eventsTableBody.appendChild(row);
            });
        });
    }
    
    async function loadRecentActivity() {
        const userQuery = db.collection('users').orderBy('createdAt', 'desc').limit(3);
        const [userSnapshot] = await Promise.all([userQuery.get()]);
        let activities = [];
        userSnapshot.forEach(doc => {
            const data = doc.data();
            if(data.email === ADMIN_EMAIL) return;
            activities.push({
                type: 'user',
                text: `New student <strong>${data.name}</strong> signed up.`,
                timestamp: data.createdAt.toDate()
            });
        });
        activities.sort((a,b) => b.timestamp - a.timestamp);
        recentActivityFeed.innerHTML = activities.map(act => {
             const timeAgo = Math.round((new Date() - act.timestamp) / (1000 * 60)); // in minutes
             return `
                <div class="activity-item ${act.type}">
                    <i class="fas fa-${act.type === 'user' ? 'user-plus' : 'school'}"></i>
                    <div class="activity-text">${act.text}</div>
                    <div class="activity-time">${timeAgo} min ago</div>
                </div>
             `;
        }).join('');
    }

    // --- MODAL & FORM HANDLING ---
    function openModal(title, formHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML = formHTML;
        formModal.style.display = 'flex';
    }
    function closeModal() {
        formModal.style.display = 'none';
        modalBody.innerHTML = '';
    }
    closeModalBtn.addEventListener('click', closeModal);

    function showAddCollegeModal() {
        const formHTML = `
            <form id="add-college-form">
                <input class="full-width" type="text" name="name" placeholder="College Name" required>
                <input type="text" name="city" placeholder="City" required>
                <input type="number" name="nirf" placeholder="NIRF Rank (optional)">
                <input class="full-width" type="url" name="image" placeholder="Image URL" required>
                <input type="text" name="lat" placeholder="Latitude (e.g., 30.9010)" required>
                <input type="text" name="lon" placeholder="Longitude (e.g., 75.8573)" required>
                <input class="full-width" type="text" name="courses" placeholder="Courses (comma-separated)" required>
                <input class="full-width" type="text" name="facilities" placeholder="Facilities (comma-separated)" required>
                <input type="number" name="fee" placeholder="Annual Fee" required>
                        <select name="type" required>
                            <option value="" disabled selected>Select Type</option>
                            <option value="Government">Government</option>
                            <option value="Private">Private</option>
                        </select>
                <input type="number" name="placement" placeholder="Placement %" required>
                <input type="number" name="package" placeholder="Average Package (LPA)" required>
                <button type="submit" class="admin-button primary full-width">Add College</button>
            </form>
        `;
        openModal('Add New College', formHTML);
    }

    function showAddEventModal() {
        const formHTML = `
            <form id="add-event-form" class="full-width">
                <input class="full-width" type="text" name="title" placeholder="Event Title" required>
                <input class="full-width" type="text" name="description" placeholder="Short Description">
                <select name="type" required>
                    <option value="" disabled selected>Select Type</option>
                    <option value="exam">Exam</option>
                    <option value="admission">Admission</option>
                    <option value="scholarship">Scholarship</option>
                </select>
                <input type="date" name="deadline" required>
                <button type="submit" class="admin-button primary">Add Event</button>
            </form>
        `;
        openModal('Add New Event', formHTML);
    }
    
    // Attach listeners to all add/seed buttons (guard in case elements were removed)
    if (addCollegeBtnMain) addCollegeBtnMain.addEventListener('click', showAddCollegeModal);
    if (addCollegeBtnQuick) addCollegeBtnQuick.addEventListener('click', showAddCollegeModal);
    if (addEventBtnMain) addEventBtnMain.addEventListener('click', showAddEventModal);
    if (addEventBtnHeader) addEventBtnHeader.addEventListener('click', showAddEventModal);
    if (seedCollegesBtn) seedCollegesBtn.addEventListener('click', () => { if(confirm("This will add 5 sample colleges. Proceed?")) window.seedColleges(); });
    if (seedTimelineBtn) seedTimelineBtn.addEventListener('click', () => { if(confirm("This will add 3 sample events. Proceed?")) window.seedTimeline(); });

    // --- DYNAMIC EVENT LISTENERS for forms and deletes ---
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'add-college-form') {
            e.preventDefault();
            const formData = new FormData(e.target);
            db.collection('colleges').add({
                name: formData.get('name'), city: formData.get('city'),
                image: formData.get('image'), lat: parseFloat(formData.get('lat')),
                lon: parseFloat(formData.get('lon')),
                courses: formData.get('courses').split(',').map(item => item.trim()),
                facilities: formData.get('facilities').split(',').map(item => item.trim()),
                fee: parseInt(formData.get('fee')), nirf: parseInt(formData.get('nirf')) || null,
                type: formData.get('type'), placement: parseInt(formData.get('placement')),
                package: parseFloat(formData.get('package'))
            }).then(() => closeModal());
        }
        if (e.target && e.target.id === 'add-event-form') {
            e.preventDefault();
            const formData = new FormData(e.target);
            db.collection('timelineEvents').add({
                title: formData.get('title'), description: formData.get('description'),
                type: formData.get('type'), deadline: formData.get('deadline'),
            }).then(() => closeModal());
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const table = e.target.closest('table');
            if (table.id === 'colleges-table') {
                if (confirm('Are you sure you want to delete this college?')) {
                    db.collection('colleges').doc(id).delete();
                }
            } else if (table.id === 'events-table') {
                 if (confirm('Are you sure you want to delete this event?')) {
                    db.collection('timelineEvents').doc(id).delete();
                }
            }
        }
        // Edit button clicked
        if (e.target && e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            // Fetch the college doc and open modal
            db.collection('colleges').doc(id).get().then(doc => {
                if (!doc.exists) return alert('College not found');
                const data = doc.data() || {};
                showEditCollegeModal(id, data);
            }).catch(err => { console.error('Error fetching college for edit', err); alert('Failed to load college for editing'); });
        }
    });

    // Show edit modal and populate fields
    function showEditCollegeModal(id, data) {
        const formHTML = `
            <form id="edit-college-form" data-id="${id}">
                <input class="full-width" type="text" name="name" placeholder="College Name" value="${(data.name||'').replace(/"/g, '&quot;')}" required>
                <input type="text" name="city" placeholder="City" value="${(data.city||'').replace(/"/g, '&quot;')}" required>
                <input type="number" name="nirf" placeholder="NIRF Rank (optional)" value="${data.nirf || ''}">
                <input class="full-width" type="url" name="image" placeholder="Image URL" value="${(data.image||'').replace(/"/g, '&quot;')}" required>
                <input type="text" name="lat" placeholder="Latitude (e.g., 30.9010)" value="${data.lat || ''}" required>
                <input type="text" name="lon" placeholder="Longitude (e.g., 75.8573)" value="${data.lon || ''}" required>
                <input class="full-width" type="text" name="courses" placeholder="Courses (comma-separated)" value="${(data.courses || []).join(', ')}" required>
                <input class="full-width" type="text" name="facilities" placeholder="Facilities (comma-separated)" value="${(data.facilities || []).join(', ')}" required>
                <input type="number" name="fee" placeholder="Annual Fee" value="${data.fee || ''}" required>
                        <select name="type" required>
                            <option value="Government" ${((data.type||'').toString().toLowerCase() === 'government') ? 'selected' : ''}>Government</option>
                            <option value="Private" ${((data.type||'').toString().toLowerCase() === 'private') ? 'selected' : ''}>Private</option>
                        </select>
                <input type="number" name="placement" placeholder="Placement %" value="${data.placement || ''}" required>
                <input type="number" name="package" placeholder="Average Package (LPA)" value="${data.package || ''}" required>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;"><button type="submit" class="admin-button primary">Save Changes</button><button type="button" id="cancel-edit" class="admin-button">Cancel</button></div>
            </form>
        `;
        openModal('Edit College', formHTML);
        // Cancel handler
        document.getElementById('cancel-edit').addEventListener('click', closeModal);
    }

    // Handle edit form submit
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'edit-college-form') {
            e.preventDefault();
            const id = e.target.dataset.id;
            const formData = new FormData(e.target);
            const updated = {
                name: formData.get('name'), city: formData.get('city'),
                image: formData.get('image'), lat: parseFloat(formData.get('lat')),
                lon: parseFloat(formData.get('lon')),
                courses: formData.get('courses').split(',').map(item => item.trim()),
                facilities: formData.get('facilities').split(',').map(item => item.trim()),
                fee: parseInt(formData.get('fee')), nirf: parseInt(formData.get('nirf')) || null,
                type: formData.get('type'), placement: parseInt(formData.get('placement')),
                package: parseFloat(formData.get('package'))
            };
            db.collection('colleges').doc(id).update(updated).then(() => {
                closeModal();
            }).catch(err => { console.error('Failed to save college edits', err); alert('Failed to save changes'); });
        }
    });

    // --- CONSOLE HELPERS (Seeder functions) ---
    window.seedColleges = function() { console.log("Seeding colleges..."); const colleges = [ { name: "SCD Government College", city: "Ludhiana", image: "https://images.unsplash.com/photo-1562774053-701939374585", lat: 30.9010, lon: 75.8573, courses: ["B.A.", "B.Sc.", "B.Com."], facilities: ["Hostel", "Library", "Wi-Fi", "Labs"], type: "Government", fee: 15000, placement: 60, package: 3.5, nirf: 101 }, { name: "Government Mohindra College", city: "Patiala", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b", lat: 30.3398, lon: 76.3869, courses: ["B.A.", "B.Sc.", "BCA"], facilities: ["Library", "Sports Complex", "Labs"], type: "Government", fee: 18000, placement: 55, package: 3.2, nirf: 125 }, { name: "NIT Jalandhar", city: "Jalandhar", image: "https://images.unsplash.com/photo-1607237138185-e894ee31b2af", lat: 31.3954, lon: 75.5355, courses: ["B.Tech", "M.Tech", "Ph.D"], facilities: ["Hostel", "Wi-Fi", "Labs", "Gym"], type: "Government", fee: 150000, placement: 95, package: 12.5, nirf: 46 }, { name: "Government Medical College", city: "Amritsar", image: "https://images.unsplash.com/photo-1584931422245-c3dd3b35065c", lat: 31.6340, lon: 74.8723, courses: ["MBBS", "MD", "MS"], facilities: ["Hostel", "Labs", "Library", "Hospital"], type: "Government", fee: 80000, placement: 100, package: 18.0, nirf: 55 }, { name: "Guru Nanak Dev University", city: "Amritsar", image: "https://images.unsplash.com/photo-1532649538693-79046d41e58c", lat: 31.6366, lon: 74.8239, courses: ["B.A.", "B.Sc.", "B.Tech", "LLB"], facilities: ["Hostel", "Library", "Wi-Fi", "Sports Complex"], type: "Government", fee: 45000, placement: 75, package: 5.5, nirf: 49 } ]; const batch = db.batch(); colleges.forEach(c => batch.set(db.collection("colleges").doc(), c)); batch.commit().then(() => alert("Successfully added 5 sample colleges!")); }
    window.seedTimeline = function() { console.log("Seeding timeline..."); const events = [ { title: "JEE Mains 2026 Session 1 Reg.", type: "exam", description: "Registration window for the first session.", deadline: "2025-11-30" }, { title: "NEET 2026 Registration", type: "exam", description: "National Eligibility cum Entrance Test for medical courses.", deadline: "2026-01-31" }, { title: "Punjab University Admissions", type: "admission", description: "Admission forms for B.A., B.Sc., B.Com. are available.", deadline: "2026-05-15" } ]; const batch = db.batch(); events.forEach(e => batch.set(db.collection("timelineEvents").doc(), e)); batch.commit().then(() => alert("Successfully added 3 timeline events!")); }
});