document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login');
    const dashboard = document.getElementById('dashboard');
    const loginContainer = document.getElementById('loginForm');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const membersList = document.getElementById('membersList');
    const themeToggle = document.getElementById('themeToggle');
    const connectionStatus = document.getElementById('connectionStatus');
    const connectionIndicator = document.getElementById('connectionIndicator');

    // WebSocket Connection
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
        connectionStatus.textContent = 'Connected';
        connectionIndicator.classList.remove('offline');
    };

    ws.onclose = () => {
        connectionStatus.textContent = 'Disconnected';
        connectionIndicator.classList.add('offline');
    };

    ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        handleLiveUpdate(update);
    };

    // Authentication
    const users = [
        { username: 'admin', password: 'admin123', role: 'superadmin' },
        { username: 'mod', password: 'mod123', role: 'moderator' }
    ];

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            loginContainer.classList.add('hidden');
            dashboard.classList.remove('hidden');
            welcomeMessage.textContent = `Welcome, ${username} (${user.role})`;
            initializeDashboard();
        } else {
            alert('Invalid credentials!');
        }
    });

    logoutBtn.addEventListener('click', () => {
        loginContainer.classList.remove('hidden');
        dashboard.classList.add('hidden');
        loginForm.reset();
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.setAttribute('data-theme', 
            document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
        );
    });

    // Navigation
    document.querySelectorAll('.nav-items li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-items li').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(item.dataset.panel).classList.add('active');
        });
    });

    // Charts Initialization
    function initializeCharts() {
        const activityChart = new Chart(document.getElementById('activityChart'), {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Bird Posts',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#0088cc',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Daily Activity' }
                }
            }
        });

        const membershipChart = new Chart(document.getElementById('membershipChart'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Members',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: '#0088cc'
                }]
            }
        });

        const engagementChart = new Chart(document.getElementById('engagementChart'), {
            type: 'pie',
            data: {
                labels: ['Photos', 'Comments', 'Reactions'],
                datasets: [{
                    data: [300, 150, 100],
                    backgroundColor: ['#0088cc', '#00cc88', '#cc8800']
                }]
            }
        });
    }

    // Live Updates Handler
    function handleLiveUpdate(update) {
        switch(update.type) {
            case 'memberUpdate':
                updateMemberStats(update.data);
                break;
            case 'messageUpdate':
                updateMessageStats(update.data);
                break;
            case 'contentUpdate':
                updateContentStats(update.data);
                break;
        }
    }

    function updateMemberStats(data) {
        document.getElementById('totalMembers').textContent = data.totalMembers;
        document.getElementById('activeToday').textContent = data.activeToday;
        document.getElementById('growthRate').textContent = `${data.growthRate}%`;
    }

    function updateMessageStats(data) {
        document.getElementById('birdPosts').textContent = data.birdPosts;
    }

    // Member Management
    function updateMembersList(members) {
        membersList.innerHTML = '';
        members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.role}</td>
                <td>${member.lastActive}</td>
                <td>${member.birdPosts}</td>
                <td>
                    <select onchange="updateMemberRole(${member.id}, this.value)">
                        <option value="member" ${member.role === 'member' ? 'selected' : ''}>Member</option>
                        <option value="moderator" ${member.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                    </select>
                    <button onclick="removeMember(${member.id})">Remove</button>
                </td>
            `;
            membersList.appendChild(row);
        });
    }

    // Content Moderation
    document.getElementById('addFilter').addEventListener('click', () => {
        const filter = prompt('Enter keyword to filter:');
        if (filter) {
            addContentFilter(filter);
        }
    });

    function addContentFilter(filter) {
        const filtersList = document.getElementById('filtersList');
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';
        filterItem.innerHTML = `
            <span>${filter}</span>
            <button onclick="removeFilter(this)">Remove</button>
        `;
        filtersList.appendChild(filterItem);
    }

    // Automation
    document.getElementById('saveWelcome').addEventListener('click', () => {
        const welcomeMsg = document.getElementById('welcomeMsg').value;
        saveWelcomeMessage(welcomeMsg);
    });

    function saveWelcomeMessage(message) {
        // Send to server
        fetch('http://localhost:5000/api/automation/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    }

    // Initialize Dashboard
    function initializeDashboard() {
        initializeCharts();
        loadInitialData();
    }

    function loadInitialData() {
        // Fetch initial data from server
        fetch('http://localhost:5000/api/group/stats')
            .then(response => response.json())
            .then(data => {
                updateMemberStats(data);
                updateMessageStats(data);
            })
            .catch(error => console.error('Error loading data:', error));
    }

    // Export functionality
    document.getElementById('exportMembers').addEventListener('click', () => {
        exportMembersList();
    });

    function exportMembersList() {
        const data = JSON.stringify(membersList.innerHTML);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members_list.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Global functions
    window.updateMemberRole = (memberId, newRole) => {
        // Send to server
        fetch('http://localhost:5000/api/members/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, newRole })
        });
    };

    window.removeMember = (memberId) => {
        if (confirm('Are you sure you want to remove this member?')) {
            fetch('http://localhost:5000/api/members/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId })
            });
        }
    };

    window.removeFilter = (element) => {
        element.parentElement.remove();
    };
});