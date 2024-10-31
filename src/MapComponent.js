import React, { useEffect } from 'react';

const MapComponent = ({ mapLoaded, restaurants, mapCenter, radius }) => {
  // 원 추가 함수
  const addCircle = (map, position) => {
    const circle = new window.kakao.maps.Circle({
      center: position,
      radius: radius, // 반경 사용
      strokeWeight: 2,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.7,
      fillColor: '#CFE7FF',
      fillOpacity: 0.5,
    });
    circle.setMap(map);
  };

  useEffect(() => {
    if (mapLoaded && window.kakao) {
      const container = document.getElementById('map');
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 레스토랑 위치에 마커 추가
      restaurants.forEach((restaurant) => {
        const markerPosition = new window.kakao.maps.LatLng(restaurant.y, restaurant.x);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          title: restaurant.place_name,
        });
        marker.setMap(map);
      });

      // 원 추가
      addCircle(map, new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }
  }, [mapLoaded, mapCenter, restaurants, radius]); // radius 추가

  return <div id="map" style={{ width: '100%', height: '400px' }}></div>;
};

export default MapComponent;
