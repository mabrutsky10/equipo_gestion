import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SocialLoginButtons from '../components/Buttons/SocialLoginButtons'

const Login = () => {
  const [error, setError] = useState('')
  const { signInWithGoogle, signInWithApple, isSignIn, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isSignIn) {
      navigate('/home')
    }
  }, [loading, isSignIn, navigate])

  const handleGoogleLogin = async () => {
    try {
      setError('')
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.')
    }
  }

  const handleAppleLogin = async () => {
    try {
      setError('')
      await signInWithApple()
    } catch (error) {
      console.error('Error signing in with Apple:', error)
      setError('Error al iniciar sesión con Apple. Por favor, inténtalo de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Verificando sesión...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicio de sesión
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="mt-8">
          <SocialLoginButtons
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
          />
        </div>
      </div>
    </div>
  )
}

export default Login
