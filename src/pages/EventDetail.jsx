import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../App'

function EventDetail() {
  const { id } = useParams();
  const { events, loading } = useEvents();

  // Find the specific event by id from the shared context
  const event = events.find(e => e.id === id);

  if (loading) {
    return (
      <div className="detail-page">
        <p className="status-msg">⏳ Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="detail-page">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <p className="status-msg error">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-layout">

        {/* ── Sidebar ── */}
        <aside className="detail-sidebar">
          <Link to="/" className="back-link">← Back to Dashboard</Link>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">📅 Date & Time</h3>
            <p>{event.date}</p>
            {event.time !== "TBD" && <p>{event.time}</p>}
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">📍 Location</h3>
            <p>{event.venue}</p>
            {event.address && <p>{event.address}</p>}
            <p>{event.city}{event.state ? `, ${event.state}` : ""}</p>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">🎭 Classification</h3>
            <p><span className="category-badge">{event.category}</span></p>
            <p style={{ marginTop: "8px", color: "#f5d78e" }}>{event.genre}</p>
            {event.subGenre && event.subGenre !== event.genre && (
              <p style={{ color: "#d4c5a9", fontSize: "0.85rem" }}>{event.subGenre}</p>
            )}
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">💵 Pricing</h3>
            {event.priceMin !== null ? (
              <p>
                From <strong style={{ color: "#f5d78e" }}>${event.priceMin}</strong>
                {event.priceMax !== null && event.priceMax !== event.priceMin
                  ? ` – $${event.priceMax}`
                  : ""}
              </p>
            ) : (
              <p>Pricing not listed</p>
            )}
          </div>

          <a href={event.url} target="_blank" rel="noreferrer" className="tickets-btn sidebar-tickets">
            🎟 Get Tickets →
          </a>
        </aside>

        {/* ── Main content ── */}
        <main className="detail-main">
          {event.image && (
            <img src={event.image} alt={event.title} className="detail-image" />
          )}

          <h1 className="detail-title">{event.title}</h1>

          <div className="detail-meta-row">
            <span className="category-badge">{event.category}</span>
            <span className="detail-date">{event.date}</span>
            <span className="detail-venue">{event.venue} · {event.city}{event.state ? `, ${event.state}` : ""}</span>
          </div>

          {event.info && (
            <div className="detail-section">
              <h2 className="detail-section-title">About This Event</h2>
              <p className="detail-body">{event.info}</p>
            </div>
          )}

          {event.accessibility && (
            <div className="detail-section">
              <h2 className="detail-section-title">♿ Accessibility</h2>
              <p className="detail-body">{event.accessibility}</p>
            </div>
          )}

          {!event.info && !event.accessibility && (
            <div className="detail-section">
              <p className="detail-body" style={{ color: "#d4c5a9" }}>
                Visit the Ticketmaster page for full event details, seating charts, and more.
              </p>
            </div>
          )}

          <div className="detail-section">
            <h2 className="detail-section-title">📊 Quick Facts</h2>
            <div className="facts-grid">
              <div className="fact-item">
                <span className="fact-label">Genre</span>
                <span className="fact-value">{event.genre}</span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Category</span>
                <span className="fact-value">{event.category}</span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Date</span>
                <span className="fact-value">{event.date}</span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Start Time</span>
                <span className="fact-value">{event.time}</span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Venue</span>
                <span className="fact-value">{event.venue}</span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Price From</span>
                <span className="fact-value">
                  {event.priceMin !== null ? `$${event.priceMin}` : "Not listed"}
                </span>
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default EventDetail