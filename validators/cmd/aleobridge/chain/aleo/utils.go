package aleo

import (
	"fmt"
	"math/big"
	"os/exec"
	"strconv"
	"strings"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

// after splitting we get the message in the form [key1:value1,key2:value2, ...]
// now we get message in the form []string{key1, value1, key2, value2, ...}
func parseMessage(s string) *aleoPacket {
	sMessages := strings.Split(trim(s), ",")
	var messages []string

	for i := 0; i < len(sMessages); i++ {
		msg := sMessages[i]
		msplit := strings.Split(msg, ":")
		messages = append(messages, msplit...)
	}

	pkt := new(aleoPacket)

	for m, v := range messages {
		switch v {
		case "version":
			pkt.version = messages[m+1]
		case "sequence":
			pkt.sequence = messages[m+1]
		case "source":
			pkt.source.chain_id = messages[m+2]
			pkt.source.address = messages[m+4]
		case "destination":
			serviceProgram := ""
			pkt.destination.chain_id = messages[m+2]
			for i := m + 4; true; i++ {
				if messages[i] == "message" {
					break
				}
				serviceProgram += messages[i] + " "
			}
			pkt.destination.address = serviceProgram
		case "message":
			denom := ""
			i := 0
			for i = m + 2; true; i++ {
				if messages[i] == "sender" {
					break
				}
				denom += messages[i] + " "
			}
			pkt.message.token = denom
			sender := messages[i+1]
			pkt.message.sender = sender
			receiver := ""
			for i = i + 3; true; i++ {
				if messages[i] == "amount" {
					break
				}
				receiver += messages[i] + " "
			}
			pkt.message.receiver = receiver
			pkt.message.amount = messages[i+1]
		case "height":
			pkt.height = messages[m+1]
		}

	}
	return pkt
}

func trim(msg string) string {
	strReplacer := strings.NewReplacer("\\n", "", "{", "", "}", "", "[", "", "]", "", " ", "", "\"", "")
	return strReplacer.Replace(msg)
}

func parseAleoPacket(packet *aleoPacket) (*chain.Packet, error) {
	pkt := new(chain.Packet)
	version, err := strconv.ParseUint(strings.Replace(packet.version, "u8", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Version = version
	sequence, err := strconv.ParseUint(strings.Replace(packet.sequence, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Sequence = sequence

	sourceChainID, err := strconv.ParseUint(strings.Replace(packet.source.chain_id, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, &exec.Error{}
	}
	pkt.Source.ChainID = sourceChainID
	pkt.Source.Address = packet.source.address

	destChainID, err := strconv.ParseUint(strings.Replace(packet.destination.chain_id, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}

	pkt.Destination.ChainID = destChainID

	pkt.Destination.Address = parseAleoEthAddrToHexString(packet.destination.address)

	pkt.Message.DestTokenAddress = parseAleoEthAddrToHexString(packet.message.token)
	pkt.Message.SenderAddress = packet.message.sender
	pkt.Message.ReceiverAddress = parseAleoEthAddrToHexString(packet.message.receiver)

	amount := &big.Int{}
	pkt.Message.Amount, _ = amount.SetString(strings.Replace(packet.message.amount, "u64", "", 1), 0)

	height, err := strconv.ParseUint(strings.Replace(packet.height, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Height = height

	return pkt, nil
}

// formats packet for aleo bridge contract
// return: string :: example ::
// "{version: 0u8, sequence: 1u32, source: { chain_id: 1u32, addr: <source contract address in the form of len 32 long byte array in which eth address is represented by the last 20 bytes>}....}
func (c *Client) constructAleoPacket(msg *chain.Packet) string {
	return fmt.Sprintf(
		"{ version: %du8, sequence: %du32, "+
			"source: { chain_id: %du32, addr: %s }, "+
			"destination: { chain_id: %du32, addr: %s }, "+
			"message: { token: %s, sender: %s, receiver: %s, amount: %du64 }, "+
			"height: %du32 }",
		msg.Version, msg.Sequence, msg.Source.ChainID,
		constructEthAddressForAleoParameter(msg.Source.Address),
		msg.Destination.ChainID, msg.Destination.Address, msg.Message.DestTokenAddress,
		constructEthAddressForAleoParameter(msg.Message.SenderAddress),
		msg.Message.ReceiverAddress, msg.Message.Amount, msg.Height)
}

// constructs ethereum address in the format of 32 len byte array string, appending "u8" in every
// array element. The eth address is represented by the last 20 elements in the array and the
// first 12 fields are padded with "0u8"
func constructEthAddressForAleoParameter(serviceContract string) string {
	aleoAddress := "[ "
	serviceContractByte := []byte(serviceContract)
	lenDifference := 32 - len(serviceContractByte)
	for i := 0; i < lenDifference; i++ { // left pad the return by 0 if the len of byte array of address is smaller than 32
		aleoAddress += "0u8, "
	}

	appendString := "u8, "
	for i := lenDifference; i < 32; i++ {
		aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8, "
	}

	return aleoAddress[:len(appendString)-len("u8")] + "]"
}

// parses the eth addr in the form [ 0u8, 0u8, ..., 0u8] received from aleo to hex string
// example [0u8, ... * 32]: aleo[u8, 32] -> 0x0.....0 eth:string
func parseAleoEthAddrToHexString(addr string) string {
	addr = strings.ReplaceAll(addr, "u8", "")
	addr = strings.Trim(addr, " ")
	splittedAddress := strings.Split(addr, " ")

	var addrbt []byte

	for i := 12; i < len(splittedAddress)-1; i++ {
		bt, _ := strconv.ParseUint(splittedAddress[i], 0, 8)

		addrbt = append(addrbt, uint8(bt))
	}

	return ethCommon.Bytes2Hex(addrbt)

}
