const API_BASE = '/api';
let token = '';
let userRole = '';

// Helper: Set auth header
function getHeaders() {
  return token ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } : { 'Content-Type': 'application/json' };
}

// Auth Section
const authSection = document.getElementById('auth-section');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');

registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password, role })
  });
  const data = await res.json();
  authMessage.textContent = data.message || (res.ok ? 'Registered!' : 'Registration failed');
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    token = data.token;
    userRole = data.role;
    authSection.style.display = 'none';
    logoutBtn.style.display = 'block';
    if (userRole === 'admin') showAdminSection();
    else showUserSection();
  } else {
    authMessage.textContent = data.message || 'Login failed';
  }
};

logoutBtn.onclick = () => {
  token = '';
  userRole = '';
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('user-section').style.display = 'none';
  authSection.style.display = 'block';
  logoutBtn.style.display = 'none';
};

// Admin Section
function showAdminSection() {
  const adminSection = document.getElementById('admin-section');
  adminSection.style.display = 'block';
  loadAdminQuizzes();
  setupQuizForm();
}

function setupQuizForm() {
  const questionsContainer = document.getElementById('questions-container');
  questionsContainer.innerHTML = '';
  addQuestionBlock(questionsContainer);
  document.getElementById('add-question').onclick = () => addQuestionBlock(questionsContainer);
  document.getElementById('create-quiz-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('quiz-title').value;
    const questions = Array.from(questionsContainer.querySelectorAll('.question-block')).map(qb => {
      const question_text = qb.querySelector('.question-text').value;
      const options = Array.from(qb.querySelectorAll('.option')).map(opt => opt.value);
      const correct_option_index = parseInt(qb.querySelector('.correct-index').value);
      return { question_text, options, correct_option_index };
    });
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, questions })
    });
    if (res.ok) {
      loadAdminQuizzes();
      e.target.reset();
      questionsContainer.innerHTML = '';
      addQuestionBlock(questionsContainer);
    }
  };
}

function addQuestionBlock(container) {
  const div = document.createElement('div');
  div.className = 'question-block';
  div.innerHTML = `
    <input class="question-text" placeholder="Question text" required>
    <input class="option" placeholder="Option 1" required>
    <input class="option" placeholder="Option 2" required>
    <input class="option" placeholder="Option 3">
    <input class="option" placeholder="Option 4">
    <input class="correct-index" type="number" min="0" max="3" placeholder="Correct Option Index (0-based)" required>
    <button type="button" class="remove-question">Remove</button>
  `;
  div.querySelector('.remove-question').onclick = () => div.remove();
  container.appendChild(div);
}

async function loadAdminQuizzes() {
  const list = document.getElementById('admin-quiz-list');
  list.innerHTML = '';
  const res = await fetch(`${API_BASE}/quizzes`, { headers: getHeaders() });
  const quizzes = await res.json();
  quizzes.forEach(q => {
    const li = document.createElement('li');
    li.textContent = q.title;
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editQuiz(q._id);
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => {
      await fetch(`${API_BASE}/quizzes/${q._id}`, { method: 'DELETE', headers: getHeaders() });
      loadAdminQuizzes();
    };
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

async function editQuiz(id) {
  // For brevity, just load quiz and allow update title/questions
  const res = await fetch(`${API_BASE}/quizzes/${id}`, { headers: getHeaders() });
  const quiz = await res.json();
  document.getElementById('quiz-title').value = quiz.title;
  const questionsContainer = document.getElementById('questions-container');
  questionsContainer.innerHTML = '';
  quiz.questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question-block';
    div.innerHTML = `
      <input class="question-text" value="${q.question_text}" required>
      ${q.options.map((opt, i) => `<input class="option" value="${opt}" required>`).join('')}
      <input class="correct-index" type="number" min="0" max="${q.options.length-1}" value="0" required>
      <button type="button" class="remove-question">Remove</button>
    `;
    div.querySelector('.remove-question').onclick = () => div.remove();
    div.querySelector('.correct-index').value = q.correct_option_index || 0;
    questionsContainer.appendChild(div);
  });
  document.getElementById('create-quiz-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('quiz-title').value;
    const questions = Array.from(questionsContainer.querySelectorAll('.question-block')).map(qb => {
      const question_text = qb.querySelector('.question-text').value;
      const options = Array.from(qb.querySelectorAll('.option')).map(opt => opt.value);
      const correct_option_index = parseInt(qb.querySelector('.correct-index').value);
      return { question_text, options, correct_option_index };
    });
    await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ title, questions })
    });
    loadAdminQuizzes();
    e.target.reset();
    questionsContainer.innerHTML = '';
    addQuestionBlock(questionsContainer);
    setupQuizForm();
  };
}

// User Section
function showUserSection() {
  const userSection = document.getElementById('user-section');
  userSection.style.display = 'block';
  loadUserQuizzes();
}

async function loadUserQuizzes() {
  const list = document.getElementById('user-quiz-list');
  list.innerHTML = '';
  const res = await fetch(`${API_BASE}/quizzes`, { headers: getHeaders() });
  const quizzes = await res.json();
  quizzes.forEach(q => {
    const li = document.createElement('li');
    li.textContent = q.title;
    const startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    startBtn.onclick = () => startQuiz(q._id);
    li.appendChild(startBtn);
    list.appendChild(li);
  });
}

async function startQuiz(id) {
  const res = await fetch(`${API_BASE}/quizzes/${id}`, { headers: getHeaders() });
  const quiz = await res.json();
  const section = document.getElementById('quiz-attempt-section');
  section.style.display = 'block';
  section.innerHTML = `<h3>${quiz.title}</h3>`;
  quiz.questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question-block';
    div.innerHTML = `<div>${q.question_text}</div>` +
      q.options.map((opt, i) => `<label><input type="radio" name="q${idx}" value="${i}" required> ${opt}</label>`).join('<br>');
    section.appendChild(div);
  });
  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Quiz';
  submitBtn.onclick = async () => {
    const answers = quiz.questions.map((q, idx) => {
      const checked = section.querySelector(`input[name='q${idx}']:checked`);
      return checked ? parseInt(checked.value) : -1;
    });
    const res2 = await fetch(`${API_BASE}/results/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quizId: id, answers })
    });
    const result = await res2.json();
    showQuizResult(result);
  };
  section.appendChild(submitBtn);
};

function showQuizResult(result) {
  const section = document.getElementById('quiz-result-section');
  section.style.display = 'block';
  section.innerHTML = `<h3>Result: ${result.score} / ${result.total}</h3>` +
    result.answers.map((a, i) => `<div>Q${i+1}: ${a.correct ? '✅' : '❌'}</div>`).join('');
}
