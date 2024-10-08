export const CreateCallAbi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "newContract",
				"type": "address"
			}
		],
		"name": "ContractCreation",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "deploymentData",
				"type": "bytes"
			}
		],
		"name": "performCreate",
		"outputs": [
			{
				"internalType": "address",
				"name": "newContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "deploymentData",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			}
		],
		"name": "performCreate2",
		"outputs": [
			{
				"internalType": "address",
				"name": "newContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];