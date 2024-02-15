// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BridgeTokenServiceManager is OwnableUpgradeable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    mapping(address => bool) public tokenServices;

    function BridgeTokenServiceManager_init() public initializer {
        __Ownable_init();
    }

    function isRegisteredTokenService(address _service) public view returns(bool) {
        return tokenServices[_service];
    }

    function addTokenService(address _service) external onlyOwner {
        require(_service != address(0), "Zero Address");
        require(!isRegisteredTokenService(_service), "Token Service already exists");
        tokenServices[_service] = true;
        emit TokenServiceAdded(_service);
    }

    function removeTokenService(address _service) external onlyOwner {
        require(isRegisteredTokenService(_service), "Unknown Token Service");
        delete tokenServices[_service];
        emit TokenServiceRemoved(_service);
    }
}