class MyCalendarApp {
    constructor() {
        this.currentDate = new Date(2026, 2, 30);
        this.currentView = 'week';
        this.currentPeriod = 'week';
        this.selectedDate = null;
        this.editingEventId = null;
        this.editingGoalId = null;
        this.pickerDate = new Date();
        
        this.categoryColors = {
            business: '#8B5CF6',
            project: '#4ECDC4',
            study: '#FFD93D',
            health: '#6BCB77',
            personal: '#9D84B7',
            reading: '#FF8B94',
            meeting: '#A8DADC',
            leisure: '#F1FAEE',
            social: '#E63946'
        };

        this.categoryNames = {
            business: '事业',
            project: '项目',
            study: '学习',
            health: '健康',
            personal: '个人',
            reading: '阅读/新闻',
            meeting: '会议',
            leisure: '娱乐',
            social: '社交'
        };

        this.events = this.loadEvents();
        this.goals = this.loadGoals();
        this.tasks = this.loadTasks();

        this.init();
    }

    init() {
    console.log('INIT NEW VERSION');
    this.bindNavigation();
    this.bindViewSwitcher();
    this.bindEventModal();
    this.bindGoalModal();
    this.bindDatePicker();
    this.renderTimeSlots();
    this.bindAnalyticsModal();
    this.render();
}

    // ========== 导航 ==========
    bindNavigation() {
        document.getElementById('prevBtn').addEventListener('click', () => this.previousPeriod());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPeriod());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
    }


    previousPeriod() {
        if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        }
        this.render();
    }

    nextPeriod() {
        if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    // ========== 视图切换 ==========
    bindViewSwitcher() {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.currentDate = new Date();
                this.render();
            });
        });
    }

    // ========== 渲染主界面 ==========
    render() {
        this.updateDateRange();
        this.updateSidebar();
        
        document.getElementById('weekView').classList.remove('active');
        document.getElementById('monthView').classList.remove('active');
        document.getElementById('yearView').classList.remove('active');
        document.getElementById('goalsSection').style.display = 'none';

        switch (this.currentView) {
            case 'week':
                this.renderWeekView();
                document.getElementById('weekView').classList.add('active');
                document.getElementById('goalsSection').style.display = 'block';
                break;
            case 'month':
                this.renderMonthView();
                document.getElementById('monthView').classList.add('active');
                break;
            case 'year':
                this.renderYearView();
                document.getElementById('yearView').classList.add('active');
                break;
        }
    }

    updateDateRange() {
        const dateRange = document.getElementById('dateRange');
        if (this.currentView === 'week') {
            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            dateRange.textContent = this.formatDateRange(weekStart, weekEnd);
        } else if (this.currentView === 'month') {
            const monthName = this.currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
            dateRange.textContent = monthName;
        }
    }

    formatDateRange(start, end) {
        const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
        const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
        return `${start.getFullYear()}/${startStr} - ${endStr}`;
    }

    // ========== 周视图 ==========
    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        
        const daysHeader = document.getElementById('daysHeader');
        daysHeader.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            if (this.isToday(dayDate)) {
                dayHeader.classList.add('today');
            }
            
            const dayName = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i];
            dayHeader.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dayDate.getDate()}</div>
            `;
            daysHeader.appendChild(dayHeader);
        }
        
        const daysGrid = document.getElementById('daysGrid');
        daysGrid.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            
            const dayEvents = this.events.filter(e => {
                const eDate = new Date(e.date);
                return eDate.toDateString() === dayDate.toDateString();
            });
            
            dayEvents.forEach(event => {
                const eventBlock = this.createEventBlock(event);
                dayColumn.appendChild(eventBlock);
            });
            
            dayColumn.addEventListener('click', (e) => {
                if (e.target === dayColumn) {
                const wrapper = document.querySelector('.days-grid-wrapper');
                const rect = dayColumn.getBoundingClientRect();

                // 点击点相对于 dayColumn 顶部的位置
                const clickY = e.clientY - rect.top + wrapper.scrollTop;

                // 1分钟 = 1px，所以 clickY 就是当天第几分钟
                // 点击 6:00-6:59 之间，都归到 6:00
                const startMinutes = Math.floor(clickY / 60) * 60;

                // 限制范围，避免超出一天
                const safeStartMinutes = Math.max(0, Math.min(startMinutes, 23 * 60));
                const endMinutes = Math.min(safeStartMinutes + 60, 23 * 60 + 59);

                this.selectedDate = this.formatDate(dayDate);

                this.resetEventForm();
                document.getElementById('eventStartTime').value = this.minutesToTime(safeStartMinutes);
                document.getElementById('eventEndTime').value = this.minutesToTime(endMinutes);
                document.getElementById('eventDate').value = this.selectedDate;

                document.getElementById('modalTitle').textContent = '新建事件';
                this.editingEventId = null;

                this.openEventModal();
                }
            });
            
            daysGrid.appendChild(dayColumn);
        }

        // 同步滚动
        const timeSlots = document.getElementById('timeSlots');
        const wrapper = document.querySelector('.days-grid-wrapper');
        timeSlots.addEventListener('scroll', () => {
            wrapper.scrollTop = timeSlots.scrollTop;
        });
        wrapper.addEventListener('scroll', () => {
            timeSlots.scrollTop = wrapper.scrollTop;
        });
    }

 createEventBlock(event) {
     const block = document.createElement('div');
     block.className = `event-block ${event.category || 'business'}`;
     block.dataset.eventId = event.id;

     const startMinutes = this.timeToMinutes(event.startTime);
     const endMinutes = this.timeToMinutes(event.endTime);
     const durationMinutes = Math.max(15, endMinutes - startMinutes);

     // 1分钟 = 1px
     block.style.top = `${startMinutes}px`;
     block.style.height = `${durationMinutes}px`;

     block.innerHTML = `
         <div class="event-title">${event.title || '(未命名)'}</div>
         <div class="event-time">${event.startTime} - ${event.endTime}</div>
     `;

     let isDragging = false;
     let hasMoved = false;
     let startY = 0;
     let originalTop = 0;

     const timeText = block.querySelector('.event-time');

     block.addEventListener('mousedown', (e) => {
         // 只处理左键
         if (e.button !== 0) return;

         e.preventDefault();
         e.stopPropagation();

         isDragging = true;
         hasMoved = false;
         startY = e.clientY;
         originalTop = parseFloat(block.style.top) || 0;

         block.classList.add('dragging');

         const onMouseMove = (moveEvent) => {
             if (!isDragging) return;

             const deltaY = moveEvent.clientY - startY;
             if (Math.abs(deltaY) > 3) {
                 hasMoved = true;
             }

             let newTop = originalTop + deltaY;

             // 吸附到 15 分钟
             newTop = this.snapMinutes(newTop);

             // 限制在当天范围内
             const maxTop = 1440 - durationMinutes;
             newTop = Math.max(0, Math.min(maxTop, newTop));

             block.style.top = `${newTop}px`;

             // 拖动过程中实时更新时间文字
             const newStartMinutes = newTop;
             const newEndMinutes = newTop + durationMinutes;
             timeText.textContent = `${this.minutesToTime(newStartMinutes)} - ${this.minutesToTime(newEndMinutes)}`;
         };

         const onMouseUp = () => {
             if (!isDragging) return;
             isDragging = false;

             block.classList.remove('dragging');

             const finalTop = parseFloat(block.style.top) || 0;
             const newStartMinutes = this.snapMinutes(finalTop);
             const newEndMinutes = newStartMinutes + durationMinutes;

             document.removeEventListener('mousemove', onMouseMove);
             document.removeEventListener('mouseup', onMouseUp);

             // 如果没有拖动，按单击处理，进入编辑页
             if (!hasMoved) {
                 this.openEventModal(event.id);
                 return;
             }

             // 更新事件时间
             event.startTime = this.minutesToTime(newStartMinutes);
             event.endTime = this.minutesToTime(newEndMinutes);

             // 保存并重新渲染
             this.saveEvents();
             this.render();
         };

         document.addEventListener('mousemove', onMouseMove);
         document.addEventListener('mouseup', onMouseUp);
     });

     return block;
 }

    timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    minutesToTime(totalMinutes) {
        totalMinutes = Math.max(0, Math.min(1440, totalMinutes));
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    snapMinutes(value) {
        return Math.round(value / 15) * 15;
    }


    renderTimeSlots() {
        const timeSlots = document.getElementById('timeSlots');
        timeSlots.innerHTML = '';
        
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = `${String(i).padStart(2, '0')}:00`;
            timeSlots.appendChild(slot);
        }
    }

    // ========== 月视图 ==========
    renderMonthView() {
        const monthCalendar = document.getElementById('monthCalendar');
        monthCalendar.innerHTML = '';
        
        const monthTitle = document.getElementById('monthTitle');
        monthTitle.textContent = this.currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        
        const weekdaysDiv = document.createElement('div');
        weekdaysDiv.className = 'month-weekdays';
        ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'month-weekday';
            dayEl.textContent = day;
            weekdaysDiv.appendChild(dayEl);
        });
        monthCalendar.appendChild(weekdaysDiv);
        
        const daysDiv = document.createElement('div');
        daysDiv.className = 'month-days';
        
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - (monthStart.getDay() || 7) + 1);
        
        let currentDate = new Date(startDate);
        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (7 - (monthEnd.getDay() || 7)));
        
        while (currentDate <= endDate) {
            const dayEl = document.createElement('div');
            dayEl.className = 'month-day';
            
            if (currentDate.getMonth() !== this.currentDate.getMonth()) {
                dayEl.classList.add('other-month');
            }
            
            if (this.isToday(currentDate)) {
                dayEl.classList.add('today');
            }
            
            dayEl.innerHTML = `<div class="month-day-number">${currentDate.getDate()}</div>`;
            
            const dayEvents = this.events.filter(e => {
                const eDate = new Date(e.date);
                return eDate.toDateString() === currentDate.toDateString();
            });
            
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'month-day-events';
            dayEvents.slice(0, 3).forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.className = `month-event ${event.category || 'business'}`;
                eventDiv.textContent = event.title || '(未命名)';
                eventDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openEventModal(event.id);
                });
                eventsDiv.appendChild(eventDiv);
            });
            
            if (dayEvents.length > 3) {
                const moreDiv = document.createElement('div');
                moreDiv.style.fontSize = '10px';
                moreDiv.style.color = 'var(--text-secondary)';
                moreDiv.textContent = `+${dayEvents.length - 3}`;
                eventsDiv.appendChild(moreDiv);
            }
            
            dayEl.appendChild(eventsDiv);
            dayEl.addEventListener('click', () => {
                this.currentDate = new Date(currentDate);
                this.currentView = 'week';
                this.render();
            });
            
            daysDiv.appendChild(dayEl);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        monthCalendar.appendChild(daysDiv);
    }

    // ========== 年视图 ==========
    renderYearView() {
    const yearCalendar = document.getElementById('yearCalendar');
    yearCalendar.innerHTML = '';

    const currentYear = this.currentDate.getFullYear();
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    for (let month = 0; month < 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'year-month';

        // ===== 标题 =====
        const titleDiv = document.createElement('div');
        titleDiv.className = 'year-month-title';
        titleDiv.textContent = monthNames[month];

        // ===== 月卡片主体 =====
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'year-month-body';

        // ===== 小月历 =====
        const gridDiv = document.createElement('div');
        gridDiv.className = 'year-month-grid';

        // 星期标题（可选，保留更像完整月历）
        const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        weekdayLabels.forEach(label => {
            const weekdayDiv = document.createElement('div');
            weekdayDiv.className = 'year-month-weekday';
            weekdayDiv.textContent = label;
            gridDiv.appendChild(weekdayDiv);
        });

        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);

        // 让周一作为一周开始
        const startDay = (monthStart.getDay() + 6) % 7;

        for (let i = 0; i < startDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'year-month-day empty';
            gridDiv.appendChild(emptyDiv);
        }

        for (let day = 1; day <= monthEnd.getDate(); day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'year-month-day';
            dayDiv.textContent = day;

            const dayDate = new Date(currentYear, month, day);

            const dayEvents = this.events.filter(e => {
                const eDate = new Date(e.date);
                return eDate.toDateString() === dayDate.toDateString();
            });

            if (this.isToday(dayDate)) {
                dayDiv.classList.add('today');
            }

            if (dayEvents.length > 0) {
                dayDiv.classList.add('busy');
            }

            dayDiv.addEventListener('click', () => {
                this.currentDate = new Date(dayDate);
                this.currentView = 'month';
                document.querySelectorAll('.btn-view').forEach(b => {
                    b.classList.toggle('active', b.dataset.view === 'month');
                });
                this.render();
            });

            gridDiv.appendChild(dayDiv);
        }

        // ===== 本月统计 =====
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'year-month-summary';

        const monthEvents = this.events.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getMonth() === month && eDate.getFullYear() === currentYear;
        });

        const totalHours = monthEvents.reduce((sum, event) => {
            return sum + this.getEventDurationHours(event);
        }, 0);

        const summaryText = document.createElement('div');
        summaryText.className = 'year-month-focus-total';
        summaryText.textContent = `本月专注 ${totalHours.toFixed(1)} 小时`;

        summaryDiv.appendChild(summaryText);

        // ===== 组装 =====
        bodyDiv.appendChild(gridDiv);
        bodyDiv.appendChild(summaryDiv);

        monthDiv.appendChild(titleDiv);
        monthDiv.appendChild(bodyDiv);

        yearCalendar.appendChild(monthDiv);
    }
} //结束年视图

    //改成Getweekstart和updatesidebar
    getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay() || 7; // 周日按 7 处理
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

updateSidebar() {
    const categoryList = document.getElementById('categoryList');
    const todayTasks = document.getElementById('todayTasks');
    const goalsList = document.getElementById('goalsList');

    if (categoryList) {
        categoryList.innerHTML = Object.entries(this.categoryNames)
            .map(([key, name]) => `
                <div class="category-item">
                    <span class="category-dot" style="background:${this.categoryColors[key]}"></span>
                    <span>${name}</span>
                </div>
            `)
            .join('');
    }

    if (todayTasks) {
        todayTasks.innerHTML = this.tasks && this.tasks.length
            ? this.tasks.map(task => `<div class="task-item">${task.title || task}</div>`).join('')
            : '<div class="empty-state">暂无任务</div>';
    }

    if (goalsList) {
        goalsList.innerHTML = this.goals && this.goals.length
            ? this.goals.map(goal => `
                <div class="goal-item">
                    <span>${goal.title || '未命名目标'}</span>
                </div>
            `).join('')
            : '<div class="empty-state">暂无目标</div>';
    }
} //
    //istoday之前未被定义
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    calculateCategoryStats(events) {
        const stats = {};
        events.forEach(event => {
            const category = event.category || 'business';
            stats[category] = (stats[category] || 0) + 1;
        });
        return stats;
    }

    resetEventForm() {
        const form = document.getElementById('eventForm');
        if (form) form.reset();
    }

    openEventModal(eventId = null) {
        console.log('openEventModal:', eventId);
    }
    
    //添加事件
    saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(this.events));
}

bindEventModal() {
    const addEventBtn = document.getElementById('addEventBtn');
    const closeEventModalBtn = document.getElementById('closeEventModal');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const eventForm = document.getElementById('eventForm');
    const deleteEventBtn = document.getElementById('deleteEventBtn');

    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            this.editingEventId = null;
            this.resetEventForm();

            const today = this.formatDate(new Date());
            document.getElementById('eventDate').value = today;
            document.getElementById('eventStartTime').value = '09:00';
            document.getElementById('eventEndTime').value = '10:00';
            document.getElementById('modalTitle').textContent = '新建事件';
            if (deleteEventBtn) deleteEventBtn.style.display = 'none';

            this.openEventModal();
        });
    }

    if (closeEventModalBtn) {
        closeEventModalBtn.addEventListener('click', () => this.closeEventModal());
    }

    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', () => this.closeEventModal());
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => this.closeEventModal());
    }

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const startTime = document.getElementById('eventStartTime').value;
            const endTime = document.getElementById('eventEndTime').value;
            const category = document.getElementById('eventCategory').value;
            const location = document.getElementById('eventLocation').value.trim();
            const meetingLink = document.getElementById('eventMeetingLink').value.trim();
            const notes = document.getElementById('eventNotes').value.trim();

            // 修改验证：标题不再是必填项
            if (!date || !startTime || !endTime || !category) {
                alert('请填写完整的必填项（标题可选）');
                return;
            }

            if (endTime <= startTime) {
                alert('结束时间必须晚于开始时间');
                return;
            }

            if (this.editingEventId) {
                const event = this.events.find(e => e.id === this.editingEventId);
                if (event) {
                    event.title = title;
                    event.date = date;
                    event.startTime = startTime;
                    event.endTime = endTime;
                    event.category = category;
                    event.location = location;
                    event.meetingLink = meetingLink;
                    event.notes = notes;
                }
            } else {
                this.events.push({
                    id: Date.now().toString(),
                    title,
                    date,
                    startTime,
                    endTime,
                    category,
                    location,
                    meetingLink,
                    notes
                });
            }

            this.saveEvents();
            this.closeEventModal();
            this.render();
        });
    }

    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
            if (!this.editingEventId) return;

            this.events = this.events.filter(e => e.id !== this.editingEventId);
            this.saveEvents();
            this.closeEventModal();
            this.render();
        });
    }
}

openEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const deleteEventBtn = document.getElementById('deleteEventBtn');

    if (!modal) return;

    if (eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.editingEventId = eventId;

        document.getElementById('modalTitle').textContent = '编辑事件';
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventStartTime').value = event.startTime || '';
        document.getElementById('eventEndTime').value = event.endTime || '';
        document.getElementById('eventCategory').value = event.category || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventMeetingLink').value = event.meetingLink || '';
        document.getElementById('eventNotes').value = event.notes || '';

        if (deleteEventBtn) deleteEventBtn.style.display = 'inline-block';
    } else {
        if (deleteEventBtn) deleteEventBtn.style.display = 'none';
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
}

closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.style.display = 'none';
    this.editingEventId = null;
}

resetEventForm() {
    const form = document.getElementById('eventForm');
    if (form) form.reset();

    const deleteEventBtn = document.getElementById('deleteEventBtn');
    if (deleteEventBtn) deleteEventBtn.style.display = 'none';
}  // 

    //迷你日历加载
    bindDatePicker() {
    const eventDateInput = document.getElementById('eventDate');
    const datePicker = document.getElementById('datePicker');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (!eventDateInput || !datePicker) return;

    eventDateInput.addEventListener('click', (e) => {
        e.stopPropagation();

        if (eventDateInput.value) {
            const selected = new Date(eventDateInput.value);
            if (!isNaN(selected.getTime())) {
                this.pickerDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
            }
        } else {
            this.pickerDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        }

        this.renderDatePicker();
        datePicker.classList.remove('hidden');
    });

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pickerDate.setMonth(this.pickerDate.getMonth() - 1);
            this.renderDatePicker();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pickerDate.setMonth(this.pickerDate.getMonth() + 1);
            this.renderDatePicker();
        });
    }

    datePicker.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.date-picker-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            datePicker.classList.add('hidden');
        }
    });
}

renderDatePicker() {
    const pickerMonth = document.getElementById('pickerMonth');
    const pickerGrid = document.getElementById('pickerGrid');
    const eventDateInput = document.getElementById('eventDate');
    const datePicker = document.getElementById('datePicker');

    if (!pickerMonth || !pickerGrid) return;

    const year = this.pickerDate.getFullYear();
    const month = this.pickerDate.getMonth();

    pickerMonth.textContent = `${year}年 ${month + 1}月`;
    pickerGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = (firstDay.getDay() + 6) % 7; // 周一=0
    const totalDays = lastDay.getDate();

    for (let i = 0; i < startWeekday; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'picker-day empty';
        pickerGrid.appendChild(emptyCell);
    }

    const today = new Date();
    const selectedValue = eventDateInput.value;

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'picker-day';
        cell.textContent = day;

        const current = new Date(year, month, day);
        const formatted = this.formatDate(current);

        if (formatted === selectedValue) {
            cell.classList.add('selected');
        }

        if (current.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }

        cell.addEventListener('click', () => {
            eventDateInput.value = formatted;
            datePicker.classList.add('hidden');
        });

        pickerGrid.appendChild(cell);
    }
}
    //重要目标的编辑
saveGoals() {
    localStorage.setItem('calendarGoals', JSON.stringify(this.goals));
}

bindGoalModal() {
    const addGoalBtn = document.getElementById('addGoalBtn');
    const closeGoalModalBtn = document.getElementById('closeGoalModal');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    const goalOverlay = document.getElementById('goalOverlay');
    const goalForm = document.getElementById('goalForm');
    const deleteGoalBtn = document.getElementById('deleteGoalBtn');

    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            this.editingGoalId = null;
            this.resetGoalForm();

            const today = this.formatDate(new Date());
            document.getElementById('goalStartDate').value = today;
            document.getElementById('goalEndDate').value = today;
            document.getElementById('goalCategory').value = 'business';

            if (deleteGoalBtn) deleteGoalBtn.style.display = 'none';
            this.openGoalModal();
        });
    }

    if (closeGoalModalBtn) {
        closeGoalModalBtn.addEventListener('click', () => this.closeGoalModal());
    }

    if (cancelGoalBtn) {
        cancelGoalBtn.addEventListener('click', () => this.closeGoalModal());
    }

    if (goalOverlay) {
        goalOverlay.addEventListener('click', () => this.closeGoalModal());
    }

    if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('goalTitle').value.trim();
            const startDate = document.getElementById('goalStartDate').value;
            const endDate = document.getElementById('goalEndDate').value;
            const category = document.getElementById('goalCategory').value;

            if (!title) {
                alert('请输入目标标题');
                return;
            }

            if (!category) {
                alert('请选择分类');
                return;
            }

            if (startDate && endDate && endDate < startDate) {
                alert('结束日期不能早于开始日期');
                return;
            }

            if (this.editingGoalId) {
                const goal = this.goals.find(g => g.id === this.editingGoalId);
                if (goal) {
                    goal.title = title;
                    goal.startDate = startDate;
                    goal.endDate = endDate;
                    goal.category = category;
                }
            } else {
                this.goals.push({
                    id: Date.now().toString(),
                    title,
                    startDate,
                    endDate,
                    category
                });
            }

            this.saveGoals();
            this.closeGoalModal();
            this.updateSidebar();
            this.render();
        });
    }

    if (deleteGoalBtn) {
        deleteGoalBtn.addEventListener('click', () => {
            if (!this.editingGoalId) return;

            this.goals = this.goals.filter(g => g.id !== this.editingGoalId);
            this.saveGoals();
            this.closeGoalModal();
            this.updateSidebar();
            this.render();
        });
    }
}

openGoalModal(goalId = null) {
    const modal = document.getElementById('goalModal');
    const deleteGoalBtn = document.getElementById('deleteGoalBtn');

    if (!modal) return;

    if (goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.editingGoalId = goalId;
        document.getElementById('goalTitle').value = goal.title || '';
        document.getElementById('goalStartDate').value = goal.startDate || '';
        document.getElementById('goalEndDate').value = goal.endDate || '';
        document.getElementById('goalCategory').value = goal.category || 'business';

        if (deleteGoalBtn) deleteGoalBtn.style.display = 'inline-block';
    } else {
        if (deleteGoalBtn) deleteGoalBtn.style.display = 'none';
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
}

closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.style.display = 'none';
    this.editingGoalId = null;
}

resetGoalForm() {
    const form = document.getElementById('goalForm');
    if (form) form.reset();

    const deleteGoalBtn = document.getElementById('deleteGoalBtn');
    if (deleteGoalBtn) deleteGoalBtn.style.display = 'none';
}//
    //重要目标的显示
    updateSidebar() {
        const categoryList = document.getElementById('categoryList');
        const todayTasks = document.getElementById('todayTasks');
        const goalsList = document.getElementById('goalsList');

        if (categoryList) {
            categoryList.innerHTML = Object.entries(this.categoryNames)
                .map(([key, name]) => `
                    <div class="category-item">
                        <span class="category-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:${this.categoryColors[key]}"></span>
                        <span>${name}</span>
                    </div>
                `)
                .join('');
        }

        if (todayTasks) {
            todayTasks.innerHTML = this.tasks && this.tasks.length
                ? this.tasks.map(task => `<div class="task-item">${task.title || task}</div>`).join('')
                : '<div class="empty-state">暂无任务</div>';
        }

        if (goalsList) {
            if (this.goals && this.goals.length) {
                goalsList.innerHTML = this.goals.map(goal => `
                    <div class="goal-item" data-goal-id="${goal.id}" style="cursor:pointer; padding:8px 10px; border:1px solid #eee; border-radius:8px; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="category-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${this.categoryColors[goal.category] || '#999'}"></span>
                            <strong>${goal.title || '未命名目标'}</strong>
                        </div>
                        <div style="margin-top:4px; font-size:12px; color:#666;">
                            ${goal.startDate || '未设置开始'} ${goal.endDate ? `- ${goal.endDate}` : ''}
                        </div>
                    </div>
                `).join('');

                goalsList.querySelectorAll('.goal-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.openGoalModal(item.dataset.goalId);
                    });
                });
            } else {
                goalsList.innerHTML = '<div class="empty-state">暂无目标</div>';
            }
        }
    }
    //统计功能
    bindAnalyticsModal() {
    const analyticsBtn = document.getElementById('analyticsBtn');
    const analyticsOverlay = document.getElementById('analyticsOverlay');
    const closeAnalyticsModal = document.getElementById('closeAnalyticsModal');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            this.currentPeriod = 'week';

            tabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.period === 'week');
            });

            this.openAnalyticsModal();
        });
    }

    if (closeAnalyticsModal) {
        closeAnalyticsModal.addEventListener('click', () => this.closeAnalyticsModal());
    }

    if (analyticsOverlay) {
        analyticsOverlay.addEventListener('click', () => this.closeAnalyticsModal());
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            this.currentPeriod = btn.dataset.period;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            this.renderAnalytics();
        });
    });
}

    openAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;
        modal.classList.add('active');
        modal.style.display = 'flex';
        this.renderAnalytics();
    }

    closeAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    renderAnalytics() {
    const events = this.getAnalyticsEvents(this.currentPeriod);
    const prevEvents = this.getPreviousPeriodEvents(this.currentPeriod);

    this.renderAnalyticsRangeTitle(this.currentPeriod);
    this.renderTotalHours(events);
    this.renderCategoryStats(events);
    this.renderCategoryRanking(events, prevEvents);
    this.renderGoalsGantt(this.currentPeriod);
    }

    renderAnalyticsRangeTitle(period) { // 表格行显示时间
    const modal = document.getElementById('analyticsModal');
    if (!modal) return;

    let subtitle = modal.querySelector('.analytics-range-text');

    if (!subtitle) {
        subtitle = document.createElement('div');
        subtitle.className = 'analytics-range-text';

        const header = modal.querySelector('.modal-header');
        if (header) {
            header.appendChild(subtitle);
        }
    }

    if (period === 'week') {
        const start = this.getWeekStart(this.currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        subtitle.textContent = this.formatDateRange(start, end);
    } else {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        subtitle.textContent = `${year}年${month}月`;
    }
}
    // 统计计算
    getAnalyticsEvents(period = 'week') {
    if (period === 'week') {
        const start = this.getWeekStart(this.currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7); // 右开区间

        return this.events.filter(event => {
            const d = new Date(event.date + 'T00:00:00');
            return d >= start && d < end;
        });
    }

    if (period === 'month') {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1); // 下月1号，右开区间

        return this.events.filter(event => {
            const d = new Date(event.date + 'T00:00:00');
            return d >= start && d < end;
        });
    }

    return [];
}

getPreviousPeriodEvents(period = 'week') {
    if (period === 'week') {
        const currentStart = this.getWeekStart(this.currentDate);

        const prevStart = new Date(currentStart);
        prevStart.setDate(prevStart.getDate() - 7);

        const prevEnd = new Date(currentStart); // 上一期周结束 = 本周开始
        return this.events.filter(event => {
            const d = new Date(event.date + 'T00:00:00');
            return d >= prevStart && d < prevEnd;
        });
    }

    if (period === 'month') {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const prevStart = new Date(year, month - 1, 1);
        const prevEnd = new Date(year, month, 1);

        return this.events.filter(event => {
            const d = new Date(event.date + 'T00:00:00');
            return d >= prevStart && d < prevEnd;
        });
    }

    return [];
}

getEventDurationHours(event) {
    if (!event.startTime || !event.endTime) return 0;

    const [sh, sm] = event.startTime.split(':').map(Number);
    const [eh, em] = event.endTime.split(':').map(Number);

    const start = sh + sm / 60;
    const end = eh + em / 60;

    return Math.max(0, end - start);
}

getTotalHours(events) {
    return events.reduce((sum, event) => sum + this.getEventDurationHours(event), 0);
}
    //统计渲染
    renderTotalHours(events) {
    const totalHoursEl = document.getElementById('totalHours');
    if (!totalHoursEl) return;

    const total = this.getTotalHours(events);
    totalHoursEl.textContent = `${total.toFixed(1)} 小时`;
}

renderCategoryStats(events) {
    const categoryStatsEl = document.getElementById('categoryStats');
    if (!categoryStatsEl) return;

    const totals = {};
    let totalHours = 0;

    events.forEach(event => {
        const category = event.category || 'business';
        const hours = this.getEventDurationHours(event);
        totals[category] = (totals[category] || 0) + hours;
        totalHours += hours;
    });

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
        categoryStatsEl.innerHTML = '<div class="empty-state">暂无统计数据</div>';
        return;
    }

    categoryStatsEl.innerHTML = entries.map(([category, hours]) => {
        const percent = totalHours > 0 ? (hours / totalHours) * 100 : 0;
        return `
            <div class="category-dist-row">
                <div class="category-dist-left">
                    <span class="category-dist-dot" style="background:${this.categoryColors[category] || '#999'}"></span>
                    <span class="category-dist-name">${this.categoryNames[category] || category}</span>
                </div>
                <div class="category-dist-right">
                    ${hours.toFixed(1)} 小时 <span style="color: var(--text-secondary);">(${percent.toFixed(1)}%)</span>
                </div>
            </div>
        `;
    }).join('');
}


renderCategoryRanking(events, prevEvents) {
    const rankingEl = document.getElementById('categoryRanking');
    if (!rankingEl) return;

    const currentTotals = {};
    const prevTotals = {};
    let totalCurrentHours = 0;

    events.forEach(event => {
        const category = event.category || 'business';
        const hours = this.getEventDurationHours(event);
        currentTotals[category] = (currentTotals[category] || 0) + hours;
        totalCurrentHours += hours;
    });

    prevEvents.forEach(event => {
        const category = event.category || 'business';
        prevTotals[category] = (prevTotals[category] || 0) + this.getEventDurationHours(event);
    });

    const categories = Array.from(new Set([
        ...Object.keys(currentTotals),
        ...Object.keys(prevTotals)
    ]));

    if (!categories.length) {
        rankingEl.innerHTML = '<div class="empty-state">暂无排行数据</div>';
        return;
    }

    const sortedCategories = categories.sort((a, b) => {
        return (currentTotals[b] || 0) - (currentTotals[a] || 0);
    });

    // ===== 左侧：饼图数据 =====
    const pieSegments = [];
    let startDeg = 0;

    sortedCategories.forEach(category => {
        const current = currentTotals[category] || 0;
        const percent = totalCurrentHours > 0 ? (current / totalCurrentHours) * 100 : 0;
        const deg = (percent / 100) * 360;
        const color = this.categoryColors[category] || '#999';

        pieSegments.push(`${color} ${startDeg}deg ${startDeg + deg}deg`);
        startDeg += deg;
    });

    const pieBackground = pieSegments.length
        ? `conic-gradient(${pieSegments.join(', ')})`
        : '#e5e7eb';

    const pieLegend = sortedCategories.map(category => {
        const current = currentTotals[category] || 0;
        const percent = totalCurrentHours > 0 ? (current / totalCurrentHours) * 100 : 0;

        return `
            <div class="pie-legend-item">
                <div class="pie-legend-left">
                    <span class="pie-legend-color" style="background:${this.categoryColors[category] || '#999'}"></span>
                    <span class="pie-legend-name">${this.categoryNames[category] || category}</span>
                </div>
                <div class="pie-legend-right">${percent.toFixed(1)}%</div>
            </div>
        `;
    }).join('');

    // ===== 右侧：柱状图动态 Y 轴 =====
    const maxValue = Math.max(
        0,
        ...sortedCategories.map(cat => currentTotals[cat] || 0),
        ...sortedCategories.map(cat => prevTotals[cat] || 0)
    );

    const yAxisTop = this.getNiceAxisMax(maxValue);
    const yTicks = 4;
    const tickValues = [];
    for (let i = yTicks; i >= 0; i--) {
        tickValues.push((yAxisTop / yTicks) * i);
    }

  const CHART_HEIGHT = 220;

    const chartBars = sortedCategories.map(category => {
        const current = currentTotals[category] || 0;
        const prev = prevTotals[category] || 0;

        const currentHeight = yAxisTop > 0 ? (current / yAxisTop) * CHART_HEIGHT : 0;
        const prevHeight = yAxisTop > 0 ? (prev / yAxisTop) * CHART_HEIGHT : 0;

        return `
            <div class="compare-group">
                <div class="compare-bars">
                    <div class="compare-bar-wrap">
                        <div class="compare-bar current" style="height:${Math.max(currentHeight, current > 0 ? 4 : 0)}px"></div>
                    </div>
                    <div class="compare-bar-wrap">
                        <div class="compare-bar previous" style="height:${Math.max(prevHeight, prev > 0 ? 4 : 0)}px"></div>
                    </div>
                </div>
                <div class="compare-label">${this.categoryNames[category] || category}</div>
            </div>
        `;
    }).join('');

    const yAxisLabels = tickValues.map(v => `
        <div class="compare-y-tick">${this.formatAxisValue(v)}</div>
    `).join('');

    const yAxisGrid = tickValues.map(() => `
        <div class="compare-grid-line"></div>
    `).join('');

    rankingEl.innerHTML = `
        <div class="analytics-compare-wrapper">
            <div class="analytics-compare-title-row">
                <div class="analytics-compare-title">时间占比</div>
                <div class="analytics-compare-title">本期 vs 上期对比</div>
            </div>

            <div class="analytics-compare-content">
                <div class="pie-panel">
                    <div class="pie-chart-wrap">
                        <div class="pie-chart" style="background:${pieBackground};"></div>
                    </div>
                    <div class="pie-legend">
                        ${pieLegend}
                    </div>
                </div>

                <div class="compare-chart-area">
                    <div class="compare-y-axis">
                        <div class="compare-y-axis-label">小时</div>
                        <div class="compare-y-labels">
                            ${yAxisLabels}
                        </div>
                    </div>

                    <div class="compare-chart-main">
                        <div class="compare-grid">
                            ${yAxisGrid}
                        </div>

                        <div class="compare-bars-row">
                            ${chartBars}
                        </div>

                        <div class="compare-legend">
                            <span class="legend-item">
                                <span class="legend-color current"></span>本期
                            </span>
                            <span class="legend-item">
                                <span class="legend-color previous"></span>上期
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

//统计-axis
getNiceAxisMax(maxValue) {
    if (maxValue <= 0) return 4;

    const rough = maxValue * 1.15; // 留一点顶部空间
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / magnitude;

    let niceNormalized;
    if (normalized <= 1) niceNormalized = 1;
    else if (normalized <= 2) niceNormalized = 2;
    else if (normalized <= 2.5) niceNormalized = 2.5;
    else if (normalized <= 5) niceNormalized = 5;
    else niceNormalized = 10;

    return niceNormalized * magnitude;
}

formatAxisValue(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

renderGoalsGantt() {
    const ganttContainer = document.getElementById('ganttContainer');
    const ganttChart = document.getElementById('ganttChart');
    if (!ganttContainer || !ganttChart) return;

    const validGoals = (this.goals || []).filter(goal => goal.startDate && goal.endDate);

    if (!validGoals.length) {
        ganttContainer.style.display = 'none';
        ganttChart.innerHTML = '';
        return;
    }

    ganttContainer.style.display = 'block';

    const starts = validGoals.map(g => new Date(g.startDate).getTime());
    const ends = validGoals.map(g => new Date(g.endDate).getTime());
    const minDate = Math.min(...starts);
    const maxDate = Math.max(...ends);
    const totalSpan = Math.max(1, maxDate - minDate);

    ganttChart.innerHTML = validGoals.map(goal => {
        const start = new Date(goal.startDate).getTime();
        const end = new Date(goal.endDate).getTime();

        const left = ((start - minDate) / totalSpan) * 100;
        const width = Math.max(3, ((end - start) / totalSpan) * 100);
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

        return `
            <div class="gantt-row">
                <div class="gantt-label">
                    <div>${goal.title || '未命名目标'}</div>
                    <div class="gantt-subtitle">${goal.startDate} - ${goal.endDate}</div>
                </div>
                <div class="gantt-track">
                    <div class="gantt-bar" style="left:${left}%; width:${width}%; background:${this.categoryColors[goal.category] || '#4ECDC4'};">
                        ${days}天
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


    //load和save没被定义
    loadEvents() {
        const saved = localStorage.getItem('calendarEvents');
        return saved ? JSON.parse(saved) : [];
    }

    loadGoals() {
        const saved = localStorage.getItem('calendarGoals');
        return saved ? JSON.parse(saved) : [];
    }

    loadTasks() {
        const saved = localStorage.getItem('calendarTasks');
        return saved ? JSON.parse(saved) : [];
    }
}           // ✅ 结束 class

console.log('script loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('dom ready');
    new MyCalendarApp();
});
