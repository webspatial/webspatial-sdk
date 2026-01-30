import React from 'react';
import { createRoot } from 'react-dom/client';
 

const MultiSceneDemo = () => {
  const openPage = (path: string, title: string) => {
    const url = `${window.location.origin}${path}`;
    window.open(url, title);
  };

  const openScene = (name: string, title: string) => {
    switch (name) {
      case 'overview':
        openPage('/src/solar-system-simple/scene-overview.html', title);
        break;
      case 'inner':
        openPage('/src/solar-system-simple/scene-inner.html', title);
        break;
      case 'outer':
        openPage('/src/solar-system-simple/scene-outer.html', title);
        break;
      case 'sun':
        openPage('/src/solar-system-simple/scene-sun.html', title);
        break;
      default:
        break;
    }
  };

  const openAllScenes = () => {
    openScene('overview', 'SolarOverview');
    openScene('inner', 'InnerPlanets');
    openScene('outer', 'OuterPlanets');
    openScene('sun', 'SunFocus');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <a href="index.html" style={{ color: '#fff', textDecoration: 'none', padding: '0.6rem 1.2rem', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '8px' }}>← Back to Demo Menu</a>

      <button
        style={{
          padding: '0.6rem 1.2rem',
          backgroundColor: '#42a5f5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
        onClick={openAllScenes}
      >
        Open All Scenes
      </button>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer' }}
          onClick={() => openScene('overview', 'SolarOverview')}
        >
          Open Overview
        </button>
        <button
          style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer' }}
          onClick={() => openScene('inner', 'InnerPlanets')}
        >
          Open Inner Planets
        </button>
        <button
          style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer' }}
          onClick={() => openScene('outer', 'OuterPlanets')}
        >
          Open Outer Planets
        </button>
        <button
          style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer' }}
          onClick={() => openScene('sun', 'SunFocus')}
        >
          Open Sun Focus
        </button>
      </div>
    </div>
  );
};

// Mount the app
const container = document.getElementById('scene-container');
if (container) {
  const root = createRoot(container);
  root.render(<MultiSceneDemo />);
}
