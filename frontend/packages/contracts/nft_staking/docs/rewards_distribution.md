# Rewards Distribution

The NFT Staking Contract distributes rewards for NFT owners that choose to stake their tokens. The longer they stake, the biggest their total reward. This happens through Staking Programs, which are created by the contract's administrators to support select NFT Collections.

There are a couple of parameters should be configured when creating a Staking Program. These parameters and other technical concepts whose knowledge is necessary to operate this contract will be discussed in this document.

## Rounds

As tokens are quantized - meaning they cannot be divided into arbitrarily small pieces - so it's not possible to make reward distribution perfectly linear on total staked time. Thus, the adopted solution is to have rewards distributed at discrete moments in time, called rounds.

### Round Interval

The interval between rounds is determined when creating a Staking Program.

Note that the shorter the round interval, the more closely to linear on time the reward distribution function end up as. It's recommended to set it to couple of seconds at most.

### Round Reward

Of course, the amount of rewards to be distributed at each round is also an important parameter to consider. As Staking Programs reward multiple different tokens to stakers, this value is configurable in a per-token basis.

As previously mentioned, [round intervals](#round-interval) are supposed to be short so that we can have quantized reward distribution that mimics a linear one. With that in mind, the round reward should also be small, as it's going to get distributed very frequently.

It's important to calculate `program_duration = available_rewards / (round_reward(token) * round_interval)` so that a Staking Program can be configured according to their inteded duration.

## Seeds

A Staking Program distributes funds on a per-round basis to staked tokens. The reward distributed at each round is constant, but the amount of staked tokens is not, meaning that the reward is evenly distributed among each token staked during the round. A NFT staked at a given round is called a seed.

### RPS

One of the huge paradigm changes of Web 3 is the smart contract's model of execution. Instead of having a service continously updating the system's state, with smart contracts we can only update state whenever an user calls a function and pays for its gas. If that's the case, how can we update the token's rewards appropriately, considering they increase every couple of seconds?

Note that as long as no user stakes or unstake a token, we can determine what the new balance of each token should be: just increment it by `(rounds * round_reward) / total_seeds`. These 3 parameters completely determine the state change that happened between the last seed update (either stake or unstake). The [round reward](#round-reward) is constant, the amount of rounds can be calculated with the block timestamp and [round intervals](#round-interval), which is constant. That leaves the amount of seeds.

However, whenever a seed update happens, that means there's an user paying for gas, and we can use this opportunity to update the farm state. Still, it wouldn't be fair (or viable) to make an user pay enough gas for updating all the seeds' balances. But that's unnecessary. We can just update a single number, the farm's RPS.

The RPS (reward per seed) represents the reward a single seed would have if it was staked since the last round there were no seeds. That way, for each given seed we can just register what the RPS value was when it was staked, and subtract that from the current RPS when claiming rewards, and then update it to the current value.
