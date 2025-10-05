import type { ScoreCategory } from '../types/game';
import { calculateScore, getDiceCounts } from './scoring';

// 공통 유틸리티 함수
class AIUtils {
  // 스트레이트 패턴 감지
  static detectStraightPattern(dice: number[]): { type: 'large' | 'small' | 'partial' | 'none', numbers: number[] } {
    const unique = [...new Set(dice)].sort((a, b) => a - b);
    const str = unique.join('');

    if (str === '12345' || str === '23456') return { type: 'large', numbers: unique };
    if (/1234|2345|3456/.test(str)) return { type: 'small', numbers: unique };
    if (unique.length >= 3) {
      for (let i = 0; i <= unique.length - 3; i++) {
        if (unique[i + 1] === unique[i] + 1 && unique[i + 2] === unique[i] + 2) {
          return { type: 'partial', numbers: unique.slice(i, i + 3) };
        }
      }
    }
    return { type: 'none', numbers: [] };
  }

  // 풀하우스 가능성 확인
  static detectFullHousePotential(dice: number[]): { hasFullHouse: boolean, hasPair: boolean, hasTriple: boolean } {
    const counts = getDiceCounts(dice);
    const values = Object.values(counts).sort((a, b) => b - a);
    return {
      hasFullHouse: values[0] === 3 && values[1] === 2,
      hasPair: values[0] === 2 || values[1] === 2,
      hasTriple: values[0] === 3
    };
  }

  // 기대값 계산 헬퍼 (미사용 인자 제거)
  static calculateExpectedValue(category: ScoreCategory, currentScore: number): number {
    // 카테고리별 평균 기대값 (통계적 데이터 기반)
    const avgExpectedScore: Record<ScoreCategory, number> = {
      aces: 1.9,
      twos: 3.8,
      threes: 5.7,
      fours: 7.6,
      fives: 9.5,
      sixes: 11.4,
      threeOfAKind: 15.0,
      fourOfAKind: 18.0,
      fullHouse: 25.0,
      smallStraight: 30.0,
      largeStraight: 40.0,
      yahtzee: 50.0,
      chance: 21.0
    };

    const expected = avgExpectedScore[category] || 0;
    // 현재 점수 vs 기대값 비율
    return currentScore / Math.max(expected, 1);
  }
}

// 초보 AI: 단순 탐욕적 전략
export class BeginnerAI {
  static chooseDiceToKeep(dice: number[]): number[] {
    const counts = getDiceCounts(dice);
    const straight = AIUtils.detectStraightPattern(dice);

    // 스트레이트 우선
    if (straight.type !== 'none') {
      const keepNumbers = new Set(straight.numbers);
      return dice.map((d, i) => keepNumbers.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 가장 많이 나온 숫자 (높은 숫자 우선)
    let maxCount = 0;
    let bestNumber = 0;
    for (const [num, count] of Object.entries(counts)) {
      const n = parseInt(num);
      if (count > maxCount || (count === maxCount && n > bestNumber)) {
        maxCount = count;
        bestNumber = n;
      }
    }

    return dice.map((d, i) => d === bestNumber ? i : -1).filter(i => i !== -1);
  }

  static chooseCategory(dice: number[], availableCategories: ScoreCategory[]): ScoreCategory {
    if (availableCategories.length === 0) {
      throw new Error('사용 가능한 카테고리가 없습니다');
    }

    let bestCategory = availableCategories[0];
    let bestValue = -1;

    // 카테고리 가치 가중치 (모든 키 포함)
    const categoryWeight: Record<ScoreCategory, number> = {
      yahtzee: 1.0, largeStraight: 0.9, fullHouse: 0.85, smallStraight: 0.8,
      fourOfAKind: 0.75, sixes: 0.65, fives: 0.6, threeOfAKind: 0.55,
      fours: 0.5, threes: 0.4, twos: 0.35, aces: 0.3, chance: 0.25
    };

    for (const category of availableCategories) {
      const result = calculateScore(dice, category);
      const value = result.score * (categoryWeight[category] || 1.0);

      if (value > bestValue) {
        bestValue = value;
        bestCategory = category;
      }
    }

    return bestCategory;
  }
}

// 중급 AI: 전략적 주사위 선택 + 보너스 관리
export class IntermediateAI {
  static chooseDiceToKeep(dice: number[]): number[] {
    const counts = getDiceCounts(dice);
    const straight = AIUtils.detectStraightPattern(dice);
    const fullHouse = AIUtils.detectFullHousePotential(dice);

    // 1. 라지 스트레이트 완성
    if (straight.type === 'large') {
      const keepNumbers = new Set(straight.numbers);
      return dice.map((d, i) => keepNumbers.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 2. 야추/4-of-a-kind 추구 (3개 이상)
    for (const [num, count] of Object.entries(counts)) {
      if (count >= 3) {
        const n = parseInt(num);
        return dice.map((d, i) => d === n ? i : -1).filter(i => i !== -1);
      }
    }

    // 3. 풀하우스 완성
    if (fullHouse.hasFullHouse) {
      return dice.map((_, i) => i); // 모두 유지
    }

    // 4. 스몰 스트레이트 → 라지 시도
    if (straight.type === 'small') {
      const keepNumbers = new Set(straight.numbers);
      return dice.map((d, i) => keepNumbers.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 5. 풀하우스 가능성 (3+1 or 2+2)
    if (fullHouse.hasTriple && fullHouse.hasPair) {
      const countEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const keep = new Set([parseInt(countEntries[0][0]), parseInt(countEntries[1][0])]);
      return dice.map((d, i) => keep.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 6. 페어 2개 (풀하우스 시도)
    const pairs = Object.entries(counts).filter(([_, c]) => c === 2);
    if (pairs.length === 2) {
      const keep = new Set(pairs.map(([n]) => parseInt(n)));
      return dice.map((d, i) => keep.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 7. 부분 스트레이트
    if (straight.type === 'partial') {
      const keepNumbers = new Set(straight.numbers);
      return dice.map((d, i) => keepNumbers.has(d) ? i : -1).filter(i => i !== -1);
    }

    // 8. 높은 숫자 페어 (4-6)
    const highPair = Object.entries(counts).find(([n, c]) => c >= 2 && parseInt(n) >= 4);
    if (highPair) {
      const n = parseInt(highPair[0]);
      return dice.map((d, i) => d === n ? i : -1).filter(i => i !== -1);
    }

    // 9. 기본: 가장 많은 숫자 (높은 것 우선)
    return BeginnerAI.chooseDiceToKeep(dice);
  }

  static chooseCategory(dice: number[], availableCategories: ScoreCategory[], upperSum: number): ScoreCategory {
    if (availableCategories.length === 0) {
      throw new Error('사용 가능한 카테고리가 없습니다');
    }

    const upperCategories: ScoreCategory[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const bonusNeeded = 63 - upperSum;
    const upperRemaining = availableCategories.filter(c => upperCategories.includes(c));

    let bestCategory = availableCategories[0];
    let bestValue = -1;

    for (const category of availableCategories) {
      const result = calculateScore(dice, category);
      let value = result.score;

      // 보너스 관리 전략
      if (upperCategories.includes(category)) {
        // 보너스 달성 가능성
        if (bonusNeeded > 0 && upperRemaining.length > 0) {
          const avgNeeded = bonusNeeded / upperRemaining.length;
          // 평균 이상이면 보너스 가치 추가
          if (result.score >= avgNeeded * 0.8) {
            value += 35 * (result.score / avgNeeded) * 0.5; // 보너스 기대값
          }
        }
        // 보너스 이미 달성했으면 가치 감소
        if (upperSum >= 63) {
          value *= 0.7;
        }
      }

      // 카테고리 희소성 가중치 (부분 맵 사용)
      const rarityBonus: Partial<Record<ScoreCategory, number>> = {
        yahtzee: 25, largeStraight: 20, fullHouse: 15, smallStraight: 12,
        fourOfAKind: 10, threeOfAKind: 5, chance: -5
      };
      value += rarityBonus[category] ?? 0;

      // 효율성 비율 (실제 점수 / 기대 점수)
      const efficiency = AIUtils.calculateExpectedValue(category, result.score);
      value *= (0.5 + efficiency * 0.5); // 효율성 반영

      if (value > bestValue) {
        bestValue = value;
        bestCategory = category;
      }
    }

    return bestCategory;
  }
}

// 고급 AI: 고급 전략 + 게임 상황 분석
export class ExpertAI {
  static chooseDiceToKeep(dice: number[], _opsBudget: number, round: number): number[] {
    const counts = getDiceCounts(dice);
    const straight = AIUtils.detectStraightPattern(dice);
    const fullHouse = AIUtils.detectFullHousePotential(dice);

    if(!straight&&!fullHouse){
      console.log('이거 임시 변수임');
    }

    // 초반 (1-5라운드): 고득점 조합 적극 추구
    if (round <= 5) {
      // 야추 가능성 (4개)
      for (const [num, count] of Object.entries(counts)) {
        if (count === 4) {
          const n = parseInt(num);
          return dice.map((d, i) => d === n ? i : -1).filter(i => i !== -1);
        }
      }

      // 3개 (5-6만) - 야추/4-of-a-kind 시도
      for (const [num, count] of Object.entries(counts)) {
        if (count === 3 && parseInt(num) >= 5) {
          const n = parseInt(num);
          return dice.map((d, i) => d === n ? i : -1).filter(i => i !== -1);
        }
      }
    }

    // 공통 전략
    return IntermediateAI.chooseDiceToKeep(dice);
  }

  static chooseCategory(
    dice: number[],
    availableCategories: ScoreCategory[],
    upperSum: number,
    round: number
  ): ScoreCategory {
    if (availableCategories.length === 0) {
      throw new Error('사용 가능한 카테고리가 없습니다');
    }

    const upperCategories: ScoreCategory[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const bonusNeeded = 63 - upperSum;
    const upperRemaining = availableCategories.filter(c => upperCategories.includes(c));
    const roundsLeft = 13 - round;

    let bestCategory = availableCategories[0];
    let bestValue = -1;

    for (const category of availableCategories) {
      const result = calculateScore(dice, category);
      let value = result.score;

      // 1. 보너스 전략 (고급)
      if (upperCategories.includes(category)) {
        if (bonusNeeded > 0 && upperRemaining.length > 0) {
          const avgNeeded = bonusNeeded / upperRemaining.length;
          // 공통 보너스 확률 헬퍼 활용(미사용 함수 제거 목적 + 일관성)
          const bonusProb = this.calculateBonusProbability(upperSum, availableCategories);

          // 초반: 보너스 가능성 높이면 적극 추구
          if (round <= 6 && result.score >= avgNeeded * 0.7) {
            value += 35 * bonusProb * 0.8;
          }
          // 중반: 균형
          else if (round <= 10 && result.score >= avgNeeded * 0.6) {
            value += 35 * bonusProb * 0.6;
          }
          // 후반: 보수적
          else if (result.score >= avgNeeded * 0.9) {
            value += 35 * bonusProb * 0.4;
          }
        }

        // 보너스 달성 후 상단 카테고리 가치 하락
        if (upperSum >= 63) {
          value *= 0.6;
        }
      }

      // 2. 희소성 프리미엄 (라운드 고려, 부분 맵 사용)
      const rarityValue: Partial<Record<ScoreCategory, number>> = {
        yahtzee: 30,
        largeStraight: 25,
        fullHouse: 18,
        smallStraight: 15,
        fourOfAKind: 12,
        threeOfAKind: 6,
        chance: -8
      };

      // 후반부에 희소 카테고리 가치 상승
      const rarityMultiplier = round >= 10 ? 1.5 : 1.0;
      value += (rarityValue[category] ?? 0) * rarityMultiplier;

      // 3. 기회 비용 (효율성)
      const efficiency = AIUtils.calculateExpectedValue(category, result.score);

      // 초반: 효율 70% 이상이면 선택 고려
      if (round <= 5 && efficiency < 0.7) {
        value *= 0.7;
      }
      // 중반: 효율 60% 이상
      else if (round <= 10 && efficiency < 0.6) {
        value *= 0.8;
      }
      // 후반: 효율 50% 이상 (선택지 제한적)
      else if (efficiency < 0.5) {
        value *= 0.9;
      }

      // 4. 시간 압박 (남은 라운드)
      if (roundsLeft <= 3) {
        // 확실한 점수 우선
        value *= 1.2;
      }

      if (value > bestValue) {
        bestValue = value;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  private static calculateBonusProbability(currentUpperSum: number, available: ScoreCategory[]): number {
    const upperCategories: ScoreCategory[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const remainingUpper = available.filter(cat => upperCategories.includes(cat));

    if (currentUpperSum >= 63) return 1.0;
    if (remainingUpper.length === 0) return 0.0;

    const needed = 63 - currentUpperSum;
    // 평균 3.5점 기대
    const expectedTotal = remainingUpper.length * 3.5;

    return Math.min(1.0, Math.max(0.0, (expectedTotal - needed) / 35));
  }
}
