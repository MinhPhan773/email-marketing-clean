// src/pages/CampaignDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  const fetchCampaign = async () => {
    try {
      console.log("Campaign ID from useParams:", id);
      const res = await fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${id}`);
      const dataCampaign = await res.json();
      console.log("Raw campaign data returned:", JSON.stringify(dataCampaign));
      if (dataCampaign.emails && dataCampaign.emails.length > 0) {
        const formattedCampaign = {
          ...dataCampaign.emails[0],
          timestamp: dataCampaign.emails[0].timestamp
        };
        setCampaign(formattedCampaign);
      } else {
        setCampaign(null);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      setCampaign(null);
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
    fetchCampaign();
    fetchTracking();
    fetchStats();
  }, [id]);

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
      await fetchCampaign();
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
    return <div>Loading...</div>;
  }

  if (!campaign) {
    return <div>Campaign not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Campaign Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p><strong>Recipients:</strong> {campaign.recipients
          ? (Array.isArray(campaign.recipients) ? campaign.recipients.join(', ') : String(campaign.recipients))
          : 'No recipients'}
        </p>
        <p><strong>Subject:</strong> {campaign.subject}</p>
        <p><strong>Content:</strong> {campaign.body}</p>
        <p><strong>Status:</strong> {campaign.status}</p>
        <p><strong>Time:</strong> {stats?.timestamp || campaign.timestamp}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Email Response Tracking</h2>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {tracking.length === 0 ? (
          <p>No response data available.</p>
        ) : (
          <ul className="list-disc list-inside">
            {tracking.map((item, index) => (
              <li key={index}>
                {item.event_type} - {item.timestamp}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Campaign Statistics</h2>
        {stats ? (
          <>
            <p><strong>Emails Sent:</strong> {stats.total_sent || 0}</p>
            <p><strong>Open Rate:</strong> {stats.open_rate ? stats.open_rate.toFixed(2) : 0}%</p>
            <p><strong>Click Rate:</strong> {stats.click_rate ? stats.click_rate.toFixed(2) : 0}%</p>
          </>
        ) : (
          <p>No statistics available.</p>
        )}
      </div>

      <div className="mt-4 flex space-x-4">
        <Link to="/campaigns" className="text-blue-600 hover:underline"> {/* Thay đổi từ "/" thành "/campaigns" */}
          ← Back to List
        </Link>
        <button
          onClick={handleResendUnopened}
          disabled={resendLoading}
          className={`px-4 py-2 rounded flex items-center ${resendLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {resendLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              Sending...
            </>
          ) : (
            "Resend to Unopened"
          )}
        </button>
      </div>
    </div>
  );
}

export default CampaignDetail;