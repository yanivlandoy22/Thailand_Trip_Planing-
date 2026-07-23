import {
  HomeIcon,
  PlaneIcon,
  HotelIcon,
  PalmIcon,
  CheckIcon,
  CoinsIcon,
  BulbIcon,
  BotIcon,
} from './Icons';

export const NAV_ITEMS = [
  { to: '/', label: 'בית', Icon: HomeIcon },
  { to: '/flights', label: 'טיסות', Icon: PlaneIcon },
  { to: '/hotels', label: 'מלונות', Icon: HotelIcon },
  { to: '/activities', label: 'אטרקציות', Icon: PalmIcon },
  { to: '/checklist', label: "צ'קליסט", Icon: CheckIcon },
  { to: '/expenses', label: 'הוצאות', Icon: CoinsIcon },
  { to: '/tips', label: 'טיפים', Icon: BulbIcon },
  { to: '/chat', label: 'צ׳אט AI', Icon: BotIcon },
];
