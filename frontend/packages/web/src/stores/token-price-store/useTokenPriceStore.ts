import axios, { AxiosResponse } from "axios";
import create from "zustand";

// types
import type { IState, ITokenPrice } from "./types";

const useTokenPriceStore = create<IState>((setState) => ({
  fetching: false,
  fetchTokenPrices: async () => {
    let response: AxiosResponse<ITokenPrice[]>;

    setState({ fetching: true });

    try {
      response = await axios.get('https://pikespeak.ai/api/swap/tokenprice');

      setState({ tokenPrices: response.data });
    } catch (error) {
      console.error(error);
    }

    setState({ fetching: false });
  },
  tokenPrices: [],
}));

export default useTokenPriceStore;
