// DripCampaignBuilder.jsx - Fixed Layout with Better Content Display
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

function TiptapEditor({ value, onChange }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-2 border-b flex gap-2">
        <button type="button" className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm">B</button>
        <button type="button" className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm">I</button>
        <button type="button" className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm">U</button>
      </div>
      <div 
        contentEditable
        className="p-4 min-h-[250px] bg-white text-left overflow-y-auto max-h-[400px]"
        style={{ 
          textAlign: 'left',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}

export default function DripCampaignBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [recipients, setRecipients] = useState("");
  const [email1Subject, setEmail1Subject] = useState("Welcome to your journey!");
  const [email1Body, setEmail1Body] = useState(`<h2>Hello!</h2>
<p>We're excited to welcome you!</p>
<p>This is the first email in your automated sequence.</p>
<p><a href="https://yourwebsite.com/start" style="background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin-top:10px;">Get Started</a></p>`);

  const [emailASubject, setEmailASubject] = useState("Thanks for opening our email!");
  const [emailABody, setEmailABody] = useState(`<h2>Special offer just for you!</h2>
<p>Since you opened the previous email → here's your reward!</p>
<p><strong>30% off your next order – valid for 48 hours only!</strong></p>
<p><a href="https://yourwebsite.com/offer" style="background:#10b981;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;margin-top:10px;">Claim Your Offer</a></p>`);

  const [emailBSubject, setEmailBSubject] = useState("You're missing out...");
  const [emailBBody, setEmailBBody] = useState(`<h2>Last chance!</h2>
<p>We noticed you <strong>haven't opened our previous email</strong>...</p>
<p>This is your final chance to claim your gift!</p>
<p><a href="https://yourwebsite.com/last-chance" style="background:#ef4444;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;margin-top:10px;">Click before it expires!</a></p>`);

  const [waitHours, setWaitHours] = useState("0");
  const [waitMinutes, setWaitMinutes] = useState("2");
  const [waitSeconds, setWaitSeconds] = useState("0");

  const convertToWaitDays = () => {
    const hours = parseInt(waitHours) || 0;
    const minutes = parseInt(waitMinutes) || 0;
    const seconds = parseInt(waitSeconds) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds / (24 * 60 * 60);
  };

  const formatWaitTime = () => {
    const hours = parseInt(waitHours) || 0;
    const minutes = parseInt(waitMinutes) || 0;
    const seconds = parseInt(waitSeconds) || 0;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} hours`);
    if (minutes > 0) parts.push(`${minutes} minutes`);
    if (seconds > 0) parts.push(`${seconds} seconds`);
    
    return parts.length > 0 ? parts.join(" ") : "0 seconds";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailList = recipients.split(",").map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) {
      alert("Enter at least 1 email!");
      setLoading(false);
      return;
    }

    const totalSeconds = (parseInt(waitHours) || 0) * 3600 + 
                        (parseInt(waitMinutes) || 0) * 60 + 
                        (parseInt(waitSeconds) || 0);
    
    if (totalSeconds < 60) {
      alert("Minimum wait time is 60 seconds (1 minute)!");
      setLoading(false);
      return;
    }

    const waitDaysFloat = convertToWaitDays();
    if (waitDaysFloat > 365) {
      alert("Wait time too long! Maximum 365 days");
      setLoading(false);
      return;
    }        
    
    const payload = {
      user_id: localStorage.getItem("user_id"),
      campaign_type: "drip",
      recipients: emailList,
      email1_subject: email1Subject,
      email1_body: email1Body,
      emailA_subject: emailASubject,
      emailA_body: emailABody,
      emailB_subject: emailBSubject,
      emailB_body: emailBBody,
      wait_days: waitDaysFloat
    };

    try {
      const res = await fetch("https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Drip campaign launched successfully! ID: ${data.campaignId}`);
        setTimeout(() => navigate("/drip-dashboard"), 2000);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("API connection error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const waitDaysFloat = convertToWaitDays();
  const nextSendTime = format(new Date(Date.now() + waitDaysFloat * 24 * 60 * 60 * 1000), "MM/dd/yyyy HH:mm:ss");

  const setWaitTime = (hours, minutes, seconds) => {
    setWaitHours(hours.toString());
    setWaitMinutes(minutes.toString());
    setWaitSeconds(seconds.toString());
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Drip Campaign Builder
        </h1>
        <p className="text-lg text-gray-600">Automatically send emails based on user behavior</p>
      </div>

      {/* Timeline */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-center mb-6">Automated Drip Campaign Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-white text-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg">1</div>
            <h3 className="text-lg font-bold">Email 1</h3>
            <p className="text-base">Send immediately</p>
          </div>
          <div className="text-center">
            <div className="text-4xl">→</div>
            <p className="mt-3 text-lg font-bold">Wait {formatWaitTime()}</p>
            <p className="text-sm opacity-90">→ {nextSendTime}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500 bg-opacity-30 backdrop-blur p-3 rounded-xl text-center border-2 border-green-300">
              <p className="text-3xl mb-1">✓</p>
              <p className="text-base font-bold mb-1">Opened</p>
              <p className="text-lg font-bold">→ Email A</p>
            </div>
            <div className="bg-red-500 bg-opacity-30 backdrop-blur p-3 rounded-xl text-center border-2 border-red-300">
              <p className="text-3xl mb-1">✗</p>
              <p className="text-base font-bold mb-1">Not Opened</p>
              <p className="text-lg font-bold">→ Email B</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">Recipients list (comma separated)</label>
          <textarea
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-base"
            rows="3"
            placeholder="email1@gmail.com, email2@yahoo.com, test@company.co"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* EMAIL 1 */}
          <div className="border-2 border-purple-500 rounded-xl p-5 bg-purple-50 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">📧</div>
              <h3 className="text-lg font-bold text-purple-700">Email 1 – Send now</h3>
            </div>
            <input 
              type="text" 
              className="w-full p-2.5 border-2 border-purple-300 rounded-lg mb-3 text-base font-semibold focus:border-purple-500 focus:outline-none" 
              placeholder="Subject" 
              value={email1Subject} 
              onChange={e => setEmail1Subject(e.target.value)} 
              required 
            />
            <div className="flex-1">
              <TiptapEditor value={email1Body} onChange={setEmail1Body} />
            </div>
          </div>

          {/* EMAIL A */}
          <div className="border-2 border-green-500 rounded-xl p-5 bg-green-50 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">✅</div>
              <h3 className="text-lg font-bold text-green-700">Email A – If opened</h3>
            </div>
            <input 
              type="text" 
              className="w-full p-2.5 border-2 border-green-300 rounded-lg mb-3 text-base font-semibold focus:border-green-500 focus:outline-none" 
              placeholder="Subject" 
              value={emailASubject} 
              onChange={e => setEmailASubject(e.target.value)} 
              required 
            />
            <div className="flex-1">
              <TiptapEditor value={emailABody} onChange={setEmailABody} />
            </div>
          </div>

          {/* EMAIL B */}
          <div className="border-2 border-red-500 rounded-xl p-5 bg-red-50 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">❌</div>
              <h3 className="text-lg font-bold text-red-700">Email B – If not opened</h3>
            </div>
            <input 
              type="text" 
              className="w-full p-2.5 border-2 border-red-300 rounded-lg mb-3 text-base font-semibold focus:border-red-500 focus:outline-none" 
              placeholder="Subject" 
              value={emailBSubject} 
              onChange={e => setEmailBSubject(e.target.value)} 
              required 
            />
            <div className="flex-1">
              <TiptapEditor value={emailBBody} onChange={setEmailBBody} />
            </div>
          </div>
        </div>

        <div className="text-center py-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
          <label className="text-xl font-bold text-gray-800 block mb-2">
            ⏱️ How long to wait before sending next email?
          </label>

          {/* Quick Presets */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <button type="button" onClick={() => setWaitTime(0, 1, 0)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold text-sm">
              1 minute (Test)
            </button>
            <button type="button" onClick={() => setWaitTime(0, 2, 0)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold text-sm">
              2 minutes
            </button>
            <button type="button" onClick={() => setWaitTime(1, 0, 0)} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-semibold text-sm">
              1 hour
            </button>
            <button type="button" onClick={() => setWaitTime(24, 0, 0)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold text-sm">
              1 day
            </button>
          </div>
          
          {/* Custom Input */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="8760"
                value={waitHours}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseInt(val) >= 0) setWaitHours(val);
                }}
                className="text-2xl font-bold w-20 text-center p-3 border-2 border-purple-500 rounded-xl shadow"
                placeholder="0"
              />
              <p className="text-base font-bold text-purple-600 mt-1">Hours</p>
            </div>
            
            <span className="text-3xl font-bold text-purple-600">:</span>
            
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="59"
                value={waitMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) setWaitMinutes(val);
                }}
                className="text-2xl font-bold w-20 text-center p-3 border-2 border-pink-500 rounded-xl shadow"
                placeholder="0"
              />
              <p className="text-base font-bold text-pink-600 mt-1">Minutes</p>
            </div>
            
            <span className="text-3xl font-bold text-pink-600">:</span>
            
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="59"
                value={waitSeconds}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) setWaitSeconds(val);
                }}
                className="text-2xl font-bold w-20 text-center p-3 border-2 border-indigo-500 rounded-xl shadow"
                placeholder="0"
              />
              <p className="text-base font-bold text-indigo-600 mt-1">Seconds</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className={`text-lg font-semibold px-12 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
              loading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            }`}
          >
            {loading ? "Creating Drip Campaign..." : "🚀 Launch Drip Campaign"}
          </button>
        </div>

        {success && (
          <div className="text-center text-lg font-semibold text-green-600 bg-green-100 p-4 rounded-xl">
            ✅ {success}
            <p className="text-base mt-2">Redirecting to Dashboard...</p>
          </div>
        )}
      </form>
    </div>
  );
}