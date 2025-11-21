import React, { createContext, useContext, useState, useEffect } from 'react'
import { fetchAuthSession, signInWithRedirect, signOut, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSignIn, setIsSignIn] = useState(false)

  useEffect(() => {
    checkAuthSession()
    
    // Listen to auth events
    const hubListenerCancelToken = Hub.listen('auth', (data) => {
      const { payload } = data
      switch (payload.event) {
        case 'signedIn':
          checkAuthSession()
          break
        case 'signedOut':
          setUser(null)
          setIsSignIn(false)
          break
        case 'tokenRefresh':
          checkAuthSession()
          break
        default:
          break
      }
    })

    return () => {
      hubListenerCancelToken()
    }
  }, [])

  const checkAuthSession = async () => {
    try {
      setLoading(true)
      const session = await fetchAuthSession()
      
      if (session.tokens && session.tokens.accessToken) {
        try {
          const currentUser = await getCurrentUser()
          const attributes = await fetchUserAttributes()
          
          setUser({
            ...currentUser,
            attributes,
            tokens: session.tokens,
          })
          setIsSignIn(true)
        } catch (attrError) {
          // If attributes fetch fails (e.g., token revoked), treat as signed out
          console.warn('Error fetching user attributes, clearing session:', attrError)
          await clearSession()
        }
      } else {
        await clearSession(false)
      }
    } catch (error) {
      console.error('Error checking auth session:', error)
      await clearSession(false)
    } finally {
      setLoading(false)
    }
  }

  const clearSession = async (signOutUser = true) => {
    if (signOutUser) {
      try {
        await signOut()
      } catch (signOutError) {
        console.warn('Error signing out from Cognito:', signOutError)
      }
    }
    setUser(null)
    setIsSignIn(false)
  }

  const signInWithProvider = async (provider) => {
    try {
      await signInWithRedirect({ provider })
    } catch (error) {
      if (error?.name === 'UserAlreadyAuthenticatedException') {
        await clearSession()
        await signInWithRedirect({ provider })
        return
      }
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      await signInWithProvider('Google')
    } catch (error) {
      throw error
    }
  }

  const signInWithApple = async () => {
    try {
      await signInWithProvider('Apple')
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await clearSession()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    isSignIn,
    signInWithGoogle,
    signInWithApple,
    logout,
    loading,
    checkAuthSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
