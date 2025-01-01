import { useEffect, useState } from "react";
import Layout from "../../Common/Layout";
import { getAllCertificates } from "../../../services/child";
import CertificateListItem from "./CertificateListItem";
import Loader from "../Loader";
import { backButtonHandler } from "../../../Constants/Commons";
import { useNavigate } from "react-router-dom";
import { ReactComponent as ChildrenPlayingSvg } from "../../../assets/icons/children-playing.svg";
import AppButton from "../../Common/AppButton";

const CertificatesPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        const func = async () => {
            const data = await getAllCertificates();
            setLoading(false);
            setCertificates(data);
        };
        func();
    }, []);

    const goToTournaments = () => {
        navigate("/tournament/select");
    };

    return (
      <Layout
        showArenaHeader
        headerText="Your Certificates"
        layoutClassName="bg-[#3a3a3a]"
        onBackClick={() => backButtonHandler(navigate, window.location)}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full w-full">
            <Loader />
          </div>
        ) : certificates.length ? (
          <div className="px-4">
            <ul className="p-0">
              {certificates.map((cert) => {
                return <CertificateListItem certificate={cert} />;
              })}
            </ul>
          </div>
        ) : (
          <div className="text-white text-center mt-10 text-xl flex flex-col p-5 items-center">
            <ChildrenPlayingSvg className="h-[200px] w-[200px] mx-auto" />
            Get Merit ranks in tournaments and win certificates!
            <AppButton className="mt-5" onClick={goToTournaments}>
              Checkout Tournaments
            </AppButton>
          </div>
        )}
      </Layout>
    );
};

export default CertificatesPage;