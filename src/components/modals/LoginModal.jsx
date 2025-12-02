import React from 'react';
import { X } from 'lucide-react';

/**
 * LoginModal Component
 * Modal for user authentication (password and magic link)
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {string} loginEmail - Current email input value
 * @param {string} loginPassword - Current password input value
 * @param {string} confirmPassword - Current confirm password input value
 * @param {string} loginMode - 'password' or 'magiclink'
 * @param {string} passwordMode - 'login' or 'signup'
 * @param {boolean} emailSent - Whether magic link email was sent
 * @param {boolean} isVerifying - Whether authentication is in progress
 * @param {object} authUser - Current authenticated user
 * @param {object} defaultUser - Default user for fallback
 * @param {function} onClose - Callback to close the modal
 * @param {function} onEmailChange - Callback when email changes
 * @param {function} onPasswordChange - Callback when password changes
 * @param {function} onConfirmPasswordChange - Callback when confirm password changes
 * @param {function} onLoginModeChange - Callback when login mode changes
 * @param {function} onPasswordModeChange - Callback when password mode changes
 * @param {function} onPasswordLogin - Callback for password login/signup
 * @param {function} onEmailLogin - Callback for magic link login
 * @param {function} onUseDefaultUser - Callback to use default user
 */
export default function LoginModal({
  show,
  loginEmail,
  loginPassword,
  confirmPassword,
  loginMode,
  passwordMode,
  emailSent,
  isVerifying,
  authUser,
  defaultUser,
  onClose,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onLoginModeChange,
  onPasswordModeChange,
  onPasswordLogin,
  onEmailLogin,
  onUseDefaultUser
}) {
  if (!show) return null;

  const handleClose = () => {
    onClose();
    // Reset form state
    onEmailChange('');
    onPasswordChange('');
    onConfirmPasswordChange('');
    onLoginModeChange('password');
    onPasswordModeChange('login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Bookshelf</h2>
          <p className="text-gray-600">
            {emailSent 
              ? 'Check your email for the magic link to sign in'
              : 'Sign in with your email to access your personal bookshelf'
            }
          </p>
        </div>

        {!emailSent ? (
          <div className="space-y-4">
            {/* Login Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  onLoginModeChange('password');
                  onPasswordChange('');
                  onEmailChange('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  loginMode === 'password'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => {
                  onLoginModeChange('magiclink');
                  onPasswordChange('');
                  onEmailChange('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  loginMode === 'magiclink'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Magic Link
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (loginMode === 'password') {
                      onPasswordLogin();
                    } else {
                      onEmailLogin();
                    }
                  }
                }}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isVerifying}
              />
            </div>

            {loginMode === 'password' && (
              <>
                {/* Sign In / Create Account Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      onPasswordModeChange('login');
                      onPasswordChange('');
                      onConfirmPasswordChange('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      passwordMode === 'login'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onPasswordModeChange('signup');
                      onPasswordChange('');
                      onConfirmPasswordChange('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      passwordMode === 'signup'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        onPasswordLogin();
                      }
                    }}
                    placeholder={passwordMode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isVerifying}
                  />
                </div>

                {passwordMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onPasswordLogin();
                        }
                      }}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isVerifying}
                    />
                  </div>
                )}
              </>
            )}

            <button
              onClick={loginMode === 'password' ? onPasswordLogin : onEmailLogin}
              disabled={
                isVerifying || 
                !loginEmail.trim() || 
                (loginMode === 'password' && !loginPassword.trim()) ||
                (loginMode === 'password' && passwordMode === 'signup' && !confirmPassword.trim())
              }
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isVerifying 
                ? (loginMode === 'password' 
                    ? (passwordMode === 'signup' ? 'Creating account...' : 'Signing in...') 
                    : 'Sending...') 
                : (loginMode === 'password' 
                    ? (passwordMode === 'signup' ? 'Create Account' : 'Sign In') 
                    : 'Send Magic Link')
              }
            </button>

            {!authUser && defaultUser && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Or continue with default account
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    onUseDefaultUser(defaultUser);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                >
                  Continue as {defaultUser.username}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✉️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Magic link sent!
                  </p>
                  <p className="text-sm text-blue-700">
                    We've sent a sign-in link to <strong>{loginEmail}</strong>. 
                    Click the link in the email to verify and access your account.
                  </p>
                </div>
              </div>
            </div>

            {isVerifying && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⏳ Waiting for email verification... You'll be signed in automatically once you click the link.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                onEmailChange('');
                onPasswordChange('');
                onConfirmPasswordChange('');
                onLoginModeChange('password');
                onPasswordModeChange('login');
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
            >
              Use Different Email
            </button>

            {!authUser && defaultUser && (
              <button
                onClick={() => {
                  handleClose();
                  onUseDefaultUser(defaultUser);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
              >
                Continue with Default Account
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

