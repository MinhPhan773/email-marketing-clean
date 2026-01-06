// src/pages/CreateCampaign.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TiptapEditor from "../components/TiptapEditor";


const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export default function CreateCampaign() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setSuccessMessage('');
    setErrorMessage('');

    const emailList = recipients.split(',').map(email => email.trim()).filter(e => e);
    const invalidEmails = emailList.filter(email => !isValidEmail(email));

    if (invalidEmails.length > 0) {
      setErrorMessage(`❌ Invalid email: ${invalidEmails.join(', ')}. Please check again!`);
      setLoadingSubmit(false);
      return;
    }

    if (emailList.length === 0) {
      setErrorMessage("❌ Please enter at least 1 email!");
      setLoadingSubmit(false);
      return;
    }

    const scheduleTimeUtc = scheduledTime ? new Date(scheduledTime).toISOString() : null;
    const userId = localStorage.getItem('user_id');

    const payload = {
      user_id: userId,
      subject,
      content,
      recipients: emailList,
      scheduleTime: scheduleTimeUtc
    };

    try {
      const response = await fetch('https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`🎉 Campaign created successfully! ID: ${data.campaignId}`);
        setTimeout(() => navigate("/campaigns"), 2500);
      } else {
        setErrorMessage(`❌ Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('❌ Connection error to API');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Create Regular Campaign (Send Once)
        </h1>
        <p className="text-lg text-red-600 font-semibold mb-4">
          Want to send automated email sequences based on user behavior?
        </p>
        <Link 
          to="/drip-builder" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl hover:scale-105 transition shadow-lg"
        >
          🚀 Try Drip Campaign Builder
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Recipients First */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-700">Recipients</label>
            <textarea
              placeholder="Email list, separated by commas (e.g: email1@gmail.com, email2@yahoo.com)"
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-base min-h-24"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-700">Subject</label>
            <input
              type="text"
              placeholder="Email subject"
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-base font-medium"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-700">Email Content</label>
            <TiptapEditor value={content} onChange={setContent} />
          </div>

          {/* Preview */}
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-lg font-semibold text-gray-700 mb-3">Preview:</p>
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ 
                __html: content || "<p class='text-gray-500 italic'>No content yet...</p>" 
              }} 
            />
          </div>

          {/* Schedule Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">⏰ Schedule send (optional)</label>
              <input
                type="datetime-local"
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-base"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">Leave empty to send immediately</p>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={loadingSubmit}
              className={`px-12 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                loadingSubmit 
                ? "bg-gray-400 cursor-not-allowed text-white" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
              }`}
            >
              {loadingSubmit ? "⏳ Creating Campaign..." : "🚀 Create Campaign"}
            </button>
          </div>
        </form>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mt-6 p-4 bg-green-100 border-2 border-green-500 rounded-xl text-center">
            <p className="text-lg font-semibold text-green-700">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mt-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl text-center">
            <p className="text-base text-red-600 font-semibold">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}