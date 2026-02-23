import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import AdminGallerySubTab from './AdminGallerySubTab';
import AdminTransformationsSubTab from './AdminTransformationsSubTab';

const SUB_TABS = [
  { id: 'galerie', label: 'Galerie' },
  { id: 'promeny', label: 'Proměny' },
];

export default function AdminPhotosTab() {
  const [subTab, setSubTab] = useState('galerie');

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <ImageIcon size={18} className="text-stone-400" /> Fotografie (Kosmetika)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Galerie = jednotlivé fotky do sekce „Moje práce“. Proměny = před/po dvojice do sekce „Proměny“. Nepleťte si je – každá sekce má vlastní formulář.
        </p>

        {/* Segmented control: Galerie | Proměny */}
        <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 mb-6 w-full max-w-sm">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                subTab === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'galerie' && <AdminGallerySubTab />}
        {subTab === 'promeny' && <AdminTransformationsSubTab />}
      </section>
    </div>
  );
}
