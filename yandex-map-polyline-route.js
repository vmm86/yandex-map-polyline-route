// Как только будет загружен API и готов DOM, выполняем инициализацию
ymaps.ready(init);

function init() {
    // Создание экземпляра карты с привязкой к контейнеру
    var myMap = new ymaps.Map(mapElement, {
        center: mapCenter,
        zoom: mapZoom,
        controls: mapControls
    });

    // Создание и добавление на карту элемента управления "Пробки"
    var trafficControl = new ymaps.control.TrafficControl(
        {
            state:
                {
                    providerKey: 'traffic#actual',
                    trafficShown: true
                }
        }
    );
    myMap.controls.add(trafficControl);
    trafficControl.getProvider('traffic#actual').state.set('infoLayerShown', true);

    // Создание и добавление на карту будущего маршрута
    var polyline = new ymaps.Polyline(
        [], 
        {
            hintContent: routeTitle
        }, 
        {
            draggable: false,
            strokeColor: routeColor,
            strokeWidth: routeWidth
        }
    );
    myMap.geoObjects.add(polyline);

    // Создание и добавление на карту коллекции транзитных точек
    var routeMidPointsCollection = new ymaps.GeoObjectCollection(
        null, 
        {
            preset: midPointsUnchecked,
            draggable: false
        }
    );
    for (item in routeMidPoints) {
        routeMidPointsCollection.add(new ymaps.Placemark(
                routeMidPoints[item], 
                {hintContent: item}
            )
        );
    }
    myMap.geoObjects.add(routeMidPointsCollection);

    // Создание и добавление на карту коллекции конечных точек
    var routeEndPointsCollection = new ymaps.GeoObjectCollection(
        null, 
        {
            preset: endPointsUnchecked,
            draggable: false
        }
    );
    for (item in routeEndPoints) {
        routeEndPointsCollection.add(new ymaps.Placemark(
                routeEndPoints[item], 
                {hintContent: item}
            )
        );
    }
    myMap.geoObjects.add(routeEndPointsCollection);

    // Работа с транзитными точками при создании маршрута
    routeMidPointsCollection.events.add('click', function (e) {

        var currentPoint = e.get('target').options.get('preset');
        var currentPointCoords = e.get('target').geometry._coordinates;
        var routePoints     = document.getElementById('routePoints');
        var routeChildPoint = document.createElement('li');

        // Если точка была выделена при клике
        if (typeof currentPoint == 'undefined' || currentPoint == midPointsUnchecked) {
            e.get('target').options.set('preset', midPointsChecked);

            // Добавление координат кликнутой транзитной точки в полилинию, а её подписи - в список routePoints
            //// Точка не будет дублироваться в маршруте, если она совпадает с предыдущей
            if (polyline.geometry.get(polyline.geometry.getLength() - 1) !== currentPointCoords) {
                for (item in routeMidPoints) {
                    if (currentPointCoords == routeMidPoints[item]) {
                        polyline.geometry.insert(polyline.geometry.getLength(), currentPointCoords);
                        // Добавление названия кликнутой транзитной точки в список routePoints
                        routeChildPoint.innerHTML = item;
                        routePoints.appendChild(routeChildPoint);
                        createRoute();
                        document.getElementById('routeThereAndBack').checked = false;
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                            document.getElementById('routeThereAndBack').disabled = false;
                            document.getElementById('clearRoute').style.display = 'block';
                        } else {
                            document.getElementById('routeThereAndBack').disabled = true;
                            document.getElementById('clearRoute').style.display = 'none';
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
                        // Удаление кликнутой транзитной точки из полилинии
                        polyline.geometry.remove( polyline.geometry.getLength() - 1 );
                        // Удаление названия кликнутой транзитной точки из списка routePoints
                        routePoints.removeChild(routePoints.lastChild);
                        createRoute();
                        document.getElementById('routeThereAndBack').checked = false;
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                            document.getElementById('routeThereAndBack').disabled = false;
                            document.getElementById('clearRoute').style.display = 'block';
                        } else {
                            clearRoute();
                            document.getElementById('routeThereAndBack').disabled = true;
                            document.getElementById('clearRoute').style.display = 'none';
                        }
                    }
                }
            }
        }

    });

    // Работа с конечными точками при создании маршрута
    routeEndPointsCollection.events.add('click', function (e) {

        var currentPoint = e.get('target').options.get('preset');
        var currentPointCoords = e.get('target').geometry._coordinates;
        var routePoints     = document.getElementById('routePoints');
        var routeChildPoint = document.createElement('li');

        // Если точка была выделена при клике
        if (typeof currentPoint == 'undefined' || currentPoint == endPointsUnchecked) {
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
                        document.getElementById('routeThereAndBack').checked = false;
                        //// Маршрут не будет выведен, если ни одна точка ещё не выбрана или выбрана только одна точка
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                            document.getElementById('routeThereAndBack').disabled = false;
                            document.getElementById('clearRoute').style.display = 'block';
                        } else {
                            document.getElementById('routeThereAndBack').disabled = true;
                            document.getElementById('clearRoute').style.display = 'none';
                        }
                    }
                }
            }
        // Если у точки снято выделение при повторном клике
        } else {
            // Если кликнута именно последняя точка полилинии
            if (polyline.geometry.get(polyline.geometry.getLength() - 1) === currentPointCoords) {
                // Сброс флажка "маршрут туда и обратно"
                document.getElementById('routeThereAndBack').checked = false;

                e.get('target').options.set('preset', endPointsUnchecked);

                // Удаление координат кликнутой конечной точки из полилинии, а её подписи - из списка routePoints
                for (item in routeEndPoints) {
                    if ( currentPointCoords == routeEndPoints[item] ) {
                        // Удаление кликнутой конечной точки из полилинии
                        polyline.geometry.remove( polyline.geometry.getLength() - 1 );
                        // Удаление названия кликнутой конечной точки из списка routePoints
                        routePoints.removeChild(routePoints.lastChild);
                        createRoute();
                        document.getElementById('routeThereAndBack').checked = false;
                        //// Маршрут будет очищен, если выбранной остаются менее 2-х точек
                        if (polyline.geometry.getLength() >= 2 ) {
                            outputRoute();
                            document.getElementById('routeThereAndBack').disabled = false;
                            document.getElementById('clearRoute').style.display = 'block';
                        } else {
                            clearRoute();
                            document.getElementById('routeThereAndBack').disabled = true;
                            document.getElementById('clearRoute').style.display = 'none';
                        }
                    }
                }
            }
        }

    });

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

    document.getElementById('clearRoute').onclick = clearRoute;

    // Построение маршрута
    function createRoute() {
        routeLength = Math.ceil(polyline.geometry.getDistance() / 1000);
        routePrice  = (routeLength * document.getElementById('routeRatio').value).toFixed(2);
        routePrice  = routePrice % 1 === 0 ? parseInt(routePrice) : parseFloat(routePrice);
    }

    // Вывод длины и стоимости маршрута
    function outputRoute() {
        document.getElementById('routeInfo').innerHTML = 
        'Длина: <strong>' + routeLength + '</strong> км <br> Стоимость: <strong>' + routePrice + '</strong> руб.';
    }

    // Очистка маршрута
    function clearRoute() {
        // Сброс стилизации всех точек
        routeMidPointsCollection.each(function(i, e) {
            i.options.set('preset', midPointsUnchecked);
        });
        routeEndPointsCollection.each(function(i, e) {
            i.options.set('preset', endPointsUnchecked);
        });
        // Удаление построенного ранее маршрута
        polyline.geometry.splice(0, polyline.geometry.getLength());
        // Сброс переменных routeLength и routePrice
        routeLength = 0;
        routePrice  = 0;
        // Очистка списка routePoints
        document.getElementById('routePoints').innerHTML = '';
        // Сброс длины маршрута
        document.getElementById('routeInfo').innerHTML = 'Маршрут ещё не построен...';
        // Сброс флажка "маршрут туда и обратно"
        document.getElementById('routeThereAndBack').checked = false;
        // Скрытие кнопки "Очистить маршрут"
        document.getElementById('clearRoute').style.display = 'none';
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

// Сброс флажка "маршрут туда и обратно" при перезагрузке страницы
window.onload = function() {
    document.getElementById('routeRatio').value = routeRatio;
    document.getElementById('routeThereAndBack').checked = false;
    document.getElementById('routeThereAndBack').disabled = true;
    document.getElementById('clearRoute').style.display = 'none';
}
