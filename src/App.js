import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import RestaurantList from './RestaurantList';
import RadiusInput from './RadiusInput';
import './styles.css';

const App = () => {
  const [radius, setRadius] = useState(2000);
  const [address, setAddress] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [count, setCount] = useState(0);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 34.9687735, lng: 127.4802359 });
  const [searchResults, setSearchResults] = useState([]);

  const REST_API_KEY = '25d26859dae2a8cb671074b910e16912';
  const JAVASCRIPT_API_KEY = '51120fdc1dd2ae273ccd643e7a301c77';

  const fetchAddressData = async (query) => {
    const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=AT4`;

    try {
      const [addressResponse, keywordResponse] = await Promise.all([
        fetch(addressUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
        fetch(keywordUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
      ]);

      if (!addressResponse.ok || !keywordResponse.ok) {
        throw new Error(`검색 실패: ${addressResponse.status} ${addressResponse.statusText}`);
      }

      const addressData = await addressResponse.json();
      const keywordData = await keywordResponse.json();

      const combinedResults = [
        ...(addressData.documents || []),
        ...(keywordData.documents || [])
      ];

      // 결과가 없을 때 fallback 검색
      if (combinedResults.length === 0) {
        const fallbackKeywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
        const fallbackResponse = await fetch(fallbackKeywordUrl, {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setSearchResults(fallbackData.documents || []);
        } else {
          alert("검색 결과가 없습니다.");
        }
      } else {
        setSearchResults(combinedResults);
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const fetchNearbyRestaurants = async (x, y) => {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
      });

      if (!response.ok) {
        throw new Error(`식당 검색 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        setRestaurants(data.documents);
      } else {
        alert("근처에 식당이 없습니다.");
      }
    } catch (error) {
      console.error("식당 검색 중 오류 발생:", error);
      alert("식당 검색 중 오류가 발생했습니다.");
    }
  };

  const handleSearch = async () => {
    if (!address) {
      alert("주소를 입력해 주세요.");
      return;
    }
    await fetchAddressData(address); // 주소 및 건물 검색 실행
  };

  const handleSelectAddress = (result) => {
    setAddress(result.address_name); // 선택한 주소 설정
    setMapCenter({ lat: parseFloat(result.y), lng: parseFloat(result.x) }); // 지도 중심 설정
    fetchNearbyRestaurants(result.x, result.y); // 근처 식당 검색
    setSearchResults([]); // 검색 결과 초기화
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleSpin = () => {
    if (restaurants.length === 0) {
      alert("식당 목록이 비어 있습니다. 주소를 검색해 주세요.");
      return;
    }

    const excludedCategories = excludedCategory.split(',').map((cat) => cat.trim());

    const filteredRestaurants = restaurants.filter((restaurant) => {
      const isExcluded = excludedCategories.some((cat) => restaurant.category_name.includes(cat));
      const isIncluded = includedCategory ? restaurant.category_name.includes(includedCategory) : true;
      return !isExcluded && isIncluded;
    });

    const randomRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;

    const randomSelection = randomRestaurants
      .sort(() => 0.5 - Math.random())
      .slice(0, count || randomRestaurants.length);

    setRestaurants(randomSelection);
    if (randomSelection.length > 0) {
      setMapCenter({ lat: parseFloat(randomSelection[0].y), lng: parseFloat(randomSelection[0].x) });
    }
  };

  const handleLocationClick = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
        await fetchNearbyRestaurants(lng, lat);
      }, (error) => {
        console.error('위치를 가져오지 못했습니다: ', error);
        alert('위치를 가져오지 못했습니다.');
      });
    } else {
      alert('이 브라우저는 Geolocation을 지원하지 않습니다.');
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JAVASCRIPT_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => setMapLoaded(true));
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="container">
      <h1>식당 추천 앱</h1>
      <RadiusInput setRadius={setRadius} />
      <input
        type="text"
        placeholder="주소 또는 건물명 입력"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={handleSearch}>검색</button>
      
      {searchResults.length > 0 && (
        <div className="scrollable-list">
          {searchResults.map((result, index) => (
            <div key={index} onClick={() => handleSelectAddress(result)}>
              {result.address_name} ({result.place_name})
            </div>
          ))}
        </div>
      )}

      <MapComponent mapLoaded={mapLoaded} mapCenter={mapCenter} restaurants={restaurants} radius={radius} />
      <RestaurantList restaurants={restaurants} onSelect={handleSelectRestaurant} />

      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <button onClick={handleLocationClick}>현위치</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <input
          type="number"
          placeholder="추천 개수"
          value={count || ''} // count가 0일 때는 빈 문자열로 설정
          onChange={(e) => setCount(Number(e.target.value) || 0)} // Number로 변환하고, falsy 값일 경우 0으로 설정
        />
        <button style={{ width: '210px' }} onClick={handleSpin}>랜덤 추천</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0px' }}>
        <input
          type="text"
          placeholder="추천할 카테고리 (예: 한식)"
          value={includedCategory}
          onChange={(e) => setIncludedCategory(e.target.value || '')} // 빈 문자열 처리
        />
        <input
          type="text"
          placeholder="제외할 카테고리 (쉼표로 구분)"
          value={excludedCategory}
          onChange={(e) => setExcludedCategory(e.target.value || '')} // 빈 문자열 처리
        />
      </div>
    </div>
  );
};

export default App;
