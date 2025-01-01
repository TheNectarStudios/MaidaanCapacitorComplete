import './Ticker.css';

const Ticker = ({ icons }) => {
    console.log(icons); 
    const repeatedIcons = [...icons, ...icons, ...icons, ...icons, ...icons]

    return (
        <div className="ticker-wrapper flex gap-[80px] m-10 mt-[40px] w-full md:w-[80%]">
          <div className="ticker">
            {repeatedIcons.map((icon, index) => (
              <div key={index} className="ticker-item">
                <img className="ticker-img" src={icon} alt={`Icon ${index}`} />
              </div>
            ))}
          </div>
        </div>
    );
};

export default Ticker;
