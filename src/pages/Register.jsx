// src/pages/Register.jsx - WITH EMAIL EXISTENCE VERIFICATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPool from '../cognitoConfig';
import { Check, X, Eye, EyeOff, AlertCircle, CheckCircle2, Mail, Loader2 } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
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
    isChecked: false,
    status: 'empty', // empty, checking, invalid, warning, valid
    message: '',
    canRegister: true
  });

  // ============================================
  // EMAIL VALIDATION FUNCTIONS
  // ============================================
  
  const checkDomainMXRecord = async (email) => {
    const domain = email.split('@')[1];
    
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      
      const data = await response.json();
      return data.Answer && data.Answer.length > 0;
    } catch (error) {
      console.error('MX Check Error:', error);
      return null; // Không chắc chắn
    }
  };

  const detectSuspiciousEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    const localPart = email.split('@')[0]?.toLowerCase();

    // Disposable email domains
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
      'fakeinbox.com', 'trashmail.com', 'yopmail.com'
    ];

    if (disposableDomains.includes(domain)) {
      return {
        isSuspicious: true,
        severity: 'high',
        message: '❌ Disposable email addresses are not allowed'
      };
    }

    // Fake patterns
    const fakePatterns = [
      /test\d+/i,
      /fake\d+/i,
      /temp\d+/i,
      /dummy\d+/i,
      /^\d{6,}$/,  // chỉ toàn số
    ];

    for (const pattern of fakePatterns) {
      if (pattern.test(localPart)) {
        return {
          isSuspicious: true,
          severity: 'medium',
          message: '⚠️ Email looks like a test account'
        };
      }
    }

    return { isSuspicious: false };
  };

  const validateEmail = async (emailInput) => {
    if (!emailInput || emailInput.trim() === '') {
      setEmailValidation({
        isValid: false,
        isChecked: false,
        status: 'empty',
        message: '',
        canRegister: false
      });
      return;
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setEmailValidation({
        isValid: false,
        isChecked: true,
        status: 'invalid',
        message: '❌ Invalid email format',
        canRegister: false
      });
      return;
    }

    setEmailChecking(true);
    setEmailValidation(prev => ({ ...prev, status: 'checking' }));

    // Check typos in domain
    const [localPart, domain] = emailInput.toLowerCase().split('@');
    const domainSuggestions = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmailll.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'outloo.com': 'outlook.com',
      'hotmial.com': 'hotmail.com',
    };

    if (domainSuggestions[domain]) {
      setEmailChecking(false);
      setEmailValidation({
        isValid: false,
        isChecked: true,
        status: 'invalid',
        message: `❌ Did you mean ${localPart}@${domainSuggestions[domain]}?`,
        suggestion: `${localPart}@${domainSuggestions[domain]}`,
        canRegister: false
      });
      return;
    }

    // Check suspicious patterns
    const suspicious = detectSuspiciousEmail(emailInput);
    if (suspicious.isSuspicious && suspicious.severity === 'high') {
      setEmailChecking(false);
      setEmailValidation({
        isValid: false,
        isChecked: true,
        status: 'invalid',
        message: suspicious.message,
        canRegister: false
      });
      return;
    }

    // Check MX record (domain có thể nhận email không)
    const hasMX = await checkDomainMXRecord(emailInput);
    
    setEmailChecking(false);

    if (hasMX === false) {
      // Domain không tồn tại hoặc không có mail server
      setEmailValidation({
        isValid: false,
        isChecked: true,
        status: 'invalid',
        message: `❌ Domain "${domain}" cannot receive emails`,
        canRegister: false
      });
      return;
    }

    // Nếu có suspicious pattern (medium severity) → warning nhưng vẫn cho phép
    if (suspicious.isSuspicious) {
      setEmailValidation({
        isValid: true,
        isChecked: true,
        status: 'warning',
        message: suspicious.message,
        canRegister: true
      });
      return;
    }

    // Email hợp lệ
    setEmailValidation({
      isValid: true,
      isChecked: true,
      status: 'valid',
      message: '✅ Email validated successfully',
      canRegister: true
    });
  };

  // Debounce email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        validateEmail(email);
      }
    }, 800); // Đợi 800ms sau khi user ngừng gõ

    return () => clearTimeout(timer);
  }, [email]);

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

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  const isPasswordValid = () => {
    return Object.entries(passwordChecks)
      .filter(([key]) => key !== 'passwordsMatch')
      .every(([_, value]) => value === true);
  };

  const canSubmit = () => {
    return emailValidation.canRegister && 
           emailValidation.isChecked &&
           isPasswordValid() && 
           passwordChecks.passwordsMatch &&
           !emailChecking;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      setMessage('❌ Please fix all validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    UserPool.signUp(email, password, [], null, (err, data) => {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Registration error:', err);
        
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

  const handleEmailSuggestionClick = () => {
    if (emailValidation.suggestion) {
      setEmail(emailValidation.suggestion);
    }
  };

  // ============================================
  // UI COMPONENTS
  // ============================================

  const RequirementItem = ({ label, isValid }) => (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
      isValid ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
    }`}>
      {isValid ? (
        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
      ) : (
        <X size={18} className="text-gray-400 flex-shrink-0" />
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
          {/* Email Input with Real-time Validation */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={18} />
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="your.email@example.com"
                className={`w-full p-4 pr-12 border-2 rounded-xl focus:outline-none transition-all ${
                  emailValidation.status === 'empty' 
                    ? 'border-gray-300 focus:border-purple-500'
                    : emailValidation.status === 'checking'
                    ? 'border-blue-400 focus:border-blue-500'
                    : emailValidation.status === 'valid'
                    ? 'border-green-500 focus:border-green-600 bg-green-50'
                    : emailValidation.status === 'warning'
                    ? 'border-yellow-500 focus:border-yellow-600 bg-yellow-50'
                    : 'border-red-500 focus:border-red-600 bg-red-50'
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailChecking && (
                <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Email Validation Message */}
            {emailValidation.status !== 'empty' && !emailChecking && (
              <div className={`mt-2 p-3 rounded-lg border-2 flex items-start gap-3 ${
                emailValidation.status === 'valid'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : emailValidation.status === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {emailValidation.status === 'valid' ? (
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{emailValidation.message}</p>
                  {emailValidation.suggestion && (
                    <button
                      type="button"
                      onClick={handleEmailSuggestionClick}
                      className="mt-2 text-xs font-mono bg-white/70 px-3 py-1 rounded hover:bg-white transition"
                    >
                      Click to use: {emailValidation.suggestion}
                    </button>
                  )}
                </div>
              </div>
            )}

            {emailChecking && (
              <div className="mt-2 p-3 rounded-lg bg-blue-50 border-2 border-blue-200 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Verifying email domain...
                </span>
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
              <RequirementItem label="At least 8 characters" isValid={passwordChecks.minLength} />
              <RequirementItem label="At least 1 number (0-9)" isValid={passwordChecks.hasNumber} />
              <RequirementItem label="At least 1 special character (!@#$%^&*)" isValid={passwordChecks.hasSpecial} />
              <RequirementItem label="At least 1 uppercase letter (A-Z)" isValid={passwordChecks.hasUppercase} />
              <RequirementItem label="At least 1 lowercase letter (a-z)" isValid={passwordChecks.hasLowercase} />
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
                <Loader2 size={20} className="animate-spin" />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">Already have an account? </span>
          <a 
            href="/login" 
            className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
          >
            Log In
          </a>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">📧 Email Verification</p>
              <p>We verify that your email domain can receive messages. You'll receive a verification code after registration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;