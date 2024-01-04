package ethereum

import (
	"context"
	"math/big"
	"time"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"go.uber.org/zap/zapcore"

	abi "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum/abi"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type MockClient struct {
	name              string
	address           string
	eth               *ethclient.Client
	bridge            *abi.Bridge
	minRequiredGasFee uint64
	finalityHeight    uint64
	blockGenTime      time.Duration
	chainID           uint32
	chainCfg          *relay.ChainConfig
	wallet            common.Wallet
}

func giveOutPackets(destChainID, seqNumber *big.Int) (*abi.PacketLibraryOutPacket, error) {
	return &abi.PacketLibraryOutPacket{
		Version: ethCommon.Big0,
		DestTokenService: abi.PacketLibraryOutNetworkAddress{
			ChainId: destChainID,
			Addr:    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		SourceTokenService: abi.PacketLibraryInNetworkAddress{
			ChainId: ethCommon.Big1,
			Addr:    ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0"),
		},
		Sequence: seqNumber,
		Message: abi.PacketLibraryOutTokenMessage{
			SenderAddress: ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0"),
			DestTokenAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			Amount: big.NewInt(102),
			ReceiverAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Height: big.NewInt(110),
	}, nil
}

func (cl *MockClient) GetPktWithSeq(ctx context.Context, dstChainID uint32, seqNum uint64) (*chain.Packet, error) {
	destChainIDBig := &big.Int{}
	destChainIDBig.SetUint64(uint64(dstChainID))
	sequenceNumber := &big.Int{}
	sequenceNumber.SetUint64(seqNum)

	ethpacket, err := giveOutPackets(destChainIDBig, sequenceNumber)
	if err != nil {
		return nil, err
	}

	packet := &chain.Packet{
		Version: ethpacket.Version.Uint64(),
		Destination: chain.NetworkAddress{
			ChainID: ethpacket.DestTokenService.ChainId.Uint64(),
			Address: ethpacket.DestTokenService.Addr,
		},
		Source: chain.NetworkAddress{
			ChainID: ethpacket.SourceTokenService.ChainId.Uint64(),
			Address: string(ethpacket.SourceTokenService.Addr.Bytes()),
		},
		Sequence: ethpacket.Sequence.Uint64(),
		Message: chain.Message{
			DestTokenAddress: ethpacket.Message.DestTokenAddress,
			Amount:           ethpacket.Message.Amount,
			ReceiverAddress:  ethpacket.Message.ReceiverAddress,
			SenderAddress:    string(ethpacket.Message.SenderAddress.Bytes()),
		},
		Height: ethpacket.Height.Uint64(),
	}
	return packet, nil
}

func (cl *MockClient) attestMessage(opts *ethBind.TransactOpts, packet abi.PacketLibraryInPacket) (tx *ethTypes.Transaction, err error) {
	tx, err = cl.bridge.ReceivePacket(opts, packet)
	return
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *MockClient) SendPacket(ctx context.Context, m *chain.Packet) error {
	newTransactOpts := func() (*ethBind.TransactOpts, error) {
		txo, err := ethBind.NewKeyedTransactorWithChainID(cl.wallet.(*wallet).SKey(), big.NewInt(int64(cl.chainID)))
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultReadTimeout)
		defer cancel()
		txo.GasPrice, _ = cl.SuggestGasPrice(ctx)
		txo.GasLimit = uint64(defaultGasLimit)
		return txo, nil
	}

	txOpts, err := newTransactOpts()
	if err != nil {
		return err
	}

	_ctx, cancel := context.WithTimeout(ctx, defaultSendTxTimeout)
	defer cancel()

	txOpts.Context = _ctx
	txOpts.GasLimit = defaultGasLimit

	txOpts.GasPrice = big.NewInt(defaultGasPrice)
	// send transaction here
	packet := &abi.PacketLibraryInPacket{
		Version:  big.NewInt(int64(m.Version)),
		Sequence: big.NewInt(int64(m.Sequence)),
		SourceTokenService: abi.PacketLibraryOutNetworkAddress{
			ChainId: big.NewInt(2),
			Addr:    m.Source.Address,
		},
		DestTokenService: abi.PacketLibraryInNetworkAddress{
			ChainId: big.NewInt(1),
			Addr:    ethCommon.HexToAddress(m.Destination.Address),
		},
		Message: abi.PacketLibraryInTokenMessage{
			DestTokenAddress: ethCommon.HexToAddress(m.Message.DestTokenAddress),
			Amount:           m.Message.Amount,
			ReceiverAddress:  ethCommon.HexToAddress(m.Message.ReceiverAddress),
		},
		Height: big.NewInt(int64(m.Height)),
	}

	transacton, err := cl.attestMessage(txOpts, *packet)
	if err != nil {
		return err
	}
	logger.Logger.Info("packet sent to ethereum with hash :: hash :: ", zapcore.Field{String: transacton.Hash().String()})
	return nil
}

func (cl *MockClient) GetLatestHeight(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *MockClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *MockClient) CurHeight(ctx context.Context) uint64 {
	height, err := cl.eth.BlockNumber(ctx)
	if err != nil {
		return 0
	}
	return height
}

func (cl *MockClient) GetFinalityHeight() uint64 {
	return cl.finalityHeight
}

func (cl *MockClient) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *MockClient) GetDestChains() ([]string, error) {
	return []string{"aleo"}, nil
}

func (cl *MockClient) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *MockClient) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *MockClient) Name() string {
	return cl.name
}

func (cl *MockClient) GetSourceChain() (string, string) {
	return cl.name, cl.address
}

func (cl *MockClient) GetChainID() uint32 {
	return cl.chainID
}

func (cl *MockClient) SuggestGasPrice(ctx context.Context) (*big.Int, error) {
	return cl.eth.SuggestGasPrice(ctx)
}

func NewMockClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize eth client and panic if any error occurs.
		nextSeq should start from 1
	*/
	rpc, err := rpc.Dial(cfg.NodeUrl)
	if err != nil {
		panic("failed to create ethereum rpc client")
	}

	ethclient := ethclient.NewClient(rpc)
	contractAddress := ethCommon.HexToAddress(cfg.BridgeContract)
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient)
	if err != nil {
		panic("failed to create ethereum bridge client")
	}

	wallet, err := loadWalletConfig(cfg.WalletPath)
	if err != nil {
		panic("failed to load ethereum wallet")
	}
	name := cfg.Name
	finalizeHeight := cfg.FinalityHeight
	if name == "" {
		name = ethereum
	}
	if finalizeHeight == 0 {
		finalizeHeight = defaultFinalityHeight
	}
	// todo: handle start height from stored height if start height in the config is 0
	return &Client{
		name:           name,
		address:        cfg.BridgeContract,
		eth:            ethclient,
		bridge:         bridgeClient,
		finalityHeight: uint64(finalizeHeight),
		blockGenTime:   blockGenerationTime,
		chainID:        cfg.ChainID,
		chainCfg:       cfg,
		wallet:         wallet,
	}
}
