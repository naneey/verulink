import {
  ProposalVote,
  AddMember,
  RemoveMember,
  UpdateThreshold,
  TbUpdateGovernance,
  TbAddAttestor,
  TbRemoveAttestor,
  TbUpdateThreshold,
  TbAddChain,
  TbRemoveChain,
  TbAddService,
  TbRemoveService,
  TsTransferOwnership,
  TsAddToken,
  TsRemoveToken,
  TsUpdateMinTransfer,
  TsUpdateMaxTransfer,
  TsUpdateWithdrawalLimit,
  HoldingRelease,
  ConnectorUpdate,
  ExternalProposal,
  AleoProgram,
  ForeignContract,
  MsgTokenReceive,
  MsgTokenSend,
  InPacket,
  OutPacket,
  PacketId,
  PacketIdWithAttestor,
  InPacketWithScreening,
  WithdrawalLimit,
  token,
  Approval,
  TokenInfo
} from "./types";

import {
  getProposalVoteLeo,
  getAddMemberLeo,
  getRemoveMemberLeo,
  getUpdateThresholdLeo,
  getTbUpdateGovernanceLeo,
  getTbAddAttestorLeo,
  getTbRemoveAttestorLeo,
  getTbUpdateThresholdLeo,
  getTbAddChainLeo,
  getTbRemoveChainLeo,
  getTbAddServiceLeo,
  getTbRemoveServiceLeo,
  getTsTransferOwnershipLeo,
  getTsAddTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateMinTransferLeo,
  getTsUpdateMaxTransferLeo,
  getTsUpdateWithdrawalLimitLeo,
  getHoldingReleaseLeo,
  getConnectorUpdateLeo,
  getExternalProposalLeo,
  getAleoProgramLeo,
  getForeignContractLeo,
  getMsgTokenReceiveLeo,
  getMsgTokenSendLeo,
  getInPacketLeo,
  getOutPacketLeo,
  getPacketIdLeo,
  getPacketIdWithAttestorLeo,
  getInPacketWithScreeningLeo,
  getWithdrawalLimitLeo,
  gettokenLeo,
  getApprovalLeo,
  getTokenInfoLeo
} from "./js2leo";

import {
  getProposalVote,
  getAddMember,
  getRemoveMember,
  getUpdateThreshold,
  getTbUpdateGovernance,
  getTbAddAttestor,
  getTbRemoveAttestor,
  getTbUpdateThreshold,
  getTbAddChain,
  getTbRemoveChain,
  getTbAddService,
  getTbRemoveService,
  getTsTransferOwnership,
  getTsAddToken,
  getTsRemoveToken,
  getTsUpdateMinTransfer,
  getTsUpdateMaxTransfer,
  getTsUpdateWithdrawalLimit,
  getHoldingRelease,
  getConnectorUpdate,
  getExternalProposal,
  getAleoProgram,
  getForeignContract,
  getMsgTokenReceive,
  getMsgTokenSend,
  getInPacket,
  getOutPacket,
  getPacketId,
  getPacketIdWithAttestor,
  getInPacketWithScreening,
  getWithdrawalLimit,
  gettoken,
  getApproval,
  getTokenInfo
} from "./leo2js";

import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping,
  js2leo,
  leo2js
} from "@aleojs/core";

import {
  BaseContract
} from "../../contract/base-contract";

export class Wusdc_connector_v0001Contract extends BaseContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    super(config);
    this.config = {
      ...this.config,
      appName: 'wusdc_connector_v0001',
      contractPath: 'artifacts/leo/wusdc_connector_v0001',
      fee: '0.01'
    };
  }
  async initialize_wusdc() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_wusdc',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_receive(r0: Array < number > , r1: string, r2: string, r3: bigint, r4: bigint, r5: number, r6: Array < string > , r7: Array < string > ) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u64(r4);
    const r5Leo = js2leo.u32(r5);
    const r6Leo = js2leo.arr2string(js2leo.array(r6, js2leo.address));
    const r7Leo = js2leo.arr2string(js2leo.array(r7, js2leo.signature));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_receive',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_send(r0: Array < number > , r1: bigint) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_send',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_release(r0: number, r1: string, r2: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_release',
      params,
    });
    if (this.config.mode === "execute") return result;
  }


}