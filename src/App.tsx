import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Users, Play, Trophy, RefreshCw, X, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  score: number;
}

type GamePhase = 'setup' | 'scoreboard';

// Simple Web Audio API sound synthesizer
const playSound = (type: 'correct' | 'wrong', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime); // Low buzz
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error("Audio Context not supported", e);
  }
};

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [recentlyChanged, setRecentlyChanged] = useState<{ id: string; type: 'plus' | 'minus' } | null>(null);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setGroups([...groups, { id: Date.now().toString(), name: newGroupName.trim(), score: 0 }]);
    setNewGroupName('');
  };

  const handleRemoveGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  const handleStartQuiz = () => {
    if (groups.length === 0) {
      alert("Tambahkan minimal 1 grup untuk mulai!");
      return;
    }
    setPhase('scoreboard');
  };

  const updateScore = (id: string, delta: number, type: 'plus' | 'minus') => {
    setGroups(groups.map(g => g.id === id ? { ...g, score: g.score + delta } : g));
    playSound(type === 'plus' ? 'correct' : 'wrong', isMuted);
    
    setRecentlyChanged({ id, type });
    setTimeout(() => {
      setRecentlyChanged(current => current?.id === id ? null : current);
    }, 1000);
  };

  const handleRestart = () => {
    setGroups(groups.map(g => ({ ...g, score: 0 })));
    setPhase('setup');
  };

  const sortedGroups = [...groups].sort((a, b) => b.score - a.score);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 selection:bg-red-500/30 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`backdrop-blur-md border-b shadow-lg w-full sticky top-0 z-10 shrink-0 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/50 border-white/10' : 'bg-white/70 border-slate-200'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl shadow-lg shadow-red-500/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
              Papan Skor Cerdas Tangkas
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`transition-colors p-2 rounded-full ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              title={isDarkMode ? "Mode Terang" : "Mode Gelap"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`transition-colors p-2 rounded-full ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              title={isMuted ? "Bunyikan" : "Bisukan"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {phase === 'scoreboard' && (
              <button
                onClick={handleRestart}
                className={`transition-colors p-2 rounded-full flex items-center space-x-2 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                title="Atur Ulang"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Ulangi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-3xl backdrop-blur-xl border rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="text-center mb-10">
                <Users className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className={`text-3xl sm:text-4xl font-bold mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Pendaftaran Peserta</h2>
                <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Tambahkan tim atau peserta yang akan mengikuti kuis.
                </p>
              </div>

              <form onSubmit={handleAddGroup} className="flex gap-3 mb-10">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nama Grup/Peserta..."
                  className={`flex-1 border rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-500/25 active:scale-95 whitespace-nowrap"
                >
                  Tambah
                </button>
              </form>

              <div className="mb-10">
                {groups.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                      {groups.map((group) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`border rounded-full pl-5 pr-2 py-2 flex items-center gap-3 backdrop-blur-sm ${isDarkMode ? 'bg-slate-700/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}
                        >
                          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{group.name}</span>
                          <button
                            onClick={() => handleRemoveGroup(group.id)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-slate-200 hover:bg-red-200 text-slate-500 hover:text-red-500'}`}
                            title="Hapus"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className={`text-center py-8 border-2 border-dashed rounded-2xl ${isDarkMode ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-300'}`}>
                    Belum ada grup yang ditambahkan.
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleStartQuiz}
                  disabled={groups.length === 0}
                  className={`group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold text-xl transition-all disabled:cursor-not-allowed active:scale-95 disabled:scale-100 ${
                    isDarkMode 
                      ? 'bg-white disabled:bg-slate-800 text-slate-900 disabled:text-slate-500 hover:bg-slate-100 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] disabled:shadow-none' 
                      : 'bg-slate-900 disabled:bg-slate-300 text-white disabled:text-slate-500 hover:bg-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] disabled:shadow-none'
                  }`}
                >
                  <span>Mulai Kuis</span>
                  <Play className="w-6 h-6 fill-current" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'scoreboard' && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              className="w-full max-w-7xl h-full flex flex-col relative z-10"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                <AnimatePresence>
                  {sortedGroups.map((group, index) => {
                    const isBlinking = recentlyChanged?.id === group.id;
                    const changeType = recentlyChanged?.type;
                    const isTop = index === 0 && group.score > 0;

                    return (
                      <motion.div
                        layout
                        key={group.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          backgroundColor: isBlinking 
                            ? (changeType === 'plus' ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)') : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'))
                            : (isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)')
                        }}
                        transition={{ 
                          layout: { type: "spring", stiffness: 300, damping: 30 },
                          backgroundColor: { duration: 0.5 }
                        }}
                        className={`relative rounded-3xl p-6 sm:p-8 flex flex-col border backdrop-blur-xl transition-all duration-300 ${
                          isTop 
                            ? `border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] ${!isDarkMode ? 'bg-yellow-50/50' : ''}` 
                            : (isDarkMode ? 'border-white/10 shadow-xl' : 'border-slate-200 shadow-md')
                        }`}
                      >
                        {isTop && (
                          <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 p-2 rounded-full shadow-lg shadow-yellow-500/30 transform rotate-12">
                            <Trophy className="w-6 h-6" />
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <h3 className={`text-2xl sm:text-3xl font-bold truncate px-2 mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {group.name}
                          </h3>
                          <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-b ${isDarkMode ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500'}`}>
                            {group.score}
                          </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-3">
                          <button
                            onClick={() => updateScore(group.id, -10, 'minus')}
                            className={`py-4 sm:py-5 rounded-2xl flex items-center justify-center transition-all group active:scale-95 border ${
                              isDarkMode 
                                ? 'bg-white/5 hover:bg-red-500/20 border-white/10 hover:border-red-500/50 text-slate-300 hover:text-red-400' 
                                : 'bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600'
                            }`}
                          >
                            <Minus className="w-8 h-8 group-hover:scale-125 transition-transform" />
                          </button>
                          <button
                            onClick={() => updateScore(group.id, 10, 'plus')}
                            className={`py-4 sm:py-5 rounded-2xl flex items-center justify-center transition-all group active:scale-95 border ${
                              isDarkMode 
                                ? 'bg-white/5 hover:bg-green-500/20 border-white/10 hover:border-green-500/50 text-slate-300 hover:text-green-400' 
                                : 'bg-slate-50 hover:bg-green-50 border-slate-200 hover:border-green-200 text-slate-600 hover:text-green-600'
                            }`}
                          >
                            <Plus className="w-8 h-8 group-hover:scale-125 transition-transform" />
                          </button>
                        </div>
                        
                        {/* Flashing overlay for points */}
                        <AnimatePresence>
                          {isBlinking && (
                            <motion.div
                              initial={{ opacity: 1, y: 0, scale: 0.5 }}
                              animate={{ opacity: 0, y: -50, scale: 1.5 }}
                              exit={{ opacity: 0 }}
                              className={`absolute inset-0 flex items-center justify-center pointer-events-none text-6xl font-black ${
                                changeType === 'plus' ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {changeType === 'plus' ? '+10' : '-10'}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
