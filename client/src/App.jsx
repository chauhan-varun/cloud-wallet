import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import axios from 'axios'
const App = () => {
  const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/OmpV8pByLQt4GL68rAeSLc9iKtIgy7ly');
  const fromPubkey =  new PublicKey("G6WVXCkT7xatjdAwqFAbFRmheVsQ5SEatX1Ew2ZDBZrU");
  const sendSol = async () => {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey("Ft5j2u8hRRcdWQj4RL4zH3cvwa6rKgHoAQTpjfvwPCFD"),
        lamports: 0.1 * LAMPORTS_PER_SOL
        
      })
    )

    transaction.recentBlockhash = ((await connection.getLatestBlockhash()).blockhash);
    transaction.feePayer = fromPubkey;

    const signature = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    })
    const bs64Txn = Buffer.from(signature).toString('base64');

    console.log(bs64Txn);
    await axios.post("http://localhost:3000/api/v1/txn/sign", {
      message: bs64Txn,
      retry: false
    })
    
  }
  return (
   <button onClick={sendSol}>Send Sol</button>

  )
}

export default App
