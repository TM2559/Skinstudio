import React from 'react';
import { X, Phone, Mail, CalendarDays, CalendarPlus, Trash2 } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const OrderDetailModal = ({ order, onClose, onExportCalendar, onDelete }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-display text-xl font-bold text-stone-900">{order.name}</h3>
            <p className="text-xs font-bold text-stone-400 mt-1">{order.serviceName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-stone-600 mb-6">
          <div className="flex gap-3 items-center">
            <CalendarDays size={16} /> <span>{Utils.formatDateDisplay(order.date)}, {order.time}</span>
          </div>
          {order.phone && (
            <div className="flex gap-3 items-center">
              <Phone size={16} /> <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
            </div>
          )}
          {order.email && (
            <div className="flex gap-3 items-center">
              <Mail size={16} /> <a href={`mailto:${order.email}`} className="hover:underline truncate w-48 block">{order.email}</a>
            </div>
          )}
          {!order.phone && !order.email && (
            <div className="text-stone-400 text-xs">Bez kontaktu</div>
          )}
        </div>

        <div className="flex gap-3 mb-3">
          {order.phone && (
            <a href={`tel:${order.phone}`} className="flex-1 bg-stone-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
              <Phone size={14} /> Zavolat
            </a>
          )}
          {order.email && (
            <a href={`mailto:${order.email}`} className={`${order.phone ? 'flex-1' : 'w-full'} bg-white border border-stone-200 text-stone-800 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors`}>
              <Mail size={14} /> E-mail
            </a>
          )}
        </div>

        <button
          onClick={() => onExportCalendar(order)}
          className="w-full mb-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <CalendarPlus size={14} /> Uložit do kalendáře
        </button>

        <button onClick={() => onDelete(order.id)} className="w-full text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 py-3">
          <Trash2 size={14} /> Smazat objednávku
        </button>
      </div>
    </div>
  );
};

export default OrderDetailModal;
