package aleo

import (
	"context"
	"fmt"
	"math/rand"
	"strconv"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

const (
	ALEO              = "aleo"
	DefaultRetryCount = 1
)

type Sender struct {
	mu         sync.RWMutex
	W          common.Wallet
	Src        string
	Dst        string
	Client     *Client
	RetryQueue map[uint64]*chain.QueuedMessage // include err also
	SentPackets []string 
}

func (s *Sender) Send(ctx context.Context, msg []*chain.QueuedMessage) error {
	for _, m := range msg {
		randomNumber := rand.Intn(10)
		if randomNumber%3 == 0 {
			time.Sleep(5 * time.Second)
			m.RetryCount++
			if m.RetryCount < DefaultRetryCount {
				if _, ok := s.RetryQueue[m.DepartureBlock]; !ok {
					s.RetryQueue[m.DepartureBlock] = m
				}
			} else {
				depBlock := strconv.Itoa(int(m.DepartureBlock))
				fmt.Println("putting the block in the db")
				packet, _ := store.GetRetryPacket(ALEO, depBlock)
				if packet != nil {
					return nil
				}
				err := store.StoreRetryPacket(ALEO, depBlock, m)
				if err != nil {
					return err
				}
				delete(s.RetryQueue, m.DepartureBlock)
			}
			fmt.Println("couldnot send ", m.DepartureBlock, m.RetryCount)

		} else {
			fmt.Println("deleting sent blocks from retry")
			store.DeleteRetryPacket(ALEO, strconv.Itoa(int(m.DepartureBlock)))
			delete(s.RetryQueue, m.DepartureBlock)
			fmt.Println("message sent", m.DepartureBlock, "retry count", m.RetryCount)
			time.Sleep(5 * time.Second)
			s.SentPackets = append(s.SentPackets, strconv.Itoa(int(m.DepartureBlock)))
		}
	}

	return nil
}

func (s *Sender) GetRetryingBlocks() map[uint64]*chain.QueuedMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.RetryQueue
}

func (s *Sender) GetRetryingBlocksFromDB() ([]*chain.QueuedMessage, error) {
	retryingBlocks, err := store.GetAllRetryPackets(ALEO)
	if err != nil {
		return nil, err
	}
	return retryingBlocks, nil 
}

func (s *Sender) GetRetryBlockFromDBByKey(key string) *chain.QueuedMessage{
	msg, err := store.GetRetryPacket(ALEO, key)
	if err != nil {
		return nil 
	}
	return msg
}


func NewSender(src, dst, url string, wallet common.Wallet) chain.ISender {
	return &Sender{RetryQueue: map[uint64]*chain.QueuedMessage{}, SentPackets: []string{}}
}
