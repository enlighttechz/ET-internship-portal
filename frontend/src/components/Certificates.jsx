import React from 'react';
import { Download, Share2, Award, Terminal, Database, Check, Lock, ChevronRight } from 'lucide-react';

const Certificates = () => {
  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      {/* Featured Certificate */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-text-primary px-1">Recent Milestone</h2>
        <div className="bg-surface-container-lowest/50 backdrop-blur-xl border border-outline-variant/30 shadow-sm rounded-2xl overflow-hidden group">
          <div className="relative aspect-[4/3] w-full bg-slate-200">
            <img 
              alt="Featured Certificate" 
              className="w-full h-full object-cover" 
              loading="lazy"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkZefgAqbDUQdFE_TEMDciXqA30grMU5hYrsKTRODHvWnkUgIHpebAILOhYyABWaU-6xxheff-vJwBuTM6Rnm2pl7kwZTP29fEDxyKlmayFUDKe6O_MEXrmg8fZ_odbVV7mPlGIKUM10Pat_qJaiqrW8T61EWB-FFbdH1sd4jOX6wv8-miU6_OY9RKbgTh_SbK_ojxgvVqRj5Yh2-JDCtm9j540TJgAXL_z1wweOViffJ9jr092wZ51o34EoCVGzNKwBbAA760PvBc"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
              <span className="bg-success text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded w-fit mb-2">Verified Achievement</span>
              <h3 className="text-white font-headline-md text-headline-md">Full-Stack Development</h3>
              <p className="text-white/80 font-label-md text-label-md">Professional Certification • Issued Nov 2023</p>
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <button className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 hover:bg-primary-container">
              <Download size={20} />
              Download PDF
            </button>
            <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary active:scale-[0.9] transition-transform hover:bg-surface-container-low">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Earned Certificates */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-headline-md text-headline-md text-text-primary">Earned (4)</h2>
          <button className="text-primary font-label-md text-label-md font-bold">See All</button>
        </div>
        <div className="space-y-3">
          {/* Certificate Row 1 */}
          <div className="bg-surface-container-lowest/50 backdrop-blur-xl border border-outline-variant/30 shadow-sm rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
              <Award className="text-primary" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-label-md font-bold text-text-primary truncate">React State Management</h4>
              <p className="font-label-md text-[12px] text-outline">Oct 12, 2023</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-outline hover:text-primary transition-colors">
                <Share2 size={20} />
              </button>
              <button className="px-4 py-1.5 rounded-full border border-primary text-primary font-label-md text-[12px] font-bold hover:bg-primary/5 transition-colors">
                View
              </button>
            </div>
          </div>
          
          {/* Certificate Row 2 */}
          <div className="bg-surface-container-lowest/50 backdrop-blur-xl border border-outline-variant/30 shadow-sm rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
              <Terminal className="text-primary" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-label-md font-bold text-text-primary truncate">Advanced CSS Masterclass</h4>
              <p className="font-label-md text-[12px] text-outline">Sep 05, 2023</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-outline hover:text-primary transition-colors">
                <Share2 size={20} />
              </button>
              <button className="px-4 py-1.5 rounded-full border border-primary text-primary font-label-md text-[12px] font-bold hover:bg-primary/5 transition-colors">
                View
              </button>
            </div>
          </div>
          
          {/* Certificate Row 3 */}
          <div className="bg-surface-container-lowest/50 backdrop-blur-xl border border-outline-variant/30 shadow-sm rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
              <Database className="text-primary" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-label-md font-bold text-text-primary truncate">SQL Fundamentals</h4>
              <p className="font-label-md text-[12px] text-outline">Aug 22, 2023</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-outline hover:text-primary transition-colors">
                <Share2 size={20} />
              </button>
              <button className="px-4 py-1.5 rounded-full border border-primary text-primary font-label-md text-[12px] font-bold hover:bg-primary/5 transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Certificates */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-text-primary px-1">In Progress</h2>
        <div className="bg-surface-container-lowest/50 backdrop-blur-xl rounded-2xl p-5 border-l-4 border-l-primary shadow-sm border-y border-r border-y-outline-variant/20 border-r-outline-variant/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-label-md text-label-md font-bold text-text-primary">Database Schema Design</h4>
              <p className="font-label-md text-[12px] text-outline">2 modules remaining</p>
            </div>
            <span className="font-label-md text-primary font-bold">85%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: '85%' }}></div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-white ring-2 ring-surface-container-lowest">
                <Check size={14} />
              </div>
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-white ring-2 ring-surface-container-lowest">
                <Check size={14} />
              </div>
              <div className="w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center text-white ring-2 ring-surface-container-lowest">
                <Lock size={14} />
              </div>
            </div>
            <button className="text-primary font-label-md text-label-md font-bold flex items-center gap-1 hover:text-primary-container transition-colors">
              Continue
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Certificates;
