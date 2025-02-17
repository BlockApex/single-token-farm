import { StatusEnum } from "@near/apollo";

const types = {
  [StatusEnum.Open]: (
    <div className="w-max bg-[#559C71] rounded-[50px] px-[8px] h-[20px]">
      <span className="text-white text-[12px] font-[500] relative top-[-3px] tracking-[-0.04em]">
        In progress
      </span>
    </div>
  ),
  [StatusEnum.Closed]: (
    <div className="w-max bg-[#CE2828] rounded-[50px] px-[8px] px-[8px] h-[20px]">
      <span className="text-white text-[12px] font-[500] relative top-[-3px] tracking-[-0.04em]">
        Closed
      </span>
    </div>
  ),
  [StatusEnum.Waiting]: (
    <div className="w-max bg-[#5E6DEC] rounded-[50px] px-[8px] px-[8px] h-[20px]">
      <span className="text-white text-[12px] font-[500] relative top-[-3px] tracking-[-0.04em]">
        Upcoming
      </span>
    </div>
  ),
  whitelist: (
    <div className="w-max bg-white rounded-[50px] px-[8px] px-[8px] h-[20px]">
      <span className="text-[#431E5A] text-[12px] font-[500] relative top-[-3px] tracking-[-0.04em]">
        Private sale
      </span>
    </div>
  ),
};

export const Badge = ({ type }: { type: string }) => {
  return types[type];
};

export default Badge;
