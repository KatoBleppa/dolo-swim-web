
import sportProLogo from './assets/SportProLogo_02.png'
import './App.css'
import AppRouter from './AppRouter'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient';
import { AuthView } from './components/Auth'
import Login from './components/Login'
import Signup from './components/Signup'

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

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
      {session ? (
        <>
          <div>Benvenuto, sei loggato!</div>
          <AppRouter />
        </>
      ) : (
        <AuthView />
      )}
    </div>
  </>
  );
}

export default App
