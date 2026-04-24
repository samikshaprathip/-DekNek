const API_BASE_URL =
	window.APP_CONFIG?.API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/api$/, '');
const TOKEN_KEY = 'smart_notes_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token) => {
	localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = () => {
	localStorage.removeItem(TOKEN_KEY);
};

const setFieldHint = (id, text = '') => {
	const el = document.getElementById(id);
	if (!el) return;
	el.textContent = text;
	el.classList.toggle('error', Boolean(text));
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeHTML = (value) =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

const showMessage = (text, type = 'error') => {
	const messageEl = document.getElementById('message');
	if (!messageEl) return;

	messageEl.textContent = text;
	messageEl.classList.remove('error', 'success');
	if (text) messageEl.classList.add(type);

	if (text && messageEl.classList.contains('message-fixed')) {
		setTimeout(() => {
			messageEl.textContent = '';
			messageEl.classList.remove('error', 'success');
		}, 2500);
	}
};

const request = async (endpoint, options = {}, requiresAuth = false) => {
	const headers = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (requiresAuth) {
		const token = getToken();
		if (!token) {
			throw new Error('Please login first');
		}
		headers.Authorization = `Bearer ${token}`;
	}

	let response;
	try {
		response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...options,
			headers,
		});
	} catch (error) {
		throw new Error('Network error. Please ensure the backend is running.');
	}

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.message || 'Request failed');
	}

	return data;
};

const armDeleteConfirmation = (button, baseLabel = 'Delete') => {
	if (!(button instanceof HTMLButtonElement)) return false;

	if (button.dataset.confirm === 'yes') {
		button.dataset.confirm = 'no';
		button.classList.remove('btn-warn');
		button.classList.add('btn-danger');
		button.textContent = baseLabel;
		return true;
	}

	button.dataset.confirm = 'yes';
	button.classList.remove('btn-danger');
	button.classList.add('btn-warn');
	button.textContent = 'Confirm';

	window.setTimeout(() => {
		if (button.dataset.confirm === 'yes') {
			button.dataset.confirm = 'no';
			button.classList.remove('btn-warn');
			button.classList.add('btn-danger');
			button.textContent = baseLabel;
		}
	}, 3200);

	return false;
};

const initLoginPage = () => {
	const loginForm = document.getElementById('loginForm');
	if (!loginForm) return;

	if (getToken()) {
		window.location.href = 'dashboard.html';
		return;
	}

	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		showMessage('');
		setFieldHint('loginEmailHint', '');
		setFieldHint('loginPasswordHint', '');

		const formData = new FormData(loginForm);
		const payload = {
			email: String(formData.get('email') || '').trim(),
			password: String(formData.get('password') || '').trim(),
		};

		let isValid = true;
		if (!isValidEmail(payload.email)) {
			setFieldHint('loginEmailHint', 'Enter a valid email address.');
			isValid = false;
		}
		if (!payload.password) {
			setFieldHint('loginPasswordHint', 'Password is required.');
			isValid = false;
		}
		if (!isValid) return;

		try {
			const data = await request('/auth/login', {
				method: 'POST',
				body: JSON.stringify(payload),
			});

			setToken(data.token);
			showMessage('Login successful', 'success');
			window.location.href = 'dashboard.html';
		} catch (error) {
			showMessage(error.message || 'Login failed');
		}
	});

	loginForm.querySelector('#email')?.addEventListener('input', () => setFieldHint('loginEmailHint', ''));
	loginForm.querySelector('#password')?.addEventListener('input', () => setFieldHint('loginPasswordHint', ''));
};

const initSignupPage = () => {
	const signupForm = document.getElementById('signupForm');
	if (!signupForm) return;

	if (getToken()) {
		window.location.href = 'dashboard.html';
		return;
	}

	signupForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		showMessage('');
		setFieldHint('signupNameHint', '');
		setFieldHint('signupEmailHint', '');
		setFieldHint('signupPasswordHint', '');

		const formData = new FormData(signupForm);
		const payload = {
			name: String(formData.get('name') || '').trim(),
			email: String(formData.get('email') || '').trim(),
			password: String(formData.get('password') || '').trim(),
		};

		let isValid = true;
		if (payload.name.length < 2) {
			setFieldHint('signupNameHint', 'Name should be at least 2 characters.');
			isValid = false;
		}
		if (!isValidEmail(payload.email)) {
			setFieldHint('signupEmailHint', 'Enter a valid email address.');
			isValid = false;
		}
		if (payload.password.length < 6) {
			setFieldHint('signupPasswordHint', 'Password should be at least 6 characters.');
			isValid = false;
		}
		if (!isValid) return;

		try {
			const data = await request('/auth/signup', {
				method: 'POST',
				body: JSON.stringify(payload),
			});

			setToken(data.token);
			showMessage('Signup successful', 'success');
			window.location.href = 'dashboard.html';
		} catch (error) {
			showMessage(error.message || 'Signup failed');
		}
	});

	signupForm.querySelector('#name')?.addEventListener('input', () => setFieldHint('signupNameHint', ''));
	signupForm.querySelector('#email')?.addEventListener('input', () => setFieldHint('signupEmailHint', ''));
	signupForm.querySelector('#password')?.addEventListener('input', () => setFieldHint('signupPasswordHint', ''));
};

const initDashboardPage = () => {
	const notesList = document.getElementById('notesList');
	const tasksList = document.getElementById('tasksList');
	const notesStatus = document.getElementById('notesStatus');
	const tasksStatus = document.getElementById('tasksStatus');
	const noteSort = document.getElementById('noteSort');
	const taskSort = document.getElementById('taskSort');
	const noteFilter = document.getElementById('noteFilter');
	const taskFilter = document.getElementById('taskFilter');
	const notePrevBtn = document.getElementById('notePrevBtn');
	const noteNextBtn = document.getElementById('noteNextBtn');
	const taskPrevBtn = document.getElementById('taskPrevBtn');
	const taskNextBtn = document.getElementById('taskNextBtn');
	const notePageInfo = document.getElementById('notePageInfo');
	const taskPageInfo = document.getElementById('taskPageInfo');
	const apiHealthBadge = document.getElementById('apiHealthBadge');
	if (!notesList || !tasksList) return;

	if (!getToken()) {
		window.location.href = 'index.html';
		return;
	}

	const noteForm = document.getElementById('noteForm');
	const taskForm = document.getElementById('taskForm');
	const logoutBtn = document.getElementById('logoutBtn');
	const editModal = document.getElementById('editModal');
	const editNoteForm = document.getElementById('editNoteForm');
	const editNoteTitle = document.getElementById('editNoteTitle');
	const editNoteContent = document.getElementById('editNoteContent');
	const cancelEditBtn = document.getElementById('cancelEditBtn');
	const noteTitleInput = document.getElementById('noteTitle');
	const noteContentInput = document.getElementById('noteContent');
	const taskTitleInput = document.getElementById('taskTitle');
	let activeEditNoteId = null;
	let allNotes = [];
	let allTasks = [];
	let notesPage = 1;
	let tasksPage = 1;
	const pageSize = 5;

	const setSectionStatus = (element, text, isLoading = false) => {
		if (!element) return;
		element.textContent = text;
		element.classList.toggle('loading', isLoading);
	};

	const setButtonLoading = (button, loadingText) => {
		if (!(button instanceof HTMLButtonElement)) return () => {};
		const originalText = button.textContent;
		button.disabled = true;
		if (loadingText) button.textContent = loadingText;

		return () => {
			button.disabled = false;
			if (originalText) button.textContent = originalText;
		};
	};

	const setApiHealth = (status) => {
		if (!apiHealthBadge) return;
		apiHealthBadge.classList.remove('online', 'offline', 'checking');

		if (status === 'online') {
			apiHealthBadge.classList.add('online');
			apiHealthBadge.textContent = 'API: online';
			return;
		}

		if (status === 'offline') {
			apiHealthBadge.classList.add('offline');
			apiHealthBadge.textContent = 'API: offline';
			return;
		}

		apiHealthBadge.classList.add('checking');
		apiHealthBadge.textContent = 'API: checking';
	};

	const pingApi = async () => {
		setApiHealth('checking');
		try {
			const res = await fetch(`${API_ROOT_URL}/`, { method: 'GET' });
			setApiHealth(res.ok ? 'online' : 'offline');
		} catch (error) {
			setApiHealth('offline');
		}
	};

	const sortNotes = (notes) => {
		const mode = noteSort?.value || 'newest';
		const sorted = [...notes];

		if (mode === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		if (mode === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		if (mode === 'title-asc') sorted.sort((a, b) => a.title.localeCompare(b.title));
		if (mode === 'title-desc') sorted.sort((a, b) => b.title.localeCompare(a.title));

		return sorted;
	};

	const filterNotes = (notes) => {
		const query = (noteFilter?.value || '').trim().toLowerCase();
		if (!query) return notes;
		return notes.filter(
			(note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
		);
	};

	const sortTasks = (tasks) => {
		const mode = taskSort?.value || 'newest';
		const sorted = [...tasks];

		if (mode === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		if (mode === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		if (mode === 'pending-first') sorted.sort((a, b) => Number(a.completed) - Number(b.completed));
		if (mode === 'completed-first') sorted.sort((a, b) => Number(b.completed) - Number(a.completed));
		if (mode === 'title-asc') sorted.sort((a, b) => a.title.localeCompare(b.title));
		if (mode === 'title-desc') sorted.sort((a, b) => b.title.localeCompare(a.title));

		return sorted;
	};

	const filterTasks = (tasks) => {
		const query = (taskFilter?.value || '').trim().toLowerCase();
		if (!query) return tasks;
		return tasks.filter((task) => task.title.toLowerCase().includes(query));
	};

	const pagedSlice = (items, currentPage) => {
		const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
		const safePage = Math.max(1, Math.min(currentPage, totalPages));
		const start = (safePage - 1) * pageSize;
		return {
			pageItems: items.slice(start, start + pageSize),
			totalPages,
			safePage,
		};
	};

	const closeEditModal = () => {
		if (!editModal || !editNoteForm) return;
		activeEditNoteId = null;
		editNoteForm.reset();
		editModal.classList.add('hidden');
		editModal.setAttribute('aria-hidden', 'true');
	};

	const openEditModal = (noteId, title, content) => {
		if (!editModal || !editNoteTitle || !editNoteContent) return;
		activeEditNoteId = noteId;
		setFieldHint('editNoteTitleHint', '');
		setFieldHint('editNoteContentHint', '');
		editNoteTitle.value = title;
		editNoteContent.value = content;
		editModal.classList.remove('hidden');
		editModal.setAttribute('aria-hidden', 'false');
		editNoteTitle.focus();
	};

	const renderNotes = (notes) => {
		notesList.innerHTML = '';

		if (!notes.length) {
			notesList.innerHTML = '<div class="empty-state">No notes yet. Add your first note above.</div>';
			return;
		}

		notes.forEach((note, index) => {
			const card = document.createElement('article');
			card.className = 'card card-enter';
			card.style.animationDelay = `${index * 40}ms`;
			const safeTitle = escapeHTML(note.title);
			const safeContent = escapeHTML(note.content);
			card.innerHTML = `
				<div class="card-head">
					<h3>${safeTitle}</h3>
					<div class="row-actions">
						<button class="btn btn-outline small-btn" data-action="edit-note" data-id="${note._id}" type="button">Edit</button>
						<button class="btn btn-danger small-btn" data-action="delete-note" data-confirm="no" data-id="${note._id}" type="button">Delete</button>
					</div>
				</div>
				<p>${safeContent}</p>
			`;
			notesList.appendChild(card);
		});
	};

	const renderTasks = (tasks) => {
		tasksList.innerHTML = '';

		if (!tasks.length) {
			tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one to get started.</div>';
			return;
		}

		tasks.forEach((task, index) => {
			const card = document.createElement('article');
			card.className = 'card card-enter';
			card.style.animationDelay = `${index * 40}ms`;
			const safeTitle = escapeHTML(task.title);
			card.innerHTML = `
				<div class="task-row">
					<p class="task-title ${task.completed ? 'completed' : ''}">${safeTitle}</p>
					<div class="row-actions">
						<button class="btn btn-outline small-btn" data-action="toggle-task" data-id="${task._id}" data-completed="${task.completed}" type="button">
							${task.completed ? 'Undo' : 'Done'}
						</button>
						<button class="btn btn-danger small-btn" data-action="delete-task" data-confirm="no" data-id="${task._id}" type="button">Delete</button>
					</div>
				</div>
			`;
			tasksList.appendChild(card);
		});
	};

	const renderNotesSection = () => {
		const sorted = sortNotes(filterNotes(allNotes));
		const { pageItems, totalPages, safePage } = pagedSlice(sorted, notesPage);
		notesPage = safePage;
		renderNotes(pageItems);
		if (notePageInfo) notePageInfo.textContent = `Page ${safePage} of ${totalPages}`;
		if (notePrevBtn) notePrevBtn.disabled = safePage <= 1;
		if (noteNextBtn) noteNextBtn.disabled = safePage >= totalPages;
	};

	const renderTasksSection = () => {
		const sorted = sortTasks(filterTasks(allTasks));
		const { pageItems, totalPages, safePage } = pagedSlice(sorted, tasksPage);
		tasksPage = safePage;
		renderTasks(pageItems);
		if (taskPageInfo) taskPageInfo.textContent = `Page ${safePage} of ${totalPages}`;
		if (taskPrevBtn) taskPrevBtn.disabled = safePage <= 1;
		if (taskNextBtn) taskNextBtn.disabled = safePage >= totalPages;
	};

	const loadDashboardData = async () => {
		try {
			showMessage('');
			setSectionStatus(notesStatus, 'Loading notes...', true);
			setSectionStatus(tasksStatus, 'Loading tasks...', true);
			setApiHealth('checking');
			const [notes, tasks] = await Promise.all([
				request('/notes', { method: 'GET' }, true),
				request('/tasks', { method: 'GET' }, true),
			]);
			allNotes = notes;
			allTasks = tasks;
			renderNotesSection();
			renderTasksSection();
			setSectionStatus(notesStatus, `${notes.length} note${notes.length === 1 ? '' : 's'}`);
			setSectionStatus(tasksStatus, `${tasks.length} task${tasks.length === 1 ? '' : 's'}`);
			setApiHealth('online');
		} catch (error) {
			if (error.message.toLowerCase().includes('not authorized')) {
				clearToken();
				window.location.href = 'index.html';
				return;
			}
			setSectionStatus(notesStatus, 'Unable to load notes');
			setSectionStatus(tasksStatus, 'Unable to load tasks');
			setApiHealth('offline');
			showMessage(error.message || 'Unable to load dashboard');
		}
	};

	noteForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const submitButton = noteForm.querySelector('button[type="submit"]');
		const resetButton = setButtonLoading(submitButton, 'Adding...');
		setFieldHint('noteTitleHint', '');
		setFieldHint('noteContentHint', '');

		const title = noteTitleInput?.value.trim() || '';
		const content = noteContentInput?.value.trim() || '';
		if (!title || !content) {
			if (!title) setFieldHint('noteTitleHint', 'Title is required.');
			if (!content) setFieldHint('noteContentHint', 'Content is required.');
			resetButton();
			return;
		}

		try {
			await request(
				'/notes',
				{
					method: 'POST',
					body: JSON.stringify({ title, content }),
				},
				true
			);
			noteForm.reset();
			showMessage('Note added', 'success');
			await loadDashboardData();
		} catch (error) {
			showMessage(error.message || 'Unable to add note');
		} finally {
			resetButton();
		}
	});

	taskForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const submitButton = taskForm.querySelector('button[type="submit"]');
		const resetButton = setButtonLoading(submitButton, 'Adding...');
		setFieldHint('taskTitleHint', '');

		const title = taskTitleInput?.value.trim() || '';
		if (!title) {
			setFieldHint('taskTitleHint', 'Task title is required.');
			resetButton();
			return;
		}

		try {
			await request(
				'/tasks',
				{
					method: 'POST',
					body: JSON.stringify({ title }),
				},
				true
			);
			taskForm.reset();
			showMessage('Task added', 'success');
			await loadDashboardData();
		} catch (error) {
			showMessage(error.message || 'Unable to add task');
		} finally {
			resetButton();
		}
	});

	notesList.addEventListener('click', async (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		const action = target.getAttribute('data-action');
		const id = target.getAttribute('data-id');
		if (!action || !id) return;
		let resetActionButton = () => {};

		try {
			if (action === 'delete-note') {
				if (!armDeleteConfirmation(target, 'Delete')) {
					showMessage('Click Confirm to delete this note');
					return;
				}
				resetActionButton = setButtonLoading(target, 'Deleting...');
				await request(`/notes/${id}`, { method: 'DELETE' }, true);
				showMessage('Note deleted', 'success');
			}

			if (action === 'edit-note') {
				const card = target.closest('.card');
				const currentTitle = card?.querySelector('h3')?.textContent || '';
				const currentContent = card?.querySelector('p')?.textContent || '';
				openEditModal(id, currentTitle, currentContent);
				return;
			}

			await loadDashboardData();
		} catch (error) {
			showMessage(error.message || 'Unable to process note action');
		} finally {
			resetActionButton();
		}
	});

	if (editNoteForm) {
		editNoteForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			if (!activeEditNoteId) return;

			const title = editNoteTitle.value.trim();
			const content = editNoteContent.value.trim();
			if (!title || !content) {
				if (!title) setFieldHint('editNoteTitleHint', 'Title is required.');
				if (!content) setFieldHint('editNoteContentHint', 'Content is required.');
				showMessage('Title and content are required');
				return;
			}

			try {
				await request(
					`/notes/${activeEditNoteId}`,
					{
						method: 'PUT',
						body: JSON.stringify({ title, content }),
					},
					true
				);
				closeEditModal();
				showMessage('Note updated', 'success');
				await loadDashboardData();
			} catch (error) {
				showMessage(error.message || 'Unable to update note');
			}
		});
	}

	if (cancelEditBtn) {
		cancelEditBtn.addEventListener('click', closeEditModal);
	}

	noteTitleInput?.addEventListener('input', () => setFieldHint('noteTitleHint', ''));
	noteContentInput?.addEventListener('input', () => setFieldHint('noteContentHint', ''));
	taskTitleInput?.addEventListener('input', () => setFieldHint('taskTitleHint', ''));
	editNoteTitle?.addEventListener('input', () => setFieldHint('editNoteTitleHint', ''));
	editNoteContent?.addEventListener('input', () => setFieldHint('editNoteContentHint', ''));

	noteSort?.addEventListener('change', () => {
		notesPage = 1;
		renderNotesSection();
	});

	noteFilter?.addEventListener('input', () => {
		notesPage = 1;
		renderNotesSection();
	});

	taskSort?.addEventListener('change', () => {
		tasksPage = 1;
		renderTasksSection();
	});

	taskFilter?.addEventListener('input', () => {
		tasksPage = 1;
		renderTasksSection();
	});

	notePrevBtn?.addEventListener('click', () => {
		notesPage -= 1;
		renderNotesSection();
	});

	noteNextBtn?.addEventListener('click', () => {
		notesPage += 1;
		renderNotesSection();
	});

	taskPrevBtn?.addEventListener('click', () => {
		tasksPage -= 1;
		renderTasksSection();
	});

	taskNextBtn?.addEventListener('click', () => {
		tasksPage += 1;
		renderTasksSection();
	});

	document.addEventListener('keydown', (event) => {
		const activeTag = document.activeElement?.tagName?.toLowerCase();
		const typingInField = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

		if (event.key === 'Escape' && editModal && !editModal.classList.contains('hidden')) {
			closeEditModal();
			return;
		}

		if (typingInField) return;

		if (event.key.toLowerCase() === 'n') {
			noteTitleInput?.focus();
		}

		if (event.key.toLowerCase() === 't') {
			taskTitleInput?.focus();
		}
	});

	if (editModal) {
		editModal.addEventListener('click', (event) => {
			if (event.target === editModal) {
				closeEditModal();
			}
		});
	}

	tasksList.addEventListener('click', async (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		const action = target.getAttribute('data-action');
		const id = target.getAttribute('data-id');
		if (!action || !id) return;
		let resetActionButton = () => {};

		try {
			if (action === 'delete-task') {
				if (!armDeleteConfirmation(target, 'Delete')) {
					showMessage('Click Confirm to delete this task');
					return;
				}
				resetActionButton = setButtonLoading(target, 'Deleting...');
				await request(`/tasks/${id}`, { method: 'DELETE' }, true);
				showMessage('Task deleted', 'success');
			}

			if (action === 'toggle-task') {
				resetActionButton = setButtonLoading(target, '...');
				const completed = target.getAttribute('data-completed') === 'true';
				await request(
					`/tasks/${id}`,
					{
						method: 'PUT',
						body: JSON.stringify({ completed: !completed }),
					},
					true
				);
				showMessage('Task updated', 'success');
			}

			await loadDashboardData();
		} catch (error) {
			showMessage(error.message || 'Unable to process task action');
		} finally {
			resetActionButton();
		}
	});

	logoutBtn.addEventListener('click', () => {
		clearToken();
		window.location.href = 'index.html';
	});

	pingApi();
	window.setInterval(pingApi, 20000);
	loadDashboardData();
};

document.addEventListener('DOMContentLoaded', () => {
	initLoginPage();
	initSignupPage();
	initDashboardPage();
});
