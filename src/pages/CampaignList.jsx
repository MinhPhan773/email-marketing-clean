// src/pages/CampaignList.jsx - Updated UI
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Zap, TrendingUp, Mail, Search, AlertCircle } from "lucide-react";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    fetch(`https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) {
          setCampaigns(data.campaigns);
        } else {
          setCampaigns([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching campaign list:", err);
        setError("Unable to load campaign list.");
        setLoading(false);
      });
  }, []);

  const handleClick = (campaignId) => {
    const plainId = campaignId.replace("campaign#", "");
    navigate(`/campaign/${plainId}`);
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        const response = await fetch(
          `https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${campaignId.replace("campaign#", "")}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Deletion failed");
        setCampaigns(campaigns.filter((item) => item.campaign_id !== campaignId));
      } catch (err) {
        console.error("Error deleting campaign:", err);
        alert("Unable to delete campaign. Please try again.");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-yellow-300 border-yellow-500";
      case "SENT":
        return "bg-green-200 border-green-400";
      case "OPENED":
        return "bg-green-400 border-green-600";
      case "CLICKED":
        return "bg-blue-400 border-blue-600";
      case "PENDING_VERIFICATION":
        return "bg-orange-300 border-orange-500";
      case "FAILED":
        return "bg-red-300 border-red-500";
      case "DRAFT":
        return "bg-gray-300 border-gray-500";
      default:
        return "bg-purple-300 border-purple-500";
    }
  };

  const getStatusBadge = (status, campaign) => {
    const badges = {
      SCHEDULED: { icon: "⏰", text: "Scheduled", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      SENT: { icon: "📧", text: "Sent", color: "bg-green-100 text-green-800 border-green-300" },
      OPENED: { icon: "👁️", text: "Opened", color: "bg-green-200 text-green-900 border-green-400" },
      CLICKED: { icon: "🖱️", text: "Clicked", color: "bg-blue-200 text-blue-900 border-blue-400" },
      PENDING_VERIFICATION: { 
        icon: "⚠️", 
        text: "Pending Verification", 
        color: "bg-orange-100 text-orange-800 border-orange-300" 
      },
      FAILED: { icon: "❌", text: "Failed", color: "bg-red-100 text-red-800 border-red-300" },
      DRAFT: { icon: "📝", text: "Draft", color: "bg-gray-100 text-gray-800 border-gray-300" }
    };

    const badge = badges[status] || { icon: "❓", text: status, color: "bg-purple-100 text-purple-800 border-purple-300" };

    return (
      <div className="flex flex-col gap-2">
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2 ${badge.color}`}>
          <span className="text-base">{badge.icon}</span>
          {badge.text}
        </span>
        
        {status === "PENDING_VERIFICATION" && campaign.unverified_emails && (
          <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Unverified emails:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {campaign.unverified_emails.map((email, idx) => (
                  <li key={idx} className="font-mono">{email}</li>
                ))}
              </ul>
              <p className="mt-1 italic">Verification emails have been sent. Please check inbox.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .replace(/,/, "")
      .replace(/\//g, "-");
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.campaign_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="mb-6">
              <Mail size={80} className="mx-auto text-purple-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Welcome to Email Marketing Platform!
            </h1>
            <p className="text-lg text-gray-600 mb-10">
              You haven't created any campaigns yet. Let's get started!
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="text-4xl mb-3">📧</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Regular Campaign
                </h3>
                <p className="text-base text-gray-600 mb-5">
                  Send one-time emails to your audience. Perfect for newsletters, announcements, and promotions.
                </p>
                <Link to="/create">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold text-base hover:scale-105 transition">
                    Create Regular Campaign
                  </button>
                </Link>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-xl font-bold mb-2">
                  Drip Campaign (Automated)
                </h3>
                <p className="text-base mb-5 opacity-90">
                  Smart email sequences based on user behavior. Automatically send different emails to openers vs non-openers.
                </p>
                <Link to="/drip-builder">
                  <button className="w-full bg-white text-purple-600 py-3 rounded-xl font-semibold text-base hover:scale-105 transition">
                    Create Drip Campaign
                  </button>
                </Link>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-base text-gray-600 mb-3">
                Want to start with a template?
              </p>
              <Link to="/templates">
                <button className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition border-2 border-purple-200">
                  Browse Template Library
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              📧 My Campaigns
            </h1>
            <p className="text-base text-gray-600">
              Manage and track your email campaigns
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link to="/create">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:scale-105 transition shadow-lg">
                <Plus size={18} />
                New Campaign
              </button>
            </Link>
            <Link to="/drip-dashboard">
              <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:scale-105 transition shadow-lg">
                <TrendingUp size={18} />
                Drip Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-xl p-3 shadow-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search campaigns by subject or ID..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 shadow-md">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Status Guide:</h3>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-yellow-300 border-2 border-yellow-500"></div>
                  <span className="text-xs">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-200 border-2 border-green-400"></div>
                  <span className="text-xs">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-400 border-2 border-green-600"></div>
                  <span className="text-xs">Opened</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-400 border-2 border-blue-600"></div>
                  <span className="text-xs">Clicked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-orange-300 border-2 border-orange-500"></div>
                  <span className="text-xs">Pending Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red-300 border-2 border-red-500"></div>
                  <span className="text-xs">Failed</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading campaigns...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center">
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            ) : filteredCampaigns.length > 0 ? (
              <div className="space-y-3">
                {filteredCampaigns.map((item, index) => (
                  <div
                    key={index}
                    className={`bg-white p-5 border-2 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-all ${getStatusColor(item.status)}`}
                    onClick={() => handleClick(item.campaign_id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.campaign_id.replace("campaign#", "")}
                          </span>
                        </div>
                        {getStatusBadge(item.status, item)}
                        <h3 className="text-lg font-bold text-gray-800 mb-1.5 mt-2">
                          {item.subject}
                        </h3>
                        <p className="text-sm text-gray-600">
                          📅 {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.campaign_id); }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-10 text-center shadow-md">
                <p className="text-gray-500 text-base">No campaigns found matching "{searchTerm}"</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-5">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl p-5 shadow-xl sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={24} className="text-yellow-300" />
                <h3 className="text-lg font-bold">Try Drip Campaigns</h3>
              </div>
              
              <p className="text-sm mb-3 opacity-90">
                Send smarter emails that adapt based on user behavior. Automatically send different content to engaged vs unengaged users.
              </p>

              <div className="space-y-2 mb-5">
                <div className="flex items-start gap-1.5">
                  <span className="text-green-300">✓</span>
                  <span className="text-sm">Behavior-based automation</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-300">✓</span>
                  <span className="text-sm">Higher engagement rates</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-300">✓</span>
                  <span className="text-sm">Set it and forget it</span>
                </div>
              </div>

              <Link to="/drip-builder">
                <button className="w-full bg-white text-purple-600 py-2.5 rounded-xl font-bold hover:scale-105 transition text-sm">
                  Create Drip Campaign
                </button>
              </Link>

              <Link to="/drip-dashboard">
                <button className="w-full mt-2 bg-white/10 text-white py-2 rounded-xl font-semibold hover:bg-white/20 transition text-sm">
                  View Dashboard
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-md">
              <h3 className="text-base font-bold text-gray-800 mb-3">📊 Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Campaigns:</span>
                  <span className="font-bold text-purple-600">{campaigns.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-bold text-green-600">
                    {campaigns.filter(c => c.status === "OPENED" || c.status === "CLICKED").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending Verification:</span>
                  <span className="font-bold text-orange-600">
                    {campaigns.filter(c => c.status === "PENDING_VERIFICATION").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-bold text-yellow-600">
                    {campaigns.filter(c => c.status === "SCHEDULED").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}