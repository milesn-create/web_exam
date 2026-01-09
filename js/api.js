/**
 * Модуль для работы с API языковой школы
 */

const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'fdb746ba-4802-46af-9f21-10ccd05a1b63';

class ApiService {
    constructor() {
        this.apiKey = API_KEY;
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Создает URL с API ключом
     */
    buildUrl(endpoint) {
        const separator = endpoint.includes('?') ? '&' : '?';
        return `${this.baseUrl}${endpoint}${separator}api_key=${this.apiKey}`;
    }

    /**
     * Обрабатывает ответ API
     */
    async handleResponse(response) {
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `HTTP error! status: ${response.status}`;
            } catch (e) {
                errorText = `HTTP error! status: ${response.status}`;
            }
            throw new Error(errorText);
        }
        return response.json();
    }

    /**
     * Получает список курсов
     */
    async getCourses() {
        try {
            const url = this.buildUrl('/api/courses');
            console.log('Запрашиваю курсы по URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('Ошибка при получении курсов:', error);
            throw new Error('Не удалось загрузить курсы. Проверьте подключение к API.');
        }
    }

    /**
     * Получает список репетиторов
     */
    async getTutors() {
        try {
            const url = this.buildUrl('/api/tutors');
            console.log('Запрашиваю репетиторов по URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('Ошибка при получении репетиторов:', error);
            throw new Error('Не удалось загрузить репетиторов. Проверьте подключение к API.');
        }
    }

    /**
     * Получает список заявок пользователя
     */
    async getOrders() {
        try {
            const url = this.buildUrl('/api/orders');
            console.log('Запрашиваю заявки по URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('Ошибка при получении заявок:', error);
            throw new Error('Не удалось загрузить заявки. Проверьте подключение к API.');
        }
    }

    /**
     * Получает информацию о конкретном курсе
     */
    async getCourse(courseId) {
        try {
            const response = await fetch(this.buildUrl(`/api/courses/${courseId}`));
            return this.handleResponse(response);
        } catch (error) {
            console.error('Ошибка при получении курса:', error);
            throw error;
        }
    }

    /**
     * Получает информацию о конкретном репетиторе
     */
    async getTutor(tutorId) {
        try {
            const response = await fetch(this.buildUrl(`/api/tutors/${tutorId}`));
            return this.handleResponse(response);
        } catch (error) {
            console.error('Ошибка при получении репетитора:', error);
            throw error;
        }
    }

    /**
     * Получает информацию о конкретной заявке
     */
    async getOrder(orderId) {
        try {
            const response = await fetch(this.buildUrl(`/api/orders/${orderId}`));
            return this.handleResponse(response);
        } catch (error) {
            console.error('Ошибка при получении заявки:', error);
            throw error;
        }
    }

    /**
     * Создает новую заявку
     */
    async createOrder(orderData) {
        try {
            const url = this.buildUrl('/api/orders');
            console.log('Создаю заявку по URL:', url, 'Данные:', orderData);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            throw error;
        }
    }

    /**
     * Обновляет существующую заявку
     */
    async updateOrder(orderId, orderData) {
        try {
            const response = await fetch(this.buildUrl(`/api/orders/${orderId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Ошибка при обновлении заявки:', error);
            throw error;
        }
    }

    /**
     * Удаляет заявку
     */
    async deleteOrder(orderId) {
        try {
            const response = await fetch(this.buildUrl(`/api/orders/${orderId}`), {
                method: 'DELETE'
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Ошибка при удалении заявки:', error);
            throw error;
        }
    }

    /**
     * Фильтрует репетиторов по критериям
     */
    filterTutors(tutors, filters) {
        if (!tutors || !Array.isArray(tutors)) {return [];}
        
        return tutors.filter(tutor => {
            // Фильтр по языку
            if (filters.language && filters.language !== '') {
                if (!tutor.languages_offered || !tutor.languages_offered.includes(filters.language)) {
                    return false;
                }
            }

            // Фильтр по уровню
            if (filters.level && filters.level !== '') {
                if (tutor.language_level !== filters.level) {
                    return false;
                }
            }

            // Фильтр по опыту
            if (filters.experience && filters.experience !== '') {
                const experience = tutor.work_experience || 0;
                switch (filters.experience) {
                case '1-3':
                    if (experience < 1 || experience > 3) {return false;}
                    break;
                case '4-7':
                    if (experience < 4 || experience > 7) {return false;}
                    break;
                case '8+':
                    if (experience < 8) {return false;}
                    break;
                }
            }

            return true;
        });
    }

    /**
     * Фильтрует курсы по критериям
     */
    filterCourses(courses, filters) {
        if (!courses || !Array.isArray(courses)) {return [];}
        
        return courses.filter(course => {
            // Фильтр по названию
            if (filters.name && filters.name !== '') {
                if (!course.name || !course.name.toLowerCase().includes(filters.name.toLowerCase())) {
                    return false;
                }
            }

            // Фильтр по уровню
            if (filters.level && filters.level !== '') {
                if (course.level !== filters.level) {
                    return false;
                }
            }

            return true;
        });
    }
    /**
* Рассчитывает стоимость заявки
*/
    calculatePrice(orderData, objectData = null, isCourse = false) {
        console.log('РАСЧЕТ СТОИМОСТИ:', { orderData, objectData, isCourse });
    
        // Определяем базовую цену за час
        let basePricePerHour = 0;
    
        if (isCourse && objectData && objectData.course_fee_per_hour) {
        // Это курс
            basePricePerHour = objectData.course_fee_per_hour;
            console.log('Курс: цена за час =', basePricePerHour, 'руб (из API)');
        } else if (!isCourse && objectData && objectData.price_per_hour) {
        // Это репетитор
            basePricePerHour = objectData.price_per_hour;
            console.log('Репетитор: цена за час =', basePricePerHour, 'руб (из API)');
        } else {
        // Резервные значения если данных нет
            basePricePerHour = isCourse ? 200 : 500;
            console.log('Использую резервную цену:', basePricePerHour, 'руб/час');
        }
    
        // Длительность в часах
        const duration = orderData.duration || 1;
        const persons = orderData.persons || 1;
    
        // Базовая стоимость (цена за час × длительность × количество студентов)
        let total = basePricePerHour * duration * persons;
        console.log('Базовая стоимость:', basePricePerHour, '*', duration, '*', persons, '=', total, 'руб');
    
        // Проверяем выходной день
        let isWeekend = false;
        if (orderData.date_start) {
            try {
                const startDate = new Date(orderData.date_start);
                const dayOfWeek = startDate.getDay();
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
                if (isWeekend) {
                    total *= 1.5; // Надбавка за выходные 50%
                    console.log('Выходной день: +50%');
                }
            } catch (error) {
                console.error('Ошибка проверки даты:', error);
            }
        }
    
        // Доплаты за время суток
        if (orderData.time_start) {
            try {
                const hour = parseInt(orderData.time_start.split(':')[0]);
            
                if (hour >= 9 && hour < 12) {
                    total += 400 * persons * duration; // Утренняя доплата
                    console.log('Утреннее время 9-12: +400 руб ×', persons, '×', duration, '=', 400 * persons * duration, 'руб');
                } else if (hour >= 18 && hour < 20) {
                    total += 1000 * persons * duration; // Вечерняя доплата
                    console.log('Вечернее время 18-20: +1000 руб ×', persons, '×', duration, '=', 1000 * persons * duration, 'руб');
                }
            } catch (error) {
                console.error('Ошибка проверки времени:', error);
            }
        }
    
        console.log('С учетом количества студентов:', persons, 'чел, текущая сумма:', total);
    
        // Применяем скидки и надбавки
    
        // Ранняя регистрация
        if (orderData.early_registration) {
            total *= 0.9; // -10%
            console.log('Ранняя регистрация: -10%');
        }

        // Групповая запись (скидка применяется только если 5+ студентов)
        if (orderData.group_enrollment && persons >= 5) {
            total *= 0.85; // -15%
            console.log('Групповая запись (5+ студентов): -15%');
        }

        // Интенсивный курс
        if (orderData.intensive_course) {
            total *= 1.2; // +20%
            console.log('Интенсивный курс: +20%');
        }

        // Дополнительные материалы
        if (orderData.supplementary) {
            total += 2000 * persons; // +2000 руб за каждого студента
            console.log('Доп. материалы: +', 2000 * persons, 'руб');
        }

        // Индивидуальные занятия
        if (orderData.personalized) {
        // Рассчитываем недели
            let weeks = 1;
            if (isCourse && objectData && objectData.total_length) {
                weeks = objectData.total_length;
                console.log('Курс: продолжительность', weeks, 'недель (из API)');
            } else {
            // Для репетитора рассчитываем по часам (предполагаем 4 часа в неделю)
                weeks = Math.ceil(duration / 4);
                console.log('Репетитор: предполагаем', weeks, 'недель (из расчета', duration, 'часов)');
            }
            total += 1500 * weeks * persons; // Индивидуальные занятия для каждого студента
            console.log('Индивидуальные занятия: +', 1500 * weeks * persons, 'руб за', weeks, 'недель ×', persons, 'студентов');
        }

        // Культурные экскурсии
        if (orderData.excursions) {
            total *= 1.25; // +25%
            console.log('Культурные экскурсии: +25%');
        }

        // Оценка уровня
        if (orderData.assessment) {
            total += 300 * persons; // +300 руб за каждого студента
            console.log('Оценка уровня: +', 300 * persons, 'руб');
        }

        // Интерактивная платформа
        if (orderData.interactive) {
            total *= 1.5; // +50%
            console.log('Интерактивная платформа: +50%');
        }
    
        // Финальное округление
        const finalPrice = Math.round(Math.max(0, total));
        console.log('Итоговая стоимость:', finalPrice, 'руб');
        console.log('---');
    
        return finalPrice;
    }

    /**
     * Форматирует дату для отображения
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Форматирует время для отображения
     */
    formatTime(timeString) {
        if (!timeString) {return '';}
        return timeString.substring(0, 5);
    }
}

// Экспортируем экземпляр API сервиса
const apiService = new ApiService();