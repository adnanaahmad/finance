const fastify = require('fastify')({ logger: true });
const bcrypt = require('fastify-bcrypt');
const jwt = require('fastify-jwt');
const mongoose = require('mongoose');
const { User, PaymentAccount, Transaction } = require('./models');

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
fastify.register(bcrypt, { saltWorkFactor: 12 });

// User Registration
fastify.post('/register', async (request, reply) => {
  const { username, password } = request.body;
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  const hashedPassword = await fastify.bcrypt.hash(password);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  reply.send({ message: 'User registered successfully' });
});

// User Login
fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body;
  const user = await User.findOne({ username });

  if (!user || !(await fastify.bcrypt.compare(password, user.password))) {
    return reply.code(401).send({ error: 'Invalid username or password' });
  }

  const token = fastify.jwt.sign({ username });
  reply.send({ token });
});

// Middleware to protect routes
fastify.addHook('onRequest', async (request, reply) => {
  if (request.routerPath !== '/login' && request.routerPath !== '/register') {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
});

// API to create a payment account
fastify.post('/accounts', async (request, reply) => {
    const username = request.user.username;
    const { accountType } = request.body;
    let { balance } = request.body;
    balance = balance || 0;
    
    const user = await User.findOne({ username });
  
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
  
    const existingAccount = await PaymentAccount.findOne({ userId: user._id, accountType });
    if (existingAccount) {
      return reply.code(400).send({ error: 'Account already exists' });
    }
  
    const newAccount = new PaymentAccount({
      userId: user._id,
      accountType,
      balance
    });
  
    await newAccount.save();
    reply.send({ message: 'Payment account created successfully', account: newAccount });
});

// API to retrieve all accounts of a user
fastify.get('/accounts', async (request, reply) => {
  const username = request.user.username;
  const user = await User.findOne({ username });

  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const accounts = await PaymentAccount.find({ userId: user._id });
  reply.send(accounts);
});

// API to retrieve all transactions of an account
fastify.get('/accounts/:accountId/transactions', async (request, reply) => {
  const { accountId } = request.params;
  const transactions = await Transaction.find({ $or: [{ accountId }, { toAddress: accountId }] });
  reply.send(transactions);
});

// Run the server
const start = async () => {
  try {
    await fastify.listen(3000, '0.0.0.0');
    fastify.log.info(`Account Manager service running on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
