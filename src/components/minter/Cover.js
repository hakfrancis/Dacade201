import React from 'react';
import potOfGoldImage from "../../assets/pot_of_gold.webp"


const Cover = ({ connect }) => {
    return (
      <div className="cover_page d-flex align-items-center">
        <div className="cover_header d-flex align-items-center">
          <div className="cover_text">
            <h1>Stakers - One stop point for NFT staking</h1>
            <p>
              Stake your NFT into a pot and stand a chance to win more NFTs.
              Winner gets randomly selected to win all tokens in the pot
            </p>
            <button
              onClick={() => connect().catch((e) => console.log(e))}
            >
              Connect Wallet
            </button>
          </div>
        </div>
        <img className='cover_image_lg' src={potOfGoldImage} />
      </div>
    );
};

export default Cover;
