import { useState } from 'react'
import Navbar from './components/navbar'
import './App.css'
import Team from './components/Team'
import Articles from './components/Articles'
import Contact from './components/Contact'
import Admin from './components/Admin'
import Hero from './components/Hero'
import CategoryPage from './components/CategoryPage'
import ArticleDetail from './components/ArticleDetail'

function App() {
  const [activeTab, setActiveTab] = useState("")
  const [view, setView] = useState("home") // home | category | article | admin
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [prevView, setPrevView] = useState("home")

  function goHome() {
    setView("home")
    setActiveTab("")
    setSelectedArticleId(null)
    setPrevView("home")
  }

  function openCategory(tab) {
    setActiveTab(tab)
    setView("category")
  }

  function openArticle(articleId) {
    setPrevView(view) // remember where we came from
    setSelectedArticleId(articleId)
    setView("article")
  }

  function goBackFromArticle() {
    setView(prevView || "home")
    setSelectedArticleId(null)
  }

  function openAdmin() {
    setPrevView(view)
    setView("admin")
  }

  function closeAdmin() {
    setView(prevView || "home")
  }

  return (
    <div>
      <Navbar
        activeTab={activeTab}
        onTabClick={openCategory}
        onHomeClick={goHome}
        onProfileClick={openAdmin}
      />

      {view === "home" && (
        <>
          <Hero />
          <Articles activeTab={activeTab} onOpenArticle={openArticle} />
          <Team />
          <Contact />
        </>
      )}

      {view === "article" && (
        <ArticleDetail
          articleId={selectedArticleId}
          onBack={goBackFromArticle}
        />
      )}

      {view === "category" && (
        <CategoryPage
          categoryName={activeTab}
          onBack={goHome}
          onOpenArticle={openArticle}
        />
      )}

      {view === "admin" && (
        <div>
          {/* tiny back control, since Admin already has its own header */}
          <div className="bg-white px-20 pt-6">
            <button
              onClick={closeAdmin}
              className="text-black font-semibold tracking-[0.06em] uppercase"
            >
              ← Назад
            </button>
          </div>
          <Admin />
        </div>
      )}
    </div>
  )
}

export default App
