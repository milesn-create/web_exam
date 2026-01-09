/**
 * Скрипт для интерактивной карты учебных ресурсов
 */
/* global bootstrap, ymaps */
let map = null;
let placemarks = [];
let clusterer = null;
const YANDEX_MAPS_API_KEY = '0ebc6ed1-4187-4e03-943b-985fc4647252';

// Точки интереса для карты (расширенные данные)
const resourcePoints = [
    {
        id: 1,
        name: 'Библиотека иностранной литературы',
        address: 'Москва, ул. Николоямская, 1',
        type: 'library',
        coordinates: [55.7522, 37.6563],
        description: 'Крупнейшая библиотека иностранной литературы в России с большим выбором учебных материалов',
        hours: 'Пн-Пт: 10:00-20:00, Сб: 12:00-18:00',
        contact: '+7 (495) 915-36-36',
        categories: ['library', 'education']
    },
    {
        id: 2,
        name: 'Языковой центр "Lingua"',
        address: 'Москва, ул. Тверская, 12',
        type: 'language_center',
        coordinates: [55.7572, 37.6083],
        description: 'Курсы иностранных языков для всех уровней, подготовка к экзаменам',
        hours: 'Пн-Вс: 9:00-21:00',
        contact: '+7 (495) 123-45-67',
        categories: ['language_center', 'education', 'courses']
    },
    {
        id: 3,
        name: 'Кафе языкового обмена "Polyglot"',
        address: 'Москва, ул. Арбат, 25',
        type: 'language_cafe',
        coordinates: [55.7494, 37.5937],
        description: 'Место для практики языков в неформальной обстановке, разговорные клубы',
        hours: 'Вт-Вс: 12:00-23:00',
        contact: '+7 (495) 234-56-78',
        categories: ['language_cafe', 'social']
    },
    {
        id: 4,
        name: 'Культурный центр "Диалог культур"',
        address: 'Москва, ул. Новый Арбат, 36',
        type: 'cultural_center',
        coordinates: [55.7520, 37.5837],
        description: 'Культурные мероприятия и языковые клубы, встречи с носителями языков',
        hours: 'Пн-Сб: 10:00-22:00',
        contact: '+7 (495) 345-67-89',
        categories: ['cultural_center', 'education', 'social']
    },
    {
        id: 5,
        name: 'Образовательный центр "Глобус"',
        address: 'Москва, ул. Кузнецкий Мост, 19',
        type: 'education_center',
        coordinates: [55.7631, 37.6225],
        description: 'Курсы и семинары по иностранным языкам, корпоративное обучение',
        hours: 'Пн-Пт: 8:00-20:00, Сб: 10:00-16:00',
        contact: '+7 (495) 456-78-90',
        categories: ['education_center', 'courses']
    },
    {
        id: 6,
        name: 'Частная библиотека "Книжный мир"',
        address: 'Москва, ул. Пятницкая, 18',
        type: 'library',
        coordinates: [55.7412, 37.6275],
        description: 'Библиотека с отделом иностранной литературы, тихие залы для занятий',
        hours: 'Вт-Сб: 11:00-19:00',
        contact: '+7 (495) 567-89-01',
        categories: ['library', 'education']
    },
    {
        id: 7,
        name: 'Языковая школа "Speak Easy"',
        address: 'Москва, ул. Большая Дмитровка, 32',
        type: 'language_school',
        coordinates: [55.7643, 37.6124],
        description: 'Индивидуальные и групповые занятия по языкам, подготовка к IELTS/TOEFL',
        hours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00',
        contact: '+7 (495) 678-90-12',
        categories: ['language_school', 'education', 'courses']
    },
    {
        id: 8,
        name: 'Клуб любителей французского языка',
        address: 'Москва, ул. Малая Бронная, 24',
        type: 'language_club',
        coordinates: [55.7600, 37.6000],
        description: 'Разговорный клуб французского языка, культурные вечера',
        hours: 'Ср, Пт: 18:00-21:00, Сб: 15:00-18:00',
        contact: '+7 (495) 789-01-23',
        categories: ['language_club', 'social']
    },
    {
        id: 9,
        name: 'Центр китайского языка',
        address: 'Москва, ул. Мясницкая, 15',
        type: 'language_center',
        coordinates: [55.7610, 37.6350],
        description: 'Изучение китайского языка и культуры, каллиграфия',
        hours: 'Пн-Пт: 10:00-19:00, Сб: 11:00-16:00',
        contact: '+7 (495) 890-12-34',
        categories: ['language_center', 'education', 'courses']
    },
    {
        id: 10,
        name: 'Английский разговорный клуб',
        address: 'Москва, Страстной бульвар, 12',
        type: 'language_club',
        coordinates: [55.7660, 37.6100],
        description: 'Еженедельные встречи для практики английского с носителями',
        hours: 'Вт, Чт: 19:00-22:00',
        contact: '+7 (495) 901-23-45',
        categories: ['language_club', 'social']
    }
];

// Инициализация карты при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли элемент карты на странице
    if (document.getElementById('map')) {
        // Ждем загрузки API Яндекс.Карт
        if (typeof ymaps === 'undefined') {
            // Загружаем API, если еще не загружено
            const script = document.createElement('script');
            script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
            script.type = 'text/javascript';
            script.onload = initMap;
            document.head.appendChild(script);
        } else {
            initMap();
        }
    }
});

/**
 * Инициализирует Яндекс.Карту
 */
function initMap() {
    ymaps.ready(function() {
        // Создаем карту
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423], // Центр Москвы
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
        });
        
        // Создаем кластеризатор
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130
        });
        
        // Добавляем точки на карту
        addResourcePoints();
        
        // Создаем панель фильтров
        createFilterPanel();
        
        console.log('Карта успешно инициализирована');
    });
}

/**
 * Добавляет точки ресурсов на карту
 */
function addResourcePoints(filterType = 'all') {
    if (!map || !clusterer) {return;}
    
    // Очищаем кластеризатор
    clusterer.removeAll();
    placemarks = [];
    
    // Фильтруем точки по типу
    const filteredPoints = filterType === 'all' 
        ? resourcePoints 
        : resourcePoints.filter(point => 
            point.categories.includes(filterType) || point.type === filterType
        );
    
    // Создаем метки для каждой точки
    filteredPoints.forEach(point => {
        const placemark = new ymaps.Placemark(
            point.coordinates,
            {
                balloonContentHeader: `<strong>${point.name}</strong>`,
                balloonContentBody: `
                    <div class="map-balloon">
                        <p><strong>Адрес:</strong> ${point.address}</p>
                        <p><strong>Часы работы:</strong> ${point.hours}</p>
                        <p><strong>Телефон:</strong> ${point.contact}</p>
                        <p><strong>Описание:</strong> ${point.description}</p>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-primary details-btn" 
                                    data-point-id="${point.id}">
                                <i class="fas fa-info-circle"></i> Подробнее
                            </button>
                        </div>
                    </div>
                `,
                hintContent: point.name
            },
            {
                iconColor: getColorByType(point.type),
                preset: getPresetByType(point.type),
                balloonCloseButton: true
            }
        );
        
        // Сохраняем данные точки в свойствах метки
        placemark.properties.set('pointData', point);
        
        placemarks.push(placemark);
        clusterer.add(placemark);
    });
    
    // Добавляем кластеризатор на карту
    map.geoObjects.add(clusterer);
    
    // Добавляем обработчик для кнопок "Подробнее"
    map.balloon.events.add('open', function(event) {
        setTimeout(() => {
            const detailsBtn = document.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', function() {
                    const pointId = parseInt(this.getAttribute('data-point-id'));
                    showPointDetails(pointId);
                });
            }
        }, 100);
    });
    
    // Если точки есть, центрируем карту на них
    if (filteredPoints.length > 0) {
        const bounds = clusterer.getBounds();
        if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true });
        }
    }
}

/**
 * Создает панель фильтров для карты
 */
function createFilterPanel() {
    const mapContainer = document.querySelector('#resources .card-body');
    if (!mapContainer) {return;}
    
    // Удаляем старую панель фильтров, если есть
    const oldPanel = document.querySelector('.map-controls');
    if (oldPanel) {
        oldPanel.remove();
    }
    
    // Создаем панель фильтров
    const panel = document.createElement('div');
    panel.className = 'map-controls mb-3';
    panel.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body p-3">
                <h6 class="card-title mb-3">
                    <i class="fas fa-filter me-2"></i>Фильтр ресурсов
                </h6>
                <div class="row g-2">
                    <div class="col-md-6">
                        <label class="form-label">Категория ресурса</label>
                        <select class="form-select" id="resource-type-filter">
                            <option value="all">Все категории</option>
                            <option value="library">Библиотеки</option>
                            <option value="language_center">Языковые центры</option>
                            <option value="language_school">Языковые школы</option>
                            <option value="language_cafe">Языковые кафе</option>
                            <option value="language_club">Языковые клубы</option>
                            <option value="cultural_center">Культурные центры</option>
                            <option value="education_center">Образовательные центры</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Поиск по названию</label>
                        <input type="text" class="form-control" id="resource-search" 
                               placeholder="Введите название...">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <div class="d-grid gap-2 w-100">
                            <button class="btn btn-primary" id="apply-filters">
                                <i class="fas fa-search me-1"></i>Применить
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="form-text">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            На карте отмечены библиотеки, языковые центры, кафе и клубы для языковой практики
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    mapContainer.insertBefore(panel, mapContainer.firstChild);
    
    // Добавляем обработчики событий
    panel.querySelector('#apply-filters').addEventListener('click', applyFilters);
    panel.querySelector('#resource-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

/**
 * Применяет фильтры к карте
 */
function applyFilters() {
    const typeFilter = document.getElementById('resource-type-filter').value;
    const searchFilter = document.getElementById('resource-search').value.toLowerCase().trim();
    
    // Сначала фильтруем по типу
    addResourcePoints(typeFilter);
    
    // Затем фильтруем по поисковому запросу
    if (searchFilter) {
        setTimeout(() => {
            const filteredPlacemarks = placemarks.filter(placemark => {
                const pointData = placemark.properties.get('pointData');
                return pointData.name.toLowerCase().includes(searchFilter) ||
                       pointData.description.toLowerCase().includes(searchFilter);
            });
            
            // Обновляем кластеризатор с отфильтрованными метками
            clusterer.removeAll();
            filteredPlacemarks.forEach(placemark => {
                clusterer.add(placemark);
            });
            
            // Центрируем карту на оставшихся метках
            if (filteredPlacemarks.length > 0) {
                const bounds = clusterer.getBounds();
                if (bounds) {
                    map.setBounds(bounds, { checkZoomRange: true });
                }
            }
        }, 100);
    }
}

/**
 * Показывает детальную информацию о точке
 */
function showPointDetails(pointId) {
    const point = resourcePoints.find(p => p.id === pointId);
    if (!point) {return;}
    
    // Закрываем текущий балун
    map.balloon.close();
    
    // Создаем модальное окно с деталями
    let detailsModal = document.getElementById('pointDetailsModal');
    
    if (!detailsModal) {
        detailsModal = document.createElement('div');
        detailsModal.id = 'pointDetailsModal';
        detailsModal.className = 'modal fade';
        detailsModal.tabindex = '-1';
        document.body.appendChild(detailsModal);
    }
    
    // Определяем тип ресурса для отображения
    const typeName = getTypeName(point.type);
    const typeColor = getColorByType(point.type);
    
    detailsModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header" style="background-color: ${typeColor}; color: white;">
                    <h5 class="modal-title">
                        <i class="fas ${getIconByType(point.type)} me-2"></i>
                        ${point.name}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>Основная информация</h6>
                            <p><strong>Тип:</strong> ${typeName}</p>
                            <p><strong>Адрес:</strong> ${point.address}</p>
                            <p><strong>Часы работы:</strong> ${point.hours}</p>
                            <p><strong>Контакт:</strong> ${point.contact}</p>
                            
                            <h6 class="mt-4">Описание</h6>
                            <p>${point.description}</p>
                            
                            <h6 class="mt-4">Категории</h6>
                            <div>
                                ${point.categories.map(cat => 
        `<span class="badge bg-secondary me-1">${getCategoryName(cat)}</span>`
    ).join('')}
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">На карте</h6>
                                    <div id="mini-map" style="height: 200px; width: 100%; border-radius: 4px;"></div>
                                    <div class="mt-3 text-center">
                                        <button class="btn btn-sm btn-outline-primary" onclick="showOnMap(${pointId})">
                                            <i class="fas fa-map-marker-alt me-1"></i>Показать на карте
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                </div>
            </div>
        </div>
    `;
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(detailsModal);
    modal.show();
    
    // Инициализируем мини-карту
    setTimeout(() => {
        initMiniMap(point);
    }, 300);
}

/**
 * Инициализирует мини-карту в модальном окне
 */
function initMiniMap(point) {
    if (typeof ymaps === 'undefined') {return;}
    
    ymaps.ready(function() {
        const miniMap = new ymaps.Map('mini-map', {
            center: point.coordinates,
            zoom: 15,
            controls: []
        });
        
        const placemark = new ymaps.Placemark(
            point.coordinates,
            {
                hintContent: point.name
            },
            {
                iconColor: getColorByType(point.type),
                preset: getPresetByType(point.type)
            }
        );
        
        miniMap.geoObjects.add(placemark);
    });
}

/**
 * Показывает точку на основной карте
 */
function showOnMap(pointId) {
    const point = resourcePoints.find(p => p.id === pointId);
    if (!point || !map) {return;}
    
    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('pointDetailsModal'));
    if (modal) {
        modal.hide();
    }
    
    // Центрируем карту на точке
    map.setCenter(point.coordinates, 16);
    
    // Открываем балун точки
    const targetPlacemark = placemarks.find(pm => 
        pm.properties.get('pointData').id === pointId
    );
    
    if (targetPlacemark) {
        targetPlacemark.balloon.open();
    }
}

/**
 * Получает цвет иконки по типу ресурса
 */
function getColorByType(type) {
    const colors = {
        'library': 'blue',
        'language_school': 'green',
        'language_center': 'violet',
        'language_cafe': 'orange',
        'language_club': 'yellow',
        'cultural_center': 'red',
        'education_center': 'darkblue'
    };
    
    return colors[type] || 'grey';
}

/**
 * Получает пресет иконки по типу ресурса
 */
function getPresetByType(type) {
    const presets = {
        'library': 'islands#libraryIcon',
        'language_school': 'islands#educationIcon',
        'language_center': 'islands#governmentIcon',
        'language_cafe': 'islands#cafeIcon',
        'language_club': 'islands#homeIcon',
        'cultural_center': 'islands#theaterIcon',
        'education_center': 'islands#classroomIcon'
    };
    
    return presets[type] || 'islands#dotIcon';
}

/**
 * Получает иконку по типу ресурса
 */
function getIconByType(type) {
    const icons = {
        'library': 'fa-book',
        'language_school': 'fa-graduation-cap',
        'language_center': 'fa-university',
        'language_cafe': 'fa-coffee',
        'language_club': 'fa-users',
        'cultural_center': 'fa-monument',
        'education_center': 'fa-school'
    };
    
    return icons[type] || 'fa-map-marker-alt';
}

/**
 * Получает читаемое название типа ресурса
 */
function getTypeName(type) {
    const names = {
        'library': 'Библиотека',
        'language_school': 'Языковая школа',
        'language_center': 'Языковой центр',
        'language_cafe': 'Языковое кафе',
        'language_club': 'Языковой клуб',
        'cultural_center': 'Культурный центр',
        'education_center': 'Образовательный центр'
    };
    
    return names[type] || 'Ресурс';
}

/**
 * Получает читаемое название категории
 */
function getCategoryName(category) {
    const names = {
        'library': 'Библиотека',
        'education': 'Образование',
        'courses': 'Курсы',
        'social': 'Общение',
        'language_center': 'Языковой центр',
        'language_school': 'Языковая школа',
        'language_cafe': 'Языковое кафе',
        'language_club': 'Языковой клуб',
        'cultural_center': 'Культурный центр',
        'education_center': 'Образовательный центр'
    };
    
    return names[category] || category;
}

// Экспортируем функции для глобального доступа
window.showOnMap = showOnMap;
window.showPointDetails = showPointDetails;