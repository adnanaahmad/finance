# Finance Management System

This project consists of two backend services that manage users' accounts and transactions. The services are containerized using Docker and can be run using Docker Compose.

## Services

### Account Manager

- **User**: Login with Username/Password
- **Payment Account**: One user can have multiple accounts like credit, debit, loan...
- **Payment History**: Records of transactions

### Payment Manager

- **Transaction**: Include basic information like amount, timestamp, toAddress, status...
- **Core Transaction Process**: Executed by `/send` or `/withdraw` API

## Features

- Users need to register/log in and then be able to call APIs.
- APIs for 2 operations send/withdraw. Account statements will be updated after the transaction is successful.
- APIs to retrieve all accounts and transactions per account of the user.

## Project Structure

```plaintext
finance/
├── account-manager/
│   ├── node_modules/
│   ├── index.js
│   ├── models.js
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── payment-manager/
│   ├── node_modules/
│   ├── index.js
│   ├── models.js
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
└── docker-compose.yml
```

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/adnanaahmad/finance.git
cd finance
```
### 2. Build and Run the Containers

```bash
docker-compose build
docker-compose up
```

### 3. Access the Services

Account Manager: http://localhost:3000
Payment Manager: http://localhost:3001

## API Endpoints

### Account Manager

- POST /register: Register a new user
- POST /login: User login
- POST /accounts: Create a new payment account for the user
- GET /accounts: Retrieve all accounts of the user
- GET /accounts/:accountId/transactions: Retrieve all transactions for a specific account

### Payment Manager

- POST /send: Send money from one account to another
- POST /withdraw: Withdraw money from an account