import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import Hero from './components/Hero';
import ToastContainer from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { useTripStore } from './store/tripStore';

import Itinerary from './pages/Itinerary';
import Flights from './pages/Flights';
import Hotels from './pages/Hotels';
import Activities from './pages/Activities';
import Transfers from './pages/Transfers';
import Checklist from './pages/Checklist';
import Expenses from './pages/Expenses';
import Tips from './pages/Tips';
import Chat from './pages/Chat';
import Organizer from './pages/Organizer';

export default function App() {
  const load = useTripStore((s) => s.load);
  const { pathname } = useLocation();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const showHero = pathname !== '/organizer' && pathname !== '/chat';

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Navbar />
      {showHero && <Hero />}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Itinerary />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/organizer" element={<Organizer />} />
        </Routes>
      </main>
      <TabBar />
      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}
