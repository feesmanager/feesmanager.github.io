// Enhanced app.js with improved attendance functionality
// Supabase Configuration
const SUPABASE_URL = 'https://faotpearguizqotzcwca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhb3RwZWFyZ3VpenFvdHpjd2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzODQ2NTMsImV4cCI6MjA2NDk2MDY1M30.QVJ7x-7slyLnCQmeB8ZQPtIDqSRkH4aZ0FRXiDFr9Jk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let students = [];
let classes = [];
let attendance = [];
let payments = [];

// Initial classes data
const initialClasses = [
    {grade: 11, name: "Grade 11", monthly_fee: 5000, daily_fee: 200, max_students: 6},
    {grade: 10, name: "Grade 10", monthly_fee: 4500, daily_fee: 180, max_students: 1},
    {grade: 9, name: "Grade 9", monthly_fee: 4000, daily_fee: 160, max_students: 1},
    {grade: 8, name: "Grade 8", monthly_fee: 3500, daily_fee: 140, max_students: 1},
    {grade: 6, name: "Grade 6", monthly_fee: 3000, daily_fee: 120, max_students: 5}
];

// Utility Functions
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatCurrency(amount) {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
}

// Authentication Functions
async function checkAuthState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            updateUIForAuthenticatedUser();
            await loadAllData();
        } else {
            updateUIForUnauthenticatedUser();
            await loadPublicData();
        }
    } catch (error) {
        console.error('Auth state check error:', error);
        updateUIForUnauthenticatedUser();
    }
}

function updateUIForAuthenticatedUser() {
    // Show authenticated UI elements
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = '';
    });
    
    // Hide unauthenticated UI elements
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show auth banner
    const authBanner = document.getElementById('auth-banner');
    const userEmail = document.getElementById('user-email');
    if (authBanner && userEmail && currentUser) {
        authBanner.style.display = 'block';
        userEmail.textContent = currentUser.email;
    }
    
    // Show authenticated dashboard view
    const publicView = document.getElementById('public-view');
    const authenticatedView = document.getElementById('authenticated-view');
    if (publicView) publicView.style.display = 'none';
    if (authenticatedView) authenticatedView.style.display = 'block';
}

function updateUIForUnauthenticatedUser() {
    // Hide authenticated UI elements
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show unauthenticated UI elements
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = '';
    });
    
    // Hide auth banner
    const authBanner = document.getElementById('auth-banner');
    if (authBanner) authBanner.style.display = 'none';
    
    // Show public dashboard view
    const publicView = document.getElementById('public-view');
    const authenticatedView = document.getElementById('authenticated-view');
    if (publicView) publicView.style.display = 'block';
    if (authenticatedView) authenticatedView.style.display = 'none';
}

async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        showToast('Sign up successful! Please check your email for verification.', 'success');
        showSection('signin');
        return true;
    } catch (error) {
        console.error('Sign up error:', error);
        showToast(error.message, 'error');
        return false;
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateUIForAuthenticatedUser();
        await loadAllData();
        showToast('Welcome back!', 'success');
        showSection('dashboard');
        return true;
    } catch (error) {
        console.error('Sign in error:', error);
        showToast(error.message, 'error');
        return false;
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        students = [];
        attendance = [];
        payments = [];
        
        updateUIForUnauthenticatedUser();
        showToast('Logged out successfully', 'success');
        showSection('dashboard');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to corresponding nav button
    const navBtn = document.querySelector(`[data-section="${sectionId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    // Load section-specific data
    if (currentUser) {
        switch(sectionId) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'students':
                loadStudents();
                break;
            case 'classes':
                loadClasses();
                break;
            case 'attendance':
                initializeAttendance();
                break;
            case 'payments':
                loadPayments();
                break;
        }
    } else if (sectionId === 'classes') {
        loadClasses();
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Load data for specific modals
        if (modalId === 'addPaymentModal') {
            loadStudentsForPayment();
        }
        
        // Set default date for attendance and payment modals
        if (modalId.includes('Payment')) {
            const dateInput = modal.querySelector('input[type="date"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Database Functions
async function initializeDatabase() {
    try {
        // Check if classes exist, if not create them
        const { data: existingClasses } = await supabase
            .from('classes')
            .select('*');
        
        if (!existingClasses || existingClasses.length === 0) {
            const { error } = await supabase
                .from('classes')
                .insert(initialClasses);
            
            if (error) {
                console.error('Error inserting initial classes:', error);
            } else {
                showToast('Initial classes created successfully!', 'success');
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

async function loadAllData() {
    if (!currentUser) return;
    
    try {
        const [studentsResult, classesResult, attendanceResult, paymentsResult] = await Promise.all([
            supabase.from('students').select('*').order('created_at', { ascending: false }),
            supabase.from('classes').select('*').order('grade', { ascending: true }),
            supabase.from('attendance').select('*, students(name, grade)').order('date', { ascending: false }),
            supabase.from('payments').select('*, students(name, grade)').order('payment_date', { ascending: false })
        ]);
        
        students = studentsResult.data || [];
        classes = classesResult.data || [];
        attendance = attendanceResult.data || [];
        payments = paymentsResult.data || [];
        
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data from database', 'error');
    }
}

async function loadPublicData() {
    try {
        const { data: classesData } = await supabase
            .from('classes')
            .select('*')
            .order('grade', { ascending: true });
        
        classes = classesData || [];
        
        if (document.getElementById('classes').classList.contains('active')) {
            loadClasses();
        }
    } catch (error) {
        console.error('Error loading public data:', error);
    }
}

// Student Functions
async function addStudent(studentData) {
    if (!currentUser) {
        showToast('Please sign in to add students', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('students')
            .insert([studentData])
            .select();
        
        if (error) throw error;
        
        students.unshift(data[0]);
        showToast('Student added successfully!', 'success');
        loadStudents();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error adding student:', error);
        showToast(error.message, 'error');
    }
}

async function updateStudent(studentData) {
    if (!currentUser) {
        showToast('Please sign in to update students', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('students')
            .update(studentData)
            .eq('id', studentData.id)
            .select();
        
        if (error) throw error;
        
        const index = students.findIndex(s => s.id === studentData.id);
        if (index !== -1) {
            students[index] = data[0];
        }
        
        showToast('Student updated successfully!', 'success');
        loadStudents();
        
    } catch (error) {
        console.error('Error updating student:', error);
        showToast(error.message, 'error');
    }
}

async function deleteStudent(studentId) {
    if (!currentUser) {
        showToast('Please sign in to delete students', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this student? This will also delete all their attendance and payment records.')) return;
    
    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
        
        if (error) throw error;
        
        students = students.filter(s => s.id !== studentId);
        attendance = attendance.filter(a => a.student_id !== studentId);
        payments = payments.filter(p => p.student_id !== studentId);
        
        showToast('Student deleted successfully!', 'success');
        loadStudents();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast(error.message, 'error');
    }
}

function loadStudents() {
    const grid = document.getElementById('students-grid');
    if (!grid) return;
    
    if (!currentUser) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Sign in required</h3>
                <p>Please sign in to manage students.</p>
            </div>
        `;
        return;
    }
    
    const searchTerm = document.getElementById('student-search')?.value.toLowerCase() || '';
    const gradeFilter = document.getElementById('grade-filter')?.value || '';
    
    let filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm);
        const matchesGrade = !gradeFilter || student.grade.toString() === gradeFilter;
        return matchesSearch && matchesGrade;
    });
    
    if (filteredStudents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No students found</h3>
                <p>Add your first student to get started.</p>
                <button class="btn btn--primary" onclick="openModal('addStudentModal')">Add Student</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredStudents.map(student => `
        <div class="student-card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${student.name}</h3>
                    <p class="card-subtitle">Grade ${student.grade} • ${student.fee_type} fee</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--secondary" onclick="editStudent(${student.id})">Edit</button>
                    <button class="btn btn--sm btn--outline" onclick="deleteStudent(${student.id})">Delete</button>
                    <button class="btn btn--sm btn--primary" onclick="showStudentHistory(${student.id})">Attendance</button>
                </div>
            </div>
            <div class="card-body">
                <div class="info-row">
                    <span class="info-label">Contact</span>
                    <span class="info-value">${student.contact_info || 'Not provided'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value status status--${student.status === 'active' ? 'success' : 'warning'}">${student.status || 'active'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Joined</span>
                    <span class="info-value">${formatDate(student.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const form = document.getElementById('editStudentForm');
    if (!form) return;
    
    form.elements.id.value = student.id;
    form.elements.name.value = student.name;
    form.elements.grade.value = student.grade;
    form.elements.contact_info.value = student.contact_info || '';
    form.elements.fee_type.value = student.fee_type;
    
    openModal('editStudentModal');
}

// Class Functions
async function addClass(classData) {
    if (!currentUser) {
        showToast('Please sign in to add classes', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('classes')
            .insert([classData])
            .select();
        
        if (error) throw error;
        
        classes.push(data[0]);
        classes.sort((a, b) => a.grade - b.grade);
        showToast('Class added successfully!', 'success');
        loadClasses();
        
    } catch (error) {
        console.error('Error adding class:', error);
        showToast(error.message, 'error');
    }
}

async function updateClass(classData) {
    if (!currentUser) {
        showToast('Please sign in to update classes', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('classes')
            .update(classData)
            .eq('id', classData.id)
            .select();
        
        if (error) throw error;
        
        const index = classes.findIndex(c => c.id === classData.id);
        if (index !== -1) {
            classes[index] = data[0];
        }
        
        showToast('Class updated successfully!', 'success');
        loadClasses();
        
    } catch (error) {
        console.error('Error updating class:', error);
        showToast(error.message, 'error');
    }
}

async function deleteClass(classId) {
    if (!currentUser) {
        showToast('Please sign in to delete classes', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);
        
        if (error) throw error;
        
        classes = classes.filter(c => c.id !== classId);
        showToast('Class deleted successfully!', 'success');
        loadClasses();
        
    } catch (error) {
        console.error('Error deleting class:', error);
        showToast(error.message, 'error');
    }
}

function loadClasses() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;
    
    if (classes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No classes found</h3>
                <p>Classes will appear here once they are created.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = classes.map(classItem => {
        const enrolledCount = students.filter(s => s.grade === classItem.grade).length;
        
        return `
            <div class="class-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${classItem.name}</h3>
                        <p class="card-subtitle">Grade ${classItem.grade}</p>
                    </div>
                    ${currentUser ? `
                        <div class="card-actions">
                            <button class="btn btn--sm btn--secondary" onclick="editClass(${classItem.id})">Edit</button>
                            <button class="btn btn--sm btn--outline" onclick="deleteClass(${classItem.id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">Monthly Fee</span>
                        <span class="info-value">${formatCurrency(classItem.monthly_fee)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Daily Fee</span>
                        <span class="info-value">${formatCurrency(classItem.daily_fee)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Enrollment</span>
                        <span class="info-value">${enrolledCount}/${classItem.max_students} students</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status</span>
                        <span class="info-value status status--${enrolledCount < classItem.max_students ? 'success' : 'warning'}">
                            ${enrolledCount < classItem.max_students ? 'Available' : 'Full'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editClass(classId) {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return;
    
    const form = document.getElementById('editClassForm');
    if (!form) return;
    
    form.elements.id.value = classItem.id;
    form.elements.name.value = classItem.name;
    form.elements.grade.value = classItem.grade;
    form.elements.monthly_fee.value = classItem.monthly_fee;
    form.elements.daily_fee.value = classItem.daily_fee;
    form.elements.max_students.value = classItem.max_students;
    
    openModal('editClassModal');
}

// Enhanced Attendance Functions
function initializeAttendance() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set default date in attendance controls
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Set default text in attendance header
    const headerText = document.querySelector('.attendance-header h3');
    if (headerText) {
        headerText.textContent = "Today's Attendance";
    }
    
    // Clear attendance table
    const attendanceBody = document.getElementById('attendanceBody');
    if (attendanceBody) {
        attendanceBody.innerHTML = '<tr><td colspan="4" class="text-center">Select a date and grade to view attendance</td></tr>';
    }
}

async function loadAttendance() {
    if (!currentUser) {
        showToast('Please sign in to manage attendance', 'error');
        return;
    }
    
    const date = document.getElementById('attendanceDate').value;
    const gradeSelect = document.getElementById('attendanceGrade');
    const grade = gradeSelect.value;
    
    if (!date || !grade) {
        showToast('Please select both date and grade', 'warning');
        return;
    }
    
    // Update header text
    const headerText = document.querySelector('.attendance-header h3');
    if (headerText) {
        const gradeName = gradeSelect.options[gradeSelect.selectedIndex].text;
        headerText.textContent = `Attendance for ${gradeName} on ${formatDate(date)}`;
    }
    
    try {
        // Fetch students in the selected grade
        const { data: gradeStudents, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('grade', grade)
            .order('name', { ascending: true });
        
        if (studentsError) throw studentsError;
        
        if (gradeStudents.length === 0) {
            const attendanceBody = document.getElementById('attendanceBody');
            attendanceBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No students found in this grade</td>
                </tr>
            `;
            return;
        }
        
        // Get attendance records for these students on the selected date
        const studentIds = gradeStudents.map(s => s.id);
        const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', studentIds)
            .eq('date', date);
        
        if (attendanceError) throw attendanceError;
        
        // Render the attendance table
        renderAttendanceTable(gradeStudents, attendanceRecords, date);
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        showToast('Error loading attendance data', 'error');
    }
}

function renderAttendanceTable(students, attendanceRecords, date) {
    const attendanceBody = document.getElementById('attendanceBody');
    if (!attendanceBody) return;
    
    attendanceBody.innerHTML = '';
    
    students.forEach(student => {
        const record = attendanceRecords?.find(a => a.student_id === student.id);
        const status = record ? (record.present ? 'present' : 'absent') : 'not-marked';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>Grade ${student.grade}</td>
            <td>
                <span class="attendance-status ${status}">
                    ${status === 'present' ? 'Present' : (status === 'absent' ? 'Absent' : 'Not Marked')}
                </span>
            </td>
            <td>
                <div class="attendance-actions">
                    <button class="btn-present ${status === 'present' ? 'active' : ''}" 
                        onclick="markAttendance(${student.id}, '${date}', true)">
                        Present
                    </button>
                    <button class="btn-absent ${status === 'absent' ? 'active' : ''}" 
                        onclick="markAttendance(${student.id}, '${date}', false)">
                        Absent
                    </button>
                    <button class="btn-view-history" onclick="showStudentHistory(${student.id})">
                        History
                    </button>
                </div>
            </td>
        `;
        
        attendanceBody.appendChild(row);
    });
}

async function markAttendance(studentId, date, present) {
    if (!currentUser) {
        showToast('Please sign in to mark attendance', 'error');
        return;
    }
    
    try {
        // Check if there's an existing record
        const { data: existingRecords } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .eq('date', date);
        
        let result;
        
        if (existingRecords && existingRecords.length > 0) {
            // Update existing record
            result = await supabase
                .from('attendance')
                .update({ present: present })
                .eq('id', existingRecords[0].id)
                .select();
        } else {
            // Insert new record
            result = await supabase
                .from('attendance')
                .insert([{
                    student_id: studentId,
                    date: date,
                    present: present
                }])
                .select();
        }
        
        if (result.error) throw result.error;
        
        // Update attendance array for local state
        const index = attendance.findIndex(a => a.student_id === studentId && a.date === date);
        if (index !== -1) {
            attendance[index].present = present;
        } else {
            attendance.push(result.data[0]);
        }
        
        // Update the UI
        const statusCell = document.querySelector(`button.btn-${present ? 'present' : 'absent'}[onclick*="${studentId}"]`).closest('tr').querySelector('.attendance-status');
        statusCell.className = `attendance-status ${present ? 'present' : 'absent'}`;
        statusCell.textContent = present ? 'Present' : 'Absent';
        
        // Update active state of buttons
        const presentBtn = document.querySelector(`button.btn-present[onclick*="${studentId}"]`);
        const absentBtn = document.querySelector(`button.btn-absent[onclick*="${studentId}"]`);
        
        if (presentBtn && absentBtn) {
            presentBtn.classList.toggle('active', present);
            absentBtn.classList.toggle('active', !present);
        }
        
        showToast(`Marked ${present ? 'present' : 'absent'} successfully`, 'success');
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        showToast('Error updating attendance', 'error');
    }
}

async function showStudentHistory(studentId) {
    if (!currentUser) {
        showToast('Please sign in to view attendance history', 'error');
        return;
    }
    
    try {
        // Get student details
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        
        if (studentError) throw studentError;
        
        // Get all attendance records for this student
        const { data: studentAttendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('date', { ascending: false });
        
        if (attendanceError) throw attendanceError;
        
        // Display student name in the modal
        const nameElement = document.getElementById('historyStudentName');
        if (nameElement) {
            nameElement.textContent = student.name;
        }
        
        // Calculate statistics
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(a => a.present).length;
        const absentDays = totalDays - presentDays;
        const attendanceRate = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;
        
        // Update statistics in the modal
        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('presentDays').textContent = presentDays;
        document.getElementById('absentDays').textContent = absentDays;
        document.getElementById('attendancePercentage').textContent = `${attendanceRate}%`;
        
        // Render attendance history list
        const historyList = document.getElementById('attendanceHistory');
        if (historyList) {
            if (totalDays === 0) {
                historyList.innerHTML = '<div class="empty-state"><p>No attendance records found for this student</p></div>';
            } else {
                historyList.innerHTML = studentAttendance.map(record => `
                    <div class="history-item">
                        <span class="date">${formatDate(record.date)}</span>
                        <span class="status ${record.present ? 'present' : 'absent'}">
                            ${record.present ? 'Present' : 'Absent'}
                        </span>
                    </div>
                `).join('');
            }
        }
        
        // Open the modal
        openModal('studentHistoryModal');
        
    } catch (error) {
        console.error('Error loading student history:', error);
        showToast('Error loading attendance history', 'error');
    }
}

// Payment Functions
function loadStudentsForPayment() {
    const select = document.querySelector('#addPaymentForm select[name="student_id"]');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Student</option>' +
        students.map(student => 
            `<option value="${student.id}">${student.name} (Grade ${student.grade})</option>`
        ).join('');
}

async function addPayment(paymentData) {
    if (!currentUser) {
        showToast('Please sign in to record payments', 'error');
        return;
    }
    
    try {
        // Ensure we have date field instead of payment_date for database consistency
        const formattedData = {
            student_id: paymentData.student_id,
            amount: paymentData.amount,
            payment_date: paymentData.payment_date,// Support both field names
            payment_type: paymentData.payment_type || paymentData.type // Support both field names
        };
        
        const { data, error } = await supabase
            .from('payments')
            .insert([formattedData])
            .select();
        
        if (error) throw error;
        
        payments.unshift(data[0]);
        showToast('Payment recorded successfully!', 'success');
        loadPayments();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast(error.message, 'error');
    }
}

function loadPayments() {
    const grid = document.getElementById('payments-grid');
    if (!grid) return;
    
    if (!currentUser) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Sign in required</h3>
                <p>Please sign in to view payments.</p>
            </div>
        `;
        return;
    }
    
    if (payments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No payments recorded</h3>
                <p>Record your first payment to get started.</p>
                <button class="btn btn--primary" onclick="openModal('addPaymentModal')">Record Payment</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = payments.map(payment => {
        const student = students.find(s => s.id === payment.student_id) || 
                       (payment.students ? { name: payment.students.name, grade: payment.students.grade } : { name: 'Unknown', grade: 'N/A' });
        
        return `
            <div class="payment-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${student.name}</h3>
                        <p class="card-subtitle">Grade ${student.grade}</p>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">Amount</span>
                        <span class="info-value">${formatCurrency(payment.amount)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Type</span>
                        <span class="info-value status status--info">${payment.payment_type || payment.type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date</span>
                        <span class="info-value">${formatDate(payment.payment_date)}</span>  
                    </div>
                    <div class="info-row">
                        <span class="info-label">Recorded</span>
                        <span class="info-value">${formatDate(payment.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Dashboard Functions
function loadDashboard() {
    if (currentUser) {
        updateDashboardStats();
    }
}

function updateDashboardStats() {
    // Total Students
    const totalStudentsEl = document.getElementById('total-students');
    if (totalStudentsEl) {
        totalStudentsEl.textContent = students.length;
    }
    
    // Monthly Income (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyIncome = payments
        .filter(p => {
            const paymentDate = new Date(p.payment_date || p.date);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const monthlyIncomeEl = document.getElementById('monthly-income');
    if (monthlyIncomeEl) {
        monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
    }
    
    // Active Classes
    const activeClassesEl = document.getElementById('active-classes');
    if (activeClassesEl) {
        activeClassesEl.textContent = classes.length;
    }
    
    // Attendance Rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendance = attendance.filter(a => 
        new Date(a.date) >= thirtyDaysAgo
    );
    
    const attendanceRate = recentAttendance.length > 0 
        ? Math.round((recentAttendance.filter(a => a.present).length / recentAttendance.length) * 100)
        : 0;
    
    const attendanceRateEl = document.getElementById('attendance-rate');
    if (attendanceRateEl) {
        attendanceRateEl.textContent = `${attendanceRate}%`;
    }
}

// Form Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Authentication forms
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            
            await signIn(email, password);
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const fullName = formData.get('fullName');
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            await signUp(email, password, fullName);
        });
    }
    
    // Student forms
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const studentData = {
                name: formData.get('name'),
                grade: parseInt(formData.get('grade')),
                contact_info: formData.get('contact_info'),
                fee_type: formData.get('fee_type'),
                status: 'active'
            };
            
            await addStudent(studentData);
            closeModal('addStudentModal');
        });
    }
    
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const studentData = {
                id: parseInt(formData.get('id')),
                name: formData.get('name'),
                grade: parseInt(formData.get('grade')),
                contact_info: formData.get('contact_info'),
                fee_type: formData.get('fee_type')
            };
            
            await updateStudent(studentData);
            closeModal('editStudentModal');
        });
    }
    
    // Class forms
    const addClassForm = document.getElementById('addClassForm');
    if (addClassForm) {
        addClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const classData = {
                name: formData.get('name'),
                grade: parseInt(formData.get('grade')),
                monthly_fee: parseInt(formData.get('monthly_fee')),
                daily_fee: parseInt(formData.get('daily_fee')),
                max_students: parseInt(formData.get('max_students'))
            };
            
            await addClass(classData);
            closeModal('addClassModal');
        });
    }
    
    const editClassForm = document.getElementById('editClassForm');
    if (editClassForm) {
        editClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const classData = {
                id: parseInt(formData.get('id')),
                name: formData.get('name'),
                grade: parseInt(formData.get('grade')),
                monthly_fee: parseInt(formData.get('monthly_fee')),
                daily_fee: parseInt(formData.get('daily_fee')),
                max_students: parseInt(formData.get('max_students'))
            };
            
            await updateClass(classData);
            closeModal('editClassModal');
        });
    }
    
    // Payment form
    const addPaymentForm = document.getElementById('addPaymentForm');
    if (addPaymentForm) {
        addPaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            // Ensure we have a payment date
            let paymentDate = formData.get('payment_date');
            if (!paymentDate) {
                paymentDate = new Date().toISOString().split('T')[0];
            }
            
            const paymentData = {
                student_id: parseInt(formData.get('student_id')),
                amount: parseFloat(formData.get('amount')),
                payment_date: paymentDate,
                payment_type: formData.get('payment_type')
            };
            
            if (isNaN(paymentData.student_id) || isNaN(paymentData.amount)) {
                showToast('Please fill all required fields correctly', 'error');
                return;
            }
            
            await addPayment(paymentData);
            closeModal('addPaymentModal');
        });
    }
    
    // Search and filter event handlers
    const studentSearch = document.getElementById('student-search');
    if (studentSearch) {
        studentSearch.addEventListener('input', loadStudents);
    }
    
    const gradeFilter = document.getElementById('grade-filter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', loadStudents);
    }
    
    // Navigation event handlers
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Modal close on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Initialize the application
    showToast('Loading application...', 'info');
    initializeDatabase();
    checkAuthState();
    showSection('dashboard');
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIForAuthenticatedUser();
            loadAllData();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForUnauthenticatedUser();
            loadPublicData();
        }
    });
});