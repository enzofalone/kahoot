package handler

// import (
// 	"context"
// 	"fmt"

// 	"github.com/enzofalone/kahoot/internal/repo"
// )

// const (
// 	MAX_QUESTIONS = 30
// )

// type BankHandler struct {
// 	logf func(f string, v ...interface{})
// 	db   *repo.Database
// }

// func NewBankHandler(logf func(f string, v ...interface{}), db *repo.Database) *BankHandler {
// 	return &BankHandler{
// 		logf: logf,
// 		db:   db,
// 	}
// }

// func (b *BankHandler) CreateBank(ctx context.Context, bankName string) error {
// 	if len(bankName) == 0 {
// 		return fmt.Errorf("invalid bank name")
// 	}

// 	if _, err := b.db.Exec(ctx, bankName); err != nil {
// 		return err
// 	}
// 	return nil
// }

// func (b *BankHandler) GetBankList(ctx context.Context, page int, limit int) {
// 	banks, err := b.db.Query(ctx, `SELECT * FROM bank`)
// }

// func (b *BankHandler) GetBank(ctx context.Context, bankName string) {

// }

// func (b *BankHandler) AddQuestion(ctx context.Context, bankName string, title string, questionBank []string) {

// }

// func (b *BankHandler) MoveQuestion(ctx context.Context, bankName string, title string, newPos int) {

// }
