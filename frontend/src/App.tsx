import { useEffect } from 'react'
import AppRouter from './router'
import useAuthStore from './store/authStore'
import useCartStore from './store/cartStore'

function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loadFromBackend = useCartStore((s) => s.loadFromBackend)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isAuthenticated) {
      loadFromBackend()
    }
  }, [isAuthenticated, loadFromBackend])

  return <AppRouter />
}

export default App
