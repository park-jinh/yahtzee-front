import React from 'react';
import clsx from 'clsx';

interface DieProps {
  value: number;
  isLocked: boolean;
  isRolling: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const Die: React.FC<DieProps> = ({ value, isLocked, isRolling, onClick, disabled = false }) => {
  // 주사위 눈 패턴 생성
  const renderDots = (num: number) => {
    const dots: React.ReactElement[] = [];
    const positions = [
      [], // 0 (사용 안함)
      ['center'], // 1
      ['top-left', 'bottom-right'], // 2  
      ['top-left', 'center', 'bottom-right'], // 3
      ['top-left', 'top-right', 'bottom-left', 'bottom-right'], // 4
      ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'], // 5
      ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'] // 6
    ];

    const dotPositions = positions[num] || [];
    
    dotPositions.forEach((position, index) => {
      dots.push(
        <div
          key={index}
          className={clsx(
            'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-800 rounded-full absolute',
            {
              'top-0.5 left-0.5 sm:top-1 sm:left-1': position === 'top-left',
              'top-0.5 right-0.5 sm:top-1 sm:right-1': position === 'top-right',
              'top-1/2 left-0.5 sm:left-1 -translate-y-1/2': position === 'middle-left',
              'top-1/2 right-0.5 sm:right-1 -translate-y-1/2': position === 'middle-right',
              'bottom-0.5 left-0.5 sm:bottom-1 sm:left-1': position === 'bottom-left',
              'bottom-0.5 right-0.5 sm:bottom-1 sm:right-1': position === 'bottom-right',
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': position === 'center'
            }
          )}
        />
      );
    });
    
    return dots;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRolling}
      className={clsx(
        'dice-face relative select-none',
        {
          'dice-selected': isLocked,
          'animate-dice-roll': isRolling,
          'cursor-not-allowed opacity-50': disabled || isRolling,
          'hover:shadow-md': !disabled && !isRolling
        }
      )}
      aria-label={`주사위 ${value}, ${isLocked ? '선택됨' : '선택 안됨'}`}
    >
      {!isRolling && renderDots(value)}
      {isRolling && (
        <div className="text-gray-400 text-sm">
          ?
        </div>
      )}
    </button>
  );
};

export default Die;