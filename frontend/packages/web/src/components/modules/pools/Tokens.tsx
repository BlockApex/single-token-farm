import { Token } from "@/assets/svg/token";

const Tokens = ({ token0, token1, showSymbol = true }) => {
  return (
    <div className="flex items-center pl-0  cursor-pointer">
      <div className="flex items-center justify-start">
        {token0?.icon ? (
          <img src={token0?.icon} className="w-9 h-9 rounded-full" />
        ) : (
          <Token width={40} height={40} />
        )}
        {token1?.icon ? (
          <img src={token1?.icon} className="w-9 h-9 rounded-full -ml-2" />
        ) : (
          <Token width={40} height={40} className="-ml-2" />
        )}
      </div>
      {showSymbol ? (
        <p className="text-white font-bold text-md pl-2">
          {token0?.symbol}-{token1?.symbol}
        </p>
      ) : (
        ""
      )}
    </div>
  );
};

export default Tokens;
