class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.categories = JSON.parse(localStorage.getItem('categories') || '[]');
        this.currentTask = null;
        this.redrawCount = 0;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.currentTab = 'pending';
        this.selectedTime = null;
        this.filters = { priority: 'all', energy: 'all', category: 'all' };
        this.renderTasks();
        this.updateCategoryOptions();
        this.resetDailyTasks();
    }

    addTask() {
        const name = document.getElementById('taskName').value.trim();
        if (!name) {
            alert('请输入任务名称');
            return;
        }

        const duration = document.getElementById('taskDuration').value === 'custom' 
            ? parseInt(document.getElementById('customDuration').value) || 30
            : parseInt(document.getElementById('taskDuration').value);

        const category = document.getElementById('taskCategory').value.trim() || '未分类';
        
        // 保存新分类
        if (category !== '未分类' && !this.categories.includes(category)) {
            this.categories.push(category);
            this.saveCategories();
            this.updateCategoryOptions();
        }

        const task = {
            id: Date.now(),
            name,
            type: document.getElementById('taskType').value,
            duration,
            priority: document.getElementById('taskPriority').value,
            energy: document.getElementById('taskEnergy').value,
            category,
            completed: false,
            completedToday: false,
            stalled: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.clearForm();
        closeModal('addModal');
    }

    drawTask() {
        const availableTime = this.selectedTime || parseInt(document.getElementById('availableTime').value);
        if (!availableTime) {
            alert('请选择空闲时间');
            return;
        }

        const allowCompleted = document.getElementById('allowCompleted').checked;

        let availableTasks = this.tasks.filter(task => {
            if (task.duration > availableTime) return false;
            if (task.type === 'once' && task.completed) return false;
            if (task.type === 'regular' && task.completedToday && !allowCompleted) return false;
            if (task.stalled) return false;
            
            // 应用筛选条件
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) return false;
            if (this.filters.energy !== 'all' && task.energy !== this.filters.energy) return false;
            if (this.filters.category !== 'all' && task.category !== this.filters.category) return false;
            
            return true;
        });

        if (availableTasks.length === 0) {
            alert('没有符合条件的任务');
            return;
        }

        const selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];

        this.currentTask = selectedTask;
        this.redrawCount = 0;
        closeModal('drawModal');
        openModal('cardModal');
        this.startCardAnimation(selectedTask, availableTasks);
    }

    startCardAnimation(selectedTask, availableTasks) {
        const container = document.getElementById('cardCarousel');
        const taskResult = document.getElementById('taskResult');
        
        container.classList.remove('hidden');
        taskResult.classList.add('hidden');
        
        this.createBookAnimation(availableTasks, container, selectedTask);
    }
    
    createBookAnimation(tasks, container, selectedTask) {
        container.innerHTML = '';
        const pokerContainer = document.createElement('div');
        pokerContainer.className = 'poker-container';
        
        // 创建扑克牌组
        const cards = [...tasks.slice(0, 7), selectedTask].slice(0, 8);
        cards.forEach((task, index) => {
            const card = document.createElement('div');
            card.className = 'poker-card back';
            card.textContent = '🃏';
            card.style.left = `${index * 25}px`;
            card.style.top = `${Math.sin(index * 0.5) * 20 + 40}px`;
            card.style.transform = `rotate(${(index - 3.5) * 5}deg)`;
            card.style.zIndex = index;
            card.dataset.taskName = task.name;
            card.dataset.isSelected = task === selectedTask ? 'true' : 'false';
            pokerContainer.appendChild(card);
        });
        
        container.appendChild(pokerContainer);
        
        // 开始洗牌动画
        setTimeout(() => {
            this.startShuffle(pokerContainer);
        }, 500);
    }
    
    startShuffle(pokerContainer) {
        const cards = pokerContainer.querySelectorAll('.poker-card');
        
        // 播放洗牌音效
        this.playShuffleSound();
        
        // 第一阶段：洗牌
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'cardShuffle 0.5s ease-in-out';
            }, index * 50);
        });
        
        // 第二阶段：重新排列
        setTimeout(() => {
            this.rearrangeCards(cards);
        }, 800);
        
        // 第三阶段：抽卡
        setTimeout(() => {
            this.drawCard(cards);
        }, 1200);
    }
    
    rearrangeCards(cards) {
        cards.forEach((card, index) => {
            card.style.transition = 'all 0.4s ease';
            card.style.left = `${110 + (index % 3) * 30}px`;
            card.style.top = `${30 + Math.floor(index / 3) * 35}px`;
            card.style.transform = 'rotate(0deg)';
        });
    }
    
    drawCard(cards) {
        // 随机选一张卡片作为被抽中的
        const selectedCard = Array.from(cards).find(card => card.dataset.isSelected === 'true') || cards[Math.floor(Math.random() * cards.length)];
        
        // 其他卡片隐藏
        cards.forEach(card => {
            if (card !== selectedCard) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0)';
            }
        });
        
        // 被抽中的卡片突出
        setTimeout(() => {
            selectedCard.classList.add('selected');
            selectedCard.style.animation = 'cardFloat 1s ease-in-out infinite';
            
            // 翻转显示内容
            setTimeout(() => {
                this.revealCard(selectedCard);
            }, 200);
        }, 200);
    }
    
    revealCard(selectedCard) {
        selectedCard.style.animation = 'cardFlip 0.8s ease-in-out';
        
        setTimeout(() => {
            selectedCard.classList.remove('back');
            selectedCard.textContent = selectedCard.dataset.taskName;
            selectedCard.style.background = 'white';
            selectedCard.style.color = '#1F2937';
            selectedCard.style.border = '2px solid #00d2ff';
            
            this.playDingSound();
            this.playSuccessSound();
            
            // 最终放大展示
            setTimeout(() => {
                this.showFinalResult(selectedCard);
            }, 600);
        }, 400);
    }
    
    showFinalResult(selectedCard) {
        const container = selectedCard.parentElement.parentElement;
        const taskName = selectedCard.dataset.taskName;
        
        container.innerHTML = `
            <div class="poker-container">
                <div class="final-card" style="animation: finalGlow 2s ease-in-out infinite;">
                    <div style="font-size: 32px; margin-bottom: 15px;">✨</div>
                    <div style="font-size: 20px; margin-bottom: 10px;">${taskName}</div>
                    <div style="font-size: 14px; opacity: 0.9;">抽中的任务</div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            container.classList.add('hidden');
            this.showTaskResult(this.currentTask);
            document.getElementById('taskResult').classList.remove('hidden');
        }, 2000);
    }
    
    playShuffleSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {}
    }
    
    playDingSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {}
    }
    
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 第一个叮声
            setTimeout(() => {
                const osc1 = audioContext.createOscillator();
                const gain1 = audioContext.createGain();
                osc1.connect(gain1);
                gain1.connect(audioContext.destination);
                osc1.frequency.setValueAtTime(1000, audioContext.currentTime);
                osc1.type = 'sine';
                gain1.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc1.start(audioContext.currentTime);
                osc1.stop(audioContext.currentTime + 0.2);
            }, 100);
            
            // 第二个叮声
            setTimeout(() => {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.2);
            }, 200);
        } catch (e) {}
    }

    showTaskResult(task) {
        document.getElementById('drawnTaskName').textContent = task.name;
        document.getElementById('drawnTaskMeta').innerHTML = `
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <span class="tag">⏱️ ${task.duration}分钟</span>
                <span class="tag">🔥 ${this.getEnergyText(task.energy)}</span>
                <span class="tag">⭐ ${this.getPriorityText(task.priority)}</span>
                <span class="tag">📁 ${task.category}</span>
            </div>
        `;
        document.getElementById('redrawBtn').textContent = '换一个 (5次)';
        this.resetTimer();
    }

    redraw() {
        if (this.redrawCount >= 5) {
            alert('重新抽取次数已用完');
            return;
        }
        this.redrawCount++;
        document.getElementById('redrawBtn').textContent = `换一个 (${5 - this.redrawCount}次)`;
        
        const availableTime = this.selectedTime || parseInt(document.getElementById('availableTime').value);
        const allowCompleted = document.getElementById('allowCompleted').checked;

        let availableTasks = this.tasks.filter(task => {
            if (task.duration > availableTime) return false;
            if (task.type === 'once' && task.completed) return false;
            if (task.type === 'regular' && task.completedToday && !allowCompleted) return false;
            if (task.stalled) return false;
            
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) return false;
            if (this.filters.energy !== 'all' && task.energy !== this.filters.energy) return false;
            if (this.filters.category !== 'all' && task.category !== this.filters.category) return false;
            
            return true;
        });

        const selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        this.currentTask = selectedTask;
        this.startCardAnimation(selectedTask, availableTasks);
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = this.currentTask.duration * 60;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                alert('时间到！任务完成了吗？');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    resetTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = 0;
        document.getElementById('timer').textContent = '00:00';
    }

    completeTask() {
        if (!this.currentTask) return;
        
        const task = this.tasks.find(t => t.id === this.currentTask.id);
        if (task.type === 'once') {
            task.completed = true;
        } else {
            task.completedToday = true;
        }
        
        this.saveTasks();
        this.renderTasks();
        closeModal('cardModal');
        this.resetTimer();
        this.createStarfall();
    }
    
    createStarfall() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '0px';
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 500);
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task.type === 'once') {
            task.completed = !task.completed;
        } else {
            task.completedToday = !task.completedToday;
        }
        this.saveTasks();
        this.renderTasks();
    }

    stallTask(id) {
        const task = this.tasks.find(t => t.id === id);
        task.stalled = !task.stalled;
        if (!task.stalled) {
            task.stallReason = '';
        }
        this.saveTasks();
        this.renderTasks();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        this.editingTaskId = id;
        
        document.getElementById('editTaskName').value = task.name;
        document.getElementById('editTaskType').value = task.type;
        document.getElementById('editTaskDuration').value = task.duration;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskEnergy').value = task.energy;
        document.getElementById('editTaskCategory').value = task.category;
        
        if (task.stalled) {
            document.getElementById('stallReasonGroup').style.display = 'block';
            document.getElementById('editStallReason').value = task.stallReason || '';
        } else {
            document.getElementById('stallReasonGroup').style.display = 'none';
        }
        
        openModal('editModal');
    }
    
    undoTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task.type === 'once') {
            task.completed = false;
        } else {
            task.completedToday = false;
        }
        this.saveTasks();
        this.renderTasks();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        let filteredTasks = [];

        switch (this.currentTab) {
            case 'pending':
                filteredTasks = this.tasks.filter(task => {
                    if (task.stalled) return false;
                    if (task.type === 'once') return !task.completed;
                    return !task.completedToday;
                });
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => {
                    if (task.type === 'once') return task.completed;
                    return task.completedToday;
                });
                break;
            case 'stalled':
                filteredTasks = this.tasks.filter(task => task.stalled);
                break;
        }

        if (filteredTasks.length === 0) {
            const emptyMessages = {
                pending: '暂无待完成任务，点击右上角按钮添加第一个任务吧！',
                completed: '还没有完成的任务，加油！',
                stalled: '暂无停滞任务'
            };
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>${emptyMessages[this.currentTab]}</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => {
            const isCompleted = task.type === 'once' ? task.completed : task.completedToday;
            return `
                <div class="task-item">
                    <div class="task-checkbox ${isCompleted ? 'completed' : ''}" onclick="taskManager.toggleTask(${task.id})">
                        ${isCompleted ? '✓' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-name">${task.name}</div>
                        ${task.stallReason ? `<div class="stall-reason">停滞原因：${task.stallReason}</div>` : ''}
                        <div class="task-meta">
                            <span class="tag">⏱️ ${task.duration}分钟</span>
                            <span class="tag">🔥 ${this.getEnergyText(task.energy)}</span>
                            <span class="tag">⭐ ${this.getPriorityText(task.priority)}</span>
                            <span class="tag">📁 ${task.category}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        ${this.currentTab === 'pending' ? `
                            <button class="btn-icon btn-edit" onclick="taskManager.editTask(${task.id})" title="编辑任务">✏️</button>
                            <button class="btn-icon btn-edit" onclick="taskManager.stallTask(${task.id})" title="标记为停滞">⏸️</button>
                        ` : ''}
                        ${this.currentTab === 'completed' ? `
                            <button class="btn-icon btn-edit" onclick="taskManager.undoTask(${task.id})" title="撤销完成">↩️</button>
                        ` : ''}
                        ${this.currentTab === 'stalled' ? `
                            <button class="btn-icon btn-edit" onclick="taskManager.editTask(${task.id})" title="编辑任务">✏️</button>
                            <button class="btn-icon btn-edit" onclick="taskManager.stallTask(${task.id})" title="恢复任务">▶️</button>
                        ` : ''}
                        <button class="btn-icon btn-delete" onclick="taskManager.deleteTask(${task.id})" title="删除任务">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getEnergyText(energy) {
        const map = { low: '敷衍', medium: '还行', high: '很强' };
        return map[energy] || energy;
    }

    getPriorityText(priority) {
        const map = { low: '低', medium: '中', high: '高' };
        return map[priority] || priority;
    }

    updateCategoryOptions() {
        const datalist = document.getElementById('categoryList');
        datalist.innerHTML = this.categories.map(cat => `<option value="${cat}"></option>`).join('');
        
        const categoryFilters = document.getElementById('categoryFilters');
        categoryFilters.innerHTML = `<div class="filter-option active" onclick="selectFilter('category', 'all')">全部</div>`;
        this.categories.forEach(cat => {
            categoryFilters.innerHTML += `<div class="filter-option" onclick="selectFilter('category', '${cat}')">${cat}</div>`;
        });
    }

    clearForm() {
        document.getElementById('taskName').value = '';
        document.getElementById('taskType').value = 'once';
        document.getElementById('taskDuration').value = '15';
        document.getElementById('taskPriority').value = 'high';
        document.getElementById('taskEnergy').value = 'high';
        document.getElementById('taskCategory').value = '';
        document.getElementById('customDurationGroup').classList.add('hidden');
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    resetDailyTasks() {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('lastReset');
        
        if (lastReset !== today) {
            this.tasks.forEach(task => {
                if (task.type === 'regular') {
                    task.completedToday = false;
                }
            });
            this.saveTasks();
            localStorage.setItem('lastReset', today);
        }
    }
}

// 全局函数
function switchTab(tab) {
    taskManager.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    taskManager.renderTasks();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function openAddModal() {
    openModal('addModal');
}

function openDrawModal() {
    openModal('drawModal');
}

function selectTime(time) {
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (time === 'custom') {
        document.getElementById('availableTime').classList.remove('hidden');
        taskManager.selectedTime = null;
    } else {
        document.getElementById('availableTime').classList.add('hidden');
        taskManager.selectedTime = time;
    }
}

function selectFilter(type, value) {
    const container = event.target.parentElement;
    container.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
    event.target.classList.add('active');
    taskManager.filters[type] = value;
}

function addTask() { taskManager.addTask(); }
function drawTask() { taskManager.drawTask(); }
function redraw() { taskManager.redraw(); }
function startTimer() { taskManager.startTimer(); }
function completeTask() { taskManager.completeTask(); }
function saveEditTask() { taskManager.saveEditTask(); }

// 添加保存编辑任务的方法到TaskManager类中
TaskManager.prototype.saveEditTask = function() {
    const task = this.tasks.find(t => t.id === this.editingTaskId);
    if (!task) return;
    
    task.name = document.getElementById('editTaskName').value.trim();
    task.type = document.getElementById('editTaskType').value;
    task.duration = parseInt(document.getElementById('editTaskDuration').value);
    task.priority = document.getElementById('editTaskPriority').value;
    task.energy = document.getElementById('editTaskEnergy').value;
    task.category = document.getElementById('editTaskCategory').value.trim() || '未分类';
    
    if (task.stalled) {
        task.stallReason = document.getElementById('editStallReason').value.trim();
    }
    
    this.saveTasks();
    this.renderTasks();
    closeModal('editModal');
};

// 初始化
const taskManager = new TaskManager();

// 默认选中筛选条件
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.filter-option').forEach(opt => {
        if (opt.textContent === '全部') {
            opt.classList.add('active');
        }
    });
});

// 自定义时长显示/隐藏
document.getElementById('taskDuration').addEventListener('change', function() {
    const customGroup = document.getElementById('customDurationGroup');
    if (this.value === 'custom') {
        customGroup.classList.remove('hidden');
    } else {
        customGroup.classList.add('hidden');
    }
});

// 点击弹窗外部关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// 自定义时间输入监听
document.getElementById('availableTime').addEventListener('input', function() {
    taskManager.selectedTime = parseInt(this.value) || null;
});