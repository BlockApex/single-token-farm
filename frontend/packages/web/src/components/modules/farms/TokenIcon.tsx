import { Token } from "@/assets/svg/token";
import { useRPCStore } from "@/stores/rpc-store";
import React, { useEffect, useState } from "react";

const TokenIcon = ({ address }: { address: string }) => {
    const { account } = useRPCStore();
    const [token, setToken] = useState<{ symbol?: string; icon?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!account || !address) return;

        const fetchMetadata = async () => {
            try {
                const metadata = await account.viewFunction(address, "ft_metadata", {});
                setToken(metadata);
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
                    <img src={token.icon} className="w-4 h-4 rounded-full" alt={token.symbol} />
                ) : (
                    <Token width={40} height={40} />
                )}
            </div>
        </div>
    );
};

export default TokenIcon;
