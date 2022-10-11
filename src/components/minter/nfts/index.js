import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import AddNfts from "./Add";
import Nft from "./Card";
import Loader from "../../ui/Loader";
import Stakers from "../../../contracts/Stakers-address.json";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import {
  fetchNfts,
  mintNft,
  createPot as _createPot,
  fetchPots as _fetchPots,
  stake as _stake,
} from "../../../utils/minter";
import { Row } from "react-bootstrap";
import potOfGoldImg from "../../../assets/pot_of_gold.jpg";
import { Modal, Form } from "react-bootstrap";
import { truncateAddress } from "../../../utils";

const Pot = ({ stake, potData }) => {
  const [tokenId, setTokenId] = useState(0);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const { index, name, size, creator, winner, tokens, stakers, status } =
    potData;

  return (
    <div className="pot">
      <img src={potOfGoldImg} />
      <div className="pot_info_button" onClick={handleShow}>
        Open
      </div>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header>
          <Modal.Title
            style={{ color: "#531c1c", width: "100%", textAlign: "center" }}
          >
            Pot Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="pot-details">
            <>
              <div className="pd">
                <div className="pd-label">Pot Name:</div>
                <div className="pd-desc">{name}</div>
              </div>
              <div className="pd">
                <div className="pd-label">Created By:</div>
                <div className="pd-desc">{truncateAddress(creator)}</div>
              </div>
              <div className="pd">
                <div className="pd-label">Pot Size:</div>
                <div className="pd-desc">{size}</div>
              </div>
              <div className="pd">
                <div className="pd-label">Slot Remaining:</div>
                <div className="pd-desc">{size - tokens.length}</div>
              </div>
              <div className="pd">
                <div className="pd-label">Winner:</div>
                <div className="pd-desc">
                  {Number(winner) == 0
                    ? "No winner yet"
                    : truncateAddress(winner)}
                </div>
              </div>
              <div className="pd">
                <div className="pd-label">Pot Status:</div>
                <div className="pd-desc">{status == 0 ? "Open" : "Closed"}</div>
              </div>
            </>
          </div>
          {status == 0 && (
            <>
              <div className="pd-sub">Stake</div>
              <Form>
                <Form.Control
                  type="Number"
                  placeholder="Token ID (Please ensure you are the owner of token)"
                  className={"mb-3"}
                  style={{ height: "45px", fontSize: "0.9rem" }}
                  onChange={(e) => {
                    setTokenId(e.target.value);
                  }}
                />
              </Form>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="modal_footer">
          <button className="close_btn" onClick={handleClose}>
            Close
          </button>
          {status == 0 && (
            <button
              className="create_btn"
              onClick={async () => {
                stake(index, tokenId);
                handleClose();
              }}
            >
              Stake
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const CreatePot = ({ create }) => {
  const [potName, setPotName] = useState();
  const [potSize, setPotSize] = useState();
  const [show, setShow] = useState(false);

  // check if all form data has been filled
  const isFormFilled = () => potName && potSize;

  // close the popup modal
  const handleClose = () => setShow(false);
  // display the popup modal
  const handleShow = () => setShow(true);

  return (
    <>
      <button type="button" onClick={handleShow} className="add_wine_btn mb-4">
        Create Pot <i class="bi bi-plus"></i>
      </button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header>
          <Modal.Title
            style={{ color: "#531c1c", width: "100%", textAlign: "center" }}
          >
            Create a new pot
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              type="text"
              placeholder="Pot name"
              className={"mb-3"}
              style={{ height: "45px", fontSize: "0.9rem" }}
              onChange={(e) => {
                setPotName(e.target.value);
              }}
            />
            <Form.Control
              type="number"
              placeholder="Pot size (max amount of tokens pot can take)"
              className={"mb-3"}
              style={{ height: "45px", fontSize: "0.9rem" }}
              onChange={(e) => {
                setPotSize(e.target.value);
              }}
            />
          </Form>
        </Modal.Body>

        <Modal.Footer className="modal_footer">
          <button className="close_btn" onClick={handleClose}>
            Close
          </button>
          <button
            className="create_btn"
            disabled={!isFormFilled()}
            onClick={async () => {
              create(potName, potSize);
              handleClose();
            }}
          >
            Create
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const NftList = ({ nftContract, stakersContract }) => {
  const { performActions, address, kit } = useContractKit();
  const { defaultAccount } = kit;
  const [nfts, setNfts] = useState([]);
  const [pots, setPots] = useState([]);
  const [loading, setLoading] = useState(false);

  const getNFTAssets = useCallback(async () => {
    try {
      setLoading(true);
      // fetch all nfts from the smart contract
      const allNfts = await fetchNfts(nftContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [nftContract]);

  const getPots = useCallback(async () => {
    try {
      setLoading(true);
      const allPots = await _fetchPots(stakersContract);
      if (!allPots) return;
      setPots(allPots);
    } catch (e) {
      console.log({ e });
    } finally {
      setLoading(false);
    }
  }, [stakersContract]);

  // Add new NFT
  const addNft = async (data) => {
    try {
      setLoading(true);

      // create an nft functionality
      await mintNft(nftContract, performActions, data);
      toast(<NotificationSuccess text="Updating NFT list...." />);
      getNFTAssets();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create an NFT." />);
    } finally {
      setLoading(false);
    }
  };

  const createPot = async (potName, potSize) => {
    try {
      setLoading(true);
      await _createPot(performActions, stakersContract, potName, potSize);
      toast(<NotificationSuccess text="Updating UI..." />);
      getPots();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create new pot" />);
    } finally {
      setLoading(false);
    }
  };

  const stake = async (potId, tokenId) => {
    const saddr = Stakers.Stakers;
    try {
      setLoading(true);
      await _stake(
        performActions,
        stakersContract,
        saddr,
        nftContract,
        potId,
        tokenId
      );
      toast(<NotificationSuccess text="Updating UI..." />);
      getPots();
    } catch (error) {
      console.log(error);
      toast(<NotificationError text="Failed to stake token" />);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (address && nftContract && stakersContract) {
        getNFTAssets();
        getPots();
      }
    } catch (error) {
      console.log({ error });
    }
  }, [nftContract, stakersContract, address, getNFTAssets, getPots]);

  if (address) {
    return (
      <>
        {!loading ? (
          <>
            <div className="marketplace">
              <h1
                className="fs-10 fw-bold text-center mb-5"
                style={{ color: "#531c1c" }}
              >
                Available Pots
              </h1>
              <CreatePot create={createPot} />
              <div className="pots">
                {pots.map((potData) => (
                  <Pot stake={stake} potData={potData} />
                ))}
              </div>
            </div>

            <div className="marketplace">
              <h1
                className="fs-10 fw-bold text-center mb-5"
                style={{ color: "#531c1c" }}
              >
                My NFTs
              </h1>
              <AddNfts save={addNft} address={address} />
            </div>
            <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xxl-5">
              {/* display all NFTs */}
              {nfts
                .filter((nft) => nft.owner == defaultAccount)
                .map((_nft) => (
                  <Nft
                    key={_nft.index}
                    nft={{
                      ..._nft,
                    }}
                  />
                ))}
            </Row>
          </>
        ) : (
          <Loader />
        )}
      </>
    );
  }
  return null;
};

NftList.propTypes = {
  // props passed into this component
  nftContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

NftList.defaultProps = {
  nftContract: null,
};

export default NftList;
