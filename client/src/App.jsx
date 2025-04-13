import { useState, useEffect } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
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

  useEffect(() => {
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/balance/${address}`);
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/signup`, { email, password });
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/signin`, { email, password });
      const { token, publicKey } = response.data;
      
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
      new PublicKey(recipientAddress);
      
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/txn/sign`,
        {
          message: {
            to: recipientAddress,
            amount: lamports
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.signature) {
        setSuccessMessage(`Transaction successful! Signature: ${response.data.signature}`);
        setTimeout(() => fetchBalance(publicKey), 2000); 
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.msg || 
                          error.message || 
                          'Failed to send SOL. Please check the recipient address and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        <p>&copy; {new Date().getFullYear()} Cloud Wallet - Powered by Varun</p>
      </footer>
    </div>
  );
};

export default App;
