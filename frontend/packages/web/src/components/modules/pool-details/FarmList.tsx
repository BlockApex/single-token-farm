import React from 'react'
import { Spinner } from "@chakra-ui/react";
import FarmBox from './FarmBox'
import {
    useGetFarmDetails,
} from "@/hooks/modules/farms";
import { accounts } from "@/utils/account-ids";

const FarmList = ({ id }) => {
    let farmId = `${accounts.AMM}@${id}`
    const { farm, loading, error } = useGetFarmDetails(farmId!);
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8" >
            {loading ? (
                <Spinner
                    thickness='4px'
                    speed='0.65s'
                    emptyColor='gray.200'
                    color='#4b2354'
                    size='xl'
                />
            ) : ""}
            {/* {farm && !loading && <FarmBox farm={farm} />} */}
        </div>
    )
}

export default FarmList