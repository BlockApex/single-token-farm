import React from "react";
import { nftMetadata } from "@/interfaces";
import { viewMethod } from "@/helper/near";

export function useNftMetadata(nft_id: string) {
  const [nftMetadata, setNftMetadata] = React.useState<nftMetadata | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  //TODO: No store management, just a simple hook for now
  React.useEffect(() => {
    if (!nft_id) return;

    setLoading(true);
    viewMethod(nft_id, "nft_metadata", {})
      .then((res) => {
        setNftMetadata(res);
      })
      .catch((err) => {
        console.warn(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [nft_id]);
  return { nftMetadata, loading };
}
