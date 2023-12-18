import * as dotenv from "dotenv";
import { ethers, Wallet } from "ethers";
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import {CreateCallAbi} from "../ABI/ABI.js";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq"
);
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

const bytecode = "0x60a06040523073ffffffffffffffffffffffffffffffffffffffff1660809073ffffffffffffffffffffffffffffffffffffffff1681525034801561004357600080fd5b5060805161498461007b60003960008181610c3201528181610cc001528181610e1d01528181610eab0152610f7e01526149846000f3fe6080604052600436106101c25760003560e01c80637c981f7d116100f7578063c0abe2fe11610095578063e71d86dc11610064578063e71d86dc146106c9578063ea6469f8146106f2578063f2fde38b1461071b578063f78dd84d14610744576101c2565b8063c0abe2fe146105fd578063c4d66de81461063a578063c86a64f714610663578063cbf50bb6146106a0576101c2565b806391e8d207116100d157806391e8d20714610531578063aadc3b721461055a578063af83d4d814610597578063b8cc3eaa146105c0576101c2565b80637c981f7d146104b4578063842dc8ac146104dd5780638da5cb5b14610506576101c2565b80634f1ef28611610164578063550325b51161013e578063550325b5146103d3578063555e9074146104115780636b3da26f1461044e5780637be0660c1461048b576101c2565b80634f1ef2861461034f5780635153d4671461036b57806352d1902d146103a8576101c2565b80632e2f4e24116101a05780632e2f4e241461026f5780633659cfe6146102ac578063419eb411146102d55780634d7fc58e14610312576101c2565b806303d1d693146101c757806305cd5a3614610204578063188b53391461022d575b600080fd5b3480156101d357600080fd5b506101ee60048036038101906101e99190612a00565b61076d565b6040516101fb9190612a59565b60405180910390f35b34801561021057600080fd5b5061022b60048036038101906102269190612ad2565b610792565b005b34801561023957600080fd5b50610254600480360381019061024f9190612a00565b6108f3565b60405161026696959493929190612c92565b60405180910390f35b34801561027b57600080fd5b5061029660048036038101906102919190612ad2565b610bda565b6040516102a39190612d1c565b60405180910390f35b3480156102b857600080fd5b506102d360048036038101906102ce9190612ad2565b610c30565b005b3480156102e157600080fd5b506102fc60048036038101906102f79190612a00565b610db8565b6040516103099190612a59565b60405180910390f35b34801561031e57600080fd5b5061033960048036038101906103349190612a00565b610de6565b6040516103469190612d1c565b60405180910390f35b61036960048036038101906103649190612e6c565b610e1b565b005b34801561037757600080fd5b50610392600480360381019061038d9190612ec8565b610f57565b60405161039f9190612d1c565b60405180910390f35b3480156103b457600080fd5b506103bd610f7a565b6040516103ca9190612a59565b60405180910390f35b3480156103df57600080fd5b506103fa60048036038101906103f59190612ec8565b611033565b604051610408929190612f3f565b60405180910390f35b34801561041d57600080fd5b5061043860048036038101906104339190612a00565b6110df565b6040516104459190612a59565b60405180910390f35b34801561045a57600080fd5b5061047560048036038101906104709190612ad2565b611104565b6040516104829190612d1c565b60405180910390f35b34801561049757600080fd5b506104b260048036038101906104ad91906132f2565b61115a565b005b3480156104c057600080fd5b506104db60048036038101906104d6919061333b565b6111ae565b005b3480156104e957600080fd5b5061050460048036038101906104ff919061333b565b611202565b005b34801561051257600080fd5b5061051b611256565b6040516105289190613393565b60405180910390f35b34801561053d57600080fd5b50610558600480360381019061055391906133ae565b61127c565b005b34801561056657600080fd5b50610581600480360381019061057c919061341a565b61142b565b60405161058e9190612d1c565b60405180910390f35b3480156105a357600080fd5b506105be60048036038101906105b9919061345a565b611493565b005b3480156105cc57600080fd5b506105e760048036038101906105e29190612a00565b611604565b6040516105f49190612d1c565b60405180910390f35b34801561060957600080fd5b50610624600480360381019061061f91906134b6565b611638565b6040516106319190612d1c565b60405180910390f35b34801561064657600080fd5b50610661600480360381019061065c9190612ad2565b61165f565b005b34801561066f57600080fd5b5061068a60048036038101906106859190612ec8565b6116a3565b60405161069791906134e3565b60405180910390f35b3480156106ac57600080fd5b506106c760048036038101906106c29190612ec8565b6116bb565b005b3480156106d557600080fd5b506106f060048036038101906106eb9190613686565b6117fb565b005b3480156106fe57600080fd5b50610719600480360381019061071491906133ae565b61189f565b005b34801561072757600080fd5b50610742600480360381019061073d9190612ad2565b611ac7565b005b34801561075057600080fd5b5061076b60048036038101906107669190612ad2565b611b9b565b005b6000602052816000526040600020602052806000526040600020600091509150505481565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610822576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108199061371b565b60405180910390fd5b61082b81611104565b61086a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161086190613787565b60405180910390fd5b600960008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549060ff02191690557f18952ed4229327e2d83d53a06b823c2da3b19cb320c82017b8da5f60b6dfe8f0816040516108e89190613393565b60405180910390a150565b60046020528160005260406000206020528060005260406000206000915091505080600001549080600101549080600201604051806040016040529081600082015481526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815250509080600401604051806040016040529081600082015481526020016001820180546109b9906137d6565b80601f01602080910402602001604051908101604052809291908181526020018280546109e5906137d6565b8015610a325780601f10610a0757610100808354040283529160200191610a32565b820191906000526020600020905b815481529060010190602001808311610a1557829003601f168201915b50505050508152505090806006016040518060800160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600182018054610ab1906137d6565b80601f0160208091040260200160405190810160405280929190818152602001828054610add906137d6565b8015610b2a5780601f10610aff57610100808354040283529160200191610b2a565b820191906000526020600020905b815481529060010190602001808311610b0d57829003601f168201915b5050505050815260200160028201548152602001600382018054610b4d906137d6565b80601f0160208091040260200160405190810160405280929190818152602001828054610b79906137d6565b8015610bc65780601f10610b9b57610100808354040283529160200191610bc6565b820191906000526020600020905b815481529060010190602001808311610ba957829003601f168201915b5050505050815250509080600a0154905086565b6000600760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff1603610cbe576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cb590613879565b60405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16610cfd611d75565b73ffffffffffffffffffffffffffffffffffffffff1614610d53576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d4a9061390b565b60405180910390fd5b610d5c81611dcc565b610db581600067ffffffffffffffff811115610d7b57610d7a612d41565b5b6040519080825280601f01601f191660200182016040528015610dad5781602001600182028036833780820191505090505b506000611e29565b50565b6000806000848152602001908152602001600020600083815260200190815260200160002054905092915050565b60008060001b600360008581526020019081526020016000206000848152602001908152602001600020541415905092915050565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff1603610ea9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ea090613879565b60405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16610ee8611d75565b73ffffffffffffffffffffffffffffffffffffffff1614610f3e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f359061390b565b60405180910390fd5b610f4782611dcc565b610f5382826001611e29565b5050565b600080600a60008481526020019081526020016000206000015414159050919050565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff161461100a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110019061399d565b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b905090565b600a60205280600052604060002060009150905080600001549080600101805461105c906137d6565b80601f0160208091040260200160405190810160405280929190818152602001828054611088906137d6565b80156110d55780601f106110aa576101008083540402835291602001916110d5565b820191906000526020600020905b8154815290600101906020018083116110b857829003601f168201915b5050505050905082565b6003602052816000526040600020602052806000526040600020600091509150505481565b6000600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b61116381611f97565b61116c33610bda565b6111ab576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016111a290613a09565b60405180910390fd5b50565b6111b781611fdd565b6111c033610bda565b6111ff576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016111f690613a09565b60405180910390fd5b50565b61120b81611fe9565b61121433611104565b611253576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161124a90613787565b60405180910390fd5b50565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461130c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113039061371b565b60405180910390fd5b600760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16611398576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161138f90613a09565b60405180910390fd5b600760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549060ff0219169055806008819055507f4d9baafb1aaa72b5de32bbdb949ea3d6be986b9989a747834d6470df6738352d828260405161141f929190613a29565b60405180910390a15050565b60006002600084815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611523576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161151a9061371b565b60405180910390fd5b61152c82610f57565b1561156c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161156390613a9e565b60405180910390fd5b604051806040016040528083815260200182815250600a60008481526020019081526020016000206000820151816000015560208201518160010190816115b39190613c6a565b509050507f98d2ada6e8e6c16dc5c0cd7305c7ea2a5487d613218c7498c4b1ce5c8fbd4525600a60008481526020019081526020016000206040516115f89190613e3a565b60405180910390a15050565b60008060001b6000808581526020019081526020016000206000848152602001908152602001600020541415905092915050565b600061164261209c565b600160008481526020019081526020016000205410159050919050565b80600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60056020528060005260406000206000915090505481565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461174b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117429061371b565b60405180910390fd5b61175481610f57565b611793576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161178a90613ea8565b60405180910390fd5b600a60008281526020019081526020016000206000808201600090556001820160006117bf9190612959565b50507f11a9d1a77f76361ed131c19b1dc5758504c51dbde2e49fc973a0ef9577ad13d5816040516117f091906134e3565b60405180910390a150565b611804816120a6565b61180d33611104565b61184c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161184390613787565b60405180910390fd5b61185d816060015160000151610f57565b61189c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161189390613f14565b60405180910390fd5b50565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461192f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016119269061371b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361199e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161199590613f80565b60405180910390fd5b600760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff1615611a2b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611a2290613fec565b60405180910390fd5b6001600760008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550806008819055507f3048c9ea63a33da5ed9a73829970fa3c31e6a8b32bbc5747e24632f61c027e8e8282604051611abb929190613a29565b60405180910390a15050565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611b57576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611b4e9061371b565b60405180910390fd5b80600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611c2b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611c229061371b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603611c9a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611c9190613f80565b60405180910390fd5b611ca381611104565b15611ce3576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611cda90614058565b60405180910390fd5b6001600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055507f94a4797e4c030e498da08bb8871d39298528d0f1269fba1da4363703331d58e981604051611d6a9190613393565b60405180910390a150565b6000611da37f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b612266565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611e2657600080fd5b50565b611e557f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd914360001b612270565b60000160009054906101000a900460ff1615611e7957611e748361227a565b611f92565b8273ffffffffffffffffffffffffffffffffffffffff166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015611ee157506040513d601f19601f82011682018060405250810190611ede919061408d565b60015b611f20576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611f179061412c565b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b8114611f85576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611f7c906141be565b60405180910390fd5b50611f91838383612333565b5b505050565b60005b8151811015611fd957611fc6828281518110611fb957611fb86141de565b5b602002602001015161235f565b8080611fd19061423c565b915050611f9a565b5050565b611fe68161235f565b50565b60006120018260600151600001518360200151610db8565b905061200c8261237f565b811461204d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401612044906142d0565b60405180910390fd5b6120568261240f565b61206182600261241b565b7f636209b10d69c1917cd00a9dc825c2440aed804c54f2e9d9a3dddd2cf863c223816040516120909190612a59565b60405180910390a15050565b6000600854905090565b60018160000181815250506120c2816060015160000151612429565b8160200181815250508060046000836060015160000151815260200190815260200160002060008360200151815260200190815260200160002060008201518160000155602082015181600101556040820151816002016000820151816000015560208201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050506060820151816004016000820151816000015560208201518160010190816121949190613c6a565b50505060808201518160060160008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010190816121fc9190613c6a565b5060408201518160020155606082015181600301908161221c9190613c6a565b50505060a082015181600a01559050507f23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb98160405161225b9190614456565b60405180910390a150565b6000819050919050565b6000819050919050565b61228381612471565b6122c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016122b9906144ea565b60405180910390fd5b806122ef7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b612266565b60000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b61233c83612494565b6000825111806123495750805b1561235a5761235883836124e3565b505b505050565b6123688161240f565b61237381600161241b565b61237c81612510565b50565b6000816000015182602001518360400151600001518460400151602001518560600151600001518660600151602001518760800151600001518860800151602001518960800151604001518a60800151606001518b60a001516040516020016123f29b9a999897969594939291906145af565b604051602081830303815290604052805190602001209050919050565b61241881612513565b50565b6124258282612575565b5050565b6000600160056000848152602001908152602001600020600082825461244f9190614670565b9250508190555060056000838152602001908152602001600020549050919050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b61249d8161227a565b8073ffffffffffffffffffffffffffffffffffffffff167fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b60405160405180910390a250565b60606125088383604051806060016040528060278152602001614928602791396125fe565b905092915050565b50565b61251c816126dd565b6125328160600151600001518260200151610de6565b15612572576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401612569906146f0565b60405180910390fd5b50565b61257f82826126e9565b6002811415806125a257506125a08260600151600001518360200151611604565b155b6125fa576125bc82606001516000015183602001516128c0565b6125c58261237f565b600360008460600151600001518152602001908152602001600020600084602001518152602001908152602001600020819055505b5050565b606061260984612471565b801561261b575061261933612471565b155b61265a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016126519061475c565b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff168560405161268291906147c3565b600060405180830381855af49150503d80600081146126bd576040519150601f19603f3d011682016040523d82523d6000602084013e6126c2565b606091505b50915091506126d28282866128eb565b925050509392505050565b6126e681612952565b50565b6126f38282612955565b600181036128bc576127118260400151600001518360200151611604565b6128bc5760006127208361237f565b905061272c813361142b565b15612770577f0bcf2ea3c8b515fe50f169a4131ce2d2198afc8ec7d83a8658d7bcb0a5fbbe7781336040516127629291906147da565b60405180910390a1506128bc565b7f0b2f654b7e608ce51a82ce8157e79c350ed670605e8985266ad89fc85060e74981336040516127a19291906147da565b60405180910390a160016002600083815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550600180600083815260200190815260200160002060008282546128359190614670565b9250508190555061284581611638565b61284f57506128bc565b806000808560400151600001518152602001908152602001600020600085602001518152602001908152602001600020819055507f8e74d35ba237f3bfb5e6191f17491ddfff2dd14682f463d1ebcb7302006162b5836040516128b291906148e3565b60405180910390a1505b5050565b6000808381526020019081526020016000206000828152602001908152602001600020600090555050565b606083156128fb5782905061294b565b60008351111561290e5782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016129429190614905565b60405180910390fd5b9392505050565b50565b5050565b508054612965906137d6565b6000825580601f106129775750612996565b601f0160209004906000526020600020908101906129959190612999565b5b50565b5b808211156129b257600081600090555060010161299a565b5090565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b6129dd816129ca565b81146129e857600080fd5b50565b6000813590506129fa816129d4565b92915050565b60008060408385031215612a1757612a166129c0565b5b6000612a25858286016129eb565b9250506020612a36858286016129eb565b9150509250929050565b6000819050919050565b612a5381612a40565b82525050565b6000602082019050612a6e6000830184612a4a565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000612a9f82612a74565b9050919050565b612aaf81612a94565b8114612aba57600080fd5b50565b600081359050612acc81612aa6565b92915050565b600060208284031215612ae857612ae76129c0565b5b6000612af684828501612abd565b91505092915050565b612b08816129ca565b82525050565b612b17816129ca565b82525050565b612b2681612a94565b82525050565b604082016000820151612b426000850182612b0e565b506020820151612b556020850182612b1d565b50505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015612b95578082015181840152602081019050612b7a565b60008484015250505050565b6000601f19601f8301169050919050565b6000612bbd82612b5b565b612bc78185612b66565b9350612bd7818560208601612b77565b612be081612ba1565b840191505092915050565b6000604083016000830151612c036000860182612b0e565b5060208301518482036020860152612c1b8282612bb2565b9150508091505092915050565b6000608083016000830151612c406000860182612b1d565b5060208301518482036020860152612c588282612bb2565b9150506040830151612c6d6040860182612b0e565b5060608301518482036060860152612c858282612bb2565b9150508091505092915050565b600060e082019050612ca76000830189612aff565b612cb46020830188612aff565b612cc16040830187612b2c565b8181036080830152612cd38186612beb565b905081810360a0830152612ce78185612c28565b9050612cf660c0830184612aff565b979650505050505050565b60008115159050919050565b612d1681612d01565b82525050565b6000602082019050612d316000830184612d0d565b92915050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b612d7982612ba1565b810181811067ffffffffffffffff82111715612d9857612d97612d41565b5b80604052505050565b6000612dab6129b6565b9050612db78282612d70565b919050565b600067ffffffffffffffff821115612dd757612dd6612d41565b5b612de082612ba1565b9050602081019050919050565b82818337600083830152505050565b6000612e0f612e0a84612dbc565b612da1565b905082815260208101848484011115612e2b57612e2a612d3c565b5b612e36848285612ded565b509392505050565b600082601f830112612e5357612e52612d37565b5b8135612e63848260208601612dfc565b91505092915050565b60008060408385031215612e8357612e826129c0565b5b6000612e9185828601612abd565b925050602083013567ffffffffffffffff811115612eb257612eb16129c5565b5b612ebe85828601612e3e565b9150509250929050565b600060208284031215612ede57612edd6129c0565b5b6000612eec848285016129eb565b91505092915050565b600082825260208201905092915050565b6000612f1182612b5b565b612f1b8185612ef5565b9350612f2b818560208601612b77565b612f3481612ba1565b840191505092915050565b6000604082019050612f546000830185612aff565b8181036020830152612f668184612f06565b90509392505050565b600067ffffffffffffffff821115612f8a57612f89612d41565b5b602082029050602081019050919050565b600080fd5b600080fd5b600080fd5b600067ffffffffffffffff821115612fc557612fc4612d41565b5b612fce82612ba1565b9050602081019050919050565b6000612fee612fe984612faa565b612da1565b90508281526020810184848401111561300a57613009612d3c565b5b613015848285612ded565b509392505050565b600082601f83011261303257613031612d37565b5b8135613042848260208601612fdb565b91505092915050565b60006040828403121561306157613060612fa0565b5b61306b6040612da1565b9050600061307b848285016129eb565b600083015250602082013567ffffffffffffffff81111561309f5761309e612fa5565b5b6130ab8482850161301d565b60208301525092915050565b6000604082840312156130cd576130cc612fa0565b5b6130d76040612da1565b905060006130e7848285016129eb565b60008301525060206130fb84828501612abd565b60208301525092915050565b60006080828403121561311d5761311c612fa0565b5b6131276080612da1565b9050600061313784828501612abd565b600083015250602061314b84828501612abd565b602083015250604061315f848285016129eb565b604083015250606061317384828501612abd565b60608301525092915050565b6000610140828403121561319657613195612fa0565b5b6131a060c0612da1565b905060006131b0848285016129eb565b60008301525060206131c4848285016129eb565b602083015250604082013567ffffffffffffffff8111156131e8576131e7612fa5565b5b6131f48482850161304b565b6040830152506060613208848285016130b7565b60608301525060a061321c84828501613107565b608083015250610120613231848285016129eb565b60a08301525092915050565b600061325061324b84612f6f565b612da1565b9050808382526020820190506020840283018581111561327357613272612f9b565b5b835b818110156132ba57803567ffffffffffffffff81111561329857613297612d37565b5b8086016132a5898261317f565b85526020850194505050602081019050613275565b5050509392505050565b600082601f8301126132d9576132d8612d37565b5b81356132e984826020860161323d565b91505092915050565b600060208284031215613308576133076129c0565b5b600082013567ffffffffffffffff811115613326576133256129c5565b5b613332848285016132c4565b91505092915050565b600060208284031215613351576133506129c0565b5b600082013567ffffffffffffffff81111561336f5761336e6129c5565b5b61337b8482850161317f565b91505092915050565b61338d81612a94565b82525050565b60006020820190506133a86000830184613384565b92915050565b600080604083850312156133c5576133c46129c0565b5b60006133d385828601612abd565b92505060206133e4858286016129eb565b9150509250929050565b6133f781612a40565b811461340257600080fd5b50565b600081359050613414816133ee565b92915050565b60008060408385031215613431576134306129c0565b5b600061343f85828601613405565b925050602061345085828601612abd565b9150509250929050565b60008060408385031215613471576134706129c0565b5b600061347f858286016129eb565b925050602083013567ffffffffffffffff8111156134a05761349f6129c5565b5b6134ac8582860161301d565b9150509250929050565b6000602082840312156134cc576134cb6129c0565b5b60006134da84828501613405565b91505092915050565b60006020820190506134f86000830184612aff565b92915050565b60006080828403121561351457613513612fa0565b5b61351e6080612da1565b9050600061352e84828501612abd565b600083015250602082013567ffffffffffffffff81111561355257613551612fa5565b5b61355e8482850161301d565b6020830152506040613572848285016129eb565b604083015250606082013567ffffffffffffffff81111561359657613595612fa5565b5b6135a28482850161301d565b60608301525092915050565b600060e082840312156135c4576135c3612fa0565b5b6135ce60c0612da1565b905060006135de848285016129eb565b60008301525060206135f2848285016129eb565b6020830152506040613606848285016130b7565b604083015250608082013567ffffffffffffffff81111561362a57613629612fa5565b5b6136368482850161304b565b60608301525060a082013567ffffffffffffffff81111561365a57613659612fa5565b5b613666848285016134fe565b60808301525060c061367a848285016129eb565b60a08301525092915050565b60006020828403121561369c5761369b6129c0565b5b600082013567ffffffffffffffff8111156136ba576136b96129c5565b5b6136c6848285016135ae565b91505092915050565b7f4e6f74206f776e65720000000000000000000000000000000000000000000000600082015250565b6000613705600983612ef5565b9150613710826136cf565b602082019050919050565b60006020820190508181036000830152613734816136f8565b9050919050565b7f556e6b6e6f776e20546f6b656e20536572766963650000000000000000000000600082015250565b6000613771601583612ef5565b915061377c8261373b565b602082019050919050565b600060208201905081810360008301526137a081613764565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806137ee57607f821691505b602082108103613801576138006137a7565b5b50919050565b7f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060008201527f64656c656761746563616c6c0000000000000000000000000000000000000000602082015250565b6000613863602c83612ef5565b915061386e82613807565b604082019050919050565b6000602082019050818103600083015261389281613856565b9050919050565b7f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060008201527f6163746976652070726f78790000000000000000000000000000000000000000602082015250565b60006138f5602c83612ef5565b915061390082613899565b604082019050919050565b60006020820190508181036000830152613924816138e8565b9050919050565b7f555550535570677261646561626c653a206d757374206e6f742062652063616c60008201527f6c6564207468726f7567682064656c656761746563616c6c0000000000000000602082015250565b6000613987603883612ef5565b91506139928261392b565b604082019050919050565b600060208201905081810360008301526139b68161397a565b9050919050565b7f556e6b6e6f776e204174746573746f7200000000000000000000000000000000600082015250565b60006139f3601083612ef5565b91506139fe826139bd565b602082019050919050565b60006020820190508181036000830152613a22816139e6565b9050919050565b6000604082019050613a3e6000830185613384565b613a4b6020830184612aff565b9392505050565b7f436861696e20616c726561647920737570706f72746564000000000000000000600082015250565b6000613a88601783612ef5565b9150613a9382613a52565b602082019050919050565b60006020820190508181036000830152613ab781613a7b565b9050919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302613b207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82613ae3565b613b2a8683613ae3565b95508019841693508086168417925050509392505050565b6000819050919050565b6000613b67613b62613b5d846129ca565b613b42565b6129ca565b9050919050565b6000819050919050565b613b8183613b4c565b613b95613b8d82613b6e565b848454613af0565b825550505050565b600090565b613baa613b9d565b613bb5818484613b78565b505050565b5b81811015613bd957613bce600082613ba2565b600181019050613bbb565b5050565b601f821115613c1e57613bef81613abe565b613bf884613ad3565b81016020851015613c07578190505b613c1b613c1385613ad3565b830182613bba565b50505b505050565b600082821c905092915050565b6000613c4160001984600802613c23565b1980831691505092915050565b6000613c5a8383613c30565b9150826002028217905092915050565b613c7382612b5b565b67ffffffffffffffff811115613c8c57613c8b612d41565b5b613c9682546137d6565b613ca1828285613bdd565b600060209050601f831160018114613cd45760008415613cc2578287015190505b613ccc8582613c4e565b865550613d34565b601f198416613ce286613abe565b60005b82811015613d0a57848901518255600182019150602085019450602081019050613ce5565b86831015613d275784890151613d23601f891682613c30565b8355505b6001600288020188555050505b505050505050565b60008160001c9050919050565b6000819050919050565b6000613d66613d6183613d3c565b613d49565b9050919050565b60008154613d7a816137d6565b613d848186612b66565b94506001821660008114613d9f5760018114613db557613de8565b60ff198316865281151560200286019350613de8565b613dbe85613abe565b60005b83811015613de057815481890152600182019150602081019050613dc1565b808801955050505b50505092915050565b6000604083016000808401549050613e0881613d53565b613e156000870182612b0e565b50600184018583036020870152613e2c8382613d6d565b925050819250505092915050565b60006020820190508181036000830152613e548184613df1565b905092915050565b7f556e6b6e6f776e20636861696e49640000000000000000000000000000000000600082015250565b6000613e92600f83612ef5565b9150613e9d82613e5c565b602082019050919050565b60006020820190508181036000830152613ec181613e85565b9050919050565b7f556e6b6e6f776e2064657374696e6174696f6e20636861696e00000000000000600082015250565b6000613efe601983612ef5565b9150613f0982613ec8565b602082019050919050565b60006020820190508181036000830152613f2d81613ef1565b9050919050565b7f5a65726f20416464726573730000000000000000000000000000000000000000600082015250565b6000613f6a600c83612ef5565b9150613f7582613f34565b602082019050919050565b60006020820190508181036000830152613f9981613f5d565b9050919050565b7f4174746573746f7220616c726561647920657869737473000000000000000000600082015250565b6000613fd6601783612ef5565b9150613fe182613fa0565b602082019050919050565b6000602082019050818103600083015261400581613fc9565b9050919050565b7f546f6b656e205365727669636520616c72656164792065786973747300000000600082015250565b6000614042601c83612ef5565b915061404d8261400c565b602082019050919050565b6000602082019050818103600083015261407181614035565b9050919050565b600081519050614087816133ee565b92915050565b6000602082840312156140a3576140a26129c0565b5b60006140b184828501614078565b91505092915050565b7f45524331393637557067726164653a206e657720696d706c656d656e7461746960008201527f6f6e206973206e6f742055555053000000000000000000000000000000000000602082015250565b6000614116602e83612ef5565b9150614121826140ba565b604082019050919050565b6000602082019050818103600083015261414581614109565b9050919050565b7f45524331393637557067726164653a20756e737570706f727465642070726f7860008201527f6961626c65555549440000000000000000000000000000000000000000000000602082015250565b60006141a8602983612ef5565b91506141b38261414c565b604082019050919050565b600060208201905081810360008301526141d78161419b565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000614247826129ca565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036142795761427861420d565b5b600182019050919050565b7f556e6b6e6f776e205061636b6574000000000000000000000000000000000000600082015250565b60006142ba600e83612ef5565b91506142c582614284565b602082019050919050565b600060208201905081810360008301526142e9816142ad565b9050919050565b6040820160008201516143066000850182612b0e565b5060208201516143196020850182612b1d565b50505050565b60006040830160008301516143376000860182612b0e565b506020830151848203602086015261434f8282612bb2565b9150508091505092915050565b60006080830160008301516143746000860182612b1d565b506020830151848203602086015261438c8282612bb2565b91505060408301516143a16040860182612b0e565b50606083015184820360608601526143b98282612bb2565b9150508091505092915050565b600060e0830160008301516143de6000860182612b0e565b5060208301516143f16020860182612b0e565b50604083015161440460408601826142f0565b506060830151848203608086015261441c828261431f565b915050608083015184820360a0860152614436828261435c565b91505060a083015161444b60c0860182612b0e565b508091505092915050565b6000602082019050818103600083015261447081846143c6565b905092915050565b7f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60008201527f6f74206120636f6e747261637400000000000000000000000000000000000000602082015250565b60006144d4602d83612ef5565b91506144df82614478565b604082019050919050565b60006020820190508181036000830152614503816144c7565b9050919050565b6000819050919050565b614525614520826129ca565b61450a565b82525050565b600081905092915050565b600061454182612b5b565b61454b818561452b565b935061455b818560208601612b77565b80840191505092915050565b60008160601b9050919050565b600061457f82614567565b9050919050565b600061459182614574565b9050919050565b6145a96145a482612a94565b614586565b82525050565b60006145bb828e614514565b6020820191506145cb828d614514565b6020820191506145db828c614514565b6020820191506145eb828b614536565b91506145f7828a614514565b6020820191506146078289614598565b6014820191506146178288614598565b6014820191506146278287614598565b6014820191506146378286614514565b6020820191506146478285614598565b6014820191506146578284614514565b6020820191508190509c9b505050505050505050505050565b600061467b826129ca565b9150614686836129ca565b925082820190508082111561469e5761469d61420d565b5b92915050565b7f5061636b657420616c726561647920636f6e73756d6564000000000000000000600082015250565b60006146da601783612ef5565b91506146e5826146a4565b602082019050919050565b60006020820190508181036000830152614709816146cd565b9050919050565b7f416464726573733a20696e76616c69642064656c65676174652063616c6c0000600082015250565b6000614746601e83612ef5565b915061475182614710565b602082019050919050565b6000602082019050818103600083015261477581614739565b9050919050565b600081519050919050565b600081905092915050565b600061479d8261477c565b6147a78185614787565b93506147b7818560208601612b77565b80840191505092915050565b60006147cf8284614792565b915081905092915050565b60006040820190506147ef6000830185612a4a565b6147fc6020830184613384565b9392505050565b6080820160008201516148196000850182612b1d565b50602082015161482c6020850182612b1d565b50604082015161483f6040850182612b0e565b5060608201516148526060850182612b1d565b50505050565b6000610140830160008301516148716000860182612b0e565b5060208301516148846020860182612b0e565b506040830151848203604086015261489c828261431f565b91505060608301516148b160608601826142f0565b5060808301516148c460a0860182614803565b5060a08301516148d8610120860182612b0e565b508091505092915050565b600060208201905081810360008301526148fd8184614858565b905092915050565b6000602082019050818103600083015261491f8184612f06565b90509291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220e46ad1356ea2ab98106366fde6d236356de5fa2815c597dde5a96fcadc32be4264736f6c63430008130033";

// Encode deployment
const deployerInterface = new ethers.utils.Interface(CreateCallAbi);
const deployCallData = deployerInterface.encodeFunctionData("performCreate", [
    0,
    bytecode,
]);

const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: deployerSigner,
});
const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-goerli.safe.global",
    ethAdapter,
});

const txData = {
    to: process.env.CREATECALL_CONTRACT_ADDRESS,
    value: "0",
    data: deployCallData,
};
const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: SAFE_ADDRESS,
});
const safeTx = await safeSdk.createTransaction({
    safeTransactionData: txData,
});
const safeTxHash = await safeSdk.getTransactionHash(safeTx);

const signature = await safeSdk.signTypedData(safeTx);
console.log("txn hash", safeTxHash);

const transactionConfig = {
    safeAddress: SAFE_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: process.env.SENDER_ADDRESS,
    senderSignature: signature.data,
};

// await safeService.proposeTransaction(transactionConfig);