import { useNavigate } from "react-router-dom";
import { backButtonHandler } from "../../../../Constants/Commons";
import Layout from "../../../Common/Layout";
import PlanProgress from "./PlanProgress";
import CareerStats from "./CareerStats";
import CertificatesAndWinnings from "./CertificatesAndWinnings";
import { useEffect, useState } from "react";
import { getPlanSummary, getUniqueCompetitors } from "../../../../services/child";
import PlanDetails from "./PlanDetails";
import { useAuth } from "../../../../providers/auth-provider";
import ChoosePlan from "./ChoosePlan";
import Loader from "../../Loader";

const YourPlanPage = () => {
  const navigate = useNavigate();
  const { isPremierPlan } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planSummary, setPlanSummary] = useState(null);
  const [uniqueCompetitors, setUniqueCompetitors] = useState(null);

  useEffect(() => {
    const func = async () => {
      const data = await getPlanSummary();
      setLoading(false);
      setPlanSummary(data);
    };
    func();
  }, []);

  useEffect(() => {
    const getNumberOfCompetitors = async () => {
      const data = await getUniqueCompetitors();
      setUniqueCompetitors(data);
    }
    getNumberOfCompetitors();
  }, []);


  const handleBack = () => {
    backButtonHandler(navigate, window.location);
  };

  if (loading) {
    return <div className="w-full h-full flex justify-center items-center"><Loader /></div>
  }

  if (!loading && !planSummary) {
    return <ChoosePlan />;
  }

  return (
    <Layout showArenaHeader onBackClick={handleBack} headerText="Your Plan">
      <div className="h-full w-full relative overflow-auto pb-16">
        <div className="relative z-[1] text-white p-4">
          <PlanDetails />
          <hr className="bg-[#FFFFFF4D] border-0 h-[0.5px] mx-[34px] mt-8 mb-5" />
          <PlanProgress data={planSummary} />
          <hr className="bg-[#FFFFFF4D] border-0 h-[0.5px] mx-[34px] my-4" />
          <CareerStats data={{...planSummary, uniqueCompetitors: uniqueCompetitors}} />
          {planSummary?.meritFinishes || isPremierPlan ? (
            <div className="mt-4">
              <CertificatesAndWinnings data={planSummary} />
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#CCF90080] to-transparent z-0 opacity-30"></div>
      </div>
    </Layout>
  );
};

export default YourPlanPage;
