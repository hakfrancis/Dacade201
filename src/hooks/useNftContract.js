import {useContract} from './useContract';
import ABI from '../contracts/NftContract.json';
import ADDRESS from '../contracts/NftContract-address.json';


// export interface for NFT contract
export const useNftContract = () => useContract(ABI.abi, ADDRESS.NftContract);
