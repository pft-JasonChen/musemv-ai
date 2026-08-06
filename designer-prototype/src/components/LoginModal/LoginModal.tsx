import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import icAppleLogo from '../../assets/icons/ic_apple_logo.svg'
import icGoogleLogo from '../../assets/icons/ic_google_logo.svg'
import icCheck from '../../assets/icons/ic_check.svg'
import appIcon from '../../assets/brand/AppIcon.svg'
import './LoginModal.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Provider = 'Apple' | 'Google'

// How long the success stage lingers before auto-closing — long enough to
// read "Signed in successfully!", short enough not to feel stuck.
const SUCCESS_DURATION_MS = 1800

// Figma "Popup/Dialog - Sign In" (node 1724:43347) + "Sign In — Successful"
// (node 310:4720) — third-party sign-in only, no email/password fields.
//
// UI-only prototype — no backend to authenticate against, so both buttons
// are a mock stand-in: clicking one shows the success state (matching
// Figma's mock name "Scott"), then auto-closes.
function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [provider, setProvider] = useState<Provider | null>(null)
  const { shouldRender, visible } = useMountTransition(isOpen)

  useEffect(() => {
    if (isOpen) setProvider(null)
  }, [isOpen])

  useEffect(() => {
    if (!provider) return
    const timer = window.setTimeout(onClose, SUCCESS_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [provider, onClose])

  if (!shouldRender) return null

  return createPortal(
    <div
      className={`login-modal-overlay${provider ? '' : ' login-modal-overlay--sign-in'}${visible ? ' login-modal-overlay--visible' : ''}`}
    >
      <div className="login-modal-backdrop" onClick={onClose} aria-hidden="true" />
      {provider ? (
        <div className="login-modal login-modal--success" role="dialog" aria-label="Signed in successfully">
          <div className="login-modal__handle" aria-hidden="true" />

          <div className="login-modal__success-circle">
            <img src={icCheck} alt="" className="login-modal__success-check" />
          </div>

          <div className="login-modal__message">
            <p className="login-modal__title">Signed in successfully!</p>
            <p className="login-modal__success-subtitle">Welcome back, Scott · via {provider}</p>
          </div>

          <div className="login-modal__processing">
            <p className="login-modal__processing-text">Entering your account...</p>
            <div className="login-modal__dots" aria-hidden="true">
              <span className="login-modal__dot" />
              <span className="login-modal__dot" />
              <span className="login-modal__dot" />
            </div>
          </div>
        </div>
      ) : (
        <div className="login-modal login-modal--sign-in" role="dialog" aria-label="Sign in to YouCam Muse">
          <div className="login-modal__handle" aria-hidden="true" />

          <div className="login-modal__content">
            <div className="login-modal__app-message">
              <img src={appIcon} alt="" className="login-modal__logo" />

              <div className="login-modal__message">
                <p className="login-modal__title">Sign in to YouCam Muse</p>
                <p className="login-modal__subtitle">
                  Save your creations, sync across devices,
                  <br />
                  and unlock your full creative history.
                </p>
              </div>
            </div>

            <div className="login-modal__cta">
              <div className="login-modal__buttons">
                <button
                  type="button"
                  className="login-modal__social"
                  onClick={() => {
                    setProvider('Apple')
                    onSuccess?.()
                  }}
                >
                  <img src={icAppleLogo} alt="" className="login-modal__social-icon" />
                  Continue with Apple
                </button>
                <button
                  type="button"
                  className="login-modal__social"
                  onClick={() => {
                    setProvider('Google')
                    onSuccess?.()
                  }}
                >
                  <img src={icGoogleLogo} alt="" className="login-modal__social-icon" />
                  Continue with Google
                </button>
              </div>

              <p className="login-modal__footer">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

export default LoginModal
