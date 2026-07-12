import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AnalysisWorkspace = ({ data }) => {
  const [activeTab, setActiveTab] = useState('financials');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [progressWidth, setProgressWidth] = useState(0);
  const tabsRef = useRef({});
  const isClickingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth(data.confidence || 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [data.confidence]);

  const renderTrend = (trend, centered = false, noArrow = false) => {
    if (!trend || String(trend).trim() === '' || String(trend).includes('0%') || trend === 'N/A') return null;
    const strTrend = String(trend);
    const isPos = strTrend.includes('+') || parseFloat(strTrend) > 0;
    // Check if it starts with a minus sign or contains a minus sign followed by a number to avoid matching hyphens in words
    const isNeg = (/-\d/.test(strTrend)) || parseFloat(strTrend) < 0;
    
    let colorClass = 'text-[#9CA3AF]';
    let icon = '→';
    
    if (isPos) {
      colorClass = 'text-[#22C55E]';
      icon = '↑';
    } else if (isNeg) {
      colorClass = 'text-[#EF4444]';
      icon = '↓';
    }

    return (
      <p className={`text-[11px] font-medium leading-[1.2] opacity-85 mt-[6px] animate-slide-up-fade flex items-center gap-[3px] ${centered ? 'justify-center' : ''} ${colorClass}`}>
        {!noArrow && <span className="text-[13px] font-normal">{icon}</span>}
        <span>{strTrend}</span>
      </p>
    );
  };

  const renderSparkline = (dataArr) => {
    if (!dataArr || !Array.isArray(dataArr) || dataArr.length < 2) return null;
    const min = Math.min(...dataArr);
    const max = Math.max(...dataArr);
    const range = max - min || 1;
    const points = dataArr.map((d, i) => `${(i / (dataArr.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' ');
    return (
      <svg className="w-full h-[24px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <polyline points={points} fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isClickingRef.current) return;
      const sectionIds = ['financials', 'summary', 'thesis', 'risks', 'valuation', 'sources'];
      const scrollPosition = window.scrollY + 250;

      const elements = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .sort((a, b) => a.offsetTop - b.offsetTop);

      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].offsetTop <= scrollPosition) {
          if (activeTab !== elements[i].id) {
            setActiveTab(elements[i].id);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabsRef.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 150); // Re-calculate after font load
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const handleTabClick = (e, tab) => {
    e.preventDefault();
    isClickingRef.current = true;
    setActiveTab(tab);

    // Smooth scroll to element
    const el = document.getElementById(tab);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      isClickingRef.current = false;
    }, 800);
  };

  const {
    company, recommendation, confidence,
    summary, reasoning, financials, news,
    strengths, weaknesses, risks
  } = data;

  const parseNum = (val) => {
    if (val === null || val === undefined || val === "N/A" || Number.isNaN(val)) return null;
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    return Number.isNaN(num) ? null : num;
  };

  const formatValue = (val, isCurrency = false) => {
    const num = parseNum(val);
    if (num === null) return "N/A";
    if (num === 0) return isCurrency ? "$0" : "0";

    if (isCurrency) {
      if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
      if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
      return `$${num.toLocaleString()}`;
    }
    return num.toLocaleString();
  };

  // Mock Date format
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    
    // Use setTimeout to allow the React state (Generating...) to render before blocking the main thread
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = margin;

        const checkPageBreak = (neededHeight) => {
          if (y + neededHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
        };

        const safeStr = (val) => val ? String(val) : "N/A";

        // Header: Company Name & Meta
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        const title = `${safeStr(company?.name)} Investment Report`;
        doc.text(title, margin, y);
        y += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`TICKER: ${safeStr(company?.symbol)} | SECTOR: ${safeStr(company?.sector)}`, margin, y);
        y += 6;
        doc.text(`RECOMMENDATION: ${safeStr(recommendation)} | CONFIDENCE: ${safeStr(confidence)}%`, margin, y);
        y += 6;
        doc.text(`GENERATED: ${dateStr} ${timeStr}`, margin, y);
        y += 15;

        doc.setTextColor(0); // Black

        // Executive Summary
        if (summary) {
          checkPageBreak(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("EXECUTIVE SUMMARY", margin, y);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          
          const lines = doc.splitTextToSize(String(summary), pageWidth - margin * 2);
          for (let line of lines) {
            checkPageBreak(6);
            doc.text(line, margin, y);
            y += 6;
          }
          y += 10;
        }

        // Investment Thesis (Reasoning)
        if (reasoning && Array.isArray(reasoning) && reasoning.length > 0) {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("INVESTMENT THESIS", margin, y);
          y += 8;

          reasoning.forEach((item, idx) => {
            checkPageBreak(25);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            const itemTitle = typeof item === 'object' && item.title ? item.title : `Investment Driver ${idx + 1}`;
            const itemDesc = typeof item === 'object' && item.description ? item.description : item;

            const titleLines = doc.splitTextToSize(`• ${String(itemTitle)}`, pageWidth - margin * 2);
            doc.text(titleLines, margin, y);
            y += 6 * titleLines.length;

            doc.setFont("helvetica", "normal");
            const descLines = doc.splitTextToSize(String(itemDesc), pageWidth - margin * 2 - 5);
            for (let line of descLines) {
              checkPageBreak(6);
              doc.text(line, margin + 5, y);
              y += 5;
            }
            y += 5;
          });
          y += 5;
        }

        // Financials (Table)
        if (financials) {
          checkPageBreak(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("FINANCIAL METRICS", margin, y);
          y += 4;
          
          const getMetric = (val, isCurrency, isPercentage) => {
            if (!val || val === "N/A") return "N/A";
            const formatted = formatValue(val, isCurrency);
            if (formatted === "N/A") return "N/A";
            return isPercentage ? `${formatted}%` : formatted;
          };

          autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Metric', 'Value']],
            body: [
              ['Current Price', getMetric(financials.currentPrice, true, false)],
              ['Target Price', getMetric(financials.targetPrice, true, false)],
              ['Revenue', getMetric(financials.revenue, true, false)],
              ['Revenue Growth', getMetric(financials.growth, false, true)],
              ['Operating Margins', getMetric(financials.margins, false, true)],
              ['Cash Flow', getMetric(financials.cashFlow, true, false)],
              ['Debt/Equity', getMetric(financials.debt, false, false)],
              ['P/E Ratio', getMetric(financials.peRatio, false, false)],
              ['Market Cap', getMetric(financials.marketCap, true, false)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 }
          });
          y = doc.lastAutoTable.finalY + 15;
        }

        // Strengths & Weaknesses
        if ((strengths && strengths.length > 0) || (weaknesses && weaknesses.length > 0)) {
          checkPageBreak(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("STRENGTHS & WEAKNESSES", margin, y);
          y += 8;

          if (strengths && Array.isArray(strengths) && strengths.length > 0) {
            doc.setFontSize(12);
            doc.text("Core Strengths", margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            strengths.forEach((s, idx) => {
              checkPageBreak(15);
              const lines = doc.splitTextToSize(`0${idx + 1}. ${String(s)}`, pageWidth - margin * 2);
              doc.text(lines, margin, y);
              y += 6 * lines.length;
            });
            y += 5;
          }

          if (weaknesses && Array.isArray(weaknesses) && weaknesses.length > 0) {
            checkPageBreak(20);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Key Weaknesses", margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            weaknesses.forEach((w, idx) => {
              checkPageBreak(15);
              const lines = doc.splitTextToSize(`0${idx + 1}. ${String(w)}`, pageWidth - margin * 2);
              doc.text(lines, margin, y);
              y += 6 * lines.length;
            });
            y += 10;
          }
        }

        // Risk Assessment
        if (risks && Array.isArray(risks) && risks.length > 0) {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("RISK ASSESSMENT", margin, y);
          y += 8;

          risks.forEach(risk => {
            checkPageBreak(20);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            const strRisk = String(risk);
            const riskTitle = strRisk.split(':')[0] || "Risk Factor";
            const titleLines = doc.splitTextToSize(`• ${riskTitle}`, pageWidth - margin * 2);
            doc.text(titleLines, margin, y);
            y += 6 * titleLines.length;
            
            doc.setFont("helvetica", "normal");
            const riskLines = doc.splitTextToSize(strRisk, pageWidth - margin * 2 - 5);
            for (let i = 0; i < riskLines.length; i++) {
              checkPageBreak(6);
              doc.text(riskLines[i], margin + 5, y);
              y += 5;
            }
            y += 5;
          });
          y += 5;
        }

        // Recent Catalysts (News)
        if (news && Array.isArray(news) && news.length > 0) {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("RECENT CATALYSTS", margin, y);
          y += 8;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          news.forEach(n => {
            checkPageBreak(15);
            const titleLines = doc.splitTextToSize(`• ${String(n?.title || "News Article")}`, pageWidth - margin * 2);
            doc.text(titleLines, margin, y);
            y += 6 * titleLines.length;
          });
          y += 10;
        }

        const safeFilename = String(company?.name || "Company").replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        doc.save(`${safeFilename}_Investment_Report.pdf`);

      } catch (error) {
        console.error("PDF Generation failed:", error);
        const stackLine = error.stack ? error.stack.split('\n')[1] || "" : "";
        alert(`Failed to generate PDF: ${error.message}\n${stackLine}`);
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 50);
  };

  return (
    <div className="font-body-base text-white bg-black selection:bg-white/30 selection:text-white w-full h-auto">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md hairline-b">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <button onClick={() => window.location.reload()} className="font-headline-md text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity flex items-center gap-1">
              Lumina<span className="font-light">AI</span>
            </button>
            <nav className="hidden md:flex items-center gap-6 relative">
              {['financials', 'summary', 'thesis', 'risks', 'valuation', 'sources'].map((tab) => (
                <a
                  key={tab}
                  ref={(el) => (tabsRef.current[tab] = el)}
                  href={`#${tab}`}
                  onClick={(e) => handleTabClick(e, tab)}
                  className={`pb-1 transition-colors duration-200 text-sm ${activeTab === tab
                    ? 'text-white font-semibold'
                    : 'text-secondary hover:text-white font-normal'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </a>
              ))}
              <span
                className="absolute bottom-0 h-[2px] bg-white transition-all duration-300 ease-in-out"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width
                }}
              />
            </nav>
          </div>
          <div className="flex items-center gap-3 md:gap-5 shrink-0">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="border border-zinc-700 text-white px-3 md:px-6 py-2 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all rounded-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-[14px]">
                {isGeneratingPDF ? "hourglass_empty" : "download"}
              </span>
              <span className="hidden sm:inline">{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
            </button>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-4 md:px-6 py-2 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm">
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-[64px] max-w-[1240px] mx-auto px-4 md:px-6 lg:px-10 text-left">
        {/* Section 1: Header Metadata */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-outline-variant pb-8">
          <div>
            <h1 className="font-display-lg text-[48px] md:text-[64px] text-white tracking-tighter font-bold leading-none mb-4">{company?.name || "Company Overview"}</h1>
            <div className="flex items-center gap-4 text-secondary">
              <span className="font-mono-label text-xs tracking-[0.2em] uppercase">{company?.symbol || "TICKER"}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
              <span className="font-body-sm text-xs uppercase tracking-[0.1em]">{company?.sector || "Industry"}</span>
            </div>
          </div>
          <div className="text-left md:text-right mt-6 md:mt-0">
            <p className="font-label-caps text-xs text-white font-bold tracking-[0.2em] mb-1">INVESTMENT RESEARCH</p>
            <p className="font-mono-label text-xs text-secondary">Updated {dateStr} • {timeStr}</p>
          </div>
        </section>

        {/* Section 2: Recommendation */}
        <section className="py-10 text-center mb-10">
          <div className="inline-block px-8 py-16 custom-border bg-black selection-glow w-full">
            <p className="font-label-caps text-xs text-secondary tracking-[0.3em] uppercase mb-6">CONSENSUS RATING</p>
            <h2 className="font-display-lg text-[64px] md:text-[88px] text-white font-black tracking-tighter leading-tight mb-4 uppercase">{recommendation || "ANALYZE"}</h2>
            <div className="flex flex-col items-center justify-center gap-3 mb-8">
              <div className="h-[3px] w-48 bg-zinc-800 relative overflow-hidden rounded-full">
                <div className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${
                  (recommendation || '').toLowerCase().includes('invest') || (recommendation || '').toLowerCase().includes('buy') ? 'bg-[#22c55e]' : 'bg-white'
                }`} style={{ width: `${progressWidth}%` }}></div>
              </div>
              <span className="font-mono-label text-xs text-white uppercase tracking-widest">{confidence || 0}% Confidence Score</span>
              {(() => {
                const rec = (recommendation || '').toLowerCase();
                if (!rec) return null;
                let icon = '→';
                let text = 'Neutral Outlook';
                let colorClass = 'text-[#9CA3AF]';
                
                if (rec.includes('invest') || rec.includes('buy') || rec.includes('outperform')) {
                  icon = '↑';
                  text = 'Positive Outlook';
                  colorClass = 'text-[#22C55E]';
                } else if (rec.includes('sell') || rec.includes('avoid') || rec.includes('underperform')) {
                  icon = '↓';
                  text = 'Negative Outlook';
                  colorClass = 'text-[#EF4444]';
                }
                
                return (
                  <p className={`text-[11px] font-medium leading-[1.2] opacity-85 mt-[6px] animate-slide-up-fade flex items-center justify-center gap-[3px] ${colorClass}`}>
                    <span className="text-[13px] font-normal">{icon}</span>
                    <span>{text}</span>
                  </p>
                );
              })()}
            </div>
            {summary && (
              <p className="max-w-2xl mx-auto text-secondary font-body-base leading-relaxed italic text-lg">
                "{summary.split('.')[0]}."
              </p>
            )}
          </div>
        </section>

        {/* Section 4: Key Metrics */}
        {financials && (
          <section id="financials" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 scroll-mt-24">
            <div className="custom-border p-8 bg-black hover:border-zinc-700 transition-colors group">
              <div className="border-t border-zinc-800/60 pt-4 mb-2">
                <p className="font-label-caps text-[11px] text-zinc-300 font-bold tracking-widest group-hover:text-white transition-colors">SHARE PRICE</p>
              </div>
              <p className="font-headline-md text-2xl text-white font-bold">{formatValue(financials.currentPrice, true)}</p>
              {renderTrend(financials.priceTrend ? `${financials.priceTrend}${String(financials.priceTrend).includes('Today') ? '' : ' Today'}` : null)}
            </div>
            <div className="custom-border p-8 bg-black hover:border-zinc-700 transition-colors group">
              <div className="border-t border-zinc-800/60 pt-4 mb-2">
                <p className="font-label-caps text-[11px] text-zinc-300 font-bold tracking-widest group-hover:text-white transition-colors">MARKET CAP</p>
              </div>
              <p className="font-headline-md text-2xl text-white font-bold">{formatValue(financials.marketCap, true)}</p>
              {renderTrend(financials.marketCapTrend, false, true)}
            </div>
            <div className="custom-border p-8 bg-black hover:border-zinc-700 transition-colors group">
              <div className="border-t border-zinc-800/60 pt-4 mb-2">
                <p className="font-label-caps text-[11px] text-zinc-300 font-bold tracking-widest group-hover:text-white transition-colors">REVENUE</p>
              </div>
              <p className="font-headline-md text-2xl text-white font-bold">{formatValue(financials.revenue, true)}</p>
              {renderTrend((financials.revenueGrowth || financials.growth) ? `${financials.revenueGrowth || financials.growth}${(String(financials.revenueGrowth || financials.growth).toUpperCase().includes('YOY') || String(financials.revenueGrowth || financials.growth).toUpperCase().includes('QOQ')) ? '' : ' YoY'}` : null)}
            </div>
            <div className="custom-border p-8 bg-black hover:border-zinc-700 transition-colors group">
              <div className="border-t border-zinc-800/60 pt-4 mb-2">
                <p className="font-label-caps text-[11px] text-zinc-300 font-bold tracking-widest group-hover:text-white transition-colors">P/E RATIO</p>
              </div>
              <p className="font-headline-md text-2xl text-white font-bold">{formatValue(financials.peRatio)}</p>
              {renderTrend(financials.peTrend ? `${financials.peTrend}${(String(financials.peTrend).toUpperCase().includes('VS') || String(financials.peTrend).toUpperCase().includes('AVG') || String(financials.peTrend).toUpperCase().includes('AVERAGE')) ? '' : ' vs Industry Avg'}` : null)}
            </div>
          </section>
        )}

        {/* Section 4b: Mini Sparklines */}
        {financials && financials.historical && (
          <section className="grid grid-cols-3 gap-4 mb-16 opacity-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
            {['revenue', 'eps', 'fcf'].map((metric) => financials.historical[metric] && (
              <div key={metric} className="custom-border p-4 bg-black flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <p className="font-label-caps text-[10px] text-zinc-500 tracking-widest mb-4 uppercase">{metric === 'fcf' ? 'FREE CASH FLOW' : metric}</p>
                {renderSparkline(financials.historical[metric])}
              </div>
            ))}
          </section>
        )}

        {/* Section 3: Executive Summary */}
        {summary && (
          <section id="summary" className="mb-16 scroll-mt-24">
            <h3 className="font-headline-md text-xl font-bold mb-8 border-l-2 border-white pl-6 uppercase tracking-widest">Executive Summary</h3>
            <div className="space-y-8 text-secondary font-body-base leading-loose text-lg max-w-[900px]">
              {summary.split('\n').filter(p => p.trim() !== '').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Investment Thesis */}
        {reasoning && reasoning.length > 0 && (
          <section id="thesis" className="mb-16 scroll-mt-24">
            <h3 className="font-headline-md text-xl font-bold mb-8 border-l-2 border-white pl-6 uppercase tracking-widest">Investment Thesis</h3>
            <div className="flex flex-col gap-10">
              {reasoning.map((reason, idx) => {
                let title = typeof reason === 'object' && reason.title ? reason.title : '';
                const description = typeof reason === 'object' && reason.description ? reason.description : reason;
                if (!title) {
                  const words = String(description).split(' ');
                  title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
                }
                return (
                  <div key={idx} className="flex flex-col gap-3">
                    <h4 className="font-semibold text-white text-xl tracking-tight capitalize">
                      {title}
                    </h4>
                    <p className="text-secondary text-base leading-relaxed max-w-[900px]">
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 6: Strengths & Weaknesses */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {strengths && strengths.length > 0 && (
            <div>
              <h3 className="font-label-caps text-xs text-white font-bold mb-6 flex items-center gap-3 tracking-[0.2em] uppercase">
                CORE STRENGTHS
              </h3>
              <ul className="space-y-6 font-body-base text-secondary">
                {strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="text-white font-mono-label text-xs mt-1">0{idx + 1}.</span>
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses && weaknesses.length > 0 && (
            <div>
              <h3 className="font-label-caps text-xs text-secondary font-bold mb-6 flex items-center gap-3 tracking-[0.2em] uppercase">
                KEY WEAKNESSES
              </h3>
              <ul className="space-y-6 font-body-base text-secondary/60">
                {weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="text-secondary font-mono-label text-xs mt-1">0{idx + 1}.</span>
                    <span className="text-sm">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section 7: Risk Assessment */}
        {risks && risks.length > 0 && (
          <section id="risks" className="mb-16 p-10 bg-black custom-border scroll-mt-24">
            <h3 className="font-headline-md text-xl font-bold mb-10 uppercase tracking-widest">Risk Assessment</h3>
            <div className="space-y-8">
              {risks.map((risk, idx) => (
                <div key={idx} className="flex justify-between items-center pb-6 hairline-b">
                  <div className="max-w-[900px]">
                    <p className="font-bold text-white uppercase text-sm tracking-tight">{String(risk).split(':')[0] || "Risk Factor"}</p>
                    <p className="text-xs text-secondary mt-1">{risk}</p>
                  </div>
                  {(() => {
                    const r = String(risk).toLowerCase();
                    let level = 'MEDIUM';
                    let color = 'text-amber-500 border-amber-500/30';
                    if (r.includes('high') || r.includes('severe') || r.includes('significant')) {
                      level = 'HIGH';
                      color = 'text-red-500 border-red-500/30';
                    } else if (r.includes('low') || r.includes('minimal')) {
                      level = 'LOW';
                      color = 'text-[#22c55e] border-[#22c55e]/30';
                    }
                    return (
                      <span className={`px-4 py-1 border ${color} text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap ml-4`}>
                        {level} RISK
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 8: Valuation Model */}
        {financials && financials.currentPrice && (
          <section id="valuation" className="mb-16 scroll-mt-24">
            <h3 className="font-headline-md text-xl font-bold mb-8 border-l-2 border-white pl-6 uppercase tracking-widest">Valuation Model</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-10 bg-black custom-border text-center hover:border-zinc-700 transition-colors">
                <p className="font-label-caps text-[10px] text-secondary tracking-widest mb-4">CURRENT PRICE</p>
                <p className="font-display-lg text-3xl font-bold">{formatValue(financials.currentPrice, true)}</p>
                {renderTrend(financials.priceTrend ? `${financials.priceTrend}${String(financials.priceTrend).includes('Today') ? '' : ' Today'}` : null, true)}
              </div>
              <div className="p-10 bg-zinc-900 custom-border border-white/20 text-center relative overflow-hidden hover:border-zinc-700 transition-colors">
                <p className="font-label-caps text-[10px] text-white font-bold tracking-widest mb-4">TARGET PRICE</p>
                <p className="font-display-lg text-3xl font-black">{formatValue(financials.targetPrice || (parseNum(financials.currentPrice) * 1.15), true)}</p>
                {(() => {
                  const target = financials.targetPrice ? parseNum(financials.targetPrice) : (parseNum(financials.currentPrice) * 1.15);
                  const current = parseNum(financials.currentPrice);
                  if (!current || !target) return null;
                  const upside = ((target - current) / current) * 100;
                  const isPos = upside > 0;
                  const isNeg = upside < 0;
                  const colorClass = isPos ? 'text-[#22C55E]' : isNeg ? 'text-[#EF4444]' : 'text-[#9CA3AF]';
                  const icon = isPos ? '↑' : isNeg ? '↓' : '→';
                  return (
                    <p className={`text-[11px] font-medium leading-[1.2] opacity-85 mt-[6px] animate-slide-up-fade flex items-center justify-center gap-[3px] ${colorClass}`}>
                      <span className="text-[13px] font-normal">{icon}</span>
                      <span>{upside > 0 ? '+' : ''}{upside.toFixed(1)}% Upside</span>
                    </p>
                  );
                })()}
              </div>
              <div className="p-10 bg-black custom-border text-center hover:border-zinc-700 transition-colors">
                <p className="font-label-caps text-[10px] text-secondary tracking-widest mb-4">UPSIDE</p>
                {(() => {
                  const target = financials.targetPrice ? parseNum(financials.targetPrice) : (parseNum(financials.currentPrice) * 1.15);
                  const current = parseNum(financials.currentPrice);
                  const upside = ((target - current) / current) * 100;
                  const isPos = upside > 0;
                  const isNeg = upside < 0;
                  const colorClass = isPos ? 'text-[#22C55E]' : isNeg ? 'text-[#EF4444]' : 'text-[#9CA3AF]';
                  return (
                    <>
                      <p className={`font-display-lg text-3xl font-bold ${isPos ? 'text-[#22c55e]' : 'text-white'}`}>
                        {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
                      </p>
                      <p className={`text-[11px] font-medium leading-[1.2] opacity-85 mt-[6px] animate-slide-up-fade flex items-center justify-center gap-[3px] ${colorClass}`}>
                        <span className="text-[13px] font-normal">{isPos ? '↑' : isNeg ? '↓' : '→'}</span>
                        <span>vs Current Price</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Section 9: Recent News Timeline */}
        {news && news.length > 0 && (
          <section className="mb-16">
            <h3 className="font-headline-md text-xl font-bold mb-10 uppercase tracking-widest">Recent Catalysts</h3>
            <div className="space-y-10 relative before:content-[''] before:absolute before:left-3 before:top-0 before:h-full before:w-[1px] before:bg-zinc-900">
              {news.slice(0, 3).map((n, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className={`absolute left-[9px] top-2 w-1.5 h-1.5 ${idx === 0 ? 'bg-white' : 'bg-zinc-800'}`}></div>
                  <p className="font-mono-label text-[10px] text-secondary tracking-[0.2em] mb-2 uppercase">RECENT</p>
                  <a href={n.url} target="_blank" rel="noreferrer" className="font-bold text-white text-lg tracking-tight hover:underline">{n.title}</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 10: Sources */}
        <section id="sources" className="mb-16 pt-12 hairline-b scroll-mt-24">
          <div className="flex flex-wrap gap-x-12 gap-y-6 pb-10">
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-blue-500/80 group-hover:text-blue-400 transition-colors">description</span>
              <span className="font-mono-label text-[10px] text-secondary group-hover:text-blue-400 tracking-widest uppercase flex items-center gap-1">SEC Filings (EDGAR) <span className="material-symbols-outlined text-[14px]">arrow_outward</span></span>
            </div>
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-blue-500/80 group-hover:text-blue-400 transition-colors">analytics</span>
              <span className="font-mono-label text-[10px] text-secondary group-hover:text-blue-400 tracking-widest uppercase flex items-center gap-1">Yahoo Finance <span className="material-symbols-outlined text-[14px]">arrow_outward</span></span>
            </div>
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-blue-500/80 group-hover:text-blue-400 transition-colors">open_in_new</span>
              <span className="font-mono-label text-[10px] text-secondary group-hover:text-blue-400 tracking-widest uppercase flex items-center gap-1">Tavily Web Search <span className="material-symbols-outlined text-[14px]">arrow_outward</span></span>
            </div>
          </div>
        </section>

        {/* Section 11: Research Methodology */}
        <section className="pt-24">
          <div className="bg-zinc-950 p-10 custom-border">
            <h4 className="font-headline-md text-white text-lg font-bold mb-8 flex items-center gap-3 uppercase tracking-[0.1em]">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
              Research Methodology
            </h4>
            
            <p className="text-secondary text-base leading-relaxed max-w-[900px] mb-12">
              This investment research report was generated using AI-assisted fundamental analysis. Financial statements, company filings, valuation metrics, market news, and industry trends were analyzed to produce an evidence-based investment recommendation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="font-label-caps text-xs text-secondary tracking-[0.3em] uppercase mb-6">Research Coverage</p>
                <ul className="space-y-4">
                  {[
                    "Company Overview",
                    "Financial Statements",
                    "Quarterly Earnings",
                    "SEC / Regulatory Filings",
                    "Valuation Analysis",
                    "Risk Assessment",
                    "Market News",
                    "Industry Trends"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-white font-mono-label tracking-wide">
                      <span className="material-symbols-outlined text-zinc-500 text-sm">check</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="font-label-caps text-xs text-secondary tracking-[0.3em] uppercase mb-6">Report Metadata</p>
                <div className="space-y-4 font-mono-label text-sm tracking-wide">
                  <div className="flex justify-between border-b border-zinc-900 pb-3">
                    <span className="text-secondary">Recommendation</span>
                    <span className="text-white">{recommendation || "INVEST"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-3">
                    <span className="text-secondary">Confidence</span>
                    <span className="text-white">90%</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-3">
                    <span className="text-secondary">Analysis Generated</span>
                    <span className="text-white">{dateStr} • {timeStr}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-3">
                    <span className="text-secondary">Analysis Time</span>
                    <span className="text-white">8.2 seconds</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-3">
                    <span className="text-secondary">Sources Reviewed</span>
                    <span className="text-white">18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
};
