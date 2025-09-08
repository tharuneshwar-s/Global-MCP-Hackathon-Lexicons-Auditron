import './Loading.css'

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <h2>🛡️ Auditron</h2>
        <p>Loading your security dashboard...</p>
      </div>
    </div>
  )
}
