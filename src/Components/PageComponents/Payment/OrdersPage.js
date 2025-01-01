import { useNavigate } from "react-router-dom";
import { backButtonHandler } from "../../../Constants/Commons";
import Layout from "../../Common/Layout";
import { useEffect, useState } from "react";
import Loader from "../Loader";
import { getAllOrders } from "../../../services/payment";

const OrdersPageListItem = ({ order }) => {
    const { rewardDetails } = order;
    const { description, imageUrl, name } = rewardDetails ?? {};
    return (
      <li>
        <div className="bg-[#4a4a4aB3] h-[184px] w-full rounded-lg backdrop-blur-[2px] text-white p-4 cursor-pointer">
          <div className="grid grid-cols-5">
            <div className="text-2xl col-span-5 mb-4">{name}</div>
            <div className="col-span-3 text-sm">{description}</div>
            <div className="row-start-2 row-span-3 col-span-2 col-start-4">
              <div className="h-[110px] w-full rounded-lg bg-white overflow-hidden">
                <img
                  src={imageUrl}
                    alt={name}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </li>
    );
};

const OrdersPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const func = async () => {
            const data = await getAllOrders();
            setLoading(false);
            setOrders(data);
        };
        func();
    }, []);

    return (
      <Layout
        showArenaHeader
        headerText="Your Orders"
        layoutClassName="bg-[#3a3a3a]"
        onBackClick={() => backButtonHandler(navigate, window.location)}
      >
        {loading ? (
          <div className="flex justify-center items-center w-full h-full">
            <Loader />
          </div>
        ) : (
          <div className="text-white h-full w-full overflow-auto pb-[60px]">
            {!orders.length ? (
              <div className=" text-center mt-10">
                You haven't ordered anything yet.
              </div>
            ) : (
              <ul className="px-5 space-y-5 list-none">
                {orders?.map((order) => {
                  return <OrdersPageListItem order={order} key={order} />;
                })}
              </ul>
            )}
          </div>
        )}
      </Layout>
    );
};

export default OrdersPage;