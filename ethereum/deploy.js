const ganache = require("ganache-core");
const Web3 = require("web3");
const web3 = new Web3('http://localhost:8545');
const contractCompiler = require('./compiler');
const compiledContracts = contractCompiler.compileContracts();

let myContractInstance = null;
let accounts = null;


const getMyContractInstance = async () => {
const contractAddress = '[dirección del contrato desplegado]';
const abi =[
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "user_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			}
		],
		"name": "addVehicleOwner",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "user_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "new_workshop_hash",
				"type": "bytes32"
			}
		],
		"name": "authorizeWorkshop",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "km",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "owner_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "matriculation_date",
				"type": "uint256"
			}
		],
		"name": "registerVehicle",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32[]",
						"name": "reparations_ids",
						"type": "bytes32[]"
					},
					{
						"internalType": "bytes32[]",
						"name": "owners",
						"type": "bytes32[]"
					},
					{
						"internalType": "uint256[]",
						"name": "km_history",
						"type": "uint256[]"
					},
					{
						"internalType": "uint256",
						"name": "matriculation_date",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "active",
						"type": "bool"
					},
					{
						"internalType": "string",
						"name": "visibility",
						"type": "string"
					}
				],
				"internalType": "struct CarChain.vehicleData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "reparation_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "security_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "km",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "date",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "revision_type",
				"type": "string"
			}
		],
		"name": "registerVehicleReparation",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "user_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "visibility",
				"type": "string"
			}
		],
		"name": "setVisibility",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "addressOwner",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			}
		],
		"name": "getVehicle",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32[]",
						"name": "reparations_ids",
						"type": "bytes32[]"
					},
					{
						"internalType": "bytes32[]",
						"name": "owners",
						"type": "bytes32[]"
					},
					{
						"internalType": "uint256[]",
						"name": "km_history",
						"type": "uint256[]"
					},
					{
						"internalType": "uint256",
						"name": "matriculation_date",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "active",
						"type": "bool"
					},
					{
						"internalType": "string",
						"name": "visibility",
						"type": "string"
					}
				],
				"internalType": "struct CarChain.vehicleData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			}
		],
		"name": "getVehicleCurrentOwner",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "vehicle_hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "reparation_hash",
				"type": "bytes32"
			}
		],
		"name": "getVehicleReparation",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "security_hash",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "km",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "date",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "revision_type",
						"type": "string"
					}
				],
				"internalType": "struct CarChain.reparationInfo",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
// Aquí debes colocar el ABI del contrato
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

const getAccountsInstance= async () => {
    if (!accounts) {
      accounts = await web3.eth.getAccounts();
    }
    return accounts;
  };

module.exports = {
  getMyContractInstance,
  getAccountsInstance
};