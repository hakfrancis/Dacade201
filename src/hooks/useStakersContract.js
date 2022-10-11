import { useContract } from "./useContract";
import ABI from "../contracts/Stakers.json";
import ADDRESS from "../contracts/Stakers-address.json";

// export interface for stakers contract
export const useStakersContract = () => useContract(ABI.abi, ADDRESS.Stakers);
