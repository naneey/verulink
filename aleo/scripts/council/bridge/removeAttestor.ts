import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbRemoveAttestorLeo} from "../../../artifacts/js/js2leo/council_v0003";
import { TbRemoveAttestor} from "../../../artifacts/js/types/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});

export const proposeRemoveAttestor = async (attestor: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add remove attestor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor)); 

  const [proposeRemoveAttestorTx] = await council.propose(proposalId, tbRemoveAttestorProposalHash); 
  
  await council.wait(proposeRemoveAttestorTx);

  getProposalStatus(tbRemoveAttestorProposalHash);
  
  return proposalId
};

export const voteRemoveAttestor = async (proposalId: number, attestor: string, new_threshold: number) => {

  console.log(`👍 Voting to remove attesor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor)); 

  const voter = council.getAccounts()[0];
  validateVote(tbRemoveAttestorProposalHash, voter);

  const [voteRemoveChainTx] = await council.vote(tbRemoveAttestorProposalHash, true);
  
  await council.wait(voteRemoveChainTx);

  getProposalStatus(tbRemoveAttestorProposalHash);

}

export const execRemoveAttestor = async (proposalId: number,attestor: string, new_threshold: number) => {

    console.log(`👍 executing to remove attesor: ${attestor}`)
    let isAttestorSupported = await bridge.attestors(attestor, false);
    if (!isAttestorSupported) {
        throw Error(`Attestor ${attestor} is not attestor!`);
      }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor)); 

  validateExecution(tbRemoveAttestorProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbRemoveAttestorProposalHash), SUPPORTED_THRESHOLD);
  const [removeAttestorTx] = await council.tb_remove_attestor(
    tbRemoveAttestor.id,
    tbRemoveAttestor.existing_attestor,
    tbRemoveAttestor.new_threshold,
    voters
  );

  await council.wait(removeAttestorTx);

  isAttestorSupported = await bridge.attestors(attestor, false);
  if (isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${attestor} removed successfully.`)

}