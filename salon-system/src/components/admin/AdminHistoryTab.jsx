import React from 'react';
import { Search } from 'lucide-react';
import ReservationList from './ReservationList';

const AdminHistoryTab = ({
  searchTerm,
  setSearchTerm,
  historyReservations,
  onSelectOrder,
  todayKey,
}) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-6">
      <p className="text-xs text-stone-500 font-medium">
        Zde najdete všechny proběhlé rezervace. Můžete vyhledávat podle jména, emailu nebo telefonu.
      </p>
    </div>

    <div className="relative">
      <Search className="absolute left-3 top-3 text-stone-400" size={16} />
      <input
        type="text"
        placeholder="Vyhledat v archivu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoFocus
        className="w-full pl-10 p-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-all shadow-sm"
      />
    </div>

    <ReservationList
      data={historyReservations}
      emptyMsg={searchTerm ? 'V archivu nic nenalezeno.' : 'Archiv je prázdný.'}
      onSelectOrder={onSelectOrder}
      todayKey={todayKey}
    />
  </div>
);

export default AdminHistoryTab;
