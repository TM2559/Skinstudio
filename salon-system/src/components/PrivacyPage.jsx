import React from 'react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import { WEB_CONTENT } from '../constants/content';
import { SEO } from '../constants/seo';
import PrivacyContent from './PrivacyContent';

export default function PrivacyPage() {
  const { footer, privacy } = WEB_CONTENT;

  useSEO(SEO.privacy);

  return (
    <div className="min-h-screen skin-bg">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <p className="mb-6">
          <Link
            to="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Zpět na úvod
          </Link>
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          {privacy.pageTitle}
        </h1>
        <p className="text-sm text-stone-500 mb-10">
          Informace o zpracování osobních údajů v souladu s GDPR.
        </p>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 pt-2 pb-1">
            <PrivacyContent footer={footer} privacy={privacy} isDark={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
