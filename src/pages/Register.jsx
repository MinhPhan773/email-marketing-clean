// src/pages/Register.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPool from '../cognitoConfig';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import EmailValidator from '../components/EmailValidator';
import { Check, X, Eye, EyeOff, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Password requirements state
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
    hasLowercase: false,
    passwordsMatch: false
  });

  // Email validation state
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    message: ''
  });

  // Real-time password validation
  useEffect(() => {
    setPasswordChecks({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      passwordsMatch: password === confirmPassword && password !== '' && confirmPassword !== ''
    });
  }, [password, confirmPassword]);

  // Real-time email validation
  useEffect(() => {
    if (email === '') {
      setEmailValidation({ isValid: false, message: '' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValid: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Check for common typos in popular domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1];
    
    if (domain) {
      const similarDomain = commonDomains.find(d => {
        const distance = levenshteinDistance(domain.toLowerCase(), d);
        return distance === 1 || distance === 2;
      });

      if (similarDomain) {
        setEmailValidation({
          isValid: true,
          message: `Did you mean @${similarDomain}?`
        });
        return;
      }
    }

    setEmailValidation({
      isValid: true,
      message: 'Valid email format'
    });
  }, [email]);

  // Levenshtein distance for typo detection
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const isPasswordValid = () => {
    return Object.entries(passwordChecks)
      .filter(([key]) => key !== 'passwordsMatch')
      .every(([_, value]) => value === true);
  };

  const canSubmit = () => {
    return emailValidation.isValid && 
           isPasswordValid() && 
           passwordChecks.passwordsMatch;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      setMessage('Please fix all validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    UserPool.signUp(email, password, [], null, (err, data) => {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Registration error:', err);
        
        // Enhanced error messages
        if (err.code === 'UsernameExistsException') {
          setMessage('❌ This email is already registered. Please try logging in instead.');
        } else if (err.code === 'InvalidPasswordException') {
          setMessage('❌ Password does not meet requirements. Please check all criteria above.');
        } else if (err.code === 'InvalidParameterException') {
          setMessage('❌ Invalid email or password format. Please check your input.');
        } else {
          setMessage(`❌ Registration failed: ${err.message}`);
        }
      } else {
        navigate('/confirm', { state: { email } });
      }
    });
  };

  const RequirementItem = ({ label, isValid, showCheck = true }) => (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
      isValid ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
    }`}>
      {showCheck && (
        isValid ? (
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
        ) : (
          <X size={18} className="text-gray-400 flex-shrink-0" />
        )
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  const getPasswordStrength = () => {
    const validCount = Object.entries(passwordChecks)
      .filter(([key]) => key !== 'passwordsMatch')
      .filter(([_, value]) => value === true)
      .length;

    if (validCount <= 1) return { label: 'Very Weak', color: 'bg-red-500', width: '20%' };
    if (validCount === 2) return { label: 'Weak', color: 'bg-orange-500', width: '40%' };
    if (validCount === 3) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (validCount === 4) return { label: 'Good', color: 'bg-blue-500', width: '80%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = password ? getPasswordStrength() : null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">Join our email marketing platform</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
            message.includes('❌') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                email === '' 
                  ? 'border-gray-300 focus:border-purple-500'
                  : emailValidation.isValid
                  ? 'border-green-500 focus:border-green-600 bg-green-50'
                  : 'border-red-500 focus:border-red-600 bg-red-50'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {email !== '' && (
              <div className={`mt-2 text-sm flex items-center gap-2 ${
                emailValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {emailValidation.isValid ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span className="font-medium">{emailValidation.message}</span>
              </div>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter strong password"
                className="w-full p-4 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && strength && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                  <span className={`text-sm font-bold ${
                    strength.label === 'Strong' ? 'text-green-600' :
                    strength.label === 'Good' ? 'text-blue-600' :
                    strength.label === 'Fair' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2">
              <p className="text-sm font-bold text-gray-700 mb-3">Password must contain:</p>
              <RequirementItem 
                label="At least 8 characters" 
                isValid={passwordChecks.minLength} 
              />
              <RequirementItem 
                label="At least 1 number (0-9)" 
                isValid={passwordChecks.hasNumber} 
              />
              <RequirementItem 
                label="At least 1 special character (!@#$%^&*)" 
                isValid={passwordChecks.hasSpecial} 
              />
              <RequirementItem 
                label="At least 1 uppercase letter (A-Z)" 
                isValid={passwordChecks.hasUppercase} 
              />
              <RequirementItem 
                label="At least 1 lowercase letter (a-z)" 
                isValid={passwordChecks.hasLowercase} 
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className={`w-full p-4 pr-12 border-2 rounded-xl focus:outline-none transition-all ${
                  confirmPassword === '' 
                    ? 'border-gray-300 focus:border-purple-500'
                    : passwordChecks.passwordsMatch
                    ? 'border-green-500 focus:border-green-600 bg-green-50'
                    : 'border-red-500 focus:border-red-600 bg-red-50'
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword !== '' && (
              <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                passwordChecks.passwordsMatch 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {passwordChecks.passwordsMatch ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-medium">Passwords match!</span>
                  </>
                ) : (
                  <>
                    <X size={18} />
                    <span className="text-sm font-medium">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit() || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform ${
              canSubmit() && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <span className="text-gray-600">Already have an account? </span>
          <a 
            href="/login" 
            className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
          >
            Log In
          </a>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Security Notice</p>
              <p>Your password is encrypted and stored securely. We never store passwords in plain text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;