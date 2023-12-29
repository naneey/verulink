package ethereum

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"io"
	"math/big"
	"os"
	"testing"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	abi "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum/abi"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

func TestGeneratePacket(t *testing.T) {
	cfg := &relay.ChainConfig{
		ChainID:        1,
		NodeUrl:        "https://rpc.sepolia.org",
		BridgeContract: "0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/eth_wallet.json",
	}
	client := NewClient(cfg)

	fmt.Println(client.CurHeight(context.Background()))
	if true {
		return
	}

	newTransactOpts := func() (*ethBind.TransactOpts, error) {
		txo, err := ethBind.NewKeyedTransactorWithChainID(getPrivateKey(), big.NewInt(11155111))
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultReadTimeout)
		defer cancel()
		txo.GasPrice, _ = client.(*Client).eth.SuggestGasPrice(ctx)
		txo.GasLimit = uint64(defaultGasLimit)
		return txo, nil
	}

	txOpts, err := newTransactOpts()
	assert.Nil(t, err)

	txOpts.Context = context.Background()
	txOpts.GasLimit = defaultGasLimit

	txOpts.GasPrice = big.NewInt(defaultGasPrice)
	packet := abi.PacketLibraryOutPacket{
		Version:            big.NewInt(1),
		Sequence:           big.NewInt(1),
		SourceTokenService: abi.PacketLibraryInNetworkAddress{big.NewInt(1), common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0")},
		DestTokenService:   abi.PacketLibraryOutNetworkAddress{big.NewInt(2), "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn"},
		Message:            abi.PacketLibraryOutTokenMessage{SenderAddress: common.HexToAddress("0x35C46e00E2D17952911c4554e52dB707dD7cBf82"), DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn", Amount: big.NewInt(1000), ReceiverAddress: "aleo12g9x7pw9prsvqr9psv6psw06zam4dtwtrjepjnu6nsjd4pq9rugs3x8q46"},
		Height:             big.NewInt(10000),
	}
	tx, err := client.(*Client).bridge.SendMessage(txOpts, packet)
	assert.Nil(t, err)
	fmt.Println(tx.Hash())
}

func getPrivateKey() *ecdsa.PrivateKey {
	file := "/home/sheldor/.ethereum/keystore/UTC--2023-12-15T03-08-12.397638003Z--be4c833bc5b484637e22b11c854c1ce89a28000b"
	jsonFile, err := os.Open(file)
	if err != nil {
		return nil
	}
	byteVal, _ := io.ReadAll(jsonFile)
	fmt.Println(string(byteVal))
	ks, err := keystore.DecryptKey(byteVal, "hello")

	fmt.Println(ks.PrivateKey)

	return ks.PrivateKey

}

func TestGetPacket(t *testing.T) {
	cfg := &relay.ChainConfig{
		ChainID:        1,
		NodeUrl:        "https://rpc.sepolia.org",
		BridgeContract: "0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/eth_wallet.json",
	}
	client := NewClient(cfg)

	ethpacket, err := client.(*Client).bridge.OutgoingPackets(&ethBind.CallOpts{Context: context.Background()}, big.NewInt(2), big.NewInt(2))
	assert.Nil(t, err)
	fmt.Println(ethpacket)
}
