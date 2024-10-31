// RadiusInput.js
import React, { useState } from 'react';

const RadiusInput = ({ setRadius }) => {
  const [inputValue, setInputValue] = useState(2000); // 기본값 2000m

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = () => {
    setRadius(Number(inputValue)); // 부모 컴포넌트에 반경 설정
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="number"
        value={inputValue}
        onChange={handleChange}
        placeholder="반경(m)"
      />
      <button onClick={handleSubmit}>설정</button>
    </div>
  );
};

export default RadiusInput;
