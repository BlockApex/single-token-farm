// configs
import { vaultConfigs } from './config';

// types
import type { ITokenPrice } from "@/stores/token-price-store";
import type { Vault } from "./hooks";

// utils
import { calculateAPR } from './utils';

interface ICalculateAPRTestParams {
  expected: string;
  vault: Vault;
}

describe(`${__dirname}/utils`, () => {
  const tokenPrices: ITokenPrice[] = [
    {
      contract: 'jumptoken.jumpfinance.near',
      price: '0.006936001638',
      symbol: 'JUMP',
    },
    {
      contract: 'blackdragon.tkn.near',
      price: '0.000000031642',
      symbol: 'BLACKDRAGON',
    },
  ];
  
  describe('calculateAPR', () => {
    it.each([
      {
        expected: '28.40%',
        vault: {
          id: 1714504347026,
          apr: 20856500000,
          min_stake_amount: '1000000000000000000',
          max_fill_amount: '2500000000000000000000000',
          filled_amount: '42913950000000000000000',
          locked_time_ms: 2419200000,
          vault_start_time: 1714539114930,
          url: 'data:image/jpeg;base64,/9j/4AAQ...',
          name: 'Black Dragon Vault #1',
          stake_reward_rate: '10000000000000000000000',
          vaultConfig: vaultConfigs[0], // jumpvault1.near
        } as Vault,
      },
      {
        expected: '28.49%',
        vault: {
          id: 1714504545040,
          apr: 27900000000,
          min_stake_amount: '1000000000000000000',
          max_fill_amount: '2500000000000000000000000',
          filled_amount: '13299010000000000000000',
          locked_time_ms: 1814400000,
          vault_start_time: 1714528561526,
          url: 'data:image/png;base64,iVBOR...',
          name: 'Black Dragon Vault 2',
          stake_reward_rate: '10000000000000000000000',
          vaultConfig: vaultConfigs[0], // jumpvault1.near
        } as Vault,
      },
      {
        expected: '14.21%',
        vault: {
          id: 1714504624751,
          apr: 13910000000,
          min_stake_amount: '1000000000000000000',
          max_fill_amount: '2500000000000000000000000',
          filled_amount: '169620145567150137000000',
          locked_time_ms: 1814400000,
          vault_start_time: 1715266102548,
          url: 'data:image/png;base64,iVBOR...',
          name: 'Black Dragon Vault 3',
          stake_reward_rate: '10000000000000000000000',
          vaultConfig: vaultConfigs[0], // jumpvault1.near
        } as Vault,
      },
      {
        expected: '14.79%',
        vault: {
          id: 1717185675323,
          apr: 3378000000,
          min_stake_amount: '1000000000000000000',
          max_fill_amount: '3500000000000000000000000',
          filled_amount: '3451210254690000000000000',
          locked_time_ms: 7776000000,
          vault_start_time: 1718123439101,
          url: 'data:image/png;base64,iVBOR...',
          name: 'Black Dragon Vault #4',
          stake_reward_rate: '10000000000000000000000',
          vaultConfig: vaultConfigs[0], // jumpvault1.near
        } as Vault,
      },
    ])(
      `should convert the $vault.name vault reward/stake price to an APR of $expected`,
      ({ expected, vault }: ICalculateAPRTestParams) => {
        expect(calculateAPR({
          tokenPrices,
          vault,
        })).toBe(
          expected
        );
      }
    );
  });
});
