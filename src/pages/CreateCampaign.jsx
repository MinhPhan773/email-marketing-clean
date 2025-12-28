// src/pages/CreateCampaign.jsx - Updated UI
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TiptapEditor from "../components/TiptapEditor";
import { LayoutTemplate, Sparkles } from "lucide-react";
import { cleanupGrapesJSStorage, removeDuplicateTemplates } from '../utils/storageCleanup';

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export default function CreateCampaign() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cleanupGrapesJSStorage();
    removeDuplicateTemplates();
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const templates = [];
    const seenTemplates = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("template_") && !key.startsWith("gjs-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const contentHash = `${data.name}-${(data.html || '').substring(0, 100)}`;
          if (seenTemplates.has(contentHash)) continue;
          seenTemplates.add(contentHash);
          templates.push({
            id: key,
            name: data.name || "Untitled Template",
            html: data.html || "",
            css: data.css || "",
            createdAt: data.createdAt || null,
            preview: (data.html || "").substring(0, 200) + "..."
          });
        } catch (e) {
          console.error(`Error loading template ${key}:`, e);
        }
      }
    }
    templates.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setSavedTemplates(templates);
  };

  const handleUseTemplate = (template) => {
    let fullContent = template.html;
    if (template.css && template.css.trim()) {
      if (fullContent.includes('<style>')) {
        fullContent = fullContent.replace(/<style>[\s\S]*?<\/style>/g, `<style>${template.css}</style>`);
      } else {
        fullContent = `<style>${template.css}</style>${fullContent}`;
      }
    }
    setContent(fullContent);
    if (!subject) {
      const subjectText = template.name.includes("Template") 
        ? template.name.replace("Template", "").trim() 
        : template.name;
      setSubject(subjectText || "Your Subject Here");
    }
    setShowTemplateModal(false);
    setSuccessMessage(`✅ Template applied: ${template.name}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setMessage('');
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

        {/* TEMPLATE SELECTION BUTTON */}
        <div className="mb-6 text-center">
          <button
            onClick={() => {
              loadTemplates();
              setShowTemplateModal(true);
            }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:scale-105 transition-all shadow-lg"
          >
            <LayoutTemplate size={24} />
            Choose from Saved Templates ({savedTemplates.length})
            <Sparkles size={24} />
          </button>
          <p className="mt-3 text-base text-gray-600">Use templates with just 1 click!</p>
          
          <Link 
            to="/templates" 
            className="inline-block mt-2 text-purple-600 hover:underline text-base font-semibold"
          >
            📚 Or create new template in Template Library
          </Link>
        </div>

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
                __html: content || "<p class='text-gray-500 italic'>No content yet... Choose a template to start faster!</p>" 
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
        
        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📚 Choose Saved Template
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-4xl font-bold text-gray-500 hover:text-gray-800 hover:scale-110 transition"
                >&times;</button>
              </div>

              {savedTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 mb-4">No templates yet.</p>
                  <Link 
                    to="/templates" 
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl hover:scale-105 transition"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    📝 Create New Template
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedTemplates.map(tmp => (
                    <div key={tmp.id} className="border-2 border-purple-300 rounded-xl overflow-hidden hover:scale-105 transition shadow-lg bg-white">
                      <div className="bg-gray-100 p-4 h-48 overflow-hidden relative">
                        <div 
                          dangerouslySetInnerHTML={{ __html: tmp.html }} 
                          className="scale-50 origin-top-left transform-gpu"
                          style={{ width: '200%', height: '200%' }}
                        />
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                        <h3 className="text-lg font-bold text-purple-800 mb-2">{tmp.name}</h3>
                        {tmp.createdAt && (
                          <p className="text-xs text-gray-500 mb-3">
                            📅 {new Date(tmp.createdAt).toLocaleDateString('en-US')}
                          </p>
                        )}
                        <button
                          onClick={() => handleUseTemplate(tmp)}
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold rounded-lg hover:scale-105 transition"
                        >
                          ✨ Use This Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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