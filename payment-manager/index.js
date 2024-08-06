const fastify = require('fastify')({ logger: true });
const jwt = require('fastify-jwt');
const { PaymentAccount, Transaction } = require('../account-manager/models');

// Connect to MongoDB
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/finance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected...');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});


// Register plugins
fastify.register(jwt, { secret: 'supersecret' });

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

  if (type === 'withdraw' && account.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

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

      await transaction.save({ session });

      account.balance -= amount;
      await account.save({ session });

      toAccount.balance += amount;
      await toAccount.save({ session });

      transaction.status = 'success';
      await transaction.save({ session });

    } else if (type === 'withdraw') {
      transaction = new Transaction({
        accountId,
        amount,
        type,
        status: 'pending'
      });

      await transaction.save({ session });

      account.balance -= amount;
      await account.save({ session });

      transaction.status = 'success';
      await transaction.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return transaction;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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
    await fastify.listen(3001);
    fastify.log.info(`Payment Manager service running on http://localhost:3001`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
