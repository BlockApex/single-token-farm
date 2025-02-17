import axios from "axios";



const BASE_URL = import.meta.env.VITE_AMM_URL;


export const ifRewardExist = async (seedId: string, accountId: string) => {
    try {
        let url = `${BASE_URL}/get-rewards?account_id=${accountId}&seed_id=${seedId}`;
        const { data }: any = await axios.get(url);
        let filteredRewards = data?.rewards?.filter((r) => r.rewards > 0);
        // let filteredWithdraw = data?.withdrawable_rewards?.filter((r) => r.withdraw_amount > 0);
        // let response = {
        //     claim:false,
        //     withdraw:false
        // };
        // if (filteredRewards?.length) {
        //     response.claim = true;
        // } else {
        //     response.claim = false;
        // }
        // if (filteredWithdraw?.length) {
        //     response.withdraw = true;
        // } else {
        //     response.withdraw = false;
        // }
        // return response;
        if(filteredRewards.length){
            return true
        }else {
            return false
        }
    } catch (error) {
        console.log(error);
    }
}