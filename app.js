class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        this.currentFilter = 'all';
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskStats = document.getElementById('taskStats');
        this.clearAllBtn = document.getElementById('clearAll');
        this.filterButtons = document.querySelectorAll('.filter-btn');
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
            date: new Date().toLocaleDateString()
        };

        this.tasks.push(task);
        this.taskInput.value = '';
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

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[onclick*="todoApp.toggleTask(${taskId})"]`).closest('.task-item');
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

    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.toggleEmptyState();
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        
        let filteredTasks = this.tasks;
        
        if (this.currentFilter === 'active') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-${this.currentFilter === 'all' ? 'clipboard-list' : this.currentFilter === 'active' ? 'clock' : 'check-circle'}"></i>
                    <h3>No ${this.currentFilter} tasks</h3>
                    <p>${this.currentFilter === 'all' ? 'Add a task to get started' : this.currentFilter === 'active' ? 'All tasks are completed!' : 'Complete some tasks to see them here'}</p>
                </div>
            `;
            return;
        }
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="todoApp.toggleTask(${task.id})"></div>
                <div style="flex: 1;">
                    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                    <div class="task-date">Added: ${task.date}</div>
                </div>
                <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})">×</button>
            `;
            
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
        
        // Show/hide clear completed button
        this.clearAllBtn.style.display = completed > 0 ? 'block' : 'none';
    }

    toggleEmptyState() {
        this.emptyState.style.display = this.tasks.length === 0 ? 'block' : 'none';
        this.taskList.style.display = this.tasks.length === 0 ? 'none' : 'block';
    }
    
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
const todoApp = new TodoApp();