import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Ticket } from 'lucide-react';
import { apiGet, inr, fmtDateTime } from '../lib/format';
import { PageHeader, Countdown } from '../components/layout';
import { Card, Loader, EmptyState, Badge } from '../components/ui';
export default function UpcomingPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([apiGet('/api/upcoming'), apiGet('/api/purohits?status=approved')]).then(([u, p]) => { setEvents(u); setPurohits(p); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const name = (id: number) => purohits.find((p) => p.id === id)?.full_name;
  if (loading) return <Loader label="Loading upcoming pujas..." />;
  return (
    <div>
      <PageHeader title="Upcoming Pujas" subtitle="Community events with date, time, venue & live countdown" />
      {events.length === 0 ? <EmptyState title="No upcoming events" subtitle="Check back soon for community pujas." /> : (
        <div className="space-y-4">
          {events.map((u) => {
            const left = (u.seats_total || 0) - (u.seats_booked || 0);
            const isPast = new Date(u.event_date).getTime() <= Date.now();
            return (
              <Card key={u.id} className="overflow-hidden">
                <div className="relative">
                  <img src={u.image_url || '/images/havan.svg'} alt={u.title} className="w-full h-48 sm:h-60 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/90 via-maroon-950/25 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">{isPast ? <Badge tone="neutral">Completed</Badge> : <Badge tone="gold">Booking open</Badge>}{name(u.purohit_id) && <Badge tone="maroon">By {name(u.purohit_id)}</Badge>}</div>
                  <div className="absolute bottom-0 inset-x-0 p-4"><h2 className="font-display text-2xl text-white">{u.title}</h2><p className="text-white/85 text-[13px] font-medium mt-1">{u.description}</p></div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 bg-cream rounded-xl p-3"><Clock size={17} className="text-saffron-600 shrink-0" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Date & Time</p><p className="font-bold text-maroon-950 text-[13px]">{fmtDateTime(u.event_date)}</p></div></div>
                    <div className="flex items-center gap-2 bg-cream rounded-xl p-3"><MapPin size={17} className="text-saffron-600 shrink-0" /><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Venue</p><p className="font-bold text-maroon-950 text-[13px] truncate">{u.venue}</p></div></div>
                    <div className="flex items-center gap-2 bg-cream rounded-xl p-3"><Users size={17} className="text-saffron-600 shrink-0" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Seats left</p><p className="font-bold text-maroon-950 text-[13px]">{Math.max(0, left)} of {u.seats_total}</p></div></div>
                  </div>
                  {u.address && <p className="text-xs text-stone-500 mt-2 font-medium">{u.address}</p>}
                  {!isPast && (<div className="mt-3 bg-gradient-to-r from-maroon-900 to-maroon-800 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap"><div><p className="text-[11px] font-bold uppercase tracking-widest text-gold-300 mb-1.5">Puja begins in</p><Countdown target={u.event_date} dark /></div><div className="text-right"><p className="text-gold-200 text-xs font-semibold">Contribution</p><p className="font-display text-2xl text-white">{inr(u.price)}</p></div></div>)}
                  <div className="mt-3">
                    {isPast ? (<button disabled className="w-full bg-stone-100 text-stone-400 text-sm font-bold rounded-xl py-3">Event completed</button>) : left <= 0 ? (<button disabled className="w-full bg-stone-100 text-stone-400 text-sm font-bold rounded-xl py-3">House full</button>) : (<Link to={`/book?type=upcoming&upcomingId=${u.id}`} className="w-full inline-flex items-center justify-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white text-sm font-bold rounded-xl py-3"><Ticket size={16} /> Book Your Seat - {inr(u.price)}</Link>)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
