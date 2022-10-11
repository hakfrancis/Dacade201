import PropTypes from "prop-types";
import { Col } from "react-bootstrap";

// NFT Cards Functionality
const Nft = ({ nft }) => {
  const { image, description, name, index } = nft;  

  return (
    <>
      <Col key={index} className="mb-5">
        <div className="wine_container d-flex flex-wrap">
          <div className="wine_image">
            <img src={image} alt={name} />
          </div>
          <div className="wine_details">
            <div className="wine_id">[{index}]</div>
            <h2 className="wine_name d-flex justify-content-around">{name}</h2>
            <p className="wine_desc">{description}</p>
          </div>
        </div>
      </Col>
    </>
  );
};

Nft.propTypes = {
  // props passed into this component
  image: PropTypes.instanceOf(Object).isRequired,
};

export default Nft;
