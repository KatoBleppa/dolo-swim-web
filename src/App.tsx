
import sportProLogo from './assets/SportProLogo_02.png'
import './App.css'
import AppRouter from './AppRouter'

function App() {
  return (
    <>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
        <img
          src={sportProLogo}
          className="logo"
          alt="SportPro logo"
          style={{ width: 320, height: 'auto', marginBottom: 8 }}
        />
        <h2 style={{ margin: 0, marginBottom: 20 }}>SwimTrack 4.0</h2>
      </div>
      <div style={{ marginTop: 0 }}>
        <AppRouter />
      </div>
    </>
  );
}

export default App
