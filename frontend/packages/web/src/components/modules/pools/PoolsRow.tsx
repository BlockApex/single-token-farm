import { useState, useEffect , MouseEvent} from "react";
import Tokens from "./Tokens";
import { Tooltip } from "@chakra-ui/react";
import { formatNumberWithSuffix } from "@/utils/conversion";
import { Star } from "@/assets/svg/Star";
import { Td } from "@/components/shared";
import { useNavigate } from "react-router-dom";

const PoolsRow = ({ pool }) => {
  const navigate = useNavigate();
  const [fav, setFav] = useState(false);

  // Check if the pool is a favorite on component mount

  useEffect(() => {
    const favoritePools: any[] = JSON.parse(localStorage.getItem("favoritePools") || "[]");
    if (favoritePools?.some(favPool => favPool.id === pool.id)) {
      setFav(true);
    }
  }, [pool.id]);
  

  const handleFavoriteClick = (e: MouseEvent<SVGElement>) => {
    e.stopPropagation();
    const favoritePools: any[] = JSON.parse(localStorage.getItem("favoritePools") || "[]");
    
    if (fav) {
      // Remove from favorites
      const updatedFavorites = favoritePools.filter(p => p?.id !== pool?.id);
      localStorage.setItem("favoritePools", JSON.stringify(updatedFavorites));
      setFav(false);
    } else {
      // Add to favorites
      favoritePools.push(pool);
      localStorage.setItem("favoritePools", JSON.stringify(favoritePools));
      setFav(true);
    }
  };


  let farmid = pool?.farms && pool?.farms?.length ?  pool?.farms[0]?.seed_id : ""

  return (
    <div
      onClick={() => navigate(`/pools/${pool.id}`)}
      role="button"
      className="relative bg-white-600 rounded-md px-2 py-4 mt-3 grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4"
    >
      <Td className="">
        <Tokens token0={pool?.token0} token1={pool.token1} />
      </Td>
      <Td className="hidden md:flex">
        {pool?.farms?.length ? (
          <p
            onClick={(e) => {
              e.stopPropagation(); // Prevent click event from propagating to parent div
              navigate(`/farms/${farmid}`)
            }}
            className="text-[#CD7FF0] font-bold text-sm"
          >
            Farms
          </p>
        ) : (
          ""
        )}
      </Td>
      <Td className="">
        <p className="text-white font-bold text-sm">{pool?.fee / 100}%</p>
      </Td>
      <Td className="hidden md:flex">
        <Tooltip
          hasArrow
          placement="right"
          label={
            <div className="">
              <p>Pool APR +</p>
              <p>Farm APR</p>
            </div>
          }
          color="rgba(255, 255, 255, 0.60)"
          fontSize="sm"
          borderRadius="lg"
          bg="#5B394D"
          border="1px solid #CD7FF0"
          arrowShadowColor="#CD7FF0"
        >
          <div className="flex flex-col cursor-pointer">
            <p className="text-white font-bold text-sm">{pool?.apr}%</p>
            <small className="text-[#CD7FF0] font-bold text-sm">{pool?.farm_apr ? pool?.farm_apr : "0" }%</small>
          </div>
        </Tooltip>
      </Td>
      <Td className="hidden lg:flex">
        <p className="text-white font-bold text-sm">${formatNumberWithSuffix(pool?.volume_24h)}</p>
      </Td>
      <Td className="hidden lg:flex">
        <p className="text-white font-bold text-sm">
          ${formatNumberWithSuffix(pool?.tvl)}
        </p>
      </Td>
      <Td className="hidden lg:flex">
        <Star
          onClick={handleFavoriteClick}
          filled={fav}
          width={20}
          height={20}
          className="cursor-pointer"
        />
      </Td>
    </div>
  );
};

export default PoolsRow;
