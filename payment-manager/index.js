const fastify = require('fastify')({ logger: true });
const jwt = require('fastify-jwt');
const mongoose = require('mongoose');
const { PaymentAccount, Transaction } = require('./models');

// Connect to MongoDB
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected...');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});


// Register plugins
fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Middleware to protect routes
fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Core transaction process function
async function processTransaction(type, accountId, amount, toAddress = null) {
  const account = await PaymentAccount.findById(accountId);

  if (!account) {
    throw new Error('Account not found');
  }

  if (account.balance < amount) {
    throw new Error('Insufficient balance');
  }

  try {
    let transaction;

    if (type === 'send') {
      const toAccount = await PaymentAccount.findOne({ _id: toAddress });

      if (!toAccount) {
        throw new Error('Recipient account not found');
      }

      transaction = new Transaction({
        accountId,
        amount,
        type,
        toAddress,
        status: 'pending'
      });

      await transaction.save();

      account.balance -= amount;
      await account.save();

      toAccount.balance += amount;
      await toAccount.save();

      transaction.status = 'success';
      await transaction.save();

    } else if (type === 'withdraw') {
      transaction = new Transaction({
        accountId,
        amount,
        type,
        status: 'pending'
      });

      await transaction.save();

      account.balance -= amount;
      await account.save();

      transaction.status = 'success';
      await transaction.save();
    }

    return transaction;
  } catch (err) {
    throw err;
  }
}

// API for sending money
fastify.post('/send', async (request, reply) => {
  const { accountId, amount, toAddress } = request.body;

  try {
    const transaction = await processTransaction('send', accountId, amount, toAddress);
    reply.send(transaction);
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
});

// API for withdrawing money
fastify.post('/withdraw', async (request, reply) => {
  const { accountId, amount } = request.body;

  try {
    const transaction = await processTransaction('withdraw', accountId, amount);
    reply.send(transaction);
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
});

// Run the server
const start = async () => {
  try {
    await fastify.listen(3001, '0.0.0.0');
    fastify.log.info(`Payment Manager service running on http://localhost:3001`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
