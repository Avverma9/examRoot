import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Videos from './pages/Videos'
import PracticeSets from './pages/PracticeSets'
import MockTests from './pages/MockTests'
import TestSeries from './pages/TestSeries'
import Banners from './pages/Banners'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="videos" element={<Videos />} />
            <Route path="banners" element={<Banners />} />
            <Route path="practice" element={<PracticeSets />} />
            <Route path="mock-tests" element={<MockTests />} />
            <Route path="test-series" element={<TestSeries />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
