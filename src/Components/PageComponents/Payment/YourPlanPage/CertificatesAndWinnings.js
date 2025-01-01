import { useNavigate } from "react-router-dom";
import { ReactComponent as CertificateBannerIcon } from "../../../../assets/icons/certificate-banner.svg";
import { ReactComponent as CoinsIcon } from "../../../../assets/icons/coins.svg";
import { useAuth } from "../../../../providers/auth-provider";

const CertificatesAndWinnings = ({ data }) => {
  const navigate = useNavigate();
  const { isPremierPlan } = useAuth();
  const { coinsWon, meritFinishes } = data ?? {};
  const goToCertificates = () => {
    navigate("/certificates");
  };
  const goToOrders = () => {
    navigate("/orders");
  };
  return (
    <div>
      <div className="font-medium mb-4">Certificates & Winnings</div>
      <div className="space-y-4">
        {meritFinishes ? (
          <div
            className="rounded-lg h-16 w-full bg-gradient-to-r from-[#CCF90080] to-[#CCF90033] py-4 px-3 flex justify-between"
            onClick={goToCertificates}
          >
            <div>
              <div className="text-sm font-semibold">Certificates</div>
              <div className="underline underline-white text-xs">View All</div>
            </div>
            <CertificateBannerIcon />
          </div>
        ) : (
          <></>
        )}
        {isPremierPlan ? (
          <div
            className="rounded-lg h-16 w-full bg-gradient-to-r from-[#FFCC7580] to-[#FFCC7533] px-3 flex justify-between"
            onClick={goToOrders}
          >
            <div className="py-4">
              <div className="text-sm font-semibold">Coins Won: {coinsWon}</div>
              <div className="underline underline-white text-xs">
                View Orders
              </div>
            </div>
            <CoinsIcon />
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default CertificatesAndWinnings;
