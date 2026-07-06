import { useState, useEffect } from 'react'
import './App.css'

// Deduplicate events by id across multiple API calls
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;

        // Search multiple keywords to get a fuller picture
        const keywords = [
          "juneteenth",
          "black music festival",
          "african american festival",
          "soul music festival",
          "hip hop festival",
        ];

        const requests = keywords.map(kw =>
          fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=${encodeURIComponent(kw)}&countryCode=US&size=10&sort=date,asc`
          ).then(r => r.json())
        );

        const results = await Promise.all(requests);

        const allRaw = results.flatMap(data => data._embedded?.events || []);

        const normalized = allRaw.map(event => ({
          id: event.id,
          title: event.name,
          date: event.dates?.start?.localDate || "TBD",
          venue: event._embedded?.venues?.[0]?.name || "TBD",
          city: event._embedded?.venues?.[0]?.city?.name || "TBD",
          state: event._embedded?.venues?.[0]?.state?.stateCode || "",
          category: event.classifications?.[0]?.segment?.name || "Other",
          genre: event.classifications?.[0]?.genre?.name || "Other",
          url: event.url,
          priceMin: event.priceRanges?.[0]?.min ?? null,
        }));

        // Dedupe and sort by date
        const deduped = dedupeById(normalized).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        setEvents(deduped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ── Filtered list ──
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ── Unique categories for dropdown ──
  const categories = ["All", ...new Set(events.map(e => e.category))];

  // ── Summary statistics ──
  const totalEvents = filteredEvents.length;

  const avgPrice = (() => {
    const priced = filteredEvents.filter(e => e.priceMin !== null);
    if (priced.length === 0) return "N/A";
    const avg = priced.reduce((sum, e) => sum + e.priceMin, 0) / priced.length;
    return `$${avg.toFixed(2)}`;
  })();

  const topGenre = (() => {
    if (filteredEvents.length === 0) return "N/A";
    const counts = {};
    filteredEvents.forEach(e => { counts[e.genre] = (counts[e.genre] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  })();

  const upcomingThisMonth = (() => {
    const now = new Date();
    return filteredEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  })();

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <header className="dashboard__header">
        <h1 className="dashboard__title">✊🏾 Juneteenth & Black Culture Events</h1>
        <p className="dashboard__subtitle">
          Live event data powered by Ticketmaster — explore Black culture celebrations happening across the US.
        </p>
      </header>

      {/* ── Summary Statistics ── */}
      <section className="stats-bar">
        <div className="stat-card">
          <span className="stat-value">{totalEvents}</span>
          <span className="stat-label">Events Found</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{upcomingThisMonth}</span>
          <span className="stat-label">This Month</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{avgPrice}</span>
          <span className="stat-label">Avg. Starting Price</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{topGenre}</span>
          <span className="stat-label">Top Genre</span>
        </div>
      </section>

      {/* ── Search + Filter ── */}
      <section className="controls-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by name, venue, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="category-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </section>

      {/* ── Dashboard Table ── */}
      <section className="table-section">
        {loading && <p className="status-msg">⏳ Loading events...</p>}
        {error && (
          <p className="status-msg error">
            ⚠️ {error} — double-check your .env API key and restart the dev server.
          </p>
        )}
        {!loading && !error && filteredEvents.length === 0 && (
          <p className="status-msg">No events match your search.</p>
        )}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Price From</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => (
                  <tr key={event.id}>
                    <td className="row-num">{index + 1}</td>
                    <td className="event-title">{event.title}</td>
                    <td>{event.date}</td>
                    <td>{event.venue}</td>
                    <td>{event.city}{event.state ? `, ${event.state}` : ""}</td>
                    <td><span className="category-badge">{event.category}</span></td>
                    <td>{event.priceMin !== null ? `$${event.priceMin}` : "—"}</td>
                    <td>
                      <a href={event.url} target="_blank" rel="noreferrer" className="tickets-btn">
                        Tickets →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

export default App