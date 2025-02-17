import { RoundCross } from '@/assets/svg';
import { Token } from '@/assets/svg/token';
import { TokenMetadataType } from '@/utils/types';
import React, { useState, useEffect } from 'react';


interface RewardToken {
  token: TokenMetadataType;
  rewardPerSession: string;
}

interface RewardTokenListProps {
  tokens: RewardToken[];
  handleRemove: (token: TokenMetadataType) => void;
  handleRewardPerSessionChange: (tokenAddress: string, newReward: string) => void;
}

const RewardTokenList = ({ tokens, handleRemove, handleRewardPerSessionChange }: RewardTokenListProps) => {
  // State to store rewardPerSession for each token, keyed by token.address
  const [rewardSessions, setRewardSessions] = useState<{ [address: string]: string }>({});

  useEffect(() => {
    // Initialize rewardSessions with existing tokens' rewardPerSession values
    const initialSessions: { [address: string]: string } = {};
    tokens.forEach(({ token, rewardPerSession }) => {
      initialSessions[token.address] = rewardPerSession;
    });
    setRewardSessions(initialSessions);
  }, [tokens]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, tokenAddress: string) => {
    const newReward = e.target.value;
    setRewardSessions((prev) => ({
      ...prev,
      [tokenAddress]: newReward, // Update rewardPerSession for the specific token
    }));
    handleRewardPerSessionChange(tokenAddress, newReward); // Call the parent handler
  };

  return (
    <div className="w-full max-h-[100px] overflow-y-auto rounded-md bg-[#594661] border border-white border-opacity-20 mb-2 py-2">
      {tokens.map(({ token }) => {
        return (
          <div key={token.address} className="w-full flex items-center justify-between px-6">
            <div className="flex items-center justify-start">
              <button onClick={() => handleRemove(token)} className="mr-2">
                <RoundCross />
              </button>
              {token.icon ? (
                <img className="w-[20px] h-[20px]" src={token.icon} />
              ) : (
                <Token width={40} height={40} />
              )}
              <p className="text-[12px] md:text-[14px] text-white font-normal pl-2">
                {token.symbol || ''}
              </p>
            </div>

            <input
              className="bg-transparent text-white font-bold text-md md:text-lg placeholder-white placeholder-opacity-70 border-none focus:border-white focus:outline-none focus:ring-0 hover:border-none text-right"
              placeholder="0.0"
              type="number"
              value={rewardSessions[token.address] || ''}
              onChange={(e) => handleInputChange(e, token.address)}
              min={0}
            />
          </div>
        );
      })}
    </div>
  );
};

export default RewardTokenList;
