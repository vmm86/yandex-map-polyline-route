// Как только будет загружен API и готов DOM, выполняем инициализацию
ymaps.ready(init);

function init() {
    // Создание экземпляра карты с привязкой к контейнеру "map"
    var myMap = new ymaps.Map('map', {
        center: [50.8527,40.8664],
        zoom: 8,
        controls: ['zoomControl']
    });

    // Создание элемента управления "Пробки"
    var trafficControl = new ymaps.control.TrafficControl({
            state: {
            //// Отображение пробок "Сейчас"
            providerKey: 'traffic#actual',
            //// Начинаем сразу показывать пробки на карте.
            trafficShown: true
            }
        }
    );
    // Добавление элемента управления на карту
    myMap.controls.add(trafficControl);
    // Получение ссылки на провайдер пробок "Сейчас" и включение показа инфоточек
    trafficControl.getProvider('traffic#actual').state.set('infoLayerShown', true);

    // Заготовка будущего маршрута
    window.polyline = new ymaps.Polyline(
        [], 
        {
            hintContent: "Маршрут"
        }, 
        {
            draggable: false,
            strokeColor: '#359BEE',
            strokeWidth: 5
        }
    );
    // Добавление будущего маршрута на карту
    myMap.geoObjects.add(polyline);

    // Создание пустой коллекции транзитных точек
    var routeMidPointsCollection = new ymaps.GeoObjectCollection(null, {
        preset: 'islands#darkGreenCircleIcon',
        draggable: false
    });
    // Добавление транзитных точек в коллекцию
    for (item in routeMidPoints) {
        routeMidPointsCollection.add( new ymaps.Placemark(routeMidPoints[item], { hintContent: item } ) );
    }
    // Добавление коллекции транзитных точек на карту
    myMap.geoObjects.add(routeMidPointsCollection);

    // Создание пустой коллекции конечных точек
    var routeEndPointsCollection = new ymaps.GeoObjectCollection(null, {
        preset: 'islands#redCircleIcon',
        draggable: false
    });
    // Добавление конечных точек в коллекцию
    for (item in routeEndPoints) {
        routeEndPointsCollection.add( new ymaps.Placemark(routeEndPoints[item], { hintContent: item } ) );
    }
    // Добавление коллекции конечных точек на карту
    myMap.geoObjects.add(routeEndPointsCollection);

    // Работа с транзитными точками при создании маршрута
    routeMidPointsCollection.events.add('click', function (e) {
        e.get('target').options.set('preset', 'islands#darkGreenCircleDotIcon');

        // Кординаты кликнутой транзитной точки
        var newPointCoords = e.get('target').geometry._coordinates;
        // console.log(newPointCoords);

        var routePoints   = document.getElementById('routePoints');
        var newChildPoint = document.createElement('li');

        // Добавление координат кликнутой транзитной точки в полилинию, а её подписи - в список routePoints
        //// Точка не будет дублироваться в маршруте, если она совпадает с предыдущей
        if ( polyline.geometry.get(polyline.geometry.getLength() - 1) !== newPointCoords) {
            for (item in routeMidPoints) {
                if ( newPointCoords == routeMidPoints[item] ) {
                    polyline.geometry.insert(polyline.geometry.getLength(), newPointCoords);
                    // Добавление названия кликнутой транзитной точки в список routePoints
                    newChildPoint.innerHTML = item;
                    routePoints.appendChild(newChildPoint);
                    createRoute();
                    //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                    if (polyline.geometry.getLength() >= 2 ) {
                        outputRoute();
                    }
                }
            }
        }
    });

    // Работа с конечными точками при создании маршрута
    routeEndPointsCollection.events.add('click', function (e) {
        e.get('target').options.set('preset', 'islands#redCircleDotIcon');

        // Кординаты кликнутой транзитной точки
        var newPointCoords = e.get('target').geometry._coordinates;

        var routePoints   = document.getElementById('routePoints');
        var newChildPoint = document.createElement('li');

        // Добавление координат кликнутой транзитной точки в полилинию, а её подписи - в список routePoints
        //// Точка не будет дублироваться в маршруте, если она совпадает с предыдущей
        if ( polyline.geometry.get(polyline.geometry.getLength() - 1) !== newPointCoords) {
            for (item in routeEndPoints) {
                if ( newPointCoords == routeEndPoints[item] ) {
                    polyline.geometry.insert(polyline.geometry.getLength(), newPointCoords);
                    // Добавление названия кликнутой транзитной точки в список routePoints
                    newChildPoint.innerHTML = item;
                    routePoints.appendChild(newChildPoint);
                    createRoute();
                    //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                    if (polyline.geometry.getLength() >= 2 ) {
                        outputRoute();
                    }
                }
            }
        }
    });

    // Построение маршрута
    function createRoute() {
        // Получение длины построенного маршрута
        window.routeLength = Math.ceil(polyline.geometry.getDistance() / 1000);
        // Получение стоимости маршрута
        window.routePrice = (routeLength * document.getElementById('routePrice').value).toFixed(2);
    }
    function outputRoute() {
        // Вывод полученной длины и стоимости маршрута
        document.getElementById('routeInfo').innerHTML = 'Длина: <strong>' + routeLength + '</strong> км <br> Стоимость: <strong>' + routePrice + '</strong> руб.';
    }

    document.getElementById('routeThereAndBack').onclick = function(e) {
        // Маршрут туда и обратно удваивается
        if (typeof routeLength !== 'undefined' && typeof routePrice !== 'undefined') {
            if (this.checked) {
                routeLength *= 2;
                routePrice  *= 2;
                outputRoute();
            } else {
                routeLength /= 2;
                routePrice  /= 2;
                outputRoute();
            }
        } else {console.log('nothing to work with')}
    }

    // Очистка маршрута
    document.getElementById('clearRoute').onclick = function () {
        // Сброс стилизации всех точек
        routeMidPointsCollection.each(function(i, e) {
            i.options.set('preset', 'islands#darkGreenCircleIcon');
        });
        routeEndPointsCollection.each(function(i, e) {
            i.options.set('preset', 'islands#redCircleIcon');
        });
        // Удаление построенного ранее маршрута
        polyline.geometry.splice(0, polyline.geometry.getLength());
        // Очистка списка routePoints
        var routePoints = document.getElementById('routePoints');
        routePoints.innerHTML = '';
        // Сброс длины маршрута
        var routeInfo = document.getElementById('routeInfo');
        routeInfo.innerHTML = 'Маршрут ещё не построен...';
        // Сброс флажка "маршрут туда и обратно"
        document.getElementById('routeThereAndBack').checked = false;
    }

    // СЛУЖЕБНАЯ ФУНКЦИЯ - Получение координат по клику
    // myMap.events.add('click', function (e) {
    //     var coords = e.get('coords');
    //     coords[0] = +coords[0].toFixed(4);
    //     coords[1] = +coords[1].toFixed(4);
    //     alert(coords);
    //     console.log(coords);
    // });

}
