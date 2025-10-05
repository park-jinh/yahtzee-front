import type { DiceCounts, ScoringResult, ScoreCategory } from '../types/game';

// 주사위 배열을 카운트 객체로 변환
export function getDiceCounts(dice: number[]): DiceCounts {
  const counts: DiceCounts = {};
  dice.forEach(die => {
    counts[die] = (counts[die] || 0) + 1;
  });
  return counts;
}

// 상단 섹션 점수 계산 (Aces ~ Sixes)
export function calculateUpperSection(dice: number[], targetNumber: number): ScoringResult {
  const sum = dice.filter(die => die === targetNumber).reduce((acc, die) => acc + die, 0);
  return {
    canScore: true, // 상단은 항상 점수를 낼 수 있음 (0점이라도)
    score: sum
  };
}

// Three of a Kind 점수 계산
export function calculateThreeOfAKind(dice: number[]): ScoringResult {
  const counts = getDiceCounts(dice);
  const hasThreeOfAKind = Object.values(counts).some(count => count >= 3);
  
  return {
    canScore: hasThreeOfAKind,
    score: hasThreeOfAKind ? dice.reduce((sum, die) => sum + die, 0) : 0
  };
}

// Four of a Kind 점수 계산
export function calculateFourOfAKind(dice: number[]): ScoringResult {
  const counts = getDiceCounts(dice);
  const hasFourOfAKind = Object.values(counts).some(count => count >= 4);
  
  return {
    canScore: hasFourOfAKind,
    score: hasFourOfAKind ? dice.reduce((sum, die) => sum + die, 0) : 0
  };
}

// Full House 점수 계산 (3개 + 2개)
export function calculateFullHouse(dice: number[]): ScoringResult {
  const counts = getDiceCounts(dice);
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const isFullHouse = countValues.length === 2 && countValues[0] === 3 && countValues[1] === 2;
  
  return {
    canScore: isFullHouse,
    score: isFullHouse ? 25 : 0
  };
}

// Small Straight 점수 계산 (연속된 4개)
export function calculateSmallStraight(dice: number[]): ScoringResult {
  const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
  
  // 가능한 스몰 스트레이트: [1,2,3,4], [2,3,4,5], [3,4,5,6]
  const smallStraights = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6]
  ];
  
  const hasSmallStraight = smallStraights.some(straight => 
    straight.every(num => uniqueDice.includes(num))
  );
  
  return {
    canScore: hasSmallStraight,
    score: hasSmallStraight ? 30 : 0
  };
}

// Large Straight 점수 계산 (연속된 5개)
export function calculateLargeStraight(dice: number[]): ScoringResult {
  const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
  
  // 가능한 라지 스트레이트: [1,2,3,4,5], [2,3,4,5,6]
  const largeStraights = [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6]
  ];
  
  const hasLargeStraight = largeStraights.some(straight => 
    straight.length === uniqueDice.length && 
    straight.every((num, index) => num === uniqueDice[index])
  );
  
  return {
    canScore: hasLargeStraight,
    score: hasLargeStraight ? 40 : 0
  };
}

// Yahtzee 점수 계산 (모든 주사위가 같은 숫자)
export function calculateYahtzee(dice: number[]): ScoringResult {
  const counts = getDiceCounts(dice);
  const isYahtzee = Object.values(counts).includes(5);
  
  return {
    canScore: isYahtzee,
    score: isYahtzee ? 50 : 0
  };
}

// Chance 점수 계산 (모든 주사위의 합)
export function calculateChance(dice: number[]): ScoringResult {
  return {
    canScore: true,
    score: dice.reduce((sum, die) => sum + die, 0)
  };
}

// 카테고리별 점수 계산 메인 함수
export function calculateScore(dice: number[], category: ScoreCategory): ScoringResult {
  switch (category) {
    case 'aces':
      return calculateUpperSection(dice, 1);
    case 'twos':
      return calculateUpperSection(dice, 2);
    case 'threes':
      return calculateUpperSection(dice, 3);
    case 'fours':
      return calculateUpperSection(dice, 4);
    case 'fives':
      return calculateUpperSection(dice, 5);
    case 'sixes':
      return calculateUpperSection(dice, 6);
    case 'threeOfAKind':
      return calculateThreeOfAKind(dice);
    case 'fourOfAKind':
      return calculateFourOfAKind(dice);
    case 'fullHouse':
      return calculateFullHouse(dice);
    case 'smallStraight':
      return calculateSmallStraight(dice);
    case 'largeStraight':
      return calculateLargeStraight(dice);
    case 'yahtzee':
      return calculateYahtzee(dice);
    case 'chance':
      return calculateChance(dice);
    default:
      return { canScore: false, score: 0 };
  }
}

// 상단 보너스 계산 (63점 이상이면 35점 추가)
export function calculateUpperBonus(upperScores: Record<string, number | null>): number {
  const upperCategories = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperSum = upperCategories.reduce((sum: number, category) => {
    const score = upperScores[category];
    return sum + (score ?? 0);
  }, 0);
  
  return upperSum >= 63 ? 35 : 0;
}

// 총점 계산
export function calculateTotalScore(scores: Record<ScoreCategory, number | null>, yahtzeeBonus: number = 0): number {
  const baseScore = Object.values(scores).reduce((sum: number, score) => sum + (score ?? 0), 0);
  const upperBonus = calculateUpperBonus(scores);
  const totalYahtzeeBonus = yahtzeeBonus * 100; // 추가 야추당 100점
  
  return baseScore + upperBonus + totalYahtzeeBonus;
}

// 야추 조커 규칙 적용 여부 확인
export function canUseYahtzeeJoker(dice: number[], _category: ScoreCategory, yahtzeeScored: boolean): boolean {
  if (!yahtzeeScored) return false;
  
  const isYahtzee = calculateYahtzee(dice).canScore;
  if (!isYahtzee) return false;
  
  // 야추가 달성된 상태에서 추가 야추를 얻었을 때
  // 해당 숫자의 상단 칸이나 다른 하단 칸에 사용 가능
  return true;
}

// 카테고리 이름을 한글로 변환
export function getCategoryDisplayName(category: ScoreCategory): string {
  const categoryNames: Record<ScoreCategory, string> = {
    aces: '1 (Aces)',
    twos: '2 (Twos)', 
    threes: '3 (Threes)',
    fours: '4 (Fours)',
    fives: '5 (Fives)',
    sixes: '6 (Sixes)',
    threeOfAKind: 'Three of a Kind',
    fourOfAKind: 'Four of a Kind',
    fullHouse: 'Full House',
    smallStraight: 'Small Straight',
    largeStraight: 'Large Straight',
    yahtzee: 'YAHTZEE',
    chance: 'Chance'
  };
  
  return categoryNames[category];
}