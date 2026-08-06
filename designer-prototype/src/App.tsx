import './App.css'
import ComponentsPage from './pages/ComponentsPage/ComponentsPage'
import HomePage from './pages/HomePage/HomePage'
import HomePageReviewB from './pages/HomePage/HomePageReviewB'
import MVDetailPage from './pages/MVDetailPage/MVDetailPage'
import SongDetailPage from './pages/SongDetailPage/SongDetailPage'
import SongCreatePage from './pages/SongCreatePage/SongCreatePage'
import MVCreatePage from './pages/MVCreatePage/MVCreatePage'
import MVStoryboardPage from './pages/MVStoryboardPage/MVStoryboardPage'
import MVResultPage from './pages/MVResultPage/MVResultPage'
import MVEditPage from './pages/MVEditPage/MVEditPage'
import HistoryPage from './pages/HistoryPage/HistoryPage'
import BlogPage from './pages/BlogPage/BlogPage'
import AccountPage from './pages/AccountPage/AccountPage'
import CreditsPage from './pages/CreditsPage/CreditsPage'
import CommunityProfilePage from './pages/CommunityProfilePage/CommunityProfilePage'
import AuthProvider from './components/AuthProvider/AuthProvider'

function AppRoutes() {
  if (window.location.pathname.startsWith('/components')) {
    return <ComponentsPage />
  }

  if (window.location.pathname.startsWith('/home-review-b')) {
    return <HomePageReviewB />
  }

  if (window.location.pathname === '/' || window.location.pathname.startsWith('/home')) {
    return <HomePage />
  }

  if (window.location.pathname.startsWith('/mv-detail')) {
    return <MVDetailPage />
  }

  if (window.location.pathname.startsWith('/song-detail')) {
    return <SongDetailPage />
  }

  if (window.location.pathname.startsWith('/song-create')) {
    return <SongCreatePage />
  }

  if (window.location.pathname.startsWith('/mv-create')) {
    return <MVCreatePage />
  }

  if (window.location.pathname.startsWith('/mv-storyboard')) {
    return <MVStoryboardPage />
  }

  if (window.location.pathname.startsWith('/mv-result')) {
    return <MVResultPage />
  }

  if (window.location.pathname.startsWith('/mv-edit')) {
    return <MVEditPage />
  }

  if (window.location.pathname.startsWith('/history')) {
    return <HistoryPage />
  }

  if (window.location.pathname.startsWith('/account/credits')) {
    return <CreditsPage />
  }

  if (window.location.pathname.startsWith('/community-profile')) {
    return <CommunityProfilePage />
  }

  if (window.location.pathname.startsWith('/account')) {
    return <AccountPage />
  }

  if (window.location.pathname.startsWith('/blog3')) {
    return <BlogPage version={3} />
  }

  if (window.location.pathname.startsWith('/blog')) {
    return <BlogPage version={1} />
  }

  return (
    <div className="page">
      <p>YCM UI Prototype</p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
