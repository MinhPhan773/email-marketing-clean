// src/components/PasswordStrengthIndicator.jsx
import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password, confirmPassword }) => {
  const requirements = [
    {
      id: 'minLength',
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8,
      icon: '🔢'
    },
    {
      id: 'hasNumber',
      label: 'Contains at least 1 number (0-9)',
      test: (pwd) => /\d/.test(pwd),
      icon: '1️⃣'
    },
    {
      id: 'hasSpecial',
      label: 'Contains at least 1 special character (!@#$%^&*)',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      icon: '✨'
    },
    {
      id: 'hasUppercase',
      label: 'Contains at least 1 uppercase letter (A-Z)',
      test: (pwd) => /[A-Z]/.test(pwd),
      icon: '🔠'
    },
    {
      id: 'hasLowercase',
      label: 'Contains at least 1 lowercase letter (a-z)',
      test: (pwd) => /[a-z]/.test(pwd),
      icon: '🔡'
    }
  ];

  const checks = requirements.map(req => ({
    ...req,
    isValid: req.test(password)
  }));

  const validCount = checks.filter(c => c.isValid).length;
  const totalCount = checks.length;
  const percentage = (validCount / totalCount) * 100;

  const getStrengthInfo = () => {
    if (validCount === 0) return { label: 'No password', color: 'bg-gray-300', textColor: 'text-gray-500' };
    if (validCount <= 1) return { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (validCount === 2) return { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (validCount === 3) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (validCount === 4) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const strength = getStrengthInfo();
  const passwordsMatch = password === confirmPassword && password !== '' && confirmPassword !== '';

  return (
    <div className="space-y-4">
      {/* Strength Meter */}
      {password && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Password Strength:
            </span>
            <span className={`text-sm font-bold ${strength.textColor}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{validCount}/{totalCount} requirements met</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          🔒 Password Requirements
        </p>
        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                check.isValid
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <div className="flex-shrink-0">
                {check.isValid ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <X size={20} className="text-gray-400" />
                )}
              </div>
              <span className="text-sm font-medium flex-1">{check.label}</span>
              <span className="text-lg">{check.icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Password Match Indicator */}
      {confirmPassword !== '' && (
        <div
          className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all duration-300 ${
            passwordsMatch
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          {passwordsMatch ? (
            <>
              <CheckCircle2 size={24} className="flex-shrink-0" />
              <div>
                <p className="font-bold">✅ Passwords Match!</p>
                <p className="text-sm opacity-90">You're ready to create your account</p>
              </div>
            </>
          ) : (
            <>
              <X size={24} className="flex-shrink-0" />
              <div>
                <p className="font-bold">❌ Passwords Don't Match</p>
                <p className="text-sm opacity-90">Please make sure both passwords are identical</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;