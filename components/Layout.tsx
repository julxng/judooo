
import React from 'react';
import { TabType, User, Language } from '../types';
import { t } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout, onOpenAuth, language, setLanguage }) => {
  const tabs: {id: TabType, label: string, icon: React.ReactNode}[] = [
    { 
      id: 'marketplace', 
      label: t('nav.marketplace', language), 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg> 
    },
    { 
      id: 'events', 
      label: t('nav.exhibitions', language), 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    { 
      id: 'saved', 
      label: t('nav.watchlist', language), 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    },
    { 
      id: 'admin', 
      label: t('nav.admin', language), 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    { 
      id: 'about', 
      label: t('nav.about', language), 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => setActiveTab('marketplace')}>
              <img src="/judooo_Favicon.svg" alt="Judooo icon" className="w-10 h-10 md:w-11 md:h-11" />
              <img src="/judooo_Logo.svg" alt="Judooo" className="h-6 md:h-8 w-auto" />
            </div>
            
            <nav className="hidden md:flex items-center space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-2 px-3 text-[10px] font-black tracking-[0.14em] uppercase border rounded-sm transition-colors ${
                    activeTab === tab.id 
                      ? 'text-brand-orange border-brand-orange bg-orange-50' 
                      : 'text-slate-600 border-transparent hover:border-slate-300 hover:text-brand-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              <div className="flex items-center border-l border-slate-100 pl-6 ml-2 gap-3">
                <button 
                  onClick={() => setLanguage('vn')} 
                  className={`text-[10px] font-black transition-colors ${language === 'vn' ? 'text-brand-black' : 'text-slate-200 hover:text-slate-400'}`}
                >
                  VN
                </button>
                <span className="text-slate-100 text-[10px]">|</span>
                <button 
                  onClick={() => setLanguage('en')} 
                  className={`text-[10px] font-black transition-colors ${language === 'en' ? 'text-brand-black' : 'text-slate-200 hover:text-slate-400'}`}
                >
                  EN
                </button>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-widest">{currentUser.name}</p>
                    <p className="text-[8px] text-brand-orange font-black uppercase tracking-widest mt-1">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                  <button onClick={onLogout} className="group relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border border-slate-100">
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-20 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-black/5">
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onOpenAuth}
                  className="bg-brand-black text-white px-4 md:px-6 py-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all"
                >
                  {t('nav.join', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - STABLE & COMPACT */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-slate-200 px-1 py-2 pb-safe flex justify-around items-center shadow-[0_-2px_15px_rgba(0,0,0,0.1)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 flex-1 min-w-0 ${
              activeTab === tab.id ? 'text-brand-orange' : 'text-slate-500'
            }`}
          >
            {tab.icon}
            <span className="text-[6px] font-black uppercase tracking-tighter truncate w-full text-center">
              {tab.label}
            </span>
          </button>
        ))}
        <button 
          onClick={() => setLanguage(language === 'vn' ? 'en' : 'vn')}
          className="flex flex-col items-center gap-1 flex-1 text-slate-400"
        >
          <span className="w-4 h-4 flex items-center justify-center border border-slate-200 text-[7px] font-black rounded-sm">
            {language.toUpperCase()}
          </span>
          <span className="text-[6px] font-black uppercase tracking-tighter">Lang</span>
        </button>
      </nav>

      <main className="flex-grow bg-white">
        {children}
      </main>

      {/* COMPACT FOOTER FOR MOBILE */}
      <footer className="bg-slate-50 border-t border-slate-100 py-10 md:py-20 pb-32 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 text-center md:text-left">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4 md:mb-8">
                <img src="/judooo_Favicon.svg" alt="Judooo icon" className="w-10 h-10" />
                <img src="/judooo_Logo.svg" alt="Judooo" className="h-7 md:h-9 w-auto" />
              </div>
              <p className="mt-2 text-slate-500 max-w-sm mx-auto md:mx-0 text-xs md:text-base leading-relaxed font-medium">
                {t('footer.desc', language)}
              </p>
            </div>
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] mb-4 md:mb-8 text-slate-400">
                {t('footer.heading.judooo', language)}
              </h4>
              <ul className="space-y-2 md:space-y-4 text-slate-600 text-[10px] md:text-sm font-black uppercase tracking-widest">
                <li><button onClick={() => setActiveTab('about')} className="hover:text-brand-orange transition-colors">{t('footer.links.about', language)}</button></li>
                <li><button onClick={() => setActiveTab('about')} className="hover:text-brand-orange transition-colors">{t('footer.links.terms', language)}</button></li>
                <li><button onClick={() => setActiveTab('about')} className="hover:text-brand-orange transition-colors">{t('footer.links.privacy', language)}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] mb-4 md:mb-8 text-slate-400">
                {t('footer.heading.social', language)}
              </h4>
              <div className="flex justify-center md:flex-col md:justify-start gap-4 md:space-y-4 text-slate-600 text-[10px] md:text-sm font-black uppercase tracking-widest">
                <a href="https://www.facebook.com/judooo.art" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">FB</a>
                <a href="https://www.instagram.com/judooo.art/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">IG</a>
                <a href="https://www.tiktok.com/@judooo.art" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">TT</a>
              </div>
            </div>
          </div>
          <div className="mt-10 md:mt-20 pt-6 md:pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[8px] md:text-[10px] uppercase tracking-[0.1em] font-black text-center gap-4">
            <span>{t('footer.copy', language)}</span>
            <div className="flex gap-4 md:gap-8">
              <span className="hover:text-brand-orange transition-colors cursor-pointer" onClick={() => setActiveTab('about')}>{t('footer.links.privacy', language)}</span>
              <span className="hover:text-brand-orange transition-colors cursor-pointer" onClick={() => setActiveTab('about')}>{t('footer.links.terms', language)}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
