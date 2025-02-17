// types
import type ITokenPrice from './ITokenPrice';

interface IState {
  fetching: boolean;
  fetchTokenPrices: () => Promise<void>;
  tokenPrices: ITokenPrice[];
}

export default IState;
