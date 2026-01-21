
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Difficulty, CardData, View, BestScores, GameStats, Player } from './types';
import { INDIAN_SYMBOLS, DIFFICULTY_CONFIG, PLAYER_CONFIG } from './constants';
import { getBestScores, saveBestScore } from './utils/storageUtils';
import { audioManager } from './utils/audioUtils';
import Card from './components/Card';
import HomeMenu from './components/HomeMenu';
import GameOverModal from './components/GameOverModal';
import ScoreBoard from './components/ScoreBoard';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [bestScores, setBestScores] = useState<BestScores>(getBestScores());
  const [lastGameStats, setLastGameStats] = useState<GameStats | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Multiplayer State
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const timerRef = useRef<number | null>(null);

  const generateCards = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    const pairsCount = config.pairs;
    const shuffledSymbols = [...INDIAN_SYMBOLS].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffledSymbols.slice(0, pairsCount);
    
    const gameCards: CardData[] = [];
    selectedSymbols.forEach((symbol, index) => {
      const cardBase = { id: index, symbol, isFlipped: false, isMatched: false };
      gameCards.push({ ...cardBase, uniqueId: `${index}-a` });
      gameCards.push({ ...cardBase, uniqueId: `${index}-b` });
    });

    return gameCards.sort(() => Math.random() - 0.5);
  }, []);

  const startGame = (diff: Difficulty, playerCount: number) => {
    const newCards = generateCards(diff);
    
    // Initialize Players
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: PLAYER_CONFIG[i].name,
      score: 0,
      color: PLAYER_CONFIG[i].color
    }));

    setDifficulty(diff);
    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setCards(newCards);
    setFlippedIndexes([]);
    setMoves(0);
    setTimer(0);
    setIsGameActive(true);
    setView('game');
    setIsNewBest(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const quitGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameActive(false);
    setView('home');
    setBestScores(getBestScores());
  };

  const handleCardClick = useCallback((index: number) => {
    if (!isGameActive) return;
    if (flippedIndexes.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    audioManager.playFlip();

    setFlippedIndexes(prev => [...prev, index]);
    
    setCards(prevCards => {
      const next = [...prevCards];
      next[index] = { ...next[index], isFlipped: true };
      return next;
    });
  }, [isGameActive, flippedIndexes, cards]);

  useEffect(() => {
    if (flippedIndexes.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = flippedIndexes;
      
      if (cards[first].id === cards[second].id) {
        // MATCH!
        const matchTimeout = setTimeout(() => {
          audioManager.playMatch();
          
          setPlayers(prevPlayers => {
            const updated = [...prevPlayers];
            updated[currentPlayerIndex].score += 1;
            return updated;
          });

          setCards((prev) => {
            const next = [...prev];
            next[first] = { ...next[first], isMatched: true, isFlipped: false };
            next[second] = { ...next[second], isMatched: true, isFlipped: false };
            
            if (next.every(c => c.isMatched)) {
              handleWin();
            }
            return next;
          });
          setFlippedIndexes([]);
        }, 500);
        return () => clearTimeout(matchTimeout);
      } else {
        // NO MATCH
        const mismatchTimeout = setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[first] = { ...next[first], isFlipped: false };
            next[second] = { ...next[second], isFlipped: false };
            return next;
          });
          setFlippedIndexes([]);
          
          if (players.length > 1) {
            audioManager.playTurnSwitch();
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
          }
        }, 1000);
        return () => clearTimeout(mismatchTimeout);
      }
    }
  }, [flippedIndexes, cards, players.length, currentPlayerIndex]);

  const handleWin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameActive(false);
    
    setTimer(currentTimer => {
      setMoves(currentMoves => {
        const stats: GameStats = {
          moves: currentMoves,
          time: currentTimer,
          difficulty,
          date: new Date().toISOString()
        };

        if (players.length === 1) {
          const currentBest = bestScores[difficulty];
          const isBetter = !currentBest || 
                          stats.moves < currentBest.moves || 
                          (stats.moves === currentBest.moves && stats.time < currentBest.time);

          if (isBetter) {
            setIsNewBest(true);
            saveBestScore(stats);
          }
        }

        setLastGameStats(stats);
        setView('gameover');
        return currentMoves;
      });
      return currentTimer;
    });
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    audioManager.setEnabled(newVal);
  };

  const config = useMemo(() => DIFFICULTY_CONFIG[difficulty], [difficulty]);

  if (view === 'home') {
    return <HomeMenu onStartGame={startGame} bestScores={bestScores} />;
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#FFF9F2] safe-area-inset-bottom select-none touch-none">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b-4 border-orange-500 z-10">
        <button 
          onClick={quitGame}
          className="p-2 -ml-2 rounded-full hover:bg-orange-50 text-orange-600 transition-colors active:scale-90"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Time</span>
          <span className="text-xl font-black text-orange-600 leading-tight">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <button 
          onClick={toggleSound}
          className={`p-2 -mr-2 rounded-full transition-colors active:scale-90 ${soundEnabled ? 'text-blue-600' : 'text-gray-300'}`}
        >
          {soundEnabled ? (
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      </header>

      {/* Multiplayer Scoreboard */}
      <ScoreBoard players={players} currentPlayerIndex={currentPlayerIndex} />

      {/* Main Board - optimized for different screen orientations */}
      <main className="flex-grow min-h-0 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden relative">
        <div 
          className="grid gap-2 sm:gap-3 w-full h-full max-w-2xl mx-auto items-center justify-center content-center"
          style={{ 
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            maxHeight: 'min(calc(100vh - 220px), 800px)' // Reserve space for header/footer
          }}
        >
          {cards.map((card, idx) => (
            <Card 
              key={card.uniqueId} 
              card={card} 
              onClick={() => handleCardClick(idx)}
              disabled={!isGameActive || flippedIndexes.length >= 2}
            />
          ))}
        </div>
      </main>

      {/* Dynamic Status Bar */}
      <footer className="flex-shrink-0 p-3 bg-white border-t border-orange-100 text-center">
        <div className="flex items-center justify-center space-x-3 text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">
          <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{config.label}</span>
          <span className="hidden sm:inline">•</span>
          <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{players.length} {players.length === 1 ? 'Solo' : 'Players'}</span>
          <span>•</span>
          <span className="text-gray-500">{moves} moves</span>
        </div>
      </footer>

      {/* Win View */}
      {view === 'gameover' && lastGameStats && (
        <GameOverModal 
          stats={lastGameStats} 
          players={players}
          isNewBest={isNewBest} 
          onRestart={() => startGame(difficulty, players.length)} 
          onHome={quitGame}
        />
      )}
    </div>
  );
};

export default App;
