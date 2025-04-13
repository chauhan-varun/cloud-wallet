import { Connection, Keypair, Transaction } from '@solana/web3.js';
import express from 'express';
// import { userModel } from "./db";
import jwt from 'jsonwebtoken'
import cors from "cors"
import bs58 from 'bs58'; 
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());
app.use(cors());
const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/OmpV8pByLQt4GL68rAeSLc9iKtIgy7ly");

// app.post("/api/v1/signup",async (req, res)=>{
//     // check if user exists or not 
//     const email = req.body.email;
//     const password = req.body.password;
//     const keypair = new Keypair();
//     const publicKey =  keypair.publicKey.toString();
//     const privateKey = keypair.secretKey.toString();

//     await userModel.create({
//         email,
//         password,
//         publicKey,
//         privateKey
//     })
//     res.json({
//         msg: 'signup successfull'
//     })
// })

// app.post("/api/v1/signin",async (req, res)=>{

//     const email = req.body.email;
//     const password = req.body.password;


//     const user = await userModel.findOne({
//         email,
//         password,
//     })

//     if(user) {
//         const token = jwt.sign({
//             id: user
//         }, process.env.JWT_SECRET)

//         res.json({
//             token
//         })
//     } else {
//         res.status(403).json({
//             msg: "user not found"
//         })
//     }
//     res.json({
//         msg: 'signup successfull'
//     })
//     res.json({
//         msg: 'signin'
//     })
// })


app.post("/api/v1/txn/sign",async (req, res)=>{
    const bufferTransaction = Buffer.from(req.body.message, 'base64')
    const transaction = Transaction.from(bufferTransaction);

    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    
    transaction.recentBlockhash = ((await connection.getLatestBlockhash()).blockhash);
    transaction.feePayer = keypair.publicKey;
    transaction.sign(keypair);

    const signature = await connection.sendTransaction(transaction, [keypair]);
    console.log(signature);
    
    res.json({
        signature
    })
})
app.post("/api/v1/txn", (req, res)=>{
    res.json({
        msg: 'signup'
    })
})

app.listen(3000, ()=>{
    console.log('server is running on port 3000');
    
})