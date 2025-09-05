class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.draggedTask = null;
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        this.loadTheme();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskStats = document.getElementById('taskStats');
        this.clearAllBtn = document.getElementById('clearAll');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDate = document.getElementById('dueDate');
        this.searchInput = document.getElementById('searchInput');
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });
        
        this.clearAllBtn.addEventListener('click', () => this.clearCompletedTasks());
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.updateUI();
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.updateUI();
            });
        });
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (taskText === '') return;

        const task = {
            id: this.taskIdCounter++,
            text: taskText,
            completed: false,
            priority: this.prioritySelect.value,
            dueDate: this.dueDate.value || null,
            createdAt: new Date().toLocaleDateString(),
            order: this.tasks.length
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.dueDate.value = '';
        this.prioritySelect.value = 'medium';
        this.saveToLocalStorage();
        this.updateUI();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.updateUI();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const taskElement = document.querySelector(`[data-task-id="${taskId}"] .task-text`);
        
        if (task && taskElement) {
            const originalText = task.text;
            taskElement.contentEditable = true;
            taskElement.classList.add('editing');
            taskElement.focus();
            
            const saveEdit = () => {
                const newText = taskElement.textContent.trim();
                if (newText && newText !== originalText) {
                    task.text = newText;
                    this.saveToLocalStorage();
                }
                taskElement.contentEditable = false;
                taskElement.classList.remove('editing');
                this.updateUI();
            };
            
            taskElement.addEventListener('blur', saveEdit, { once: true });
            taskElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    taskElement.blur();
                }
            }, { once: true });
        }
    }

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveToLocalStorage();
                this.updateUI();
            }, 300);
        }
    }
    
    clearCompletedTasks() {
        const hasCompleted = this.tasks.some(task => task.completed);
        if (!hasCompleted) return;
        
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveToLocalStorage();
            this.updateUI();
        }
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        this.themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    isOverdue(dueDate) {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
    }

    formatDueDate(dueDate) {
        if (!dueDate) return '';
        const date = new Date(dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString();
        }
    }

    setupDragAndDrop(taskElement, task) {
        taskElement.draggable = true;
        
        taskElement.addEventListener('dragstart', (e) => {
            this.draggedTask = task;
            taskElement.classList.add('dragging');
        });
        
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            this.draggedTask = null;
        });
        
        taskElement.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        taskElement.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedTask && this.draggedTask.id !== task.id) {
                const draggedIndex = this.tasks.findIndex(t => t.id === this.draggedTask.id);
                const targetIndex = this.tasks.findIndex(t => t.id === task.id);
                
                const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
                this.tasks.splice(targetIndex, 0, draggedTask);
                
                this.saveToLocalStorage();
                this.updateUI();
            }
        });
    }

    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.toggleEmptyState();
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        
        let filteredTasks = this.tasks;
        
        // Apply filter
        if (this.currentFilter === 'active') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }
        
        // Apply search
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Don't render the empty state here - let toggleEmptyState handle it
        if (filteredTasks.length === 0) {
            return;
        }
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.priority}-priority`;
            li.setAttribute('data-task-id', task.id);
            
            const isOverdue = this.isOverdue(task.dueDate);
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="todoApp.toggleTask(${task.id})"></div>
                <div class="task-content">
                    <span class="task-text ${task.completed ? 'completed' : ''}" ondblclick="todoApp.editTask(${task.id})">${task.text}</span>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                        ${task.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">Due: ${this.formatDueDate(task.dueDate)}</span>` : ''}
                        <span class="task-date">Created: ${task.createdAt}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="todoApp.editTask(${task.id})" title="Edit task">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Delete task">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            this.setupDragAndDrop(li, task);
            this.taskList.appendChild(li);
        });
    }

    updateStats() {
        const remaining = this.tasks.filter(t => !t.completed).length;
        const total = this.tasks.length;
        const completed = total - remaining;
        
        if (total === 0) {
            this.taskStats.innerHTML = '0 tasks remaining';
        } else if (remaining === 0) {
            this.taskStats.innerHTML = 'All tasks completed! 🎉';
        } else {
            this.taskStats.innerHTML = `${remaining}/${total} tasks remaining`;
        }
        
        this.clearAllBtn.style.display = completed > 0 ? 'block' : 'none';
    }

    toggleEmptyState() {
        // Get filtered tasks to determine if we should show empty state
        let filteredTasks = this.tasks;
        
        if (this.currentFilter === 'active') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }
        
        // Apply search
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.searchTerm)
            );
        }
        
        const hasVisibleTasks = filteredTasks.length > 0;
        this.emptyState.style.display = hasVisibleTasks ? 'none' : 'block';
        this.taskList.style.display = hasVisibleTasks ? 'block' : 'none';
    }
    
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
const todoApp = new TodoApp();

