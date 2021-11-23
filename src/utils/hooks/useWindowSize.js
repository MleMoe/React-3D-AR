import React, { useState, useEffect } from 'react';
function useWindowSize() {
  const getWindowSize = () => ({
    width: document.body.clientWidth, //window.innerWidth,
    height: document.body.clientHeight, //window.innerHeight,
  });
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const handleResize = () => {
    setWindowSize(getWindowSize());
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
}

export { useWindowSize };
