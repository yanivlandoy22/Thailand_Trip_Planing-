import heroBeach from '../assets/hero-beach.svg';
import { useTripStore } from '../store/tripStore';

export default function Hero() {
  const settings = useTripStore((s) => s.settings);
  return (
    <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden">
      <img src={heroBeach} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-8 py-3 shadow-lg text-center">
          <h1 className="font-serif text-xl sm:text-3xl font-bold text-slate-800">
            {settings.trip_title || 'תכנון טיול לתאילנד'}
          </h1>
          {settings.hero_subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{settings.hero_subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
