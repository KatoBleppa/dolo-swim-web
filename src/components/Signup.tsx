// src/components/Signup.tsx
import { useState } from 'react'
import { supabase } from '../supabaseClient';

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    setError(error?.message ?? null)
  }

  return (
    <div>
      <h2>Signup</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default Signup
