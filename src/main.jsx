import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import FOFA from './FOFA.jsx'
import PersonalPortal from './PersonalPortal.jsx'

function App() {
  const [currentView, setCurrentView] = useState('site')

  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#portal') {
      setCurrentView('portal')
    } else {
      setCurrentView('site')
    }

    const handleHashChange = () => {
      const newHash = window.location.hash
      if (newHash === '#portal') {
        setCurrentView('portal')
      } else {
        setCurrentView('site')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <>
      {currentView === 'site' && <FOFA />}
      {currentView === 'portal' && <PersonalPortal />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
