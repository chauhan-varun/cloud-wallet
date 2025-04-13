import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
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
const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/OmpV8pByLQt4GL68rAeSLc9iKtIgy7ly");

app.post("/api/v1/signup", async (req, res) => {
    try {
        // check if user exists or not 
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
        console.error('Signup error:', error);
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ msg: 'Authentication required' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
        if (err) return res.status(403).json({ msg: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

app.post("/api/v1/txn/sign", authenticateToken, async (req, res) => {
    try {
        const bufferTransaction = Buffer.from(req.body.message, 'base64');
        const transaction = Transaction.from(bufferTransaction);

        const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || "4KgdLv9TLFyxjC1petDbvJoVZ8VcDQxpZYu4VcYQRWVkWsKVww2xGwKpALpZwmm1U1M3Z9Eq1UQYLpA1ETdm4nBs"));
        
        transaction.recentBlockhash = ((await connection.getLatestBlockhash()).blockhash);
        transaction.feePayer = keypair.publicKey;
        transaction.sign(keypair);

        const signature = await connection.sendTransaction(transaction, [keypair]);
        console.log("Transaction signature:", signature);
        
        res.json({
            signature,
            success: true
        });
    } catch (error) {
        console.error('Transaction signing error:', error);
        res.status(500).json({
            msg: 'Failed to sign and send transaction',
            error: error.message
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

app.post("/api/v1/txn", (req, res)=>{
    res.json({
        msg: 'txn'
    })
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});