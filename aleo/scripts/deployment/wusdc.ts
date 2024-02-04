
import { Wusdc_token_v0001Contract } from "../../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../../artifacts/js/wusdc_connector_v0001";

export const deployWusdc = async () => {
  const wusdcToken = new Wusdc_token_v0001Contract({mode: "execute"});
  const wusdcHolding = new Wusdc_holding_v0001Contract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connector_v0001Contract({mode: "execute"});

  // Deploy token
  const wusdcTokenDeployTx = await wusdcToken.deploy(); // 11_912_000
  await wusdcTokenDeployTx.wait();

  // Deploy holding
  const wusdcHoldingDeployTx = await wusdcHolding.deploy(); // 5_039_000
  await wusdcHoldingDeployTx.wait();

  // Deploy connector
  const wusdcConnectorDeployTx = await wusdcConnecter.deploy(); // 7_653_000
  await wusdcConnectorDeployTx.wait();

  // Initialize wusdc
  const initializeWusdcTx = await wusdcConnecter.initialize_wusdc(); // 239_906
  // @ts-ignore
  await initializeWusdcTx.wait();

}