import { Web3Storage } from "web3.storage/dist/bundle.esm.min.js";

const getAccessToken = () => {
  const token = process.env.REACT_APP_API_TOKEN;
  return token;
};
const makeStorageClient = () => {
  return new Web3Storage({ token: getAccessToken() });
};
const formattedName = (name) => {
  let file_name;
  const trim_name = name.trim();
  if (trim_name.includes(" ")) {
    file_name = trim_name.replaceAll(" ", "%20");
    return file_name;
  } else return trim_name;
};
const makeFileObjects = (file) => {
  const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
  const files = [new File([blob], `${file.name}.json`)];
  return files;
};
const client = makeStorageClient();
const storeFiles = async (files) => {
  const cid = await client.put(files);
  return cid;
};

// function to upload an image to Web3.storage
export const uploadToIpfs = async (file) => {
  if (!file) return;
  try {
    const file_name = file[0].name;
    const image_name = formattedName(file_name);
    const image_cid = await storeFiles(file);
    const image_url = `https://${image_cid}.ipfs.w3s.link/${image_name}`;
    return image_url;
  } catch (error) {
    console.log("Error uploading file: ", error);
  }
};

// mint an NFT
export const mintNft = async (
  nftContract,
  performActions,
  { name, description, ipfsImage }
) => {
  await performActions(async (kit) => {
    if (!name || !description || !ipfsImage) return;
    const { defaultAccount } = kit;

    // trim any extra whitespaces from the name and
    // replace the whitespace between the name with %20
    const file_name = formattedName(name);

    // convert NFT metadata to JSON format
    const data = {
      name,
      image: ipfsImage,
      description,
      owner: defaultAccount,
    };

    try {
      // save NFT metadata to IPFS
      const files = makeFileObjects(data);
      const file_cid = await storeFiles(files);
      const URI = `https://${file_cid}.ipfs.w3s.link/${file_name}.json`;

      // upload the NFT, mint the NFT and save the IPFS url to the blockchain
      let transaction = await nftContract.methods
        .mint(URI)
        .send({ from: defaultAccount });
      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// fetch all NFTs
export const fetchNfts = async (nftContract) => {
  try {
    const nfts = [];
    const nftsLength = await nftContract.methods.totalSupply().call();
    for (let i = 0; i < Number(nftsLength); i++) {
      const nft = new Promise(async (resolve) => {
        const nftURI = await nftContract.methods.tokenURI(i).call();
        const nftOwner = await nftContract.methods.ownerOf(i).call();
        const nftData = await fetchNftMeta(nftURI);
        resolve({
          index: i,
          owner: nftOwner,
          name: nftData.name,
          image: nftData.image,
          description: nftData.description,
        });
      });
      nfts.push(nft);
    }
    return Promise.all(nfts);
  } catch (e) {
    console.log({ e });
  }
};

// Get NFT metadata from IPFS
export const fetchNftMeta = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    const fetch_meta = await fetch(ipfsUrl);
    const meta = await fetch_meta.json();

    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// get the owner address of an NFT
export const fetchNftOwner = async (minterContract, index) => {
  try {
    return await minterContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

// Create new pot
export const createPot = async (
  performActions,
  stakersContract,
  potName,
  potSize
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      await stakersContract.methods
        .createPot(potName, potSize)
        .send({ from: defaultAccount });
    });
  } catch (error) {
    console.log({ error });
  }
};

// Fetch all pots from contract
export const fetchPots = async (stakersContract) => {
  try {
    const data = await stakersContract.methods.getAllPots().call();
    const pots = await Promise.all(
      data.map(async (_pot, index) => {
        return {
          index,
          name: _pot[0],
          size: _pot[1],
          creator: _pot[2],
          winner: _pot[3],
          tokens: _pot[4],
          stakers: _pot[5],
          status: _pot[6],
        };
      })
    );
    return pots;
  } catch (e) {
    console.log({ e });
  }
};

// Stake NFT into a pot
export const stake = async (
  performActions,
  stakersContract,
  stakersAddress,
  nftContract,
  potId,
  tokenId
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;

      // first approve `stakersContract` to spend `tokenId` from `nftContract`
      await nftContract.methods
        .approve(stakersAddress, tokenId)
        .send({ from: defaultAccount });

      // proceed to stake token
      await stakersContract.methods
        .stake(potId, tokenId)
        .send({ from: defaultAccount });
    });
  } catch (error) {
    console.log(error);
  }
};
