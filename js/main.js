/**
 * Основной скрипт для главной страницы
 */
/* global apiService, bootstrap */

let allCourses = [];
let allTutors = [];
let currentPage = 1;
const itemsPerPage = 5;
let selectedCourse = null;
let selectedTutor = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadData();
        initFilters();
        initEventListeners();
        displayCourses();
        displayTutors();
        
    } catch (error) {
        showNotification('Ошибка при загрузке данных: ' + error.message, 'danger');
        console.error('Ошибка инициализации:', error);
    }
});

/**
 * Загружает данные с API
 */
async function loadData() {
    try {
        showLoading(true);
        
        // Параллельная загрузка курсов и репетиторов
        [allCourses, allTutors] = await Promise.all([
            apiService.getCourses(),
            apiService.getTutors()
        ]);
        
        console.log('Загружено курсов:', allCourses.length);
        console.log('Загружено репетиторов:', allTutors.length);
        
        if (allCourses.length === 0) {
            showNotification('Курсы не найдены в базе данных', 'warning');
        }
        
        if (allTutors.length === 0) {
            showNotification('Репетиторы не найдены в базе данных', 'warning');
        }
        
        showNotification('Данные успешно загружены', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных: ' + error.message, 'danger');
        throw error;
    } finally {
        showLoading(false);
    }
}

/**
 * Инициализирует фильтры
 */
function initFilters() {
    const languageSelect = document.getElementById('tutor-language');
    
    if (!languageSelect || !allTutors) {return;}
    
    // Собираем уникальные языки из репетиторов
    const languages = new Set();
    allTutors.forEach(tutor => {
        if (tutor.languages_offered && Array.isArray(tutor.languages_offered)) {
            tutor.languages_offered.forEach(lang => languages.add(lang));
        }
    });
    
    // Добавляем варианты в select
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });
}

/**
 * Инициализирует обработчики событий
 */
function initEventListeners() {
    // Поиск курсов
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const filters = {
                name: document.getElementById('searchName').value,
                level: document.getElementById('searchLevel').value
            };
            displayCourses(filters);
        });
    }
    
    // Поиск репетиторов
    const tutorLanguage = document.getElementById('tutor-language');
    const tutorLevel = document.getElementById('tutor-level');
    const tutorExperience = document.getElementById('tutor-experience');
    
    if (tutorLanguage) {tutorLanguage.addEventListener('change', filterTutors);}
    if (tutorLevel) {tutorLevel.addEventListener('change', filterTutors);}
    if (tutorExperience) {tutorExperience.addEventListener('change', filterTutors);}
    
    // Оформление заявки
    const submitOrderBtn = document.getElementById('submitOrder');
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', submitOrder);
    }
    
    // Расчет стоимости
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('change', calculateTotalPrice);
        orderForm.addEventListener('input', calculateTotalPrice);
    }
    
    // Изменение даты для репетитора
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            const orderType = document.getElementById('orderType');
            if (orderType && orderType.value === 'tutor') {
                // Для репетитора всегда доступны все времена
                const timeSelect = document.getElementById('startTime');
                if (timeSelect) {
                    timeSelect.disabled = false;
                }
            }
        });
    }
}

/**
 * Отображает курсы с фильтрацией и пагинацией
 */
function displayCourses(filters = {}) {
    const container = document.getElementById('courses-container');
    if (!container) {return;}
    
    container.innerHTML = '';
    
    // Применяем фильтры
    let filteredCourses = apiService.filterCourses(allCourses, filters);
    
    // Проверяем, есть ли данные
    if (!filteredCourses || filteredCourses.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ${allCourses.length === 0 ? 'Курсы не найдены в базе данных' : 'По вашему запросу курсы не найдены'}
                </div>
            </div>
        `;
        return;
    }
    
    // Рассчитываем пагинацию
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
    
    // Отображаем курсы
    paginatedCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        if (courseCard) {
            container.appendChild(courseCard);
        }
    });
    
    // Обновляем пагинацию
    updatePagination('courses-pagination', totalPages, function(page) {
        currentPage = page;
        displayCourses(filters);
    });
}

/**
 * Создает карточку курса
 */
function createCourseCard(course) {
    if (!course) {return null;}
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in';
    
    // Безопасное получение данных
    const courseName = course.name || 'Без названия';
    const description = course.description ? 
        (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) 
        : 'Описание отсутствует';
    const teacher = course.teacher || 'Преподаватель не указан';
    const level = course.level || 'Не указан';
    const totalLength = course.total_length || 0;
    const weekLength = course.week_length || 0;
    const feePerHour = course.course_fee_per_hour || 0;
    
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">${courseName}</h5>
            </div>
            <div class="card-body">
                <p class="card-text">${description}</p>
                <p><strong>Преподаватель:</strong> ${teacher}</p>
                <p><strong>Уровень:</strong> ${level}</p>
                <p><strong>Длительность:</strong> ${totalLength} недель</p>
                <p><strong>Часов в неделю:</strong> ${weekLength}</p>
                <p><strong>Стоимость за час:</strong> ${feePerHour} руб.</p>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-primary w-100 order-course-btn" 
                        data-course-id="${course.id}"
                        data-course-name="${courseName}">
                    <i class="fas fa-book me-2"></i>Записаться на курс
                </button>
            </div>
        </div>
    `;
    
    // Добавляем обработчик для кнопки заказа
    const orderBtn = col.querySelector('.order-course-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            selectedCourse = course;
            selectedTutor = null;
            openOrderModal('course', courseName);
        });
    }
    
    return col;
}

/**
 * Фильтрует и отображает репетиторов
 */
function filterTutors() {
    const filters = {
        language: document.getElementById('tutor-language').value,
        level: document.getElementById('tutor-level').value,
        experience: document.getElementById('tutor-experience').value
    };
    
    const filteredTutors = apiService.filterTutors(allTutors, filters);
    displayTutors(filteredTutors);
}

/**
 * Отображает репетиторов
 */
function displayTutors(tutors = allTutors) {
    const container = document.getElementById('tutors-container');
    if (!container) {return;}
    
    container.innerHTML = '';
    
    if (!tutors || tutors.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ${allTutors.length === 0 ? 'Репетиторы не найдены в базе данных' : 'По вашему запросу репетиторы не найдены'}
                </div>
            </div>
        `;
        return;
    }
    
    tutors.forEach(tutor => {
        const tutorCard = createTutorCard(tutor);
        if (tutorCard) {
            container.appendChild(tutorCard);
        }
    });
}

/**
 * Создает карточку репетитора
 */
function createTutorCard(tutor) {
    if (!tutor) {return null;}
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in';
    
    // Безопасное получение данных
    const tutorName = tutor.name || 'Имя не указано';
    const experience = tutor.work_experience || 0;
    const languagesOffered = tutor.languages_offered ? tutor.languages_offered.join(', ') : 'Не указаны';
    const level = tutor.language_level || 'Не указан';
    const price = tutor.price_per_hour || 0;
    const languagesSpoken = tutor.languages_spoken ? tutor.languages_spoken.join(', ') : 'Не указаны';
    
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <div class="text-center mb-3">
                    <div class="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center" 
                         style="width: 80px; height: 80px;">
                        <i class="fas fa-user text-white fa-2x"></i>
                    </div>
                </div>
                <h5 class="card-title text-center">${tutorName}</h5>
                <p class="card-text"><strong>Опыт:</strong> ${experience} лет</p>
                <p class="card-text"><strong>Языки обучения:</strong> ${languagesOffered}</p>
                <p class="card-text"><strong>Уровень:</strong> ${level}</p>
                <p class="card-text"><strong>Ставка:</strong> ${price} руб./час</p>
                <p class="card-text"><small class="text-muted">Говорит на: ${languagesSpoken}</small></p>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-success w-100 order-tutor-btn"
                        data-tutor-id="${tutor.id}"
                        data-tutor-name="${tutorName}">
                    <i class="fas fa-user-graduate me-2"></i>Выбрать репетитора
                </button>
            </div>
        </div>
    `;
    
    // Добавляем обработчик для кнопки выбора
    const orderBtn = col.querySelector('.order-tutor-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            selectedTutor = tutor;
            selectedCourse = null;
            openOrderModal('tutor', tutorName);
        });
    }
    
    return col;
}

/**
 * Открывает модальное окно оформления заявки
 */
/**
 * Открывает модальное окно оформления заявки
 */
function openOrderModal(type, name) {
    const modalElement = document.getElementById('orderModal');
    if (!modalElement) {return;}
    
    console.log('Открываю модальное окно для:', type, name);
    console.log('selectedCourse:', selectedCourse);
    console.log('selectedTutor:', selectedTutor);
    
    const modal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('orderForm');
    
    // Сбрасываем форму
    if (form) {form.reset();}
    
    // Заполняем базовые данные
    const orderType = document.getElementById('orderType');
    const selectedItem = document.getElementById('selectedItem');
    
    if (orderType) {
        orderType.value = type;
        console.log('orderType установлен:', type);
    }
    
    if (selectedItem) {
        selectedItem.value = name;
        console.log('selectedItem установлен:', name);
    }
    
    // Устанавливаем минимальную дату (сегодня)
    const startDate = document.getElementById('startDate');
    if (startDate) {
        const today = new Date().toISOString().split('T')[0];
        startDate.min = today;
        startDate.value = today;
        console.log('Дата установлена на сегодня:', today);
    }
    
    // Очищаем выбор времени и сразу заполняем
    const timeSelect = document.getElementById('startTime');
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="">Выберите время</option>';
        timeSelect.disabled = false;
        console.log('Время очищено и активировано');
    }
    
    // Заполняем данные в зависимости от типа
    if (type === 'course' && selectedCourse) {
        console.log('Загружаю данные курса:', selectedCourse.name);
        loadCourseData(selectedCourse);
    } else if (type === 'tutor' && selectedTutor) {
        console.log('Загружаю данные репетитора:', selectedTutor.name);
        loadTutorData(selectedTutor);
    } else {
        console.error('Не найден выбранный курс или репетитор');
        showNotification('Ошибка: не найден выбранный элемент', 'danger');
        return;
    }
    
    // Показываем модальное окно
    modal.show();
    
    // Пересчитываем стоимость через небольшой таймаут, чтобы форма успела отрисоваться
    setTimeout(() => {
        calculateTotalPrice();
    }, 300);
}

/**
 * Загружает данные для курса
 */
function loadCourseData(course) {
    const startDate = document.getElementById('startDate');
    const timeSelect = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    
    if (!startDate || !timeSelect || !durationInput) {return;}
    
    // Очищаем время
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = true;
    
    // Устанавливаем продолжительность курса
    const totalHours = (course.total_length || 0) * (course.week_length || 0);
    durationInput.value = totalHours || 1;
    durationInput.readOnly = true;
    durationInput.title = 'Продолжительность курса фиксирована';
    
    // Если есть даты начала курса из API
    if (course.start_dates && course.start_dates.length > 0) {
        // Собираем уникальные даты
        const uniqueDates = new Set();
        
        course.start_dates.forEach(dateStr => {
            try {
                const date = new Date(dateStr);
                const dateOnly = date.toISOString().split('T')[0];
                uniqueDates.add(dateOnly);
            } catch (error) {
                console.error('Ошибка обработки даты:', error);
            }
        });
        
        // Заполняем select датами
        startDate.innerHTML = '<option value="">Выберите дату начала</option>';
        uniqueDates.forEach(dateStr => {
            const option = document.createElement('option');
            option.value = dateStr;
            
            // Форматируем дату для отображения
            try {
                const date = new Date(dateStr);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                option.textContent = formattedDate;
            } catch (error) {
                option.textContent = dateStr;
            }
            
            startDate.appendChild(option);
        });
        
        // Обработчик изменения даты
        startDate.addEventListener('change', function() {
            populateCourseTimes(course, this.value);
        });
        
        // Если есть хотя бы одна дата, выбираем первую и заполняем время
        if (Array.from(uniqueDates).length > 0) {
            const firstDate = Array.from(uniqueDates)[0];
            startDate.value = firstDate;
            populateCourseTimes(course, firstDate);
        }
    } else {
        // Если дат нет в API
        startDate.innerHTML = '<option value="">Нет доступных дат</option>';
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        timeSelect.disabled = true;
    }
}

/**
 * Заполняет времена для курса
 */
function populateCourseTimes(course, selectedDate) {
    const timeSelect = document.getElementById('startTime');
    if (!timeSelect) {return;}
    
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = false;
    
    if (!selectedDate || !course.start_dates) {
        timeSelect.innerHTML = '<option value="">Нет доступного времени</option>';
        timeSelect.disabled = true;
        return;
    }
    
    // Фильтруем времена для выбранной даты
    const timesForDate = course.start_dates.filter(dateStr => {
        try {
            const date = new Date(dateStr);
            const dateOnly = date.toISOString().split('T')[0];
            return dateOnly === selectedDate;
        } catch (error) {
            return false;
        }
    });
    
    if (timesForDate.length === 0) {
        timeSelect.innerHTML = '<option value="">Нет доступного времени</option>';
        timeSelect.disabled = true;
        return;
    }
    
    // Добавляем варианты времени
    timesForDate.forEach(dateStr => {
        try {
            const date = new Date(dateStr);
            const timeStr = date.toTimeString().substring(0, 5); // HH:MM
            
            // Рассчитываем время окончания
            const courseHours = course.week_length || 2;
            const endTime = new Date(date.getTime() + (courseHours * 60 * 60 * 1000));
            const endTimeStr = endTime.toTimeString().substring(0, 5);
            
            const option = document.createElement('option');
            option.value = timeStr;
            option.textContent = `${timeStr} - ${endTimeStr} (${courseHours} ч.)`;
            option.title = `Начало: ${timeStr}, окончание: ${endTimeStr}`;
            timeSelect.appendChild(option);
        } catch (error) {
            console.error('Ошибка обработки времени:', error);
        }
    });
}
function loadTutorData(tutor) {
    const startDate = document.getElementById('startDate');
    const timeSelect = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    
    if (!startDate || !timeSelect || !durationInput) {return;}
    
    // Сначала заполняем временные слоты ДО очистки даты
    populateTutorTimeSlots();
    
    // Очищаем и настраиваем выбор времени
    timeSelect.disabled = false;
    
    // Устанавливаем настройки продолжительности
    durationInput.value = 1;
    durationInput.readOnly = false;
    durationInput.min = 1;
    durationInput.max = 40;
    durationInput.title = 'Выберите продолжительность занятий (1-40 часов)';
    
    // Заполняем даты (любая дата начиная с сегодня)
    startDate.innerHTML = '';
    const today = new Date();
    
    // Добавляем даты на ближайшие 14 дней
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dateStr = date.toISOString().split('T')[0];
        const option = document.createElement('option');
        option.value = dateStr;
        
        const formattedDate = date.toLocaleDateString('ru-RU', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        option.textContent = i === 0 ? `Сегодня (${formattedDate})` : formattedDate;
        startDate.appendChild(option);
    }
    
    // Обработчик изменения даты
    startDate.addEventListener('change', function() {
        // Для репетитора время всегда доступно
        timeSelect.disabled = false;
        // При изменении даты пересчитываем стоимость
        calculateTotalPrice();
    });
    
    // Также пересчитываем стоимость при изменении времени
    timeSelect.addEventListener('change', function() {
        calculateTotalPrice();
        
        // Показываем уведомление о доплатах
        const selectedTime = this.value;
        if (selectedTime) {
            const hour = parseInt(selectedTime.split(':')[0]);
            if (hour >= 9 && hour < 12) {
                showNotification('Выбрано утреннее время: применяется доплата +400 руб', 'warning');
            } else if (hour >= 18 && hour < 20) {
                showNotification('Выбрано вечернее время: применяется доплата +1000 руб', 'warning');
            }
        }
    });
}

/**
 * Заполняет временные слоты для репетитора
 */
function populateTutorTimeSlots() {
    const timeSelect = document.getElementById('startTime');
    if (!timeSelect) {return;}
    
    // Очищаем только если есть варианты
    if (timeSelect.options.length > 1) {
        timeSelect.innerHTML = '<option value="">Выберите время</option>';
    }
    
    // Рабочие часы репетитора (с 8:00 до 20:00)
    const timeSlots = [
        { time: '08:00', hour: 8, surcharge: 0, label: '08:00 (без доплат)' },
        { time: '09:00', hour: 9, surcharge: 400, label: '09:00 (+400 руб)' },
        { time: '10:00', hour: 10, surcharge: 400, label: '10:00 (+400 руб)' },
        { time: '11:00', hour: 11, surcharge: 400, label: '11:00 (+400 руб)' },
        { time: '12:00', hour: 12, surcharge: 0, label: '12:00 (без доплат)' },
        { time: '13:00', hour: 13, surcharge: 0, label: '13:00 (без доплат)' },
        { time: '14:00', hour: 14, surcharge: 0, label: '14:00 (без доплат)' },
        { time: '15:00', hour: 15, surcharge: 0, label: '15:00 (без доплат)' },
        { time: '16:00', hour: 16, surcharge: 0, label: '16:00 (без доплат)' },
        { time: '17:00', hour: 17, surcharge: 0, label: '17:00 (без доплат)' },
        { time: '18:00', hour: 18, surcharge: 1000, label: '18:00 (+1000 руб)' },
        { time: '19:00', hour: 19, surcharge: 1000, label: '19:00 (+1000 руб)' },
        { time: '20:00', hour: 20, surcharge: 0, label: '20:00 (без доплат)' }
    ];
    
    // Добавляем слоты (если еще не добавлены)
    if (timeSelect.options.length <= 1) {
        timeSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.label;
            
            // Добавляем подсказку
            let tooltip = '';
            if (slot.surcharge === 400) {
                tooltip = 'Утреннее занятие: доплата 400 руб за занятие';
            } else if (slot.surcharge === 1000) {
                tooltip = 'Вечернее занятие: доплата 1000 руб за занятие';
            } else {
                tooltip = 'Стандартное время: без доплат';
            }
            
            option.title = tooltip;
            timeSelect.appendChild(option);
        });
    }
    
    // Активируем выбор времени
    timeSelect.disabled = false;
}
/**
 * Рассчитывает общую стоимость заявки
 */
function calculateTotalPrice() {
    try {
        console.log('=== НАЧАЛО РАСЧЕТА СТОИМОСТИ ===');
        
        const totalPriceElement = document.getElementById('totalPrice');
        if (!totalPriceElement) {
            console.error('Элемент totalPrice не найден');
            return;
        }
        
        // Получаем значения из формы
        const startDate = document.getElementById('startDate');
        const startTime = document.getElementById('startTime');
        const studentsCount = document.getElementById('studentsCount');
        const duration = document.getElementById('duration');
        
        if (!startDate || !startTime || !studentsCount || !duration) {
            console.error('Не найдены элементы формы');
            totalPriceElement.textContent = '0';
            return;
        }
        
        if (!startDate.value || !startTime.value || !studentsCount.value || !duration.value) {
            console.log('Не все поля формы заполнены');
            totalPriceElement.textContent = '0';
            return;
        }
        
        console.log('Выбран курс:', selectedCourse);
        console.log('Выбран репетитор:', selectedTutor);
        
        // Определяем данные в зависимости от выбора
        let calculationData = null;
        let isCourse = false;
        
        if (selectedCourse) {
            calculationData = selectedCourse;
            isCourse = true;
            console.log('Использую данные курса:', selectedCourse.name);
        } else if (selectedTutor) {
            calculationData = selectedTutor;
            isCourse = false;
            console.log('Использую данные репетитора:', selectedTutor.name);
        } else {
            console.error('Не выбран ни курс, ни репетитор');
            totalPriceElement.textContent = '0';
            
            // Обновляем информацию в модальном окне
            const basePriceInfo = document.getElementById('basePriceInfo');
            const selectedType = document.getElementById('selectedType');
            if (basePriceInfo) {basePriceInfo.textContent = 'Не выбрано';}
            if (selectedType) {selectedType.textContent = 'Не выбран';}
            
            return;
        }
        
        // Обновляем информацию в модальном окне
        const basePriceInfo = document.getElementById('basePriceInfo');
        const selectedType = document.getElementById('selectedType');
        if (basePriceInfo) {
            if (isCourse) {
                basePriceInfo.textContent = `${calculationData.course_fee_per_hour || 0} руб/час`;
            } else {
                basePriceInfo.textContent = `${calculationData.price_per_hour || 0} руб/час`;
            }
        }
        if (selectedType) {selectedType.textContent = isCourse ? 'Курс' : 'Репетитор';}
        
        // Собираем данные для расчета
        const formData = {
            date_start: startDate.value,
            time_start: startTime.value,
            duration: parseInt(duration.value) || 1,
            persons: parseInt(studentsCount.value) || 1,
            early_registration: document.getElementById('earlyRegistration')?.checked || false,
            group_enrollment: document.getElementById('groupEnrollment')?.checked || false,
            intensive_course: document.getElementById('intensiveCourse')?.checked || false,
            supplementary: document.getElementById('supplementary')?.checked || false,
            personalized: document.getElementById('personalized')?.checked || false,
            excursions: document.getElementById('excursions')?.checked || false,
            assessment: document.getElementById('assessment')?.checked || false,
            interactive: document.getElementById('interactive')?.checked || false,
            course_id: selectedCourse ? selectedCourse.id : null,
            tutor_id: selectedTutor ? selectedTutor.id : null
        };
        
        console.log('Данные для расчета:', formData);
        console.log('Данные объекта:', calculationData);
        
        // Рассчитываем стоимость, передавая данные репетитора/курса
        const totalPrice = apiService.calculatePrice(formData, calculationData, isCourse);
        
        console.log('Рассчитанная стоимость:', totalPrice, 'руб');
        totalPriceElement.textContent = totalPrice;
        
        // Показываем уведомление о выходных
        try {
            const date = new Date(startDate.value);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            const notification = document.getElementById('weekend-notification');
            if (notification) {
                if (isWeekend) {
                    notification.style.display = 'block';
                    notification.textContent = 'Внимание: выбрана дата на выходной день. Применяется надбавка +50%';
                } else {
                    notification.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Ошибка проверки даты:', error);
        }
        
        console.log('=== КОНЕЦ РАСЧЕТА СТОИМОСТИ ===');
        
    } catch (error) {
        console.error('Ошибка расчета стоимости:', error);
        const totalPriceElement = document.getElementById('totalPrice');
        if (totalPriceElement) {
            totalPriceElement.textContent = 'Ошибка';
        }
    }
}

/**
 * Отправляет заявку
 */
async function submitOrder() {
    try {
        const form = document.getElementById('orderForm');
        if (!form) {return;}
        
        // Проверяем валидность формы
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
            return;
        }
        
        // Проверяем, что выбран либо курс, либо репетитор
        if (!selectedCourse && !selectedTutor) {
            showNotification('Пожалуйста, выберите курс или репетитора', 'warning');
            return;
        }
        
        // Собираем данные формы
        const orderData = {
            course_id: selectedCourse ? selectedCourse.id : null,
            tutor_id: selectedTutor ? selectedTutor.id : null,
            date_start: document.getElementById('startDate').value,
            time_start: document.getElementById('startTime').value,
            duration: parseInt(document.getElementById('duration').value) || 1,
            persons: parseInt(document.getElementById('studentsCount').value) || 1,
            price: parseInt(document.getElementById('totalPrice').textContent) || 0,
            early_registration: document.getElementById('earlyRegistration')?.checked || false,
            group_enrollment: document.getElementById('groupEnrollment')?.checked || false,
            intensive_course: document.getElementById('intensiveCourse')?.checked || false,
            supplementary: document.getElementById('supplementary')?.checked || false,
            personalized: document.getElementById('personalized')?.checked || false,
            excursions: document.getElementById('excursions')?.checked || false,
            assessment: document.getElementById('assessment')?.checked || false,
            interactive: document.getElementById('interactive')?.checked || false
        };
        
        console.log('Отправляю заявку:', orderData);
        
        // Отправляем заявку
        const result = await apiService.createOrder(orderData);
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        if (modal) {modal.hide();}
        
        // Показываем уведомление об успехе
        showNotification('Заявка успешно создана! ID: ' + result.id, 'success');
        
        // Сбрасываем форму и выбор
        form.reset();
        form.classList.remove('was-validated');
        selectedCourse = null;
        selectedTutor = null;
        
    } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        showNotification('Ошибка при создании заявки: ' + error.message, 'danger');
    }
}

/**
 * Обновляет пагинацию
 */
function updatePagination(paginationId, totalPages, onPageChange) {
    const pagination = document.getElementById(paginationId);
    if (!pagination || totalPages <= 1) {return;}
    
    pagination.innerHTML = '';
    
    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = '<a class="page-link" href="#">Назад</a>';
    prevLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    });
    pagination.appendChild(prevLi);
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function(e) {
            e.preventDefault();
            onPageChange(i);
        });
        pagination.appendChild(li);
    }
    
    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = '<a class="page-link" href="#">Вперед</a>';
    nextLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    });
    pagination.appendChild(nextLi);
}

/**
 * Показывает уведомление
 */
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {return;}
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Добавляем уведомление
    notificationArea.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Показывает/скрывает индикатор загрузки
 */
function showLoading(show) {
    let spinner = document.getElementById('loading-spinner');
    
    if (show) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'loading-spinner';
            spinner.className = 'spinner-container';
            spinner.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
            `;
            document.querySelector('main').prepend(spinner);
        }
    } else if (spinner) {
        spinner.remove();
    }
}