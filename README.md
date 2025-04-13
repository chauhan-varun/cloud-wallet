# Cloud Wallet

A Solana-based web wallet application that allows users to create accounts, check balances, and send SOL tokens.

## Features

- User authentication (signup/login)
- Wallet creation using Solana keypairs
- Balance checking
- Send SOL to other wallet addresses
- Transaction history and status

## Project Structure

- **Backend**: Node.js Express server with MongoDB integration
  - User authentication and management
  - Solana transaction signing and sending
  - RESTful API endpoints

- **Frontend**: React application
  - User-friendly interface for wallet management
  - Authentication forms
  - Transaction creation

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB
- Solana CLI tools (optional)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/cloudwallet
   JWT_SECRET=your_secret_key
   PRIVATE_KEY=your_solana_private_key_in_bs58_format
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

- **POST /api/v1/signup**: Create a new user account
- **POST /api/v1/signin**: Authenticate and get JWT token
- **POST /api/v1/txn/sign**: Sign and broadcast a Solana transaction
- **GET /api/v1/balance/:address**: Get SOL balance for an address

## Technology Stack

- Backend: Express.js, MongoDB, Mongoose, @solana/web3.js
- Frontend: React, Vite, Axios
- Authentication: JWT
- Blockchain: Solana

## Development Notes

- All Solana transactions are currently sent to the Devnet network
- For production use, implement proper security measures for private key storage
- Add more comprehensive error handling and input validation

## License

ISC License
