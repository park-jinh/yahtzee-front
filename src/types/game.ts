// 게임 상태 타입 정의
export interface DiceState {
  values: number[]; // [1-6, 1-6, 1-6, 1-6, 1-6]
  locked: boolean[]; // 선택된 주사위
}

export type ScoreCategory = 
  | 'aces' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse' | 'smallStraight' 
  | 'largeStraight' | 'yahtzee' | 'chance';

export interface ScoreCategoryInfo {
  name: string;
  score: number | null; // null = 아직 선택 안함
  possibleScore: number; // 현재 주사위로 얻을 수 있는 점수
}

export interface Player {
  name: string;
  scores: Record<ScoreCategory, number | null>;
  totalScore: number;
  upperBonus: boolean;
  yahtzeeBonus: number; // 추가 야추 보너스 횟수
}

export type GameStatus = 'setup' | 'playing' | 'finished';
export type CurrentPlayer = 'human' | 'ai';
export type AILevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface GameState {
  round: number; // 1-13
  rollsLeft: number; // 0-3
  currentPlayer: CurrentPlayer;
  player: Player;
  ai: Player;
  dice: DiceState;
  gameStatus: GameStatus;
  aiLevel: AILevel;
}

// AI Worker 통신 타입
export interface AIRequest {
  type: 'decide';
  payload: {
    level: AILevel;
    opsBudget: number;
    finalize: boolean; // true = choose category, false = choose dice
    turnState: {
      dice: number[]; // 5개
      roll: 1 | 2 | 3;
      scoreState: {
        usedMask: number; // 13비트 마스크
        upperSum: number;
        yahtzeeScored: boolean;
        yahtzeeBonusCount: number;
      };
    };
  };
}

export interface AIResponse {
  type: 'decision';
  payload: {
    keepIdx?: number[]; // dice indices to keep
    chooseOnFinal?: ScoreCategory; // category name
    score?: number;
  };
  perfOpsPerMs: number; // for adaptive budgeting
}

// 점수 계산용 헬퍼 타입
export interface DiceCounts {
  [key: number]: number; // 각 숫자별 개수
}

export interface ScoringResult {
  canScore: boolean;
  score: number;
  description?: string;
}