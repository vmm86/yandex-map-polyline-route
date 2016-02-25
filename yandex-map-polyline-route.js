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

    // Создание коллекции транзитных точек
    //// Оформление обычной и выделенной транзитных точек
    var midPointsUnchecked = 'islands#darkGreenCircleIcon';
    var midPointsChecked   = 'islands#darkGreenCircleDotIcon';
    //// Заготовка пустой коллекции транзитных точек
    var routeMidPointsCollection = new ymaps.GeoObjectCollection(null, {
        preset: midPointsUnchecked,
        draggable: false
    });
    //// Добавление транзитных точек в коллекцию
    for (item in routeMidPoints) {
        routeMidPointsCollection.add( new ymaps.Placemark(routeMidPoints[item], { hintContent: item } ) );
    }
    //// Добавление коллекции транзитных точек на карту
    myMap.geoObjects.add(routeMidPointsCollection);

    // Создание пустой коллекции конечных точек
    //// Оформление обычной и выделенной конечных точек
    var endPointsUnchecked = 'islands#redCircleIcon';
    var endPointsChecked   = 'islands#redCircleDotIcon';
    //// Заготовка пустой коллекции конечных точек
    var routeEndPointsCollection = new ymaps.GeoObjectCollection(null, {
        preset: endPointsUnchecked,
        draggable: false
    });
    //// Добавление конечных точек в коллекцию
    for (item in routeEndPoints) {
        routeEndPointsCollection.add( new ymaps.Placemark(routeEndPoints[item], { hintContent: item } ) );
    }
    //// Добавление коллекции конечных точек на карту
    myMap.geoObjects.add(routeEndPointsCollection);

    // Работа с транзитными точками при создании маршрута
    routeMidPointsCollection.events.add('click', function (e) {

        // Оформление кликнутой транзитной точки
        var currentPoint = e.get('target').options.get('preset');
        // Кординаты кликнутой транзитной точки
        var currentPointCoords = e.get('target').geometry._coordinates;
        // Список routePoints
        var routePoints     = document.getElementById('routePoints');
        var routeChildPoint = document.createElement('li');

        // Если точка была выделена при клике
        if (typeof currentPoint == 'undefined' || currentPoint == midPointsUnchecked) {
            // Смена оформления точки на выделенную
            e.get('target').options.set('preset', midPointsChecked);

            // Добавление координат кликнутой транзитной точки в полилинию, а её подписи - в список routePoints
            //// Точка не будет дублироваться в маршруте, если она совпадает с предыдущей
            if (polyline.geometry.get(polyline.geometry.getLength() - 1) !== currentPointCoords) {
                for (item in routeMidPoints) {
                    if ( currentPointCoords == routeMidPoints[item] ) {
                        polyline.geometry.insert(polyline.geometry.getLength(), currentPointCoords);
                        // Добавление названия кликнутой транзитной точки в список routePoints
                        routeChildPoint.innerHTML = item;
                        routePoints.appendChild(routeChildPoint);
                        createRoute();
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                        }
                    }
                }
            }
        // Если у точки снято выделение при повторном клике
        } else {
            // Если кликнута именно последняя точка полилинии
            if (polyline.geometry.get(polyline.geometry.getLength() - 1) === currentPointCoords) {

                e.get('target').options.set('preset', midPointsUnchecked);

                // Удаление координат кликнутой транзитной точки из полилинии, а её подписи - из списка routePoints
                for (item in routeMidPoints) {
                    if ( currentPointCoords == routeMidPoints[item] ) {
                        // Сброс флажка "маршрут туда и обратно"
                        document.getElementById('routeThereAndBack').checked = false;
                        // Удаление кликнутой транзитной точки из полилинии
                        polyline.geometry.remove( polyline.geometry.getLength() - 1 );
                        // Удаление названия кликнутой транзитной точки из списка routePoints
                        routePoints.removeChild(routePoints.lastChild);
                        createRoute();
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                        } else {
                            clearRoute();
                        }
                    }
                }
            }
        }

    });

    // Работа с конечными точками при создании маршрута
    routeEndPointsCollection.events.add('click', function (e) {

        // Оформление кликнутой конечной точки
        var currentPoint = e.get('target').options.get('preset');
        // Кординаты кликнутой конечной точки
        var currentPointCoords = e.get('target').geometry._coordinates;
        // Список routePoints
        var routePoints     = document.getElementById('routePoints');
        var routeChildPoint = document.createElement('li');

        // Если точка была выделена при клике
        if (typeof currentPoint == 'undefined' || currentPoint == endPointsUnchecked) {
            // Смена оформления точки на обычную
            e.get('target').options.set('preset', endPointsChecked);

            // Добавление координат кликнутой конечной точки в полилинию, а её подписи - в список routePoints
            //// Точка не будет дублироваться в маршруте, если она совпадает с предыдущей
            if ( polyline.geometry.get(polyline.geometry.getLength() - 1) !== currentPointCoords) {
                for (item in routeEndPoints) {
                    if ( currentPointCoords == routeEndPoints[item] ) {
                        polyline.geometry.insert(polyline.geometry.getLength(), currentPointCoords);
                        // Добавление названия кликнутой конечной точки в список routePoints
                        routeChildPoint.innerHTML = item;
                        routePoints.appendChild(routeChildPoint);
                        createRoute();
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                        }
                    }
                }
            }
        // Если у точки снято выделение при повторном клике
        } else {
            // Если кликнута именно последняя точка полилинии
            if (polyline.geometry.get(polyline.geometry.getLength() - 1) === currentPointCoords) {
                e.get('target').options.set('preset', endPointsUnchecked);

                // Удаление координат кликнутой конечной точки из полилинии, а её подписи - из списка routePoints
                for (item in routeEndPoints) {
                    if ( currentPointCoords == routeEndPoints[item] ) {
                        // Сброс флажка "маршрут туда и обратно"
                        document.getElementById('routeThereAndBack').checked = false;
                        // Удаление кликнутой конечной точки из полилинии
                        polyline.geometry.remove( polyline.geometry.getLength() - 1 );
                        // Удаление названия кликнутой конечной точки из списка routePoints
                        routePoints.removeChild(routePoints.lastChild);
                        createRoute();
                        //// Маршрут будет очищен, если выбранной остаются менее 2-х точек
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                        } else {
                            clearRoute();
                        }
                    }
                }
            }
        }

    });

    // Переменные для хранения длины и стоимости маршрута
    var routeLength = 0;
    var routePrice  = 0;

    // Построение маршрута
    function createRoute() {
        // Получение длины построенного маршрута
        routeLength = Math.ceil(polyline.geometry.getDistance() / 1000);
        // Получение стоимости маршрута
        routePrice = (routeLength * document.getElementById('routePrice').value).toFixed(2);
        // Если цена целая - преобразуется в integer, иначе - в float
        routePrice = routePrice % 1 === 0 ? parseInt(routePrice) : parseFloat(routePrice);
    }
    // Вывод полученной длины и стоимости маршрута
    function outputRoute() {
        document.getElementById('routeInfo').innerHTML = 'Длина: <strong>' + routeLength + '</strong> км <br> Стоимость: <strong>' + routePrice + '</strong> руб.';
    }

    // Маршрут туда и обратно удваивается, если он уже был постороен
    document.getElementById('routeThereAndBack').onclick = function(e) {
        if (routeLength !== 0 && routePrice !== 0) {
            if (this.checked) {
                routeLength *= 2;
                routePrice  *= 2;
            } else {
                routeLength /= 2;
                routePrice  /= 2;
            }
            // Если цена целая - преобразуется в integer, иначе - в float
            routePrice = routePrice % 1 === 0 ? parseInt(routePrice) : parseFloat(routePrice);
            outputRoute();
        }
    }

    // Очистка маршрута
    function clearRoute() {
        // Сброс стилизации всех точек
        routeMidPointsCollection.each(function(i, e) {
            i.options.set('preset', 'islands#darkGreenCircleIcon');
        });
        routeEndPointsCollection.each(function(i, e) {
            i.options.set('preset', 'islands#redCircleIcon');
        });
        // Удаление построенного ранее маршрута
        polyline.geometry.splice(0, polyline.geometry.getLength());
        // Сброс переменных routeLength и routePrice
        routeLength = 0;
        routePrice  = 0;
        // Очистка списка routePoints
        var routePoints = document.getElementById('routePoints');
        routePoints.innerHTML = '';
        // Сброс длины маршрута
        var routeInfo = document.getElementById('routeInfo');
        routeInfo.innerHTML = 'Маршрут ещё не построен...';
        // Сброс флажка "маршрут туда и обратно"
        document.getElementById('routeThereAndBack').checked = false;
    }

    document.getElementById('clearRoute').onclick = clearRoute;

    // СЛУЖЕБНАЯ ФУНКЦИЯ - Получение координат по клику
    // myMap.events.add('click', function (e) {
    //     var coords = e.get('coords');
    //     coords[0] = +coords[0].toFixed(4);
    //     coords[1] = +coords[1].toFixed(4);
    //     alert(coords);
    //     console.log(coords);
    // });

}

// Сброс флажка "маршрут туда и обратно" при перезагрузке страницы
window.onload = function() {
    document.getElementById('routeThereAndBack').checked = false;
}
