
import sportProLogo from './assets/SportProLogo_02.png'
import './App.css'
import AppRouter from './AppRouter'

function App() {


  return (
    <>
      <div className="card">
        <img src={sportProLogo} className="logo" alt="SportPro logo" />
      </div>
      <h2>SwimTrack 4.0</h2>
      <AppRouter />
    </>
  )
}

export default App
