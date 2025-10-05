import React from 'react';
import clsx from 'clsx';
import type { Player, ScoreCategory } from '../../types/game';
import { getCategoryDisplayName, calculateScore, calculateUpperBonus } from '../../utils/scoring';

interface ScoreCardProps {
  player: Player;
  ai: Player;
  currentDice: number[];
  availableCategories: ScoreCategory[];
  onCategorySelect?: (category: ScoreCategory) => void;
  isPlayerTurn: boolean;
  aiSelectedCategory?: ScoreCategory | null;
  hasRolled: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  player,
  ai,
  currentDice,
  availableCategories,
  onCategorySelect,
  isPlayerTurn,
  aiSelectedCategory,
  hasRolled
}) => {

  // 상단 섹션 카테고리
  const upperCategories: ScoreCategory[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  
  // 하단 섹션 카테고리
  const lowerCategories: ScoreCategory[] = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ];

  // 현재 주사위로 얻을 수 있는 점수 계산
  const getPreviewScore = (category: ScoreCategory): number => {
    const result = calculateScore(currentDice, category);
    return result.score;
  };

  // 카테고리 선택 가능 여부
  const canSelectCategory = (category: ScoreCategory): boolean => {
    return isPlayerTurn &&
           availableCategories.includes(category) &&
           onCategorySelect !== undefined &&
           hasRolled;
  };

  // 상단 섹션 합계 계산
  const getUpperSum = (playerScores: Record<ScoreCategory, number | null>): number => {
    return upperCategories.reduce((sum: number, category) => {
      return sum + (playerScores[category] ?? 0);
    }, 0);
  };

  // 보너스 계산
  const getBonus = (playerScores: Record<ScoreCategory, number | null>): number => {
    return calculateUpperBonus(playerScores);
  };

  // 총점 계산
  const getTotalScore = (playerData: Player): number => {
    const baseScore = Object.values(playerData.scores).reduce((sum: number, score) => sum + (score ?? 0), 0);
    const bonus = getBonus(playerData.scores);
    const yahtzeeBonus = playerData.yahtzeeBonus * 100;
    return baseScore + bonus + yahtzeeBonus;
  };

  const renderScoreRow = (category: ScoreCategory, label: string, maxScore?: string) => {
    const playerScore = player.scores[category];
    const aiScore = ai.scores[category];
    const previewScore = getPreviewScore(category);
    const isAvailable = canSelectCategory(category);

    return (
      <tr key={category} className="border-b">
        <td className="score-cell text-left font-medium">
          {label}
          {maxScore && <span className="text-xs text-gray-500 ml-1">({maxScore})</span>}
        </td>
        <td 
          className={clsx(
            'score-cell',
            {
              'score-available': isAvailable,
              'score-used': playerScore !== null,
              'bg-yellow-50': isAvailable && previewScore > 0
            }
          )}
          onClick={isAvailable ? () => onCategorySelect!(category) : undefined}
        >
          {playerScore !== null ? (
            playerScore
          ) : isAvailable ? (
            <span className="text-green-600 font-semibold">
              {previewScore}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className={clsx(
          'score-cell',
          {
            'score-used': aiScore !== null,
            'bg-blue-200 font-bold animate-pulse': aiSelectedCategory === category
          }
        )}>
          {aiScore !== null ? aiScore : <span className="text-gray-400">-</span>}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-center mb-4">📊 점수표</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[27.5%]" />
            <col className="w-[27.5%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-100">
              <th className="score-cell text-left">카테고리</th>
              <th className="score-cell">플레이어</th>
              <th className="score-cell">AI</th>
            </tr>
          </thead>
          
          <tbody>
            {/* 상단 섹션 */}
            <tr>
              <td colSpan={3} className="bg-blue-50 text-center font-semibold py-2 text-blue-800">
                상단 섹션 (Upper Section)
              </td>
            </tr>
            
            {upperCategories.map(category => 
              renderScoreRow(category, getCategoryDisplayName(category), 
                category === 'sixes' ? '30' : `${Math.max(1, upperCategories.indexOf(category) + 1) * 5}`)
            )}
            
            {/* 상단 합계 */}
            <tr className="bg-gray-50 font-semibold">
              <td className="score-cell text-left">상단 합계</td>
              <td className="score-cell">{getUpperSum(player.scores)}</td>
              <td className="score-cell">{getUpperSum(ai.scores)}</td>
            </tr>
            
            {/* 보너스 */}
            <tr className="bg-gray-50">
              <td className="score-cell text-left">
                보너스 (63점 이상시 +35)
              </td>
              <td className="score-cell">{getBonus(player.scores)}</td>
              <td className="score-cell">{getBonus(ai.scores)}</td>
            </tr>
            
            {/* 하단 섹션 */}
            <tr>
              <td colSpan={3} className="bg-green-50 text-center font-semibold py-2 text-green-800">
                하단 섹션 (Lower Section)
              </td>
            </tr>
            
            {lowerCategories.map(category => {
              let maxScore = '';
              switch(category) {
                case 'fullHouse': maxScore = '25'; break;
                case 'smallStraight': maxScore = '30'; break;
                case 'largeStraight': maxScore = '40'; break;
                case 'yahtzee': maxScore = '50'; break;
                case 'threeOfAKind':
                case 'fourOfAKind':
                case 'chance': maxScore = '30'; break;
              }
              return renderScoreRow(category, getCategoryDisplayName(category), maxScore);
            })}
            
            {/* 야추 보너스 */}
            {(player.yahtzeeBonus > 0 || ai.yahtzeeBonus > 0) && (
              <tr className="bg-yellow-50">
                <td className="score-cell text-left">야추 보너스 (×100)</td>
                <td className="score-cell">{player.yahtzeeBonus * 100}</td>
                <td className="score-cell">{ai.yahtzeeBonus * 100}</td>
              </tr>
            )}
            
            {/* 총점 */}
            <tr className="bg-gray-100 font-bold text-lg">
              <td className="score-cell text-left">총점</td>
              <td className="score-cell">{getTotalScore(player)}</td>
              <td className="score-cell">{getTotalScore(ai)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 안내 메시지 */}
      {isPlayerTurn && availableCategories.length > 0 && (
        <div className="mt-4 text-xs text-gray-600 text-center">
          💡 초록색 숫자는 현재 주사위로 얻을 수 있는 점수입니다. 클릭하여 선택하세요.
        </div>
      )}
    </div>
  );
};

export default ScoreCard;