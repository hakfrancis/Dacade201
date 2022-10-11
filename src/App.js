import React from "react";
import Cover from "./components/minter/Cover";
import { Notification } from "./components/ui/Notifications";
import Wallet from "./components/wallet";
import { useBalance, useNftContract, useStakersContract } from "./hooks";
import Nfts from "./components/minter/nfts";
import { useContractKit } from "@celo-tools/use-contractkit";
import "./App.css";
import { Container, Nav } from "react-bootstrap";
import logo from "./assets/logo.png";

const App = function AppWrapper() {
  const { address, destroy, connect } = useContractKit();

  //  fetch user's celo balance using hook
  const { balance, getBalance } = useBalance();

  // initialize the NFT mint contract
  const nftContract = useNftContract();
  const stakersContract = useStakersContract();

  return (
    <>
      <Notification />
      <Nav className="nav justify-content-between px-5 py-3">
        <Nav.Item>
          <img className="logo_img" src={logo} alt="Logo" />
          <span className="logo_name">Stakers</span>
        </Nav.Item>
        {address ? (
          <Nav.Item>
            {/*display user wallet*/}
            <Wallet
              address={address}
              amount={balance.CELO}
              symbol="CELO"
              destroy={destroy}
            />
          </Nav.Item>
        ) : (
          <Nav.Item>
            <button onClick={() => connect().catch((e) => console.log(e))}>
              Connect Wallet
            </button>
          </Nav.Item>
        )}
      </Nav>
      {address ? (
        <Container fluid="md">
          <main>
            <Nfts
              updateBalance={getBalance}
              nftContract={nftContract}
              stakersContract={stakersContract}
            />
          </main>
        </Container>
      ) : (
        <Cover connect={connect} />
      )}
    </>
  );
};

export default App;
