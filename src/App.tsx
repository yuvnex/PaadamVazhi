import { useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import PenSettingsPopup from './components/PenSettingsPopup';
import EraserSettingsPopup from './components/EraserSettingsPopup';
import ShapeMenu from './components/ShapeMenu';
import InsertMenu from './components/InsertMenu';
import PageNavigation from './components/PageNavigation';
import MainMenu from './components/MainMenu';
import Clock from './components/Clock';
import SettingsDialog from './components/SettingsDialog';
import ExportDialog from './components/ExportDialog';
import PageOverview from './components/PageOverview';
import ZoomControls from './components/ZoomControls';
import BackgroundPicker from './components/BackgroundPicker';
import ClassroomSubmitDialog from './components/ClassroomSubmitDialog';
import SplashScreen from './components/SplashScreen';
import { useWhiteboardStore } from './store/useStore';

function App() {
  const {
    showPenSettings,
    showEraserSettings,
    showShapeMenu,
    showInsertMenu,
    showMainMenu,
    showSettings,
    showExportDialog,
    showPageOverview,
    showClassroomSubmitDialog,
  } = useWhiteboardStore();

  // Track whether a toolbar/popup button was recently clicked
  const toolbarClickRef = useRef(false);

  useEffect(() => {
    const handleAccessToken = async (rawUrl: string) => {
      if (rawUrl.includes('access_token=')) {
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch {}

        const hash = rawUrl.includes('#') ? rawUrl.split('#')[1] : rawUrl.split('?')[1] || '';
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        if (token) {
          const module = await import('./services/googleClassroom');
          module.setStoredAccessToken(token);
          try {
            const profile = await module.fetchGoogleUserProfile(token);
            let courses: any[] = [];
            try {
              courses = await module.fetchGoogleClassroomCourses(token);
            } catch (cErr) {
              console.warn('Classroom courses fetch warning:', cErr);
            }

            useWhiteboardStore.getState().updateSettings({
              googleClassroom: {
                isConnected: true,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
                courses,
              },
            });
            useWhiteboardStore.getState().setShowClassroomSubmitDialog(true);
          } catch (e) {
            console.error('Failed to parse OAuth redirect profile:', e);
          }
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    // 1. Check if returning from web browser OAuth redirect
    if (window.location.hash.includes('access_token=')) {
      handleAccessToken(window.location.href);
    }

    // 2. Check if returning from native Android app deep link / system browser
    let removeAppUrlListener: (() => void) | undefined;
    let removeStateListener: (() => void) | undefined;

    import('@capacitor/app').then(({ App: CapApp }) => {
      const urlPromise = CapApp.addListener('appUrlOpen', (event) => {
        if (event?.url) {
          handleAccessToken(event.url);
        }
      });
      removeAppUrlListener = () => {
        urlPromise.then(h => h.remove());
      };

      const statePromise = CapApp.addListener('appStateChange', (state) => {
        if (state.isActive && window.location.hash.includes('access_token=')) {
          handleAccessToken(window.location.href);
        }
      });
      removeStateListener = () => {
        statePromise.then(h => h.remove());
      };
    }).catch(() => {});

    return () => {
      if (removeAppUrlListener) removeAppUrlListener();
      if (removeStateListener) removeStateListener();
    };
  }, []);

  useEffect(() => {
    const handleToolbarDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // If clicking a button or inside a popup/toolbar area, mark it
      if (target.closest('button') || target.closest('[data-popup]') || target.closest('[data-toolbar]')) {
        toolbarClickRef.current = true;
        setTimeout(() => { toolbarClickRef.current = false; }, 100);
      }
    };

    const handleCanvasDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'CANVAS' && !toolbarClickRef.current) {
        const s = useWhiteboardStore.getState();
        if (s.showPenSettings) s.setShowPenSettings(false);
        if (s.showEraserSettings) s.setShowEraserSettings(false);
        if (s.showShapeMenu) s.setShowShapeMenu(false);
        if (s.showInsertMenu) s.setShowInsertMenu(false);
        if (s.showMainMenu) s.setShowMainMenu(false);
      }
    };

    window.addEventListener('pointerdown', handleToolbarDown, true);
    window.addEventListener('pointerdown', handleCanvasDown);
    return () => {
      window.removeEventListener('pointerdown', handleToolbarDown, true);
      window.removeEventListener('pointerdown', handleCanvasDown);
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#292A2E',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
    }}>
      <Canvas />
      <Clock />
      <PageNavigation />
      <BackgroundPicker />
      <Toolbar />
      <ZoomControls />
      
      {showPenSettings && <PenSettingsPopup />}
      {showEraserSettings && <EraserSettingsPopup />}
      {showShapeMenu && <ShapeMenu />}
      {showInsertMenu && <InsertMenu />}
      {showMainMenu && <MainMenu />}
      {showSettings && <SettingsDialog />}
      {showExportDialog && <ExportDialog />}
      {showPageOverview && <PageOverview />}
      {showClassroomSubmitDialog && <ClassroomSubmitDialog />}
      <SplashScreen durationMs={2600} />
    </div>
  );
}

export default App;
