import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import express from 'express';
import { userModel } from "./db.js";
import jwt from 'jsonwebtoken';
import cors from "cors";
import bs58 from 'bs58'; 
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());
app.use(cors());
const connection = new Connection(process.env.RPC_URL);

app.post("/api/v1/signup", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        
        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                msg: 'User already exists'
            });
        }

        const keypair = new Keypair();
        const publicKey = keypair.publicKey.toString();
        const privateKey = bs58.encode(keypair.secretKey);

        await userModel.create({
            email,
            password,
            publicKey,
            privateKey
        });
        
        res.status(201).json({
            msg: 'Signup successful',
            publicKey
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Server error during signup'
        });
    }
});

app.post("/api/v1/signin", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await userModel.findOne({
            email,
            password,
        });

        if (user) {
            const token = jwt.sign({
                id: user._id,
                email: user.email,
                publicKey: user.publicKey
            }, process.env.JWT_SECRET || 'fallback_secret_key');

            return res.json({
                token,
                publicKey: user.publicKey
            });
        } else {
            return res.status(403).json({
                msg: "User not found or invalid credentials"
            });
        }
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            msg: 'Server error during signin'
        });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            console.log("No token provided");
            return res.status(401).json({ msg: 'Authentication required' });
        }
        
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
            if (err) {
                console.log("Token verification error:", err);
                return res.status(403).json({ msg: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ msg: 'Server error during authentication' });
    }
};

// Transaction signing endpoint
app.post("/api/v1/txn/sign", authenticateToken, async (req, res) => {
    try {
        if (!req.body.message || typeof req.body.message !== 'object') {
            return res.status(400).json({ error: "Invalid transaction data format" });
        }
        
        // Get user from database
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Get user's keypair from database
        const userPrivateKey = user.privateKey;
        
        if (!userPrivateKey) {
            return res.status(400).json({ error: "User doesn't have a private key" });
        }
        
        const { to, amount } = req.body.message;
        
        if (!to || !amount) {
            return res.status(400).json({ error: "Missing 'to' address or 'amount'" });
        }
        
        try {
            const decodedKey = bs58.decode(userPrivateKey);
            const keypair = Keypair.fromSecretKey(decodedKey);
            
            // Parse recipient address
            const toPublicKey = new PublicKey(to);
            
            // Create transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: toPublicKey,
                    lamports: amount
                })
            );
            
            // Get recent blockhash and add to transaction
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = keypair.publicKey;
            
            // Sign transaction
            transaction.sign(keypair);
            
            // Send transaction
            const signature = await connection.sendTransaction(transaction, [keypair]);
            console.log("Transaction signature:", signature);
            
            return res.json({
                signature,
                success: true
            });
        } catch (err) {
            console.error("Error processing transaction:", err);
            return res.status(500).json({
                error: "Transaction processing error",
                details: err.message
            });
        }
    } catch (error) {
        console.error('Transaction error details:', error);
        return res.status(500).json({
            error: error.message || 'Unknown server error'
        });
    }
});

app.get("/api/v1/balance/:address", async (req, res) => {
    try {
        const address = req.params.address;
        const publicKey = new PublicKey(address);
        const balance = await connection.getBalance(publicKey);
        
        res.json({
            address,
            balance: balance / (10 ** 9),
            lamports: balance
        });
    } catch (error) {
        console.error('Balance lookup error:', error);
        res.status(500).json({
            msg: 'Failed to get balance',
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});