package ethereum

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func TestHash(t *testing.T) {
	packet := chain.Packet{
		Version:  uint8(1),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27",
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(1),
			Address: "0x2D9B1dF35e4fAc995377aD7f7a84070CD36400Ff",
		},
		Message: chain.Message{
			SenderAddress:    "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27",
			DestTokenAddress: "0xc9788ef51c8deB28F3F205b0B2F124F6884541A4",
			Amount:           big.NewInt(10),
			ReceiverAddress:  "0xBd31ba048373A07bE0357B7Ad3182F4206c8064d",
		},
		Height: uint64(100),
	}
	t.Run("happy path", func(t *testing.T) {
		h := hash(&chain.ScreenedPacket{Packet: &packet, IsWhite: true})
		assert.Equal(t, "0x01e80e351de9084e68e456b2f9fa18219ffc886f4bfc9e9ad629e5849263bb17", h)
	})
	t.Run("different hash", func(t *testing.T) {
		h := hash(&chain.ScreenedPacket{Packet: &packet, IsWhite: false})
		assert.NotEqual(t, "0x01e80e351de9084e68e456b2f9fa18219ffc886f4bfc9e9ad629e5849263bb17", h)
	})
	
}
