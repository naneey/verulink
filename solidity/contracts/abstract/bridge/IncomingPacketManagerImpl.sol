// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

contract IncomingPacketManagerImpl is IncomingPacketManager {

    event PacketArrived(PacketLibrary.InPacket packet);
    event Voted(bytes32 packetHash, address voter);
    event AlreadyVoted(bytes32 packetHash, address voter);

    // chainId => sequence => vote count
    // mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // chainId => sequence => attestor address => bool
    // mapping(uint256 => mapping(uint256 => mapping(address => bool))) private voted;

    mapping(uint256 => mapping(uint256 => bytes32)) public incomingPackets;

    // packetHash => vote count
    mapping(bytes32 => uint256) votes;
    // packetHash => attestor address => bool
    mapping(bytes32 => mapping(address => bool)) voted;

    function _getQuorumRequired() internal view virtual returns (uint256) {}

    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal override virtual {
        delete incomingPackets[_chainId][_sequence];
    }

    function getIncomingPacketHash(uint256 _chainId, uint256 _sequence) public view override virtual returns (bytes32 packetHash) {
        return incomingPackets[_chainId][_sequence];
    }

    function incomingPacketExists(uint256 _chainId, uint256 _sequence) public view override virtual returns (bool) {
        return incomingPackets[_chainId][_sequence] != bytes32(0);
    }

    function _receivePacket(PacketLibrary.InPacket memory packet) internal {
        _preValidateInPacket(packet);
        _updateInPacketState(packet);
    }
    
    function receivePacket(PacketLibrary.InPacket memory packet) public virtual {
        _receivePacket(packet);
    }

    function receivePacketBatch(PacketLibrary.InPacket[] memory packets) public virtual {
        for(uint256 i=0;i<packets.length;i++) {
            _receivePacket(packets[i]);
        }
    }

    // function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(PacketLibrary.InPacket memory packet) internal view {
        //if(incomingPacketExists(packet)) return;
        
        // require(self.chainId == packet.destination.chainId, "Packet not intended for this Chain");
        // require(isRegisteredTokenService(packet.destination.addr), "Unknown Token Service");
    }

    // function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
    //     if(action != 1) return; // 2 to represent consume operation, 1 to receive operation
    //     super._updateInPacketState(packet, action);
    //     if(hasVoted(packet, msg.sender)) {
    //         emit AlreadyVoted(packet, msg.sender);
    //         return;
    //     }
    //     emit Voted(packet, msg.sender);
    //     voted[packet.source.chainId][packet.sequence][msg.sender] = true;
    //     votes[packet.source.chainId][packet.sequence]+=1;
    //     if(hasQuorumReached(packet) && !incomingPacketExists(packet)) {
    //         _setIncomingPacket(packet);
    //     }
    // }

    function _updateInPacketState(PacketLibrary.InPacket memory packet) internal {
        
        if(incomingPacketExists(packet.sourceTokenService.chainId, packet.sequence)) return;
        
        bytes32 packetHash = _hash(packet);
        if(hasVoted(packetHash, msg.sender)) {
            emit AlreadyVoted(packetHash, msg.sender);
            return;
        }

        emit Voted(packetHash, msg.sender);

        voted[packetHash][msg.sender] = true;
        votes[packetHash] += 1;

        if(!hasQuorumReached(packetHash)) return;

        incomingPackets[packet.sourceTokenService.chainId][packet.sequence] = packetHash;
        emit PacketArrived(packet);
    }

    function hasQuorumReached(bytes32 packetHash) public view returns (bool) {
        return votes[packetHash] >= _getQuorumRequired();
    }

    function hasVoted(bytes32 packetHash, address voter) public view returns (bool) {
        return voted[packetHash][voter];
    }
}