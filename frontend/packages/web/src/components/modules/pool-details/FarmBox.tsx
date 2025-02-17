import SmallToken from "@/assets/small-token.png";
import { useNavigate } from "react-router-dom";
import { formatNumberWithSuffix } from "@/utils/conversion";




const FarmBox = ({ farm }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-auto  mb-6">
      <section className="bg-white-600 rounded-lg p-4">
        <div className="flex items-center justify-center gap-10">
          <div>
            <p className="text-white font-bold text-sm">Farms APR</p>
            <h6 className="text-[#CD7FF0] font-bold text-lg mt-3">{farm?.apr ? farm?.apr : 0}%</h6>
          </div>
          <div>
            <div className="flex items-center">
              {/* <img className="w-4 h-4" src={SmallToken} /> */}
              <small className="text-[rgba(255, 255, 255, 0.70)] font-normal text-sm ml-1">
                ${formatNumberWithSuffix(parseFloat(farm?.total_reward))}/week
              </small>
            </div>
            <button onClick={()=>navigate(`/farms/${farm?.seed_id}`)} className="bg-[#CD7FF0] text-white font-bold text-sm min-w-[120px] rounded-sm mt-4">
              Farm Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FarmBox;
