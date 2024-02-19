import { hashStruct } from "../../utils/hash";

import { Council_v0003Contract } from "../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "./councilUtils";
import { RemoveMember } from "../../artifacts/js/types/council_v0003";
import { getRemoveMemberLeo } from "../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveMember = async (member: string, new_threshold: number) => {

  console.log(`👍 Proposing to remove council Member: ${member}`)
  const isMember = await council.members(member, false);
  if (!isMember) {
    throw Error(`${member} is not council memeber!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const removeMemeberProposal: RemoveMember = {
    id: proposalId,
    existing_member: member,
    new_threshold: new_threshold,
  };
  const removeMemberProposalHash = hashStruct(getRemoveMemberLeo(removeMemeberProposal));

  const [removeMemberTx] = await council.propose(proposalId, removeMemberProposalHash);
  await council.wait(removeMemberTx);

  getProposalStatus(removeMemberProposalHash);
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveMember = async (proposalId: number, member: string, new_threshold: number) => {

  console.log(`👍 Voting to add council Member: ${member}`)
  const isMember = await council.members(member, false);
  if (isMember) {
    throw Error(`${member} is already council memeber!`);
  }

  const voter = council.getAccounts()[0];

  const removeMemeberProposal: RemoveMember = {
    id: proposalId,
    existing_member: member,
    new_threshold: new_threshold,
  };
  const removeMemberProposalHash = hashStruct(getRemoveMemberLeo(removeMemeberProposal));

  validateVote(removeMemberProposalHash, voter);

  const [removeMemberTx] = await council.vote(removeMemberProposalHash, true);
  await council.wait(removeMemberTx);

  getProposalStatus(removeMemberProposalHash);

};



//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveMember = async (proposalId: number, member: string, new_threshold: number, ) => {

    console.log(`👍executing to remove council Member: ${member}`)
    const isMember = await council.members(member, false);
    if (!isMember) {
      throw Error(`${member} is not council memeber!`);
    }

    const removeMemberProposalHash = await council.proposals(proposalId);
    validateExecution(removeMemberProposalHash);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(removeMemberProposalHash), SUPPORTED_THRESHOLD);

    const [removeMemeberExecTx] = await council.remove_member(proposalId, member, new_threshold, voters);
    await council.wait(removeMemeberExecTx);

    const isMemberRemoved = await council.members(member, false);
    if (isMemberRemoved) {
        throw Error(`❌ Unknown error.`);
    }

    console.log(` ✅ Member: ${member} removed successfully.`)
}