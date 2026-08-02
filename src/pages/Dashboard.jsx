import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../App'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ["#A0522D", "#f5d78e", "#2d6a4f", "#be6d48", "#004a1f", "#c9b99a"];

function Dashboard() {
  const { events, loading, error } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // ── Filters ──
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...new Set(events.map(e => e.category))];

  // ── Summary stats ──
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

  // ── Chart data: events by genre (bar chart) ──
  const genreChartData = (() => {
    const counts = {};
    events.forEach(e => { counts[e.genre] = (counts[e.genre] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }));
  })();

  // ── Chart data: events by category (pie chart) ──
  const categoryChartData = (() => {
    const counts = {};
    events.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <header className="dashboard__header">
        <h1 className="dashboard__title">🎈🍾 Upcoming Events and Celebrations</h1>
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

      {/* ── Charts ── */}
      {!loading && events.length > 0 && (
        <section className="charts-section">
          <div className="chart-card">
            <h2 className="chart-title">Events by Genre</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={genreChartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
                <XAxis
                  dataKey="genre"
                  tick={{ fill: "#f0e6d3", fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#f0e6d3", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#003815", border: "1px solid #A0522D", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#A0522D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Events by Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#f0e6d3" }}
                >
                  {categoryChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#003815", border: "1px solid #A0522D", color: "#fff" }}
                />
                <Legend wrapperStyle={{ color: "#f0e6d3", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
                  <tr key={event.id} className="clickable-row">
                    <td className="row-num">{index + 1}</td>
                    <td className="event-title">
                      {/* clicking the title navigates to detail view */}
                      <Link to={`/events/${event.id}`} className="event-detail-link">
                        {event.title}
                      </Link>
                    </td>
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

export default Dashboard