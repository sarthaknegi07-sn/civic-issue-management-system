const LS = {
  complaints: 'cims_complaints',
  feedback: 'cims_feedback',
  session: 'cims_admin_session'
};

const seed = [
  {
    id: 'CMP001',
    category: 'Road Issues',
    location: 'Main St & 1st Ave',
    description: 'Big pothole.',
    status: 'In Progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CMP002',
    category: 'Street Lights',
    location: 'Oak Ave Park',
    description: 'Light not working.',
    status: 'Submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// LocalStorage functions
function getComplaints() {
  const r = localStorage.getItem(LS.complaints);
  if (!r) {
    localStorage.setItem(LS.complaints, JSON.stringify(seed));
    return [...seed];
  }
  try {
    return JSON.parse(r) || [];
  } catch {
    return [];
  }
}

function setComplaints(list) {
  localStorage.setItem(LS.complaints, JSON.stringify(list));
}

function getFeedback() {
  try {
    return JSON.parse(localStorage.getItem(LS.feedback) || '[]');
  } catch {
    return [];
  }
}

function setFeedback(list) {
  localStorage.setItem(LS.feedback, JSON.stringify(list));
}

function nextId() {
  const n =
    getComplaints()
      .map((c) => Number(c.id.replace('CMP', '')) || 0)
      .reduce((a, b) => Math.max(a, b), 0) + 1;
  return 'CMP' + String(n).padStart(3, '0');
}

// Routing setup
const routes = {
  '/': renderLanding,
  '/user': renderUserHome,
  '/user/write': renderWrite,
  '/user/track': renderTrack,
  '/user/feedback': renderFeedback,
  '/admin/login': renderAdminLogin,
  '/admin/desk': guard(renderAdminDesk)
};

const app = document.getElementById('app');
const nav = document.getElementById('nav');

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

function path() {
  return location.hash.slice(1) || '/';
}

function render() {
  const p = path();
  setNav(p);
  (routes[p] || render404)();
}

function setNav(p) {
  if (p.startsWith('/admin')) {
    nav.innerHTML = `
      <a href="#/">Home</a>
      <a href="#/admin/login">Admin</a>
      ${isAuthed() ? '<a href="#/admin/desk">Desk</a>' : ''}
    `;
  } else if (p.startsWith('/user')) {
    nav.innerHTML = `
      <a href="#/">Home</a>
      <a href="#/user">User</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="#/">Home</a>
      <a href="#/user">User</a>
      <a href="#/admin/login">Admin</a>
    `;
  }
}

function mount(tplId) {
  app.innerHTML = '';
  app.appendChild(document.getElementById(tplId).content.cloneNode(true));
}

// Views
function renderLanding() {
  mount('tpl-landing');
}

function renderUserHome() {
  mount('tpl-user-home');
}

function renderWrite() {
  mount('tpl-write');
  const form = document.getElementById('form-complaint');
  const ack = document.getElementById('ack');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const rec = {
      id: nextId(),
      category: fd.get('category'),
      location: fd.get('location').trim(),
      description: fd.get('description').trim(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const list = getComplaints();
    list.push(rec);
    setComplaints(list);
    ack.classList.remove('hidden');
    ack.innerHTML = `<strong>Submitted!</strong> Your unique ID is <code>${rec.id}</code>.`;
    form.reset();
  });
}

function renderTrack() {
  mount('tpl-track');
  const form = document.getElementById('form-track');
  const out = document.getElementById('track-result');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('track-id').value.trim().toUpperCase();
    const c = getComplaints().find((x) => x.id === id);
    if (!c) {
      out.innerHTML = '<p class="muted">No complaint found.</p>';
      return;
    }
    out.innerHTML = `
      <div class="card">
        <h4>${c.id}</h4>
        <p><strong>Category:</strong> ${c.category}</p>
        <p><strong>Location:</strong> ${c.location}</p>
        <p><strong>Status:</strong> ${badge(c.status)}</p>
        <p><strong>Description:</strong> ${c.description}</p>
      </div>
    `;
  });
}

function renderFeedback() {
  mount('tpl-feedback');
  const fetchForm = document.getElementById('form-fetch');
  const panel = document.getElementById('fb-panel');
  const idShow = document.getElementById('fb-id-show');
  const fbForm = document.getElementById('form-feedback');
  const ack = document.getElementById('fb-ack');
  let currentId = null;

  fetchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('fb-id').value.trim().toUpperCase();
    const c = getComplaints().find((x) => x.id === id);
    if (!c) {
      panel.classList.add('hidden');
      alert('Invalid ID');
      return;
    }
    currentId = id;
    idShow.textContent = id;
    panel.classList.remove('hidden');
  });

  fbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentId) return;
    const fd = new FormData(fbForm);
    const rec = {
      id: currentId,
      rating: fd.get('rating'),
      comments: fd.get('comments').trim(),
      createdAt: new Date().toISOString()
    };
    const list = getFeedback();
    list.push(rec);
    setFeedback(list);
    ack.classList.remove('hidden');
    ack.textContent = 'Thanks! Feedback submitted.';
    fbForm.reset();
  });
}

// Admin
const ADMIN = { username: 'admin', password: 'admin123' };

function isAuthed() {
  return localStorage.getItem(LS.session) === 'yes';
}

function setAuthed(v) {
  if (v) localStorage.setItem(LS.session, 'yes');
  else localStorage.removeItem(LS.session);
}

function guard(view) {
  return () => {
    if (!isAuthed()) {
      location.hash = '#/admin/login';
      return;
    }
    view();
  };
}

function renderAdminLogin() {
  mount('tpl-admin-login');
  const form = document.getElementById('form-admin-login');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (fd.get('username') === ADMIN.username && fd.get('password') === ADMIN.password) {
      setAuthed(true);
      location.hash = '#/admin/desk';
    } else {
      alert('Invalid credentials');
    }
  });
}

function renderAdminDesk() {
  mount('tpl-admin-desk');
  document.getElementById('btn-logout').addEventListener('click', () => {
    setAuthed(false);
    location.hash = '#/admin/login';
  });

  const tbody = document.querySelector('#tbl-admin tbody');

  function draw() {
    const list = getComplaints().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    tbody.innerHTML = list
      .map(
        (c) => `
        <tr>
          <td>${c.id}</td>
          <td>${c.category}</td>
          <td>${c.location}</td>
          <td>${badge(c.status)}</td>
          <td>${new Date(c.createdAt).toLocaleDateString()}</td>
          <td>
            <select data-id="${c.id}">
              ${['Submitted', 'In Progress', 'Resolved']
                .map(
                  (s) =>
                    `<option ${c.status === s ? 'selected' : ''}>${s}</option>`
                )
                .join('')}
            </select>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('select[data-id]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const id = sel.getAttribute('data-id');
        const all = getComplaints();
        const rec = all.find((x) => x.id === id);
        if (rec) {
          rec.status = sel.value;
          rec.updatedAt = new Date().toISOString();
          setComplaints(all);
          draw();
        }
      });
    });
  }

  draw();
}

function render404() {
  mount('tpl-404');
}

function badge(s) {
  return `<span class="status st-${s.replace(' ', '-')}">${s}</span>`;
}
