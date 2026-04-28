import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import FOFA from './FOFA.jsx'
import PersonalPortal from './PersonalPortal.jsx'
import AdminDashboard from './AdminDashboard.jsx'

function App() {
  const [currentView, setCurrentView] = useState('site')

  useEffect(() => {
    const updateView = () => {
      const hash = window.location.hash
      if (hash === '#portal') {
        setCurrentView('portal')
      } else if (hash === '#admin') {
        setCurrentView('admin')
      } else {
        setCurrentView('site')
      }
    }

    updateView()
    window.addEventListener('hashchange', updateView)
    return () => window.removeEventListener('hashchange', updateView)
  }, [])

  return (
    <>
      {currentView === 'site' && <FOFA />}
      {currentView === 'portal' && <PersonalPortal />}
      {currentView === 'admin' && <AdminDashboard />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
