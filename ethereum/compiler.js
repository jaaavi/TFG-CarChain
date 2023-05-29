const path = require('path');
const fs = require('fs');
const solc = require('solc');

class ContractCompiler {
  constructor() {
    // Initialize an empty contracts object
    this.contracts = {};
  }

  compileContracts() {
    // Get the file path of the Solidity contract to be compiled
    const contractPath = path.resolve(__dirname + '/contracts', 'CarChain.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    // Define the Solidity compiler input object
    const input = {
      language: 'Solidity',
      sources: {
        'CarChain.sol': {
          content: contractSource,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
      },
    };

    // Compile the Solidity contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Extract the compiled contracts from the output object
    for (const contractName in output.contracts['CarChain.sol']) {
      const contractObj = output.contracts['CarChain.sol'][contractName];
      this.contracts[contractName] = {
        bytecode: contractObj.evm.bytecode.object,
        abi: contractObj.abi,
      };
    }

    // Return the compiled contracts object
    return this.contracts;
  }

  
}

// Export an instance of the ContractCompiler class
module.exports = new ContractCompiler();
