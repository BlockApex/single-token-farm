import { Token } from "@/assets/svg/token";

const TokenWithInput = ({ token, value , handleChange}) => {
  const handleKeyDown = (e:any) => {
    if (e.key === '-') {
      e.preventDefault();
    }
  };
  return (
    <div className="w-full h-auto  rounded-lg bg-[#ffffff1a] py-2 px-3">
      <div className="w-full flex items-center justify-between">
        <section className="bg-[#00000033] rounded-sm min-w-[120px] md:min-w-[150px] min-h-[36px] flex items-center justify-between p-2">
          <div className="flex items-center justify-start">
            {token?.icon ? (
              <img src={token?.icon} className="w-8 h-8 rounded-full -mt-1" />
            ) : (
              <Token width={30} height={30} className="-ml-2" />
            )}
            <p className="text-sm md:text-md text-white font-normal pl-2">
              {token?.symbol}
            </p>
          </div>
        </section>
        <section className="w-full" >
          <input
            className="w-full bg-transparent 
            text-white 
            font-bold 
            text-md md:text-lg placeholder-white placeholder-opacity-30 border-none 
            focus:border-white 
            focus:outline-none 
            focus:ring-0 
            hover:border-none text-right"
            placeholder="0.0"
            type="number"
            value={value}
            onChange={(e:any)=>{
              handleChange(e.target.value)
            }}
            onKeyDown={handleKeyDown}

            min={0}
          />
          <p className="text-white text-sm font-bold text-right pr-3 m-0">
            {/* $10.00 */}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TokenWithInput;
