import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import LoginModal from '../LoginModal/LoginModal'

interface AuthContextValue {
  isSignedIn: boolean
  openSignIn: () => void
  requireSignIn: (action: () => void) => void
  signOut: () => void
}

const STORAGE_KEY = 'ycm-prototype-signed-in'
const AuthContext = createContext<AuthContextValue | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true')
  const [loginOpen, setLoginOpen] = useState(false)

  function openSignIn() {
    setLoginOpen(true)
  }

  function requireSignIn(action: () => void) {
    if (isSignedIn) {
      action()
      return
    }
    openSignIn()
  }

  function handleSignedIn() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setIsSignedIn(true)
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY)
    setIsSignedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isSignedIn, openSignIn, requireSignIn, signOut }}>
      {children}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleSignedIn} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export default AuthProvider
