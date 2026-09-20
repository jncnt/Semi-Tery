type Zone = {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  width: number;
  height: number;
  available: number;
  reserved: number;
  occupied: number;
  color: string;
};

const zones: Zone[] = [
  { id: 'st-therese', name: 'St. Therese', area: 'North Garden', x: 90, y: 118, width: 236, height: 150, available: 14, reserved: 5, occupied: 3, color: '#DDE9DF' },
  { id: 'st-monica', name: 'St. Monica', area: 'Central Walk', x: 370, y: 120, width: 240, height: 182, available: 12, reserved: 4, occupied: 2, color: '#EADDB5' },
  { id: 'st-anne', name: 'St. Anne', area: 'Garden Crest', x: 660, y: 118, width: 236, height: 170, available: 16, reserved: 6, occupied: 1, color: '#E4E7D4' },
  { id: 'memorial-plaza', name: 'Memorial Plaza', area: 'Gathering Court', x: 330, y: 348, width: 290, height: 138, available: 0, reserved: 0, occupied: 0, color: '#C9D9D0' },
  { id: 'lake-view', name: 'Lake View', area: 'Quiet Retreat', x: 70, y: 392, width: 200, height: 130, available: 9, reserved: 2, occupied: 1, color: '#D9E7E3' },
  { id: 'sunset-terrace', name: 'Sunset Terrace', area: 'West Niche', x: 688, y: 328, width: 220, height: 172, available: 8, reserved: 4, occupied: 2, color: '#EFE2C7' },
];

const statCards = [
  { label: 'Available plots', value: '59', detail: 'Open for reservation', tone: 'bg-[#E8F0EA] text-[#1F4035]' },
  { label: 'Reserved', value: '21', detail: 'Awaiting confirmation', tone: 'bg-[#F5EEDB] text-[#8A6A2F]' },
  { label: 'Occupied', value: '9', detail: 'Families already assigned', tone: 'bg-[#F1E5E2] text-[#76534B]' },
];

const legend = [
  { label: 'Available', color: '#8FAF9A' },
  { label: 'Reserved', color: '#D7C58F' },
  { label: 'Occupied', color: '#B57F78' },
  { label: 'Memorial / Shared spaces', color: '#DDE9DF' },
];

const VicinityMap = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="rounded-[2rem] bg-[#1F4035] p-8 text-white shadow-lg shadow-[#1F4035]/10 max-md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Vicinity map</h1>
            <p className="mt-3 text-sm leading-6 text-[#DDE9DF] md:text-base">
              Explore the memorial park layout and identify the calmer sections, amenities, and the most active plot zones at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#E8F0EA]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D7C58F]" />
            Updated today
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border border-[#E1E7E2] p-5 shadow-sm ${card.tone}`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-75">{card.label}</p>
            <div className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</div>
            <p className="mt-2 text-sm opacity-80">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="overflow-hidden rounded-[2rem] border border-[#E1E7E2] bg-white p-3 shadow-sm">
          <div className="mb-3 px-2 pt-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F5D50]">Location</p>
          </div>

          <div className="overflow-hidden rounded-[1.4rem] border border-[#E1E7E2] bg-[#F4F7F3]">
            <iframe
              title="Garden of Peace Memorial Park on Google Maps"
              src="https://www.google.com/maps?q=Garden%20of%20Peace%20Memorial%20Park&z=14&output=embed"
              className="h-[360px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E1E7E2] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F5D50]">Visit</p>
          <h3 className="mt-2 text-2xl font-extrabold text-[#1F4035]">Garden of Peace Memorial Park</h3>
          <p className="mt-3 text-sm leading-6 text-[#6B756F]">
            Use the map to get directions, locate the park entrance, and see nearby landmarks around the property shown in the reference image.
          </p>

          <div className="mt-5 space-y-3 rounded-2xl bg-[#F4F7F3] p-4 text-sm text-[#26332D]">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2F5D50]" />
              <span>Search by name: Garden of Peace Memorial Park</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D7C58F]" />
              <span>Use the route planner for the fastest access from your location</span>
            </div>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Garden+of+Peace+Memorial+Park"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center rounded-xl bg-[#E8F0EA] px-4 py-2.5 text-sm font-bold text-[#1F4035] transition hover:bg-[#DDE9DF]"
          >
            Get directions
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <section className="rounded-[2rem] border border-[#E1E7E2] bg-white p-4 shadow-sm max-md:p-3">
          <div className="mb-4 flex items-center justify-between px-2 pt-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F5D50]">Ground plan</p>
              <h2 className="mt-1 text-xl font-extrabold text-[#1F4035]">Garden of Peace memorial park</h2>
            </div>
            <div className="rounded-full border border-[#D7E5D9] bg-[#F4F7F3] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#2F5D50]">
              6 sections
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#E1E7E2] bg-[#F4F7F3]">
            <svg viewBox="0 0 980 620" className="block h-[520px] w-full max-w-full" role="img" aria-label="Garden of Peace locality map">
              <rect x="0" y="0" width="980" height="620" fill="#F4F7F3" />

              <path d="M52 420 L260 420 L260 560 L52 560 Z" fill="#DDE9DF" opacity="0.9" />
              <path d="M690 450 L930 450 L930 560 L690 560 Z" fill="#E7EFE8" opacity="0.9" />
              <path d="M120 120 L860 120" stroke="#C8D2C9" strokeWidth="20" strokeLinecap="round" opacity="0.85" />
              <path d="M120 500 L860 500" stroke="#C8D2C9" strokeWidth="18" strokeLinecap="round" opacity="0.85" />
              <path d="M230 80 L230 540" stroke="#D6DDD5" strokeWidth="16" strokeLinecap="round" opacity="0.85" />
              <path d="M470 80 L470 540" stroke="#D6DDD5" strokeWidth="16" strokeLinecap="round" opacity="0.85" />
              <path d="M750 80 L750 540" stroke="#D6DDD5" strokeWidth="16" strokeLinecap="round" opacity="0.85" />

              <path d="M240 218 C 340 180, 405 178, 470 202 L470 332 C 405 358, 340 354, 240 318 Z" fill="#C9D9D0" opacity="0.9" />
              <path d="M360 360 L620 360 L620 470 L360 470 Z" fill="#DDE9DF" opacity="0.9" />

              {zones.map((zone) => {
                const statusColor =
                  zone.available > 0 ? '#8FAF9A' :
                  zone.reserved > 0 ? '#D7C58F' :
                  '#B57F78';

                return (
                  <g key={zone.id} transform={`translate(${zone.x} ${zone.y})`}>
                    <rect
                      x="0"
                      y="0"
                      width={zone.width}
                      height={zone.height}
                      rx="24"
                      fill={zone.color}
                      stroke="#D2DCD1"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="16"
                      y="16"
                      width={zone.width - 32}
                      height={zone.height - 32}
                      rx="18"
                      fill={statusColor}
                      opacity={zone.name === 'Memorial Plaza' ? 0.18 : 0.9}
                    />
                    <text x="22" y="36" fontSize="18" fontWeight="800" fill="#1F4035">{zone.name}</text>
                    <text x="22" y="60" fontSize="11" fill="#3B554B" fontWeight="700">{zone.area}</text>
                    <text x="22" y={zone.height - 22} fontSize="12" fill="#1F4035" fontWeight="800">
                      {zone.available} available • {zone.reserved} reserved • {zone.occupied} occupied
                    </text>
                  </g>
                );
              })}

              <text x="92" y="80" fontSize="18" fontWeight="700" fill="#1F4035">Main Avenue</text>
              <text x="792" y="80" fontSize="18" fontWeight="700" fill="#1F4035">Garden Access</text>
              <text x="318" y="290" fontSize="16" fontWeight="800" fill="#1F4035">Gathering court</text>
              <text x="88" y="268" fontSize="16" fontWeight="800" fill="#1F4035">Quiet path</text>
              <text x="717" y="258" fontSize="16" fontWeight="800" fill="#1F4035">Sunset walk</text>
            </svg>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F5D50]">Legend</p>
            <div className="mt-4 space-y-3">
              {legend.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm font-semibold text-[#26332D]">
                  <span className="h-4 w-4 rounded-full border border-white/40" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F5D50]">Notable zones</p>
            <div className="mt-4 space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="rounded-2xl border border-[#E1E7E2] bg-[#F8FAF8] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#1F4035]">{zone.name}</h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5F716A]">{zone.area}</p>
                    </div>
                    <span className="rounded-full bg-[#E8F0EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2F5D50]">
                      {zone.available > 0 ? 'Open' : 'Shared'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-[#26332D]">
                    <span>{zone.available} available</span>
                    <span>{zone.reserved} reserved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VicinityMap;
