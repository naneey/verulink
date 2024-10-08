import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_v1Contract } from "../../artifacts/js/vlink_token_service_v1";
import { Vlink_council_v1Contract } from "../../artifacts/js/vlink_council_v1";
import { getRegisterToken } from "../../artifacts/js/leo2js/vlink_token_service_council_v1";
import { hashStruct } from "../../utils/hash";
import { RegisterToken, RegisterTokenLeo } from "../../artifacts/js/types/vlink_token_service_council_v1";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { Vlink_token_service_council_v1Contract } from "../../artifacts/js/vlink_token_service_council_v1";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { getRegisterTokenLeo } from "../../artifacts/js/js2leo/vlink_token_service_council_v1";

(BigInt.prototype as any).toJSON = function () {
  return this.toString()+"field";
};

const mode = ExecutionMode.SnarkExecute;
export const deployWeth = async (token_name, symbol, decimals, max_supply) => {

  const tokenService = new Vlink_token_service_v1Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Vlink_token_service_council_v1Contract({ mode, priorityFee: 10_000 })
  const council = new Vlink_council_v1Contract({ mode, priorityFee: 10_000 });

  // Propose wusdc registration
  const proposalId = (parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1);
  const register_token: RegisterToken = {
    id: proposalId,
    token_name: token_name,
    symbol: symbol,
    decimals: decimals,
    max_supply: max_supply
  };
  const registerTokenProposalHash = hashStruct(getRegisterTokenLeo(register_token));
  const [proposeWusdcTx] = await council.propose(proposalId, registerTokenProposalHash)
  await council.wait(proposeWusdcTx)


  const voters = padWithZeroAddress(await getVotersWithYesVotes(registerTokenProposalHash), SUPPORTED_THRESHOLD);
  // Register wusdc
  const [registerWusdcTx] = await tokenServiceCouncil.ts_register_token(proposalId, token_name, symbol, decimals, max_supply, voters)
  await tokenService.wait(registerWusdcTx)

}