import Big from "big.js";

export const EMPTY_TOKEN_OBJ = {
  name: "",
  symbol: "",
  icon: "",
  decimals: 0,
  reference: null,
  reference_hash: null,
  type: "",
  supply_type: "",
  total_supply: "0",
};

export type TokenDataProps = {
  name: string;
  symbol: string;
  icon?: string | null;
  decimals: number;
  reference?: string | null;
  reference_hash?: string | null;
  type: string;
  supply_type: string;
  total_supply?: string;
};

export const DEPLOY_COST = "35000000000000000000000010";

export function createArgsForTokenContract(
  obj: TokenDataProps,
  accountId: string | null
) {
  const supply_type =
    obj?.supply_type == "fixed" ? "total_supply" : "init_supply";

  const decimals = new Big(10).pow(Number(obj.decimals));
  const supply = new Big(obj?.total_supply || "0").times(decimals).toFixed(0);

  const params = {
    owner_id: accountId,
    [supply_type]: supply,
    metadata: {
      spec: "ft-1.0.0",
      name: obj.name,
      symbol: obj.symbol,
      icon: obj.icon || null,
      reference: obj.reference || null,
      reference_hash: obj.reference_hash || null,
      decimals: Number(obj.decimals),
    },
  };

  return params;
}

export function getContractType(supply_type: string) {
  return supply_type == "fixed" ? "token" : "mintable_token";
}

export const handleOpenModal = (setFunc: (value: boolean) => void) => {
  if (localStorage.getItem("@token-launcher-first-interaction")) {
    return;
  } else {
    setFunc(true);
    localStorage.setItem("@token-launcher-first-interaction", "false");
  }
};

export const handleCloseModal = (setFunc: (value: boolean) => void) => {
  setFunc(false);
};

export default EMPTY_TOKEN_OBJ;
