const mongoose = require('mongoose');

// User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Payment Account Model
const paymentAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountType: { type: String, enum: ['credit', 'debit', 'loan'], required: true },
  balance: { type: Number, default: 0 },
});

const PaymentAccount = mongoose.model('PaymentAccount', paymentAccountSchema);

// Transaction Model
const transactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAccount', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['send', 'withdraw'], required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'pending' },
  toAddress: { type: mongoose.Schema.Types.ObjectId, required: false },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  User,
  PaymentAccount,
  Transaction,
}; 