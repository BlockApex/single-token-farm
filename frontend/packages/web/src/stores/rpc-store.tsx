import create from "zustand";
import { Account } from "near-api-js";
import { rpcData } from "@/utils/rpc";

interface RPC {
  name: string;
  url: string;
  ping: number;
}

interface RPCStore {
  account: Account | null;
  rpcList: RPC[];
  selectedRPC: RPC;
  addRPC: (rpc: RPC) => void;
  selectRPC: (rpc: RPC) => void;
  setDefaultRPCs: (defaultRPCs: RPC[]) => void;
  setAccount: (account: Account) => void;
}

export const useRPCStore = create<RPCStore>((set) => ({
  // Load initial state from localStorage or use default values
  account: null,
  rpcList: rpcData,
  selectedRPC: JSON.parse(JSON.stringify(rpcData[0])),

  // Add a new RPC and update localStorage
  addRPC: (rpc: RPC) =>
    set((state) => {
      const updatedRpcList = [...state.rpcList, rpc];
      localStorage.setItem('rpcList', JSON.stringify(updatedRpcList)); // Save updated list to localStorage
      return { rpcList: updatedRpcList };
    }),

  // Select an RPC and update localStorage
  selectRPC: (rpc: RPC) =>
    set(() => {
      localStorage.setItem('selectedRPC', JSON.stringify(rpc)); // Save selected RPC to localStorage
      return { selectedRPC: rpc };
    }),

  // Set default RPCs and save to localStorage
  setDefaultRPCs: (defaultRPCs: RPC[]) =>
    set(() => {
      localStorage.setItem('rpcList', JSON.stringify(defaultRPCs)); // Save default RPCs to localStorage
      return { rpcList: defaultRPCs };
    }),

  // Select an account
  setAccount: (account: Account) =>
    set(() => {
      return { account: account };
    }),
}));
