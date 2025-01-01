import { LONG_TERM_SCHOOL_PLAN_LIST, calculateGSTAndPrincipal, calculateGSTDisCountedAndPrincipal } from "../../../Constants/Commons";

const BillingDetails = ({ selectedPlan, discountCode, discountPercentage }) => {
  const { discountedAmount, gstInPercentage, benefits, name, id, amount } = selectedPlan;
  const { gstAmount, principalAmount } = calculateGSTAndPrincipal(discountedAmount, gstInPercentage);
  let planType = "";
  if(id.startsWith("SUPER")) {
    planType = "Super";
  }
  if (id.startsWith("PREMIER")) {
    planType = "Premier";
  }
  else if (id.startsWith("SCHOOL")) {
    planType = "Annual Pack";
  }

  if (LONG_TERM_SCHOOL_PLAN_LIST?.includes?.(id)) {

    const { gstAmount, principalAmount, discountAmount } = calculateGSTDisCountedAndPrincipal(discountedAmount, gstInPercentage, amount);
    return (
      <div className="text-white">
        <div className="font-semibold mb-4 md:text-2xl">Billing Details</div>
        <div className="bg-[#FFFFFF4D] rounded-lg p-4">
          <div className="flex flex-col gap-2 text-xs md:text-lg">
            <div className={`flex items-center justify-between`}>
              <div>
                {planType ? `${planType}` : name}
              </div>
              <div className="flex items-center justify-center text-center">
                <span>₹</span>
                <span
                  style={{
                    textDecoration: discountAmount !== principalAmount ? 'line-through' : 'none',
                  }}
                >
                  {principalAmount}
                </span>
              </div>

            </div>
            {discountCode && discountAmount && <div className="flex items-center justify-between">
              <div>
                {discountCode} applied
              </div>
              <div>₹{discountAmount}</div>
            </div>}
            <div className="flex items-center justify-between">
              <div>GST</div>
              <div>₹{gstAmount}</div>
            </div>
            <div className="mt-[10px] max-w-[70%]">
              <div>
                <div className="font-semibold text-sm md:text-xl">What You Get</div>
                <div>{benefits}</div>
              </div>
            </div>
          </div>
          <hr className="border-[#CCf9001a] h-[0.5px] my-4" />
          <div className="flex items-center justify-between text-sm md:text-xl">
            <div>To Pay</div>
            <div>₹{discountedAmount}</div>
          </div>
        </div>
      </div>
    );
  }
  else {

    return (
      <div className="text-white">
        <div className="font-semibold mb-4 md:text-2xl">Billing Details</div>
        <div className="bg-[#FFFFFF4D] rounded-lg p-4">
          <div className="flex flex-col gap-2 text-xs md:text-lg">
            <div className="flex items-center justify-between">
              <div>
                {planType} |&nbsp;
                {name}
              </div>
              <div>₹{principalAmount}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>GST</div>
              <div>₹{gstAmount}</div>
            </div>
            <div className="mt-[10px] max-w-[70%]">
              <div>
                <div className="font-semibold text-sm md:text-xl">What You Get</div>
                <div>{benefits}</div>
              </div>
            </div>
          </div>
          <hr className="border-[#CCf9001a] h-[0.5px] my-4" />
          <div className="flex items-center justify-between text-sm md:text-xl">
            <div>To Pay</div>
            <div>₹{discountedAmount}</div>
          </div>
        </div>
      </div>
    );
  }
};

export default BillingDetails;