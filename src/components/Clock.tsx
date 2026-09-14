import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '20px',
      color: '#ccc',
      fontSize: '20px',
      fontWeight: 500,
      fontFamily: 'sans-serif',
      zIndex: 50,
      userSelect: 'none',
      letterSpacing: '0.5px',
    }}>
      {hours}:{minutes}
    </div>
  );
};

export default Clock;
