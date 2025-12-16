// src/pages/CreateCampaign.jsx
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

  // Load templates from localStorage when page opens
  useEffect(() => {
    cleanupGrapesJSStorage();
    removeDuplicateTemplates();
    loadTemplates();
  }, []);

  // Separate logic to load templates as a function for reload capability
  const loadTemplates = () => {
    const templates = [];
    const seenTemplates = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("template_") && !key.startsWith("gjs-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));

          const contentHash = `${data.name}-${(data.html || '').substring(0, 100)}`;
          if (seenTemplates.has(contentHash)) {
            continue;
          }
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
    
    // Sort by creation time (newest first)
    templates.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    setSavedTemplates(templates);
  };

  // Improved template apply logic
  const handleUseTemplate = (template) => {
    // Combine HTML + CSS into a complete string
    let fullContent = template.html;
    
    if (template.css && template.css.trim()) {
      // If HTML already has <style>, replace it; if not, add it
      if (fullContent.includes('<style>')) {
        fullContent = fullContent.replace(/<style>[\s\S]*?<\/style>/g, `<style>${template.css}</style>`);
      } else {
        fullContent = `<style>${template.css}</style>${fullContent}`;
      }
    }
    
    setContent(fullContent);
    
    // Auto-fill subject if empty
    if (!subject) {
      const subjectText = template.name.includes("Template") 
        ? template.name.replace("Template", "").trim() 
        : template.name;
      setSubject(subjectText || "Your Subject Here");
    }
    
    setShowTemplateModal(false);
    setSuccessMessage(`âœ… Template applied: ${template.name}`);
    
    // Clear success message after 3 seconds
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
      setErrorMessage(`âŒ Invalid email: ${invalidEmails.join(', ')}. Please check again!`);
      setLoadingSubmit(false);
      return;
    }

    if (emailList.length === 0) {
      setErrorMessage("âŒ Please enter at least 1 email!");
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
        setSuccessMessage(`ðŸŽ‰ Campaign created successfully! ID: ${data.campaignId}`);
        setTimeout(() => navigate("/campaigns"), 2500);
      } else {
        setErrorMessage(`âŒ Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('âŒ Connection error to API');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-gray-800 mb-3">
          Create Regular Campaign (Send Once)
        </h1>
        <p className="text-xl text-red-600 font-semibold mb-6">
          Want to send automated email sequences based on user behavior?
        </p>
        <div className="flex justify-center gap-6">
          <Link 
            to="/drip-builder" 
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold rounded-3xl hover:scale-110 transition shadow-2xl"
          >
            ðŸš€ Drip Campaign Builder
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10">

        {/* TEMPLATE SELECTION BUTTON */}
        <div className="mb-8 text-center">
          <button
            onClick={() => {
              loadTemplates(); // Reload templates when opening modal
              setShowTemplateModal(true);
            }}
            className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-3xl font-bold rounded-3xl hover:scale-110 transition-all shadow-2xl"
          >
            <LayoutTemplate size={48} />
            Choose from Saved Templates ({savedTemplates.length})
            <Sparkles size={40} />
          </button>
          <p className="mt-4 text-lg text-gray-600">Use templates with just 1 click!</p>
          
          {/* Link to Template Library */}
          <Link 
            to="/templates" 
            className="inline-block mt-3 text-purple-600 hover:underline text-lg font-semibold"
          >
            ðŸ“š Or create new template in Template Library
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <input
            type="text"
            placeholder="Email subject"
            className="w-full p-5 border-2 border-purple-400 rounded-2xl text-xl font-bold"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div className="mb-10">
            <label className="block text-3xl font-bold text-gray-800 mb-6">Email content</label>
            <TiptapEditor value={content} onChange={setContent} />
            <div className="mt-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-4 border-dashed border-purple-300">
              <p className="text-2xl font-bold text-purple-700 mb-4">Preview:</p>
              <div 
                className="prose prose-xl max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: content || "<p class='text-gray-500 italic'>No content yet... Choose a template to start faster!</p>" 
                }} 
              />
            </div>
          </div>

          <textarea
            placeholder="Email list, separated by commas (e.g: email1@gmail.com, email2@yahoo.com)"
            className="w-full p-5 border-2 border-gray-300 rounded-2xl text-xl min-h-32"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            required
          />

          <div>
            <label className="block text-xl font-bold mb-3">â° Schedule send (optional)</label>
            <input
              type="datetime-local"
              className="w-full p-5 border-2 border-gray-300 rounded-2xl text-xl"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
            <p className="mt-2 text-sm text-gray-500">
              Leave empty to send immediately
            </p>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className={`w-full py-8 text-4xl font-bold rounded-3xl transition-all transform hover:scale-105 shadow-2xl ${
              loadingSubmit 
                ? "bg-gray-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
            }`}
          >
            {loadingSubmit ? "â³ CREATING CAMPAIGN..." : "ðŸš€ CREATE CAMPAIGN NOW"}
          </button>
        </form>

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl shadow-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ðŸ“š Choose Saved Template
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-6xl font-bold text-gray-500 hover:text-gray-800 hover:scale-110 transition"
                >&times;</button>
              </div>

              {savedTemplates.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-3xl text-gray-500 mb-6">
                    No templates yet. 
                  </p>
                  <Link 
                    to="/templates" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold rounded-2xl hover:scale-105 transition"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    ðŸ“ Create New Template
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedTemplates.map(tmp => (
                    <div key={tmp.id} className="border-4 border-purple-300 rounded-3xl overflow-hidden hover:scale-105 transition shadow-xl bg-white">
                      <div className="bg-gray-100 p-6 h-64 overflow-hidden relative">
                        <div 
                          dangerouslySetInnerHTML={{ __html: tmp.html }} 
                          className="scale-50 origin-top-left transform-gpu"
                          style={{ width: '200%', height: '200%' }}
                        />
                      </div>
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                        <h3 className="text-2xl font-bold text-purple-800 mb-2">{tmp.name}</h3>
                        {tmp.createdAt && (
                          <p className="text-sm text-gray-500 mb-4">
                            ðŸ“… {new Date(tmp.createdAt).toLocaleDateString('en-US')}
                          </p>
                        )}
                        <button
                          onClick={() => handleUseTemplate(tmp)}
                          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:scale-105 transition"
                        >
                          âœ¨ Use This Template
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
          <div className="mt-10 p-8 bg-green-100 border-4 border-green-500 rounded-3xl text-center animate-bounce">
            <p className="text-4xl font-bold text-green-700">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mt-8 p-6 bg-red-100 border-4 border-red-500 rounded-3xl text-center">
            <p className="text-2xl text-red-600 font-bold">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}