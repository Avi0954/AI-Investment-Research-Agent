import React, { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { AnalysisWorkspace } from '../components/Analysis/AnalysisWorkspace';
import Loading from '../components/Loading/Loading';
import ErrorAlert from '../components/ErrorAlert/ErrorAlert';

const Home = () => {
  const { data, isLoading, error, analyze, retry } = useAnalysis();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      analyze(query.trim());
    }
  };

  const handlePopularSearch = (company) => {
    setQuery(company);
    analyze(company);
  };

  if (data && !isLoading && !error) {
    return <AnalysisWorkspace data={data} />;
  }

  return (
    <div className="font-sans min-h-[100dvh] md:h-[100dvh] md:overflow-hidden flex flex-col bg-brand-black text-white relative">
      {/* BEGIN: Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md hairline-b border-b border-brand-border">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <button onClick={() => window.location.reload()} className="font-headline-md text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity flex items-center gap-1">
              Lumina<span className="font-light">AI</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button className="material-symbols-outlined text-secondary hover:text-white transition-all text-xl opacity-0 pointer-events-none hidden md:block">share</button>
            <button className="material-symbols-outlined text-secondary hover:text-white transition-all text-xl opacity-0 pointer-events-none hidden md:block">bookmark</button>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-4 md:px-6 py-2 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm">
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>
      </header>
      {/* END: Navigation */}

      {/* BEGIN: Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-6 lg:px-10 relative overflow-hidden pt-24 pb-16 md:pt-16 md:pb-0">
        {/* Subtle Background Overlay */}
        <div className="absolute inset-0 faint-grid opacity-20 pointer-events-none"></div>

        <div className="z-10 w-full max-w-[1200px] text-center flex flex-col items-center -mt-12 md:-mt-24">
          {(!data && !isLoading && !error) && (
            <>
              {/* Hero Section */}
              <div className="mb-10 md:mb-12 animate-fade-in" data-purpose="hero-text">
                <h1 className="text-[48px] md:text-[80px] font-extrabold tracking-tighter mb-6 md:mb-8 leading-[0.95]">
                  What company should we<br /><span className="italic font-light">analyze?</span>
                </h1>
                <p className="text-brand-muted text-lg md:text-[20px] max-w-[760px] mx-auto font-light leading-relaxed">
                  Access institutional-grade insights backed by financial data, market news, and advanced logical reasoning.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative w-full max-w-[900px] mx-auto mb-8 md:mb-12 animate-fade-in" data-purpose="search-container">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input w-full bg-brand-deep border border-brand-border h-[60px] pl-16 pr-36 text-white placeholder-brand-muted rounded-md transition-all duration-200 text-base focus:border-white focus:outline-none"
                  placeholder="Search by company name or stock symbol..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-black text-xs font-bold px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? 'ANALYZING...' : 'ANALYZE'}
                </button>
              </form>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-brand-muted animate-fade-in" data-purpose="popular-searches">
                <span className="uppercase tracking-widest text-[10px] font-bold">Popular:</span>
                {['NVIDIA', 'APPLE', 'TESLA', 'MICROSOFT', 'AMAZON'].map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => handlePopularSearch(company)}
                    className="hover:text-white transition-colors"
                  >
                    {company}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Analysis States */}
          {error && (
            <div className="w-full animate-fade-in">
              <ErrorAlert message={error} onRetry={retry} />
            </div>
          )}

          {isLoading && (
            <div className="w-full animate-fade-in flex flex-col items-center justify-center mt-12">
              <Loading />
            </div>
          )}
        </div>
      </main>
      {/* END: Main Content */}

    </div>
  );
};

export default Home;
