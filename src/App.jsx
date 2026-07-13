import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'

// ── Shared context so both pages access the same fetched data ──
export const EventsContext = createContext(null);

export function useEvents() {
  return useContext(EventsContext);
}

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

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;
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
          time: event.dates?.start?.localTime?.slice(0, 5) || "TBD",
          venue: event._embedded?.venues?.[0]?.name || "TBD",
          city: event._embedded?.venues?.[0]?.city?.name || "TBD",
          state: event._embedded?.venues?.[0]?.state?.stateCode || "",
          address: event._embedded?.venues?.[0]?.address?.line1 || "",
          category: event.classifications?.[0]?.segment?.name || "Other",
          genre: event.classifications?.[0]?.genre?.name || "Other",
          subGenre: event.classifications?.[0]?.subGenre?.name || "",
          url: event.url,
          priceMin: event.priceRanges?.[0]?.min ?? null,
          priceMax: event.priceRanges?.[0]?.max ?? null,
          image: event.images?.find(img => img.ratio === "16_9" && img.width > 500)?.url
            || event.images?.[0]?.url || null,
          info: event.info || event.pleaseNote || "",
          accessibility: event.accessibility?.info || "",
        }));
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

  return (
    <EventsContext.Provider value={{ events, loading, error }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </EventsContext.Provider>
  );
}

export default App