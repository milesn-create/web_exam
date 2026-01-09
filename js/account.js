/**
 * Скрипт для страницы личного кабинета
 */
/* global apiService, bootstrap */

let userOrders = [];
let currentOrderPage = 1;
const ordersPerPage = 5;
let orderToDelete = null;
let originalOrderForEdit = null; // Храним оригинальную заявку для расчета цены

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadUserOrders();
        initAccountEventListeners();
        displayOrders();
        
    } catch (error) {
        showNotification('Ошибка при загрузке заявок: ' + error.message, 'danger');
        console.error('Ошибка инициализации личного кабинета:', error);
    }
});

/**
 * Загружает заявки пользователя
 */
async function loadUserOrders() {
    try {
        showLoading(true);
        userOrders = await apiService.getOrders();
        console.log('Загружено заявок:', userOrders.length);
        showLoading(false);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        throw error;
    }
}

/**
 * Инициализирует обработчики событий для личного кабинета
 */
function initAccountEventListeners() {
    // Подтверждение удаления
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteOrder);
    }
    
    // Создание новой заявки
    const newOrderBtn = document.querySelector('[data-bs-target="#orderModal"]');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

/**
 * Отображает заявки пользователя с пагинацией
 */
function displayOrders() {
    const tableBody = document.getElementById('orders-table');
    if (!tableBody) {return;}
    
    tableBody.innerHTML = '';
    
    if (!userOrders || userOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        У вас пока нет заявок. <a href="index.html" class="alert-link">Создайте первую заявку</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Рассчитываем пагинацию
    const totalPages = Math.ceil(userOrders.length / ordersPerPage);
    const startIndex = (currentOrderPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = userOrders.slice(startIndex, endIndex);
    
    // Отображаем заявки
    paginatedOrders.forEach((order, index) => {
        const row = createOrderRow(order, startIndex + index + 1);
        if (row) {
            tableBody.appendChild(row);
        }
    });
    
    // Обновляем пагинацию
    updateOrdersPagination(totalPages);
}

/**
 * Создает строку таблицы для заявки
 */
function createOrderRow(order, orderNumber) {
    if (!order) {return null;}
    
    const row = document.createElement('tr');
    
    // Определяем тип и название
    let type = 'Неизвестно';
    let name = 'Неизвестно';
    
    if (order.course_id) {
        type = 'Курс';
        name = `Курс #${order.course_id}`;
    } else if (order.tutor_id) {
        type = 'Репетитор';
        name = `Репетитор #${order.tutor_id}`;
    }
    
    // Форматируем дату и время
    const formattedDate = order.date_start ? apiService.formatDate(order.date_start) : 'Не указана';
    const formattedTime = order.time_start ? apiService.formatTime(order.time_start) : 'Не указано';
    
    // Создаем HTML строки
    row.innerHTML = `
        <td>${orderNumber}</td>
        <td>${type}</td>
        <td>${name}</td>
        <td>${formattedDate}</td>
        <td>${formattedTime}</td>
        <td>${order.persons || 0}</td>
        <td>${order.price || 0} руб.</td>
        <td>
            <span class="badge bg-success">Активна</span>
        </td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info view-order-btn" 
                        data-order-id="${order.id}" title="Подробнее">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-warning edit-order-btn" 
                        data-order-id="${order.id}" title="Изменить">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger delete-order-btn" 
                        data-order-id="${order.id}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Добавляем обработчики для кнопок действий
    const viewBtn = row.querySelector('.view-order-btn');
    const editBtn = row.querySelector('.edit-order-btn');
    const deleteBtn = row.querySelector('.delete-order-btn');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            viewOrderDetails(order.id);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            editOrder(order.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            confirmDeleteOrder(order.id);
        });
    }
    
    return row;
}

/**
 * Просматривает детали заявки
 */
async function viewOrderDetails(orderId) {
    try {
        const order = await apiService.getOrder(orderId);
        const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
        const detailsContainer = document.getElementById('order-details');
        
        if (!detailsContainer) {return;}
        
        // Определяем дополнительные опции
        const options = [];
        if (order.early_registration) {options.push('Ранняя регистрация (-10%)');}
        if (order.group_enrollment) {options.push('Групповая запись (-15%)');}
        if (order.intensive_course) {options.push('Интенсивный курс (+20%)');}
        if (order.supplementary) {options.push('Доп. материалы (+2000 руб/студент)');}
        if (order.personalized) {options.push('Индивидуальные занятия (+1500 руб/неделя)');}
        if (order.excursions) {options.push('Культурные экскурсии (+25%)');}
        if (order.assessment) {options.push('Оценка уровня (+300 руб)');}
        if (order.interactive) {options.push('Интерактивная платформа (+50%)');}
        
        // Форматируем дату создания
        let formattedCreatedAt = 'Не указана';
        if (order.created_at) {
            try {
                const createdAt = new Date(order.created_at);
                formattedCreatedAt = createdAt.toLocaleString('ru-RU');
            } catch (error) {
                formattedCreatedAt = order.created_at;
            }
        }
        
        // Создаем HTML для деталей
        detailsContainer.innerHTML = `
            <div class="order-details">
                <h6>Основная информация</h6>
                <p><strong>ID заявки:</strong> ${order.id || 'Не указан'}</p>
                <p><strong>Тип:</strong> ${order.course_id ? 'Курс' : 'Репетитор'}</p>
                <p><strong>ID курса/репетитора:</strong> ${order.course_id || order.tutor_id || 'Не указан'}</p>
                <p><strong>Дата начала:</strong> ${order.date_start ? apiService.formatDate(order.date_start) : 'Не указана'}</p>
                <p><strong>Время начала:</strong> ${order.time_start ? apiService.formatTime(order.time_start) : 'Не указано'}</p>
                <p><strong>Продолжительность:</strong> ${order.duration || 0} часов</p>
                <p><strong>Количество студентов:</strong> ${order.persons || 0}</p>
                <p><strong>Общая стоимость:</strong> ${order.price || 0} руб.</p>
                
                <h6 class="mt-3">Дополнительные опции</h6>
                ${options.length > 0 
        ? `<ul class="list-unstyled">${options.map(opt => `<li>${opt}</li>`).join('')}</ul>`
        : '<p class="text-muted">Нет дополнительных опций</p>'
}
                
                <h6 class="mt-3">Метаданные</h6>
                <p><strong>ID студента:</strong> ${order.student_id || 'Не указан'}</p>
                <p><strong>Создана:</strong> ${formattedCreatedAt}</p>
                ${order.updated_at ? 
        `<p><strong>Обновлена:</strong> ${new Date(order.updated_at).toLocaleString('ru-RU')}</p>` 
        : ''
}
            </div>
        `;
        
        detailsModal.show();
        
    } catch (error) {
        console.error('Ошибка при получении деталей заявки:', error);
        showNotification('Ошибка при загрузке деталей заявки: ' + error.message, 'danger');
    }
}

/**
 * Редактирует заявку (в модальном окне личного кабинета)
 */
async function editOrder(orderId) {
    try {
        // Получаем данные заявки
        const order = await apiService.getOrder(orderId);
        originalOrderForEdit = order; // Сохраняем для расчета цены
        
        // Открываем модальное окно редактирования
        openEditModal(order);
        
    } catch (error) {
        console.error('Ошибка при редактировании заявки:', error);
        showNotification('Ошибка при редактировании заявки: ' + error.message, 'danger');
    }
}

/**
 * Открывает модальное окно редактирования заявки
 */
function openEditModal(order) {
    // Создаем или находим модальное окно редактирования
    let editModal = document.getElementById('editOrderModal');
    
    if (!editModal) {
        // Создаем модальное окно, если его нет
        editModal = document.createElement('div');
        editModal.id = 'editOrderModal';
        editModal.className = 'modal fade';
        editModal.tabindex = '-1';
        editModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">Редактирование заявки #${order.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editOrderForm">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Тип заявки</label>
                                    <select class="form-select" id="editOrderType" disabled>
                                        <option value="course" ${order.course_id ? 'selected' : ''}>Курс</option>
                                        <option value="tutor" ${order.tutor_id ? 'selected' : ''}>Репетитор</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">ID курса/репетитора</label>
                                    <input type="text" class="form-control" id="editItemId" 
                                           value="${order.course_id || order.tutor_id}" readonly>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Дата начала</label>
                                    <input type="date" class="form-control" id="editDateStart" 
                                           value="${order.date_start}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Время начала</label>
                                    <input type="time" class="form-control" id="editTimeStart" 
                                           value="${order.time_start}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Количество студентов</label>
                                    <input type="number" class="form-control" id="editPersons" 
                                           min="1" max="20" value="${order.persons}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Продолжительность (часов)</label>
                                    <input type="number" class="form-control" id="editDuration" 
                                           min="1" max="40" value="${order.duration}" required>
                                </div>
                                
                                <!-- Дополнительные опции -->
                                <div class="col-12">
                                    <h6>Дополнительные опции</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editEarlyRegistration" ${order.early_registration ? 'checked' : ''}>
                                                <label class="form-check-label" for="editEarlyRegistration">
                                                    Ранняя регистрация (-10%)
                                                </label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editGroupEnrollment" ${order.group_enrollment ? 'checked' : ''}>
                                                <label class="form-check-label" for="editGroupEnrollment">
                                                    Групповая запись (-15%)
                                                </label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editIntensiveCourse" ${order.intensive_course ? 'checked' : ''}>
                                                <label class="form-check-label" for="editIntensiveCourse">
                                                    Интенсивный курс (+20%)
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editSupplementary" ${order.supplementary ? 'checked' : ''}>
                                                <label class="form-check-label" for="editSupplementary">
                                                    Доп. материалы (+2000 руб/студент)
                                                </label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editPersonalized" ${order.personalized ? 'checked' : ''}>
                                                <label class="form-check-label" for="editPersonalized">
                                                    Индивидуальные занятия (+1500 руб/неделя)
                                                </label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editExcursions" ${order.excursions ? 'checked' : ''}>
                                                <label class="form-check-label" for="editExcursions">
                                                    Культурные экскурсии (+25%)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row mt-2">
                                        <div class="col-md-6">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editAssessment" ${order.assessment ? 'checked' : ''}>
                                                <label class="form-check-label" for="editAssessment">
                                                    Оценка уровня (+300 руб)
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="editInteractive" ${order.interactive ? 'checked' : ''}>
                                                <label class="form-check-label" for="editInteractive">
                                                    Интерактивная платформа (+50%)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-12">
                                    <div class="alert alert-info">
                                        <h6>Текущая стоимость: <span id="originalPrice">${order.price || 0}</span> руб.</h6>
                                        <h6 class="mt-2">Новая стоимость: <span id="calculatedPrice">${order.price || 0}</span> руб.</h6>
                                        <small class="text-muted">Стоимость будет пересчитана при сохранении</small>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-warning" id="saveEditOrder" 
                                data-order-id="${order.id}">Сохранить изменения</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(editModal);
        
        // Добавляем обработчик сохранения
        const saveBtn = document.getElementById('saveEditOrder');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveEditedOrder);
        }
        
        // Добавляем обработчики для пересчета стоимости при изменении полей
        const inputsToWatch = ['editDateStart', 'editTimeStart', 'editDuration', 'editPersons',
            'editEarlyRegistration', 'editGroupEnrollment', 'editIntensiveCourse',
            'editSupplementary', 'editPersonalized', 'editExcursions',
            'editAssessment', 'editInteractive'];
        
        inputsToWatch.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('change', updateCalculatedPrice);
                element.addEventListener('input', updateCalculatedPrice);
            }
        });
        
        // Инициализируем расчет стоимости
        updateCalculatedPrice();
    } else {
        // Обновляем существующее модальное окно
        editModal.querySelector('.modal-title').textContent = `Редактирование заявки #${order.id}`;
        editModal.querySelector('#editOrderType').value = order.course_id ? 'course' : 'tutor';
        editModal.querySelector('#editItemId').value = order.course_id || order.tutor_id;
        editModal.querySelector('#editDateStart').value = order.date_start || '';
        editModal.querySelector('#editTimeStart').value = order.time_start || '';
        editModal.querySelector('#editPersons').value = order.persons || 1;
        editModal.querySelector('#editDuration').value = order.duration || 1;
        editModal.querySelector('#editEarlyRegistration').checked = order.early_registration || false;
        editModal.querySelector('#editGroupEnrollment').checked = order.group_enrollment || false;
        editModal.querySelector('#editIntensiveCourse').checked = order.intensive_course || false;
        editModal.querySelector('#editSupplementary').checked = order.supplementary || false;
        editModal.querySelector('#editPersonalized').checked = order.personalized || false;
        editModal.querySelector('#editExcursions').checked = order.excursions || false;
        editModal.querySelector('#editAssessment').checked = order.assessment || false;
        editModal.querySelector('#editInteractive').checked = order.interactive || false;
        editModal.querySelector('#originalPrice').textContent = order.price || 0;
        
        const saveBtn = editModal.querySelector('#saveEditOrder');
        if (saveBtn) {
            saveBtn.setAttribute('data-order-id', order.id);
        }
        
        // Обновляем расчет стоимости
        updateCalculatedPrice();
    }
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(editModal);
    modal.show();
}

/**
 * Обновляет отображение рассчитанной стоимости
 */
async function updateCalculatedPrice() {
    if (!originalOrderForEdit) {return;}
    
    try {
        const newPrice = await calculateOrderPrice(originalOrderForEdit);
        const priceElement = document.getElementById('calculatedPrice');
        if (priceElement) {
            priceElement.textContent = newPrice;
        }
    } catch (error) {
        console.error('Ошибка при обновлении стоимости:', error);
    }
}

/**
 * Сохраняет отредактированную заявку с пересчетом стоимости
 */
async function saveEditedOrder() {
    const orderId = this.getAttribute('data-order-id');
    
    try {
        // Рассчитываем новую стоимость (теперь функция асинхронная)
        const newPrice = await calculateOrderPrice(originalOrderForEdit);
        
        // Получаем значения опций из формы
        const earlyRegistration = document.getElementById('editEarlyRegistration')?.checked || false;
        const groupEnrollment = document.getElementById('editGroupEnrollment')?.checked || false;
        const intensiveCourse = document.getElementById('editIntensiveCourse')?.checked || false;
        const supplementary = document.getElementById('editSupplementary')?.checked || false;
        const personalized = document.getElementById('editPersonalized')?.checked || false;
        const excursions = document.getElementById('editExcursions')?.checked || false;
        const assessment = document.getElementById('editAssessment')?.checked || false;
        const interactive = document.getElementById('editInteractive')?.checked || false;
        
        // Собираем данные формы
        const orderData = {
            date_start: document.getElementById('editDateStart').value,
            time_start: document.getElementById('editTimeStart').value,
            duration: parseInt(document.getElementById('editDuration').value) || originalOrderForEdit.duration,
            persons: parseInt(document.getElementById('editPersons').value) || originalOrderForEdit.persons,
            price: newPrice,
            early_registration: earlyRegistration,
            group_enrollment: groupEnrollment,
            intensive_course: intensiveCourse,
            supplementary: supplementary,
            personalized: personalized,
            excursions: excursions,
            assessment: assessment,
            interactive: interactive
        };
        
        // Проверяем обязательные поля
        if (!orderData.date_start || !orderData.time_start) {
            showNotification('Пожалуйста, заполните дату и время начала', 'warning');
            return;
        }
        
        console.log('Отправляю обновление заявки:', orderData);
        console.log('Стоимость до: ', originalOrderForEdit.price, 'Стоимость после: ', newPrice);
        
        // Отправляем запрос на обновление
        const result = await apiService.updateOrder(orderId, orderData);
        
        // Закрываем модальное окно
        const modalElement = document.getElementById('editOrderModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        // Обновляем данные в таблице
        await loadUserOrders();
        displayOrders();
        
        showNotification('Заявка успешно обновлена. Новая стоимость: ' + newPrice + ' руб.', 'success');
        
        // Очищаем сохраненную заявку
        originalOrderForEdit = null;
        
    } catch (error) {
        console.error('Ошибка при сохранении изменений:', error);
        showNotification('Ошибка при сохранении: ' + error.message, 'danger');
    }
}

/**
 * Рассчитывает стоимость заявки на основе оригинальной стоимости
 */
/**
 * Рассчитывает стоимость заявки на основе оригинальной стоимости
 */
async function calculateOrderPrice(originalOrder) {
    if (!originalOrder) {return originalOrder.price || 0;}
    
    try {
        // Получаем информацию о курсе для расчета недель
        let courseData = null;
        if (originalOrder.course_id) {
            try {
                // Пытаемся получить данные курса из API
                courseData = await apiService.getCourse(originalOrder.course_id);
            } catch (error) {
                console.warn('Не удалось получить данные курса:', error);
            }
        }
        
        // Получаем значения из формы
        const dateStart = document.getElementById('editDateStart')?.value || originalOrder.date_start;
        const timeStart = document.getElementById('editTimeStart')?.value || originalOrder.time_start;
        const duration = parseInt(document.getElementById('editDuration')?.value) || originalOrder.duration;
        const persons = parseInt(document.getElementById('editPersons')?.value) || originalOrder.persons;
        
        // Получаем текущие значения опций из формы
        const currentOptions = {
            earlyRegistration: document.getElementById('editEarlyRegistration')?.checked || false,
            groupEnrollment: document.getElementById('editGroupEnrollment')?.checked || false,
            intensiveCourse: document.getElementById('editIntensiveCourse')?.checked || false,
            supplementary: document.getElementById('editSupplementary')?.checked || false,
            personalized: document.getElementById('editPersonalized')?.checked || false,
            excursions: document.getElementById('editExcursions')?.checked || false,
            assessment: document.getElementById('editAssessment')?.checked || false,
            interactive: document.getElementById('editInteractive')?.checked || false
        };
        
        // Исходные опции из заявки
        const originalOptions = {
            earlyRegistration: originalOrder.early_registration || false,
            groupEnrollment: originalOrder.group_enrollment || false,
            intensiveCourse: originalOrder.intensive_course || false,
            supplementary: originalOrder.supplementary || false,
            personalized: originalOrder.personalized || false,
            excursions: originalOrder.excursions || false,
            assessment: originalOrder.assessment || false,
            interactive: originalOrder.interactive || false
        };
        
        // Начинаем с базовой стоимости
        let basePrice = originalOrder.price || 0;
        
        // Вычитаем стоимость всех оригинальных опций
        if (originalOptions.earlyRegistration) {
            basePrice /= 0.9; // Убираем скидку 10%
        }
        
        if (originalOptions.groupEnrollment && originalOrder.persons >= 5) {
            basePrice /= 0.85; // Убираем скидку 15%
        }
        
        if (originalOptions.intensiveCourse) {
            basePrice /= 1.2; // Убираем надбавку 20%
        }
        
        if (originalOptions.supplementary) {
            basePrice -= 2000 * originalOrder.persons; // Убираем стоимость материалов
        }
        
        if (originalOptions.personalized) {
            // Правильно рассчитываем недели на основе данных курса
            let originalWeeks = 1;
            if (courseData && courseData.total_length) {
                // Используем продолжительность курса в неделях
                originalWeeks = courseData.total_length;
            } else {
                // Если данных нет, предполагаем стандартную продолжительность
                originalWeeks = Math.ceil(originalOrder.duration / 2); // 2 часа в неделю по умолчанию
            }
            basePrice -= 1500 * originalWeeks; // Убираем стоимость индивидуальных занятий
        }
        
        if (originalOptions.excursions) {
            basePrice /= 1.25; // Убираем надбавку 25%
        }
        
        if (originalOptions.assessment) {
            basePrice -= 300; // Убираем стоимость оценки
        }
        
        if (originalOptions.interactive) {
            basePrice /= 1.5; // Убираем надбавку 50%
        }
        
        // Убираем корректировки за дату/время из оригинальной стоимости
        if (originalOrder.date_start && originalOrder.time_start) {
            const originalDate = new Date(originalOrder.date_start);
            const originalDay = originalDate.getDay();
            const wasWeekend = originalDay === 0 || originalDay === 6;
            
            if (wasWeekend) {
                basePrice /= 1.5; // Убираем надбавку за выходные
            }
            
            const [originalHours, originalMinutes] = (originalOrder.time_start || '').split(':').map(Number);
            const originalTime = originalHours + originalMinutes / 60;
            
            // Утренние занятия (9:00-12:00)
            if (originalTime >= 9 && originalTime < 12) {
                basePrice -= 400 * originalOrder.persons * originalOrder.duration;
            }
            
            // Вечерние занятия (18:00-20:00)
            if (originalTime >= 18 && originalTime < 20) {
                basePrice -= 1000 * originalOrder.persons * originalOrder.duration;
            }
        }
        
        // Теперь basePrice - это базовая стоимость без опций и корректировок
        // Теперь применяем новые параметры и опции
        
        let newPrice = basePrice;
        
        // Корректируем по изменению продолжительности и количества студентов
        newPrice = newPrice * (duration / originalOrder.duration) * (persons / originalOrder.persons);
        
        // Применяем корректировки по новой дате/времени
        if (dateStart && timeStart) {
            const newDate = new Date(dateStart);
            const newDay = newDate.getDay();
            const isWeekend = newDay === 0 || newDay === 6;
            
            if (isWeekend) {
                newPrice *= 1.5; // Надбавка за выходные
            }
            
            const [newHours, newMinutes] = timeStart.split(':').map(Number);
            const newTime = newHours + newMinutes / 60;
            
            // Утренние занятия (9:00-12:00)
            if (newTime >= 9 && newTime < 12) {
                newPrice += 400 * persons * duration;
            }
            
            // Вечерние занятия (18:00-20:00)
            if (newTime >= 18 && newTime < 20) {
                newPrice += 1000 * persons * duration;
            }
        }
        
        // Применяем новые опции
        if (currentOptions.earlyRegistration) {
            newPrice *= 0.9; // Скидка 10%
        }
        
        if (currentOptions.groupEnrollment && persons >= 5) {
            newPrice *= 0.85; // Скидка 15%
        }
        
        if (currentOptions.intensiveCourse) {
            newPrice *= 1.2; // Надбавка 20%
        }
        
        if (currentOptions.supplementary) {
            newPrice += 2000 * persons; // Материалы
        }
        
        if (currentOptions.personalized) {
            // Правильно рассчитываем недели
            let weeks = 1;
            if (courseData && courseData.total_length) {
                // Используем продолжительность курса в неделях
                weeks = courseData.total_length;
            } else {
                // Если данных нет, рассчитываем по продолжительности в часах
                // Предполагаем стандартный курс: 2 часа в неделю
                weeks = Math.ceil(duration / 2);
            }
            newPrice += 1500 * weeks; // Индивидуальные занятия
        }
        
        if (currentOptions.excursions) {
            newPrice *= 1.25; // Надбавка 25%
        }
        
        if (currentOptions.assessment) {
            newPrice += 300; // Оценка уровня
        }
        
        if (currentOptions.interactive) {
            newPrice *= 1.5; // Надбавка 50%
        }
        
        // Округляем до целого числа
        return Math.round(Math.max(0, newPrice));
        
    } catch (error) {
        console.error('Ошибка при расчете стоимости:', error);
        // В случае ошибки возвращаем оригинальную стоимость
        return originalOrder.price || 0;
    }
}

/**
 * Подтверждает удаление заявки
 */
function confirmDeleteOrder(orderId) {
    orderToDelete = orderId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

/**
 * Удаляет заявку
 */
async function deleteOrder() {
    if (!orderToDelete) {return;}
    
    try {
        // Отправляем запрос на удаление
        await apiService.deleteOrder(orderToDelete);
        
        // Удаляем заявку из локального массива
        userOrders = userOrders.filter(order => order.id !== orderToDelete);
        
        // Закрываем модальное окно
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (deleteModal) {deleteModal.hide();}
        
        // Обновляем отображение
        displayOrders();
        
        // Показываем уведомление
        showNotification('Заявка успешно удалена', 'success');
        
        // Сбрасываем переменную
        orderToDelete = null;
        
    } catch (error) {
        console.error('Ошибка при удалении заявки:', error);
        showNotification('Ошибка при удалении заявки: ' + error.message, 'danger');
    }
}

/**
 * Обновляет пагинацию для заявок
 */
function updateOrdersPagination(totalPages) {
    const pagination = document.getElementById('orders-pagination');
    if (!pagination || totalPages <= 1) {return;}
    
    pagination.innerHTML = '';
    
    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentOrderPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = '<a class="page-link" href="#">Назад</a>';
    prevLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentOrderPage > 1) {
            currentOrderPage--;
            displayOrders();
        }
    });
    pagination.appendChild(prevLi);
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentOrderPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentOrderPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function(e) {
            e.preventDefault();
            currentOrderPage = i;
            displayOrders();
        });
        pagination.appendChild(li);
    }
    
    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentOrderPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = '<a class="page-link" href="#">Вперед</a>';
    nextLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentOrderPage < totalPages) {
            currentOrderPage++;
            displayOrders();
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
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationArea.appendChild(notification);
    
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