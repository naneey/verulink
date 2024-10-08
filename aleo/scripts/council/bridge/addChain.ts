import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v1Contract } from "../../../artifacts/js/vlink_token_bridge_v1";
import { Vlink_council_v1Contract } from "../../../artifacts/js/vlink_council_v1";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddChainLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v1";
import { TbAddChain } from "../../../artifacts/js/types/vlink_bridge_council_v1";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v1Contract } from "../../../artifacts/js/vlink_bridge_council_v1";

const mode = ExecutionMode.SnarkExecute;
const council = new Vlink_council_v1Contract({mode, priorityFee: 10_000});
const bridge = new Vlink_token_bridge_v1Contract({mode, priorityFee: 10_000});
const bridgeCouncil = new Vlink_bridge_council_v1Contract({mode, priorityFee: 10_000});

export const proposeAddChain = async (newChainId: bigint): Promise<number> => {

  console.log(`👍 Proposing to add chainId: ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  const [proposeAddChainTx] = await council.propose(proposalId, tbAddChainProposalHash); 

  await council.wait(proposeAddChainTx);

  getProposalStatus(tbAddChainProposalHash);
  
  return proposalId
};

export const voteAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`👍 Voting to add chainId: ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  const voter = council.getDefaultAccount();
  validateVote(tbAddChainProposalHash, voter);

  const [voteAddChainTx] = await council.vote(tbAddChainProposalHash, true);
  
  await council.wait(voteAddChainTx);

  getProposalStatus(tbAddChainProposalHash);

}

export const execAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`Adding chainId ${newChainId}`)
  let isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  validateExecution(tbAddChainProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbAddChainProposalHash), SUPPORTED_THRESHOLD);
  console.log(voters)
  const [addChainTx] = await bridgeCouncil.tb_add_chain(
    tbAddChain.id,
    tbAddChain.chain_id,
    voters
  )

  await council.wait(addChainTx);

  isChainIdSupported = await bridge.supported_chains(newChainId);
  if (!isChainIdSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ ChainId: ${newChainId} added successfully.`)

}