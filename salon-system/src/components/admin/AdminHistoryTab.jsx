import React, { useEffect } from 'react';
import { Search } from 'lucide-react';
import ReservationList from './ReservationList';
import Pagination from './Pagination';
import usePagination from '../../hooks/usePagination';

const PAGE_SIZE = 20;

const AdminHistoryTab = ({
  searchTerm,
  setSearchTerm,
  historyReservations,
  onSelectOrder,
  todayKey,
}) => {
  const { pageItems, page, totalPages, totalItems, nextPage, prevPage, resetPage } = usePagination(historyReservations, PAGE_SIZE);

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  return (
    <div className="w-full max-w-none mx-auto space-y-4 sm:space-y-6">
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
        data={pageItems}
        emptyMsg={searchTerm ? 'V archivu nic nenalezeno.' : 'Archiv je prázdný.'}
        onSelectOrder={onSelectOrder}
        todayKey={todayKey}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPrev={prevPage}
        onNext={nextPage}
      />
    </div>
  );
};

export default AdminHistoryTab;
