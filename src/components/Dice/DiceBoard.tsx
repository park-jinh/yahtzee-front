import React, { useState } from 'react';
import Die from './Die';
import type { DiceState } from '../../types/game';

interface DiceBoardProps {
  diceState: DiceState;
  onDiceClick: (index: number) => void;
  onRoll: () => void;
  rollsLeft: number;
  canRoll: boolean;
  disabled?: boolean;
}

const DiceBoard: React.FC<DiceBoardProps> = ({ 
  diceState, 
  onDiceClick, 
  onRoll, 
  rollsLeft, 
  canRoll,
  disabled = false 
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    if (!canRoll || disabled) return;
    
    setIsRolling(true);
    
    // 애니메이션 시간
    setTimeout(() => {
      onRoll();
      setIsRolling(false);
    }, 600);
  };

  const getRollButtonText = () => {
    if (rollsLeft === 3) return '주사위 굴리기';
    if (rollsLeft === 2) return '다시 굴리기 (2번 남음)';
    if (rollsLeft === 1) return '마지막 굴리기';
    return '굴리기 완료';
  };

  const getRollButtonClass = () => {
    if (!canRoll || disabled || rollsLeft === 0) return 'btn-disabled';
    return 'btn-primary';
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full px-2">
      {/* 주사위 컨테이너 */}
      <div className="flex justify-center items-center gap-1.5 sm:gap-2.5 w-full">
        {diceState.values.map((value, index) => (
          <Die
            key={index}
            value={value}
            isLocked={diceState.locked[index]}
            isRolling={isRolling && !diceState.locked[index]}
            onClick={() => onDiceClick(index)}
            disabled={disabled || rollsLeft === 3} // 첫 굴림 전에는 선택 불가
          />
        ))}
      </div>

      {/* 굴리기 정보 */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">
          {rollsLeft === 3 ? '주사위를 굴려서 게임을 시작하세요' : 
           rollsLeft > 0 ? '원하는 주사위를 선택한 후 다시 굴리거나 점수를 선택하세요' :
           '점수를 선택하세요'}
        </div>
        
        {/* 굴리기 버튼 */}
        <button
          onClick={handleRoll}
          disabled={!canRoll || disabled || rollsLeft === 0 || isRolling}
          className={getRollButtonClass()}
        >
          {isRolling ? '굴리는 중...' : getRollButtonText()}
        </button>
        
        {/* 남은 굴림 횟수 표시 */}
        {rollsLeft < 3 && (
          <div className="mt-2 text-xs text-gray-500">
            남은 굴림: {rollsLeft}회
          </div>
        )}
      </div>

      {/* 선택된 주사위 안내 */}
      {rollsLeft < 3 && rollsLeft > 0 && (
        <div className="text-xs text-blue-600 text-center max-w-sm">
          💡 선택된 주사위(파란색)는 다음 굴림에서 고정됩니다
        </div>
      )}
    </div>
  );
};

export default DiceBoard;