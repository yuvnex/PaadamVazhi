import React, { useState, useEffect } from 'react';
import appLogo from '../assets/app-logo.png';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2600,
}) => {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Start fade-out before duration completes
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, Math.max(durationMs - 400, 1500));

    const finishTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFadingOut(true);
        setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 300);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#090d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: fadingOut ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.4s ease',
        }}
      >
        <img
          src={appLogo}
          alt="PaadamVazhi Logo"
          style={{
            width: '280px',
            maxWidth: '85vw',
            height: 'auto',
            borderRadius: '50%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(16, 185, 129, 0.18)',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
