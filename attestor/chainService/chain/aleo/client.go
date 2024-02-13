package aleo

import (
	"context"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	aleoRpc "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"
	"go.uber.org/zap"
)

const (
	defaultWaitDur             = time.Hour * 24
	outPacket                  = "out_packets"
	aleo                       = "aleo"
	defaultRetryPacketWaitDur  = time.Hour * 12
	defaultPruneBaseSeqWaitDur = time.Hour * 6
)

// Namespaces
const (
	baseSeqNumNameSpacePrefix  = "aleo_bsns"
	retryPacketNamespacePrefix = "aleo_rpns"
)

var (
	baseSeqNamespaces     []string
	retryPacketNamespaces []string
)

type Client struct {
	aleoClient          aleoRpc.IAleoRPC
	name                string
	programID           string
	queryUrl            string
	network             string
	chainID             *big.Int
	waitDur             time.Duration
	destChains          map[string]uint64 // keeps record of sequence number of all dest chains
	retryPacketWaitDur  time.Duration
	pruneBaseSeqWaitDur time.Duration
}

type aleoPacket struct {
	version     string
	source      aleoPacketNetworkAddress
	sequence    string
	destination aleoPacketNetworkAddress
	message     aleoMessage
	height      string
}

type aleoPacketNetworkAddress struct {
	chainID string
	address string
}

type aleoMessage struct {
	token    string
	receiver string
	amount   string
	sender   string
}

func (cl *Client) getPktWithSeq(ctx context.Context, dst *big.Int, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, outPacket, mappingKey)
	if err != nil {
		return nil, err
	}

	pktStr, err := parseMessage(message[mappingKey])
	if err != nil {
		return nil, err
	}
	return parseAleoPacket(pktStr)
}

func (cl *Client) CurHeight(ctx context.Context) uint64 {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0
	}
	return uint64(height)
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetChainID() *big.Int {
	return cl.chainID
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {

	go cl.managePacket(ctx)
	go cl.pruneBaseSeqNum(ctx, ch)
	go cl.retryFeed(ctx, ch)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		wg := sync.WaitGroup{}
		wg.Add(len(cl.destChains))
		for dst := range cl.destChains {
			dst := dst
			dstBig := new(big.Int)
			dstBig, ok := dstBig.SetString(dst, 10)
			if !ok {
				panic("could not parse chainID")
			}
			go func() {
				defer wg.Done()
				pkt, err := cl.getPktWithSeq(ctx, dstBig, cl.destChains[dst])
				if err != nil {
					// log error
					return
				}
				// todo verify pkt creation time
				ch <- pkt
				cl.destChains[dst]++
			}()
		}
		wg.Wait()
	}
}

func (cl *Client) pruneBaseSeqNum(ctx context.Context, ch chan<- *chain.Packet) {
	// also fill gap and put in retry feed
	ticker := time.NewTicker(cl.pruneBaseSeqWaitDur)
	index := 0
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		if index == len(baseSeqNamespaces) {
			index = 0
		}
		logger.GetLogger().Info("pruning base sequence number", zap.String("namespace", baseSeqNamespaces[index]))

		var (
			startSeqNum, endSeqNum uint64
			seqHeightRanges        [2][2]uint64
			shouldFetch            bool
		)
		ns := baseSeqNamespaces[index]
		chainIdStr := strings.Replace(ns, baseSeqNumNameSpacePrefix, "", 1)
		chainID := new(big.Int)
		chainID, ok := chainID.SetString(chainIdStr, 10)
		if !ok {
			logger.GetLogger().Error("Error while parsing uint")
			goto indIncr
		}
		seqHeightRanges, shouldFetch = store.PruneBaseSeqNum(ns)
		if !shouldFetch {
			goto indIncr
		}

		startSeqNum, endSeqNum = seqHeightRanges[0][0], seqHeightRanges[0][1]
		for i := startSeqNum; i < endSeqNum; i++ {
			pkt, err := cl.getPktWithSeq(ctx, chainID, i)
			if err != nil {
				// log/handle error
				continue
			}
			ch <- pkt
		}
	indIncr:
		index++
	}
}

func (cl *Client) retryFeed(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(cl.retryPacketWaitDur) // todo: define in config
	index := 0
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		if index == len(retryPacketNamespaces) {
			index = 0
		}
		logger.GetLogger().Info("retrying aleo feeds", zap.String("namespace", retryPacketNamespaces[index]))

		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this is the most efficient approach.
		pkts, err := store.RetrieveAndDeleteNPackets(retryPacketNamespaces[index], 10)
		if err != nil {
			//log error
			goto indIncr
		}
		for _, pkt := range pkts {
			ch <- pkt
		}

	indIncr:
		index++
	}
}

func (cl *Client) managePacket(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			logger.GetLogger().Info("Adding packet to retry namespace", zap.Any("packet", pkt))
			ns := retryPacketNamespacePrefix + pkt.Destination.ChainID.String()
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		case pkt := <-completedCh:
			ns := baseSeqNumNameSpacePrefix + pkt.Destination.ChainID.String()
			logger.GetLogger().Info("Updating base seq num",
				zap.String("namespace", ns),
				zap.String("source_chain_id", pkt.Source.ChainID.String()),
				zap.String("dest_chain_id", pkt.Destination.ChainID.String()),
				zap.Uint64("pkt_seq_num", pkt.Sequence),
			)
			err := store.StoreBaseSeqNum(ns, pkt.Sequence, 0)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		}
	}
}

func (cl *Client) GetMissedPacket(
	ctx context.Context, missedPkt *chain.MissedPacket) (
	*chain.Packet, error) {

	pkt, err := cl.getPktWithSeq(ctx, missedPkt.TargetChainID, missedPkt.SeqNum)
	if err != nil {
		return nil, err
	}
	return pkt, nil
}

func (cl *Client) IsConsumed(ctx context.Context, srcChainID *big.Int, seqNum uint64) bool {
	key := constructOutMappingKey(srcChainID, seqNum) // the in_packet_consumed mapping is same as out packet mapping key
	isConsumed, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, "in_packet_consumed", key)
	if err != nil {
		return false 
	}
	if isConsumed[key] == "null" {
		return false
	} else if isConsumed[key] == "true" {
		return true
	}
	return false
}

func NewClient(cfg *config.ChainConfig, m map[string]*big.Int) chain.IClient {

	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		panic("failed to create aleoclient")
	}

	destChainsSeqMap := make(map[string]uint64, 0)
	for k, v := range cfg.StartSeqNum {
		destChainsSeqMap[k] = v
	}

	var namespaces []string
	for _, destChainId := range cfg.DestChains {
		rns := retryPacketNamespacePrefix + destChainId
		bns := baseSeqNumNameSpacePrefix + destChainId
		namespaces = append(namespaces, rns, bns)

		retryPacketNamespaces = append(retryPacketNamespaces, rns)
		baseSeqNamespaces = append(baseSeqNamespaces, bns)

		if _, ok := destChainsSeqMap[destChainId]; !ok {
			destChainsSeqMap[destChainId] = 1 // By default start from 1
		}
	}

	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(err)
	}

	name := cfg.Name
	if name == "" {
		name = aleo
	}

	waitDur := cfg.WaitDuration
	if waitDur == 0 {
		waitDur = defaultWaitDur
	}

	retryPacketWaitDur := cfg.RetryPacketWaitDur
	if retryPacketWaitDur == 0 {
		retryPacketWaitDur = defaultRetryPacketWaitDur
	}

	pruneBaseSeqWaitDur := cfg.PruneBaseSeqNumberWaitDur
	if pruneBaseSeqWaitDur == 0 {
		pruneBaseSeqWaitDur = defaultPruneBaseSeqWaitDur
	}

	return &Client{
		queryUrl:            urlSlice[0],
		network:             urlSlice[1],
		aleoClient:          aleoClient,
		waitDur:             waitDur,
		chainID:             cfg.ChainID,
		programID:           cfg.BridgeContract,
		name:                name,
		destChains:          cfg.StartSeqNum,
		retryPacketWaitDur:  retryPacketWaitDur,
		pruneBaseSeqWaitDur: pruneBaseSeqWaitDur,
	}
}
