import { useState, useEffect } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import axios from 'axios';
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState(0.1);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState('');
  const [view, setView] = useState('login'); // login, signup, dashboard

  const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/OmpV8pByLQt4GL68rAeSLc9iKtIgy7ly');

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('token');
    const savedPublicKey = localStorage.getItem('publicKey');
    
    if (savedToken && savedPublicKey) {
      setToken(savedToken);
      setPublicKey(savedPublicKey);
      setIsLoggedIn(true);
      fetchBalance(savedPublicKey);
    }
  }, []);

  const fetchBalance = async (address) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/balance/${address}`);
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Unable to fetch wallet balance');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/v1/signup', { email, password });
      setSuccessMessage('Account created successfully! Please log in.');
      setView('login');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.msg || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/v1/signin', { email, password });
      const { token, publicKey } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('publicKey', publicKey);
      
      setToken(token);
      setPublicKey(publicKey);
      setIsLoggedIn(true);
      fetchBalance(publicKey);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('publicKey');
    setToken('');
    setPublicKey('');
    setIsLoggedIn(false);
    setView('login');
  };

  const sendSol = async (e) => {
    e.preventDefault();
    if (!recipientAddress || !amount || amount <= 0) {
      setError('Please enter a valid recipient address and amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate recipient address
      const toPublicKey = new PublicKey(recipientAddress);
      const fromPublicKey = new PublicKey(publicKey);
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL
        })
      );

      transaction.recentBlockhash = ((await connection.getLatestBlockhash()).blockhash);
      transaction.feePayer = fromPublicKey;

      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });
      
      const bs64Txn = Buffer.from(serializedTransaction).toString('base64');

      // Send to backend for signing
      const response = await axios.post("http://localhost:3000/api/v1/txn/sign", 
        { message: bs64Txn },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.signature) {
        setSuccessMessage(`Transaction successful! Signature: ${response.data.signature}`);
        // Refresh balance after transaction
        fetchBalance(publicKey);
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.response?.data?.msg || 'Failed to send SOL. Please check the recipient address and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render login form
  const renderLogin = () => (
    <div className="auth-container">
      <h2>Login to Your Wallet</h2>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn primary">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account?{' '}
        <button onClick={() => setView('signup')} className="link-button">
          Sign up
        </button>
      </p>
    </div>
  );

  // Render signup form
  const renderSignup = () => (
    <div className="auth-container">
      <h2>Create a Wallet</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn primary">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <button onClick={() => setView('login')} className="link-button">
          Log in
        </button>
      </p>
    </div>
  );

  // Render wallet dashboard
  const renderDashboard = () => (
    <div className="dashboard-container">
      <h2>Your Solana Wallet</h2>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      
      <div className="wallet-info">
        <div className="info-card">
          <h3>Your Public Key</h3>
          <p className="address">{publicKey}</p>
        </div>
        
        <div className="info-card">
          <h3>Balance</h3>
          <p className="balance">{balance} SOL</p>
          <button onClick={() => fetchBalance(publicKey)} className="btn secondary">
            Refresh Balance
          </button>
        </div>
      </div>
      
      <div className="transaction-form">
        <h3>Send SOL</h3>
        <form onSubmit={sendSol}>
          <div className="form-group">
            <label>Recipient Address:</label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter recipient's Solana address"
              required
            />
          </div>
          <div className="form-group">
            <label>Amount (SOL):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0.001"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn primary">
            {loading ? 'Processing...' : 'Send SOL'}
          </button>
        </form>
      </div>
      
      <button onClick={handleLogout} className="btn logout">
        Logout
      </button>
    </div>
  );

  return (
    <div className="app-container">
      <header>
        <h1>Cloud Wallet</h1>
      </header>
      <main>
        {isLoggedIn ? renderDashboard() : view === 'login' ? renderLogin() : renderSignup()}
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} Cloud Wallet - Powered by Solana</p>
      </footer>
    </div>
  );
};

export default App;
