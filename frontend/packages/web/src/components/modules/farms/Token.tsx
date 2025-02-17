import { Token } from "@/assets/svg/token";
import { useRPCStore } from "@/stores/rpc-store";
import { tokens_without_images } from "@/utils/config";
import React, { useEffect, useState } from "react";

const TokenWithSymbol = ({ address }: { address: string }) => {
    const { account } = useRPCStore();
    const [token, setToken] = useState<{ symbol?: string; icon?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!account || !address) return;

        const fetchMetadata = async () => {
            try {
                const metadata = await account.viewFunction(address, "ft_metadata", {});
                if(metadata.icon){
                    setToken(metadata);
                }else{
                    let _icon  = tokens_without_images.find((t)=>t.symbol === metadata.symbol)?.icon;
                    setToken({...metadata , icon:_icon})
                }
            } catch (error) {
                console.error("Failed to fetch token metadata:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [account, address]);

    return (
        <div className="flex items-center">
            {/* Token Icon */}
            <div className="flex items-center justify-start">
                {loading ? (
                    <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full"></div>
                ) : token?.icon ? (
                    <img src={token.icon} className="w-9 h-9 rounded-full" alt={token.symbol} />
                ) : (
                    <Token width={40} height={40} />
                )}
            </div>

            {/* Token Symbol */}
            <div className="flex flex-col items-start justify-start pl-4">
                <h1 className="text-lg tracking-tighter font-bold leading-6">
                    {loading ? "Loading..." : token?.symbol || "Unknown"}
                </h1>
            </div>
        </div>
    );
};

export default TokenWithSymbol;
