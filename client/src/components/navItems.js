import {
  CalendarIcon,
  PlaneIcon,
  HotelIcon,
  PalmIcon,
  VanIcon,
  CheckIcon,
  CoinsIcon,
  BulbIcon,
  BotIcon,
  GearIcon,
} from './Icons';

// Top-level navigation. טיפים + אזור מארגן live in the "עוד" menu so the
// itinerary/flights/hotels/activities/transfers stay prominent.
export const NAV_ITEMS = [
  { to: '/', label: 'מסלול', Icon: CalendarIcon },
  { to: '/flights', label: 'טיסות', Icon: PlaneIcon },
  { to: '/hotels', label: 'מלונות', Icon: HotelIcon },
  { to: '/activities', label: 'אטרקציות', Icon: PalmIcon },
  { to: '/transfers', label: 'העברות', Icon: VanIcon },
  { to: '/checklist', label: "צ'קליסט", Icon: CheckIcon },
  { to: '/expenses', label: 'הוצאות', Icon: CoinsIcon },
  { to: '/chat', label: 'צ׳אט AI', Icon: BotIcon },
];

export const MORE_ITEMS = [
  { to: '/tips', label: 'טיפים', Icon: BulbIcon },
  { to: '/organizer', label: 'אזור מארגן', Icon: GearIcon },
];
