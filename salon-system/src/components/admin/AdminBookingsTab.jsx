import React from 'react';
import { Search, Send } from 'lucide-react';
import { Utils } from '../../utils/helpers';
import ReservationList from './ReservationList';

const AdminBookingsTab = ({
  adminDateInput,
  setAdminDateInput,
  searchTerm,
  setSearchTerm,
  dailyReservations,
  onOpenReminders,
  onSelectOrder,
  todayKey,
}) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative">
        <input
          type="date"
          value={adminDateInput}
          onChange={(e) => setAdminDateInput(e.target.value)}
          className="w-full sm:w-auto p-3 bg-stone-800 text-white rounded-xl text-sm font-bold shadow-md outline-none cursor-pointer"
        />
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-stone-400" size={16} />
        <input
          type="text"
          placeholder="Filtrovat den..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-all"
        />
      </div>
      <button
        onClick={onOpenReminders}
        className="bg-white border border-stone-200 text-stone-600 px-4 py-3 sm:py-0 rounded-xl text-xs font-bold uppercase hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
      >
        <Send size={14} /> <span className="hidden sm:inline">Připomínky</span>
      </button>
    </div>

    <div className="flex justify-between items-end mt-4 mb-2">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
        {Utils.formatDateKey(new Date()) === Utils.getDateKeyFromISO(adminDateInput)
          ? 'Dnešní agenda'
          : `Agenda: ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))}`}
      </h3>
      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-lg font-bold">
        {dailyReservations.length} rezervací
      </span>
    </div>

    <ReservationList
      data={dailyReservations}
      emptyMsg={`Pro datum ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))} nejsou žádné rezervace.`}
      onSelectOrder={onSelectOrder}
      todayKey={todayKey}
    />
  </div>
);

export default AdminBookingsTab;
