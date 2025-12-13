// src/pages/Confirm.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CognitoUser } from 'amazon-cognito-identity-js';
import UserPool from '../cognitoConfig';

const Confirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const handleConfirm = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setMessage(`Verification failed: ${err.message}`);
      } else {
        navigate('/login', { 
          replace: true,
          state: { message: 'Account verified successfully, please log in.' }, 
        });
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
      <form onSubmit={handleConfirm} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Verification Code"
          className="w-full p-2 border rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Verify
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
    </div>
  );
};

export default Confirm;