package store

import (
	"sync"

	"go.etcd.io/bbolt"
)

var (
	db *bbolt.DB
	mu sync.RWMutex
)

func initDB(path string) error {
	var err error
	mu = sync.RWMutex{}
	db, err = bbolt.Open(path, 0655, nil)
	if err != nil {
		return err
	}
	return nil
}

func closeDB() error {
	err := db.Close()
	if err != nil {
		return err
	}
	return nil
}

func put(bucket string, key, value []byte) error {
	return db.Update(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Put(key, value)
	})
}

func batchPut(bucket string, key, value []byte) error {
	return db.Batch(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Put(key, value)
	})
}

func get(bucket string, key []byte) (value []byte) {
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		data := bkt.Get(key)
		value = make([]byte, len(data))
		copy(value, data)
		return nil
	})

	return
}

func retrieveNKeyValuesAfterPrefix(bucket string, n int, prefix string) [][2][]byte {
	count := 0
	s := make([][2][]byte, 0)
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		c := bkt.Cursor()
		for key, value := c.Seek([]byte(prefix)); count != n && key != nil; key, value = c.Next() {
			k := make([]byte, len(key))
			v := make([]byte, len(value))
			copy(k, key)
			copy(v, value)
			a := [2][]byte{k, v}
			s = append(s, a)
			count++
		}
		return nil
	})
	return s
}

// This function will return channel and populate minimum of n and total keys number of packets
func retrieveNKeyValuesFromFirst(bucket string, n int) <-chan [2][]byte {
	ch := make(chan [2][]byte, n)
	go func() {
		count := 0
		db.View(func(tx *bbolt.Tx) error {
			bkt := tx.Bucket([]byte(bucket))
			c := bkt.Cursor()
			for key, value := c.First(); count != n && key != nil; key, value = c.Next() {
				k := make([]byte, len(key))
				v := make([]byte, len(value))
				copy(k, key)
				copy(v, value)
				ch <- [2][]byte{k, v}
				count++
			}
			return nil
		})
		close(ch)
	}()

	return ch
}
