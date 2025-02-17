import { Token } from "@/assets/svg/token";

export const TokenLogo = ({size=50 , ...rest}) => {
  return (
    <div className="flex items-center justify-start" >
      <Token {...rest}  width={size} height={size} />
    </div>
  );
};
