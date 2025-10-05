import React, { useState } from 'react';
import type { AILevel } from '../../types/game';

interface SetupScreenProps {
  onStartGame: (aiLevel: AILevel) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [selectedLevel, setSelectedLevel] = useState<AILevel>('BEGINNER');
  const [showRules, setShowRules] = useState(false);

  const difficulties = [
    {
      level: 'BEGINNER' as AILevel,
      name: '초보',
      description: '쉬운 상대, 기본적인 전략만 사용',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      level: 'INTERMEDIATE' as AILevel,
      name: '중수',
      description: '적당한 상대, 확률 기반 의사결정',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    },
    {
      level: 'EXPERT' as AILevel,
      name: '고수',
      description: '어려운 상대, 고급 전략과 최적화',
      color: 'bg-red-100 border-red-300 text-red-800'
    }
  ];

  const rules = [
    {
      title: '게임 목표',
      content: '13개의 점수 카테고리에서 가능한 한 높은 점수를 얻어 AI를 이기는 것'
    },
    {
      title: '기본 규칙',
      content: '• 턴마다 주사위를 최대 3번 굴릴 수 있음\n• 원하는 주사위를 선택하여 고정 가능\n• 각 턴이 끝나면 반드시 하나의 카테고리 선택'
    },
    {
      title: '상단 섹션',
      content: '1부터 6까지의 숫자별 합계. 총합이 63점 이상이면 35점 보너스'
    },
    {
      title: '하단 섹션',
      content: '• Three/Four of a Kind: 같은 숫자 3/4개 이상\n• Full House: 3개+2개 조합 (25점)\n• Small Straight: 연속 4개 (30점)\n• Large Straight: 연속 5개 (40점)\n• Yahtzee: 모두 같은 숫자 (50점)\n• Chance: 모든 주사위 합'
    },
    {
      title: '특별 규칙',
      content: '야추를 한 번 달성한 후 추가로 야추를 만들면 100점 보너스'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎲 야추 게임</h1>
          <p className="text-gray-600">AI와 함께하는 전략적 주사위 게임</p>
        </div>

        {!showRules ? (
          <>
            {/* 난이도 선택 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                AI 난이도를 선택하세요
              </h2>
              
              <div className="space-y-3">
                {difficulties.map((difficulty) => (
                  <label
                    key={difficulty.level}
                    className={`
                      block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedLevel === difficulty.level 
                        ? difficulty.color + ' shadow-md' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={difficulty.level}
                      checked={selectedLevel === difficulty.level}
                      onChange={(e) => setSelectedLevel(e.target.value as AILevel)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{difficulty.name}</div>
                        <div className="text-sm">{difficulty.description}</div>
                      </div>
                      {selectedLevel === difficulty.level && (
                        <div className="text-2xl">✓</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => onStartGame(selectedLevel)}
                className="btn-primary text-lg py-3"
              >
                게임 시작
              </button>
              
              <button
                onClick={() => setShowRules(true)}
                className="btn-secondary"
              >
                게임 규칙 보기
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 게임 규칙 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                게임 규칙
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {rules.map((rule, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">{rule.title}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-line">
                      {rule.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRules(false)}
                className="btn-secondary flex-1"
              >
                뒤로 가기
              </button>
              
              <button
                onClick={() => onStartGame(selectedLevel)}
                className="btn-primary flex-1"
              >
                게임 시작
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupScreen;