import React, { useState, useCallback, useEffect } from 'react';
import type { GameState, ScoreCategory, AILevel } from '../../types/game';
import { 
  createInitialGameState, 
  rollDice, 
  toggleDiceLock, 
  recordScore, 
  endTurn, 
  decrementRolls, 
  startGame,
  getAvailableCategories,
  getWinner
} from '../../utils/gameLogic';
import { BeginnerAI, IntermediateAI, ExpertAI } from '../../utils/aiStrategies';
import DiceBoard from '../Dice/DiceBoard';
import ScoreCard from '../ScoreCard/ScoreCard';

interface GameBoardProps {
  aiLevel: AILevel;
  onGameEnd: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ aiLevel, onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(aiLevel));
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameMessage, setGameMessage] = useState('주사위를 굴려서 게임을 시작하세요!');
  const [aiSelectedCategory, setAiSelectedCategory] = useState<ScoreCategory | null>(null);

  // 게임 시작
  useEffect(() => {
    if (gameState.gameStatus === 'setup') {
      setGameState(startGame(gameState));
      setGameMessage('주사위를 굴려서 게임을 시작하세요!');
    }
  }, []);

  // AI 턴 처리
  useEffect(() => {
    if (gameState.currentPlayer === 'ai' && gameState.gameStatus === 'playing' && !isAIThinking) {
      handleAITurn();
    }
  }, [gameState.currentPlayer, gameState.rollsLeft, gameState.gameStatus]);

  // 게임 종료 처리
  useEffect(() => {
    if (gameState.gameStatus === 'finished') {
      const winner = getWinner(gameState);
      let message = '';
      switch (winner) {
        case 'human':
          message = '🎉 축하합니다! 승리하셨습니다!';
          break;
        case 'ai':
          message = '😅 아쉽네요. AI가 이겼습니다.';
          break;
        case 'tie':
          message = '🤝 무승부입니다!';
          break;
      }
      setGameMessage(`${message} 플레이어: ${gameState.player.totalScore}점, AI: ${gameState.ai.totalScore}점`);
    }
  }, [gameState.gameStatus]);

  // 주사위 굴리기
  const handleRoll = useCallback(() => {
    if (gameState.rollsLeft <= 0 || gameState.currentPlayer !== 'human') return;

    const newDiceState = rollDice(gameState.dice);
    const newGameState = decrementRolls({
      ...gameState,
      dice: newDiceState
    });

    setGameState(newGameState);
    
    if (newGameState.rollsLeft === 0) {
      setGameMessage('굴리기가 끝났습니다. 점수를 선택하세요.');
    } else {
      setGameMessage(`굴림 완료! ${newGameState.rollsLeft}번 더 굴릴 수 있습니다.`);
    }
  }, [gameState]);

  // 주사위 선택/해제
  const handleDiceClick = useCallback((index: number) => {
    if (gameState.currentPlayer !== 'human' || gameState.rollsLeft === 3) return;

    const newDiceState = toggleDiceLock(gameState.dice, index);
    setGameState({
      ...gameState,
      dice: newDiceState
    });
  }, [gameState]);

  // 점수 카테고리 선택
  const handleCategorySelect = useCallback((category: ScoreCategory) => {
    if (gameState.currentPlayer !== 'human') return;

    // 주사위를 한 번도 굴리지 않았으면 점수 선택 불가
    if (gameState.rollsLeft === 3) {
      setGameMessage('주사위를 먼저 굴려주세요!');
      return;
    }

    const newGameState = recordScore(gameState, category);
    const finalGameState = endTurn(newGameState);

    setGameState(finalGameState);

    if (finalGameState.gameStatus === 'finished') {
      return;
    }

    if (finalGameState.currentPlayer === 'ai') {
      setGameMessage('AI 턴입니다...');
    } else {
      setGameMessage(`라운드 ${finalGameState.round}: 주사위를 굴려주세요.`);
    }
  }, [gameState]);

  // AI 턴 처리
  const handleAITurn = async () => {
    setIsAIThinking(true);
    setAiSelectedCategory(null);

    let currentState = { ...gameState };

    // 첫 번째 굴림
    setGameMessage('AI가 주사위를 굴립니다...');
    await new Promise(resolve => setTimeout(resolve, 800));
    const firstRoll = rollDice(currentState.dice);
    currentState = decrementRolls({
      ...currentState,
      dice: firstRoll
    });
    setGameState({ ...currentState });

    // AI가 계속 굴릴지 결정
    while (currentState.rollsLeft > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // AI 의사결정: 주사위 유지할지, 점수 선택할지
      const shouldFinalize = getAIDecision(currentState, 'shouldFinalize') as boolean;

      if (shouldFinalize) {
        setGameMessage('AI가 점수를 선택합니다...');
        break;
      }

      // 계속 굴리기로 결정
      setGameMessage(`AI가 다시 굴립니다... (${currentState.rollsLeft}번 남음)`);
      const indicesToKeep = getAIDecision(currentState, 'chooseDice') as number[];

      // 주사위 선택 상태 업데이트
      const newLocked = [false, false, false, false, false];
      if (Array.isArray(indicesToKeep)) {
        indicesToKeep.forEach(index => {
          newLocked[index] = true;
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      const newDiceState = rollDice({
        ...currentState.dice,
        locked: newLocked
      });

      currentState = decrementRolls({
        ...currentState,
        dice: newDiceState
      });
      setGameState({ ...currentState });
    }

    // 카테고리 선택
    await new Promise(resolve => setTimeout(resolve, 1000));
    const selectedCategory = getAIDecision(currentState, 'chooseCategory') as ScoreCategory;
    setAiSelectedCategory(selectedCategory);
    setGameMessage(`AI가 "${getCategoryDisplayName(selectedCategory)}"를 선택했습니다!`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const scoredState = recordScore(currentState, selectedCategory);
    const finalState = endTurn(scoredState);

    setGameState(finalState);
    setIsAIThinking(false);
    setAiSelectedCategory(null);

    if (finalState.gameStatus === 'finished') {
      return;
    }

    setGameMessage(`라운드 ${finalState.round}: 주사위를 굴려주세요.`);
  };

  // 카테고리 한글 표시 이름
  const getCategoryDisplayName = (category: ScoreCategory): string => {
    const names: Record<ScoreCategory, string> = {
      aces: '1 (에이스)',
      twos: '2',
      threes: '3',
      fours: '4',
      fives: '5',
      sixes: '6',
      threeOfAKind: '3 동일숫자',
      fourOfAKind: '4 동일숫자',
      fullHouse: '풀하우스',
      smallStraight: '스몰 스트레이트',
      largeStraight: '라지 스트레이트',
      yahtzee: '야추',
      chance: '찬스'
    };
    return names[category] || category;
  };

  // AI 의사결정 로직
  const getAIDecision = (state: GameState, decisionType: 'shouldFinalize' | 'chooseDice' | 'chooseCategory'): boolean | number[] | ScoreCategory => {
    const availableCategories = getAvailableCategories(state);

    if (decisionType === 'shouldFinalize') {
      // 굴림을 계속할지, 점수를 선택할지 결정
      return shouldAIFinalize(state, availableCategories);
    } else if (decisionType === 'chooseCategory') {
      // 카테고리 선택
      switch (state.aiLevel) {
        case 'BEGINNER':
          return BeginnerAI.chooseCategory(state.dice.values, availableCategories);
        case 'INTERMEDIATE':
          return IntermediateAI.chooseCategory(state.dice.values, availableCategories,
            Object.values(state.ai.scores).reduce((sum: number, score) => sum + (score ?? 0), 0));
        case 'EXPERT':
          return ExpertAI.chooseCategory(state.dice.values, availableCategories,
            Object.values(state.ai.scores).reduce((sum: number, score) => sum + (score ?? 0), 0),
            state.round);
        default:
          return BeginnerAI.chooseCategory(state.dice.values, availableCategories);
      }
    } else {
      // 주사위 선택
      switch (state.aiLevel) {
        case 'BEGINNER':
          return BeginnerAI.chooseDiceToKeep(state.dice.values);
        case 'INTERMEDIATE':
          return IntermediateAI.chooseDiceToKeep(state.dice.values);
        case 'EXPERT':
          return ExpertAI.chooseDiceToKeep(state.dice.values, 10000, state.round);
        default:
          return BeginnerAI.chooseDiceToKeep(state.dice.values);
      }
    }
  };

  // AI가 점수를 선택할지 판단
  const shouldAIFinalize = (state: GameState, availableCategories: ScoreCategory[]): boolean => {
    const dice = state.dice.values;
    const rollsLeft = state.rollsLeft;

    // 마지막 굴림이면 무조건 선택
    if (rollsLeft === 0) return true;

    const counts = dice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const maxCount = Math.max(...Object.values(counts));
    const sorted = [...dice].sort((a, b) => a - b);
    const countsArray = Object.values(counts).sort((a, b) => b - a);

    // === 즉시 선택할 완벽한 조합 (개선 불가능) ===

    // 1. 야추 (50점) - 절대 굴리지 않음
    if (maxCount === 5 && availableCategories.includes('yahtzee')) return true;

    // 2. 라지 스트레이트 (40점) - 절대 굴리지 않음
    const isLargeStraight = (sorted.join('') === '12345' || sorted.join('') === '23456');
    if (isLargeStraight && availableCategories.includes('largeStraight')) return true;

    // === 개선 가능성 있는 조합 (기회 활용) ===

    // 3. 4 동일숫자 - 야추 시도 (1번만, 5-6 숫자만)
    if (maxCount === 4) {
      const fourNum = parseInt(Object.entries(counts).find(([_, c]) => c === 4)?.[0] || '0');
      // 5-6이고 야추 가능하고 기회 있으면 시도
      if (fourNum >= 5 && availableCategories.includes('yahtzee') && rollsLeft >= 1) {
        return false; // 야추 시도
      }
      // 그 외 4개면 즉시 선택
      if (availableCategories.includes('fourOfAKind')) return true;
    }

    // 4. 스몰 스트레이트 - 라지 시도 가능하면 시도
    const hasSmallStraight = /1234|2345|3456/.test(sorted.join(''));
    if (hasSmallStraight) {
      // 라지 가능하고 기회 있으면 시도
      if (availableCategories.includes('largeStraight') && rollsLeft >= 1) {
        return false; // 라지 시도
      }
      // 스몰만 가능하면 선택
      if (availableCategories.includes('smallStraight')) return true;
    }

    // 5. 풀하우스 (25점) - 즉시 선택
    const isFullHouse = countsArray[0] === 3 && countsArray[1] === 2;
    if (isFullHouse && availableCategories.includes('fullHouse')) return true;

    // === 기회 활용 전략 (롤 횟수별) ===

    // 6. 3 동일숫자 처리
    if (maxCount === 3) {
      const threeNum = parseInt(Object.entries(counts).find(([_, c]) => c === 3)?.[0] || '0');

      // 롤 2개 남음: 4개/야추/풀하우스 시도
      if (rollsLeft >= 2) {
        // 5-6은 4개/야추 시도
        if (threeNum >= 5) return false;
        // 1-4는 페어 있으면 풀하우스 시도, 없으면 굴림
        return false;
      }

      // 롤 1개 남음: 신중한 판단
      if (rollsLeft === 1) {
        // 5-6 3개: 4개 시도 (기대값 높음)
        if (threeNum >= 5) return false;

        // 1-4 3개 + 페어: 풀하우스 시도
        if (countsArray[1] === 2) return false;

        // 그 외: 3-of-a-kind로 선택
        if (availableCategories.includes('threeOfAKind')) return true;
      }
    }

    // 7. 페어 2개 - 풀하우스 시도
    if (countsArray[0] === 2 && countsArray[1] === 2 && rollsLeft >= 1) {
      return false; // 풀하우스 시도
    }

    // 8. 약한 조합 - 기회 있으면 개선
    if (rollsLeft >= 2) {
      return false; // 무조건 개선 시도
    }

    if (rollsLeft === 1) {
      // 페어 이하면 굴림
      if (maxCount <= 2) return false;
      // 3개는 위에서 처리됨
      return true;
    }

    return true;
  };

  const availableCategories = getAvailableCategories(gameState);
  const canRoll = gameState.rollsLeft > 0 && gameState.currentPlayer === 'human';

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 게임 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-800">🎲 야추 게임</h1>
              <p className="text-gray-600">
                라운드 {gameState.round}/13 | AI 난이도: {
                  gameState.aiLevel === 'BEGINNER' ? '초보' :
                  gameState.aiLevel === 'INTERMEDIATE' ? '중수' : '고수'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">현재 턴</div>
                <div className="font-semibold">
                  {gameState.currentPlayer === 'human' ? '플레이어' : 'AI'}
                  {isAIThinking && ' (사고중...)'}
                </div>
              </div>
              
              {gameState.gameStatus === 'finished' && (
                <button
                  onClick={onGameEnd}
                  className="btn-primary"
                >
                  새 게임
                </button>
              )}
            </div>
          </div>
          
          {/* 게임 메시지 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-800">{gameMessage}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 주사위 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-center mb-4">🎲 주사위</h2>
              <DiceBoard
                diceState={gameState.dice}
                onDiceClick={handleDiceClick}
                onRoll={handleRoll}
                rollsLeft={gameState.rollsLeft}
                canRoll={canRoll}
                disabled={gameState.currentPlayer === 'ai' || gameState.gameStatus === 'finished'}
              />
            </div>
          </div>

          {/* 점수표 영역 */}
          <div className="lg:col-span-3">
            <ScoreCard
              player={gameState.player}
              ai={gameState.ai}
              currentDice={gameState.dice.values}
              availableCategories={availableCategories}
              onCategorySelect={gameState.currentPlayer === 'human' && gameState.gameStatus === 'playing' ? handleCategorySelect : undefined}
              isPlayerTurn={gameState.currentPlayer === 'human' && gameState.gameStatus === 'playing'}
              aiSelectedCategory={aiSelectedCategory}
              hasRolled={gameState.rollsLeft < 3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;