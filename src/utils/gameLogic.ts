import type { GameState, DiceState, Player, ScoreCategory, AILevel } from '../types/game';
import { calculateScore, calculateTotalScore } from './scoring';

// 초기 게임 상태 생성
export function createInitialGameState(aiLevel: AILevel): GameState {
  const initialPlayer: Player = {
    name: 'Player',
    scores: {
      aces: null,
      twos: null,
      threes: null,
      fours: null,
      fives: null,
      sixes: null,
      threeOfAKind: null,
      fourOfAKind: null,
      fullHouse: null,
      smallStraight: null,
      largeStraight: null,
      yahtzee: null,
      chance: null
    },
    totalScore: 0,
    upperBonus: false,
    yahtzeeBonus: 0
  };

  const initialAI: Player = {
    ...initialPlayer,
    name: 'AI'
  };

  return {
    round: 1,
    rollsLeft: 3,
    currentPlayer: 'human',
    player: initialPlayer,
    ai: initialAI,
    dice: {
      values: [1, 1, 1, 1, 1],
      locked: [false, false, false, false, false]
    },
    gameStatus: 'setup',
    aiLevel
  };
}

// 주사위 굴리기
export function rollDice(diceState: DiceState): DiceState {
  const newValues = diceState.values.map((value, index) => {
    if (diceState.locked[index]) {
      return value; // 잠긴 주사위는 그대로
    }
    return Math.floor(Math.random() * 6) + 1; // 1-6 랜덤
  });

  return {
    values: newValues,
    locked: diceState.locked
  };
}

// 주사위 선택/해제 토글
export function toggleDiceLock(diceState: DiceState, index: number): DiceState {
  const newLocked = [...diceState.locked];
  newLocked[index] = !newLocked[index];
  
  return {
    ...diceState,
    locked: newLocked
  };
}

// 모든 주사위 선택 해제
export function unlockAllDice(diceState: DiceState): DiceState {
  return {
    ...diceState,
    locked: [false, false, false, false, false]
  };
}

// 점수 선택 가능 여부 확인
export function canSelectCategory(gameState: GameState, category: ScoreCategory): boolean {
  const currentPlayer = gameState.currentPlayer === 'human' ? gameState.player : gameState.ai;
  return currentPlayer.scores[category] === null;
}

// 점수 기록
export function recordScore(gameState: GameState, category: ScoreCategory): GameState {
  const result = calculateScore(gameState.dice.values, category);
  
  if (gameState.currentPlayer === 'human') {
    const newPlayerScores = {
      ...gameState.player.scores,
      [category]: result.score
    };
    
    const newPlayer: Player = {
      ...gameState.player,
      scores: newPlayerScores,
      totalScore: calculateTotalScore(newPlayerScores, gameState.player.yahtzeeBonus)
    };

    return {
      ...gameState,
      player: newPlayer
    };
  } else {
    const newAIScores = {
      ...gameState.ai.scores,
      [category]: result.score
    };
    
    const newAI: Player = {
      ...gameState.ai,
      scores: newAIScores,
      totalScore: calculateTotalScore(newAIScores, gameState.ai.yahtzeeBonus)
    };

    return {
      ...gameState,
      ai: newAI
    };
  }
}

// 턴 종료 (다음 플레이어로 전환)
export function endTurn(gameState: GameState): GameState {
  const isLastPlayerOfRound = gameState.currentPlayer === 'ai';

  // 주사위 초기화 (값과 잠금 모두 리셋)
  const resetDice: DiceState = {
    values: [1, 1, 1, 1, 1],
    locked: [false, false, false, false, false]
  };

  if (isLastPlayerOfRound) {
    // 라운드 종료, 다음 라운드로
    const nextRound = gameState.round + 1;
    const isGameFinished = nextRound > 13;

    return {
      ...gameState,
      round: nextRound,
      rollsLeft: 3,
      currentPlayer: 'human',
      dice: resetDice,
      gameStatus: isGameFinished ? 'finished' : 'playing'
    };
  } else {
    // AI 턴으로 전환
    return {
      ...gameState,
      rollsLeft: 3,
      currentPlayer: 'ai',
      dice: resetDice
    };
  }
}

// 굴림 횟수 차감
export function decrementRolls(gameState: GameState): GameState {
  return {
    ...gameState,
    rollsLeft: Math.max(0, gameState.rollsLeft - 1)
  };
}

// 게임 시작
export function startGame(gameState: GameState): GameState {
  return {
    ...gameState,
    gameStatus: 'playing',
    rollsLeft: 3 // 플레이어가 직접 굴림
  };
}

// 승자 결정
export function getWinner(gameState: GameState): 'human' | 'ai' | 'tie' {
  if (gameState.gameStatus !== 'finished') {
    throw new Error('게임이 아직 끝나지 않았습니다');
  }
  
  if (gameState.player.totalScore > gameState.ai.totalScore) {
    return 'human';
  } else if (gameState.ai.totalScore > gameState.player.totalScore) {
    return 'ai';
  } else {
    return 'tie';
  }
}

// 사용 가능한 카테고리 목록 반환
export function getAvailableCategories(gameState: GameState): ScoreCategory[] {
  const currentPlayer = gameState.currentPlayer === 'human' ? gameState.player : gameState.ai;
  const categories: ScoreCategory[] = [
    'aces', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ];
  
  return categories.filter(category => currentPlayer.scores[category] === null);
}

// 현재 주사위로 각 카테고리별 점수 미리보기
export function getScorePreviews(dice: number[]): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = [
    'aces', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ];
  
  const previews: Record<ScoreCategory, number> = {} as Record<ScoreCategory, number>;
  
  categories.forEach(category => {
    const result = calculateScore(dice, category);
    previews[category] = result.score;
  });
  
  return previews;
}