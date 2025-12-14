// src/components/EmailValidator.jsx
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const EmailValidator = ({ email, onValidationChange }) => {
  const [validation, setValidation] = useState({
    isValid: false,
    status: 'empty', // empty, invalid, valid, warning
    message: '',
    suggestion: null
  });

  useEffect(() => {
    validateEmail(email);
  }, [email]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation);
    }
  }, [validation, onValidationChange]);

  const validateEmail = (emailInput) => {
    if (!emailInput || emailInput.trim() === '') {
      setValidation({
        isValid: false,
        status: 'empty',
        message: '',
        suggestion: null
      });
      return;
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setValidation({
        isValid: false,
        status: 'invalid',
        message: 'Invalid email format',
        suggestion: null
      });
      return;
    }

    // Split email into parts
    const [localPart, domain] = emailInput.toLowerCase().split('@');

    // Check for common typos in popular domains
    const domainSuggestions = {
      // Gmail variations
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmailll.com': 'gmail.com', // ← Case người dùng đã test
      'gnail.com': 'gmail.com',
      'gmaik.com': 'gmail.com',
      
      // Yahoo variations
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'yaboo.com': 'yahoo.com',
      
      // Outlook/Hotmail variations
      'outloo.com': 'outlook.com',
      'outlok.com': 'outlook.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      
      // Other common domains
      'aol.com': 'aol.com',
      'icloud.com': 'icloud.com',
      'protonmail.com': 'protonmail.com'
    };

    // Check for exact match in typo dictionary
    if (domainSuggestions[domain]) {
      setValidation({
        isValid: true,
        status: 'warning',
        message: `Did you mean ${localPart}@${domainSuggestions[domain]}?`,
        suggestion: `${localPart}@${domainSuggestions[domain]}`
      });
      return;
    }

    // Check for similar domains using Levenshtein distance
    const popularDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'aol.com', 'icloud.com', 'protonmail.com', 'live.com',
      'msn.com', 'ymail.com'
    ];

    for (const popularDomain of popularDomains) {
      const distance = levenshteinDistance(domain, popularDomain);
      
      // If distance is 1-2, suggest correction
      if (distance >= 1 && distance <= 2) {
        setValidation({
          isValid: true,
          status: 'warning',
          message: `Did you mean ${localPart}@${popularDomain}?`,
          suggestion: `${localPart}@${popularDomain}`
        });
        return;
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.con$/, // .con instead of .com
      /\.met$/, // .met instead of .net
      /\.ogr$/, // .ogr instead of .org
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        const correctedDomain = domain
          .replace('.con', '.com')
          .replace('.met', '.net')
          .replace('.ogr', '.org');
        
        setValidation({
          isValid: true,
          status: 'warning',
          message: `Did you mean ${localPart}@${correctedDomain}?`,
          suggestion: `${localPart}@${correctedDomain}`
        });
        return;
      }
    }

    // Email is valid
    setValidation({
      isValid: true,
      status: 'valid',
      message: 'Valid email format',
      suggestion: null
    });
  };

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

  if (validation.status === 'empty') {
    return null;
  }

  const getIcon = () => {
    switch (validation.status) {
      case 'valid':
        return <CheckCircle2 size={20} className="text-green-600" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-600" />;
      case 'invalid':
        return <AlertCircle size={20} className="text-red-600" />;
      default:
        return <Mail size={20} className="text-gray-400" />;
    }
  };

  const getStyles = () => {
    switch (validation.status) {
      case 'valid':
        return {
          container: 'bg-green-50 border-green-200 text-green-700',
          text: 'text-green-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          text: 'text-yellow-700'
        };
      case 'invalid':
        return {
          container: 'bg-red-50 border-red-200 text-red-700',
          text: 'text-red-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-600',
          text: 'text-gray-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`mt-2 p-3 rounded-lg border-2 ${styles.container} transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${styles.text}`}>
            {validation.message}
          </p>
          {validation.suggestion && (
            <p className="text-xs mt-1 opacity-80">
              Click to use: <code className="font-mono bg-white/50 px-2 py-0.5 rounded">
                {validation.suggestion}
              </code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailValidator;