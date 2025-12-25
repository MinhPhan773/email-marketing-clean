// src/pages/CampaignDetail.jsx - FIXED: Removed getCampaignDetailLambda dependency
// Version: 2.0 - Updated to use getCampaignsLambda for subject/body
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

function CampaignDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [campaign, setCampaign] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // ✅ NEW: Fetch campaign basic info từ getCampaignsLambda
  const fetchCampaignInfo = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      
      const res = await fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns?user_id=${userId}`);
      const data = await res.json();
      
      // Tìm campaign theo ID
      const fullCampaignId = `campaign#${id}`;
      const campaignData = data.campaigns?.find(c => c.campaign_id === fullCampaignId);
      
      if (campaignData) {
        console.log("Found campaign data:", campaignData);
        setCampaign({
          campaign_id: campaignData.campaign_id,
          subject: campaignData.subject || 'N/A',
          body: campaignData.body || 'N/A',
          recipients: campaignData.recipients || [],
          status: campaignData.status || 'UNKNOWN',
          timestamp: campaignData.timestamp
        });
      }
    } catch (error) {
      console.error("Error fetching campaign info:", error);
    }
  };

  const fetchTracking = async () => {
    try {
      const res = await fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${id}/tracking`);
      const dataTracking = await res.json();
      console.log("Raw tracking data returned:", JSON.stringify(dataTracking));
      const formattedTracking = (dataTracking.tracking || []).map(item => ({
        ...item,
        timestamp: item.timestamp
      }));
      setTracking(formattedTracking);
    } catch (error) {
      console.error("Error fetching tracking:", error);
      setTracking([]);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping stats fetch.");
      setLoading(false);
      return;
    }
    try {
      console.log("Fetching stats with id:", id);
      const res = await fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching stats, status: ${res.status}, response: ${errorText}`);
        throw new Error("Error fetching stats");
      }
      const data = await res.json();
      console.log("Stats returned from API:", data);
      setStats(data);
    } catch (error) {
      console.error("Detailed error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Gọi 3 API: campaign info + tracking + stats
    // Reset state trước khi fetch
    setLoading(true);
    setCampaign(null);
    setTracking([]);
    setStats(null);
    
    fetchCampaignInfo();
    fetchTracking();
    fetchStats();
  }, [id, location.key]); // ✅ Re-fetch khi ID hoặc location thay đổi

  useEffect(() => {
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [id]);

  const handleResendUnopened = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to resend emails.");
      return;
    }

    const normalizedId = id.startsWith("campaign#") ? id.replace("campaign#", "") : id;
    console.log("Normalized ID for resend:", normalizedId);

    setResendLoading(true);
    try {
      const res = await fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${normalizedId}/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Response not JSON:", text);
          data = { body: text };
        }
        alert(data.body || "Unable to resend campaign, please try again.");
        throw new Error("Error resending campaign");
      }
      const data = await res.json();
      alert(`Resend campaign created successfully: ${data.message}`);
      
      // ✅ Refresh data sau khi resend
      await fetchCampaignInfo();
      await fetchTracking();
      await fetchStats();
    } catch (error) {
      console.error("Error resending campaign:", error);
      alert("Unable to resend campaign, please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!campaign && !stats) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold text-lg">Campaign not found.</p>
          <Link to="/campaigns" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Extract recipients từ campaign data
  const recipients = campaign?.recipients || [];

  // ✅ Determine status (ưu tiên status từ campaign data, fallback từ tracking)
  const getStatus = () => {
    if (campaign?.status) return campaign.status;
    
    // Fallback: determine từ tracking events
    if (tracking.some(t => t.event_type === 'Click')) return 'CLICKED';
    if (tracking.some(t => t.event_type === 'Open')) return 'OPENED';
    if (tracking.some(t => t.event_type === 'Delivery')) return 'SENT';
    if (tracking.some(t => t.event_type === 'Send')) return 'SENT';
    if (tracking.some(t => t.event_type === 'Bounce')) return 'FAILED';
    return 'UNKNOWN';
  };

  const status = getStatus();

  return (
    <div className="max-w-4xl mx-auto p-6" key={`campaign-${id}-${forceUpdate}`}>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📧 Campaign Details</h1>

      {/* Campaign Info Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Campaign ID</p>
            <p className="font-mono text-purple-600 font-semibold">
              {campaign?.campaign_id?.replace('campaign#', '') || id}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              status === 'CLICKED' ? 'bg-blue-200 text-blue-800' :
              status === 'OPENED' ? 'bg-green-200 text-green-800' :
              status === 'SENT' ? 'bg-green-100 text-green-800' :
              status === 'FAILED' ? 'bg-red-200 text-red-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {status}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Recipients ({recipients.length})</p>
          <p className="text-gray-800">
            {recipients.length > 0 
              ? (Array.isArray(recipients) ? recipients.join(', ') : String(recipients))
              : 'No recipients data'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Subject</p>
          <p className="text-gray-800 font-semibold">{campaign?.subject || 'N/A'}</p>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Created At</p>
          <p className="text-gray-800">{stats?.timestamp || campaign?.timestamp || 'N/A'}</p>
        </div>
      </div>

      {/* ✅ NEW: Email Content Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
        <h2 className="text-xl font-bold mb-4 text-indigo-800 flex items-center gap-2">
          📧 Email Content
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: campaign?.body || '<p class="text-gray-500 italic">No content available</p>' }}
          />
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-300">
        <h2 className="text-xl font-bold mb-4 text-purple-800">📊 Campaign Statistics</h2>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm mb-1">Emails Sent</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_sent || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm mb-1">Open Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.open_rate ? stats.open_rate.toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm mb-1">Click Rate</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.click_rate ? stats.click_rate.toFixed(1) : 0}%
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No statistics available.</p>
        )}
      </div>

      {/* Tracking Events Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">📈 Email Response Tracking</h2>
        {tracking.length === 0 ? (
          <p className="text-gray-600">No tracking data available yet.</p>
        ) : (
          <div className="space-y-3">
            {tracking.map((item, index) => {
              const eventIcons = {
                'Send': '📤',
                'Delivery': '✅',
                'Open': '👁️',
                'Click': '🖱️',
                'Bounce': '❌',
                'Complaint': '⚠️',
                'Unverified': '🔒'
              };
              
              const eventColors = {
                'Send': 'bg-blue-50 border-blue-200',
                'Delivery': 'bg-green-50 border-green-200',
                'Open': 'bg-green-100 border-green-300',
                'Click': 'bg-blue-100 border-blue-300',
                'Bounce': 'bg-red-50 border-red-200',
                'Complaint': 'bg-orange-50 border-orange-200',
                'Unverified': 'bg-yellow-50 border-yellow-200'
              };

              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    eventColors[item.event_type] || 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{eventIcons[item.event_type] || '📋'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.event_type}</p>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(item.recipients) ? item.recipients.join(', ') : item.recipient_primary}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{item.timestamp}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/campaigns" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition"
        >
          ← Back to Campaigns
        </Link>
        
        <button
          onClick={handleResendUnopened}
          disabled={resendLoading}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
            resendLoading 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 shadow-lg'
          }`}
        >
          {resendLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              🔄 Resend to Unopened
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CampaignDetail;