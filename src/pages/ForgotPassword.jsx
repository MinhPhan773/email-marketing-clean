// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import UserPool from '../cognitoConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const handleSendCode = (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: email, Pool: UserPool });

    user.forgotPassword({
      onSuccess: () => {
        setMessage('Verification code sent successfully! Please check your email.');
        setStep(2);
      },
      onFailure: (err) => {
        setMessage(`Error: ${err.message}`);
      },
    });
  };

  const handleConfirmNewPassword = (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: email, Pool: UserPool });

    user.confirmPassword(code, newPassword, {
      onSuccess: () => {
        setMessage('Password reset successful! You can log in now.');
      },
      onFailure: (err) => {
        setMessage(`Error: ${err.message}`);
      },
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
        {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmNewPassword} className="space-y-4">
            <input
              type="text"
              placeholder="Verification Code"
              className="w-full p-2 border rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;