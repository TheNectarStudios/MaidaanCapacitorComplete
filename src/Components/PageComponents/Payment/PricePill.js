import { twMerge } from "tailwind-merge";

const PricePill = ({ data, selectedPlan, setSelectedPlan, showTournaments = false, abbreviatedName, selectedPlanExpired = false }) => {
  const { id, amount, name, discountedAmount, tournamentsPerPlan } = data;
    const handlePriceSelect = () => {
      setSelectedPlan(data);
    };

    return (
      <div
        className={twMerge(
          "rounded-lg py-1 md:py-2 border border-solid border-[#FFFFFF4D] bg-[#FFFFFF33] px-5 pl-3 pr-2 flex justify-center items-center gap-2",
          selectedPlan.id === id && "bg-[#FFFFFF66] border-0"
        )}
        style={{
          outline: selectedPlan.id === id ? "3.5px solid #CCF900CC" : "",
        }}
        onClick={() => handlePriceSelect(id)}
      >
        {!selectedPlanExpired && <span className="text-[10px] md:text-sm">
          {(showTournaments || discountedAmount === amount) ? (
            `${tournamentsPerPlan} Tournaments`
          ) : (
            abbreviatedName ? (
              <span style={{ fontSize: '16px' }}>{abbreviatedName} Offer</span>
            ) : (
              <> </>
            )
          )}
        </span>}
        {!selectedPlanExpired && <span className="text-[#FFFFFF4d] md:text-xl">|</span>}
        <span className="md:text-xl">
          ₹{discountedAmount}
          {amount !== discountedAmount && (
            <span className="text-[10px] md:text-sm line-through opacity-50 ml-[2px] md:ml-[6px]">
              ₹{amount}
            </span>
          )}
        </span>
      </div>
    );
};

export default PricePill;