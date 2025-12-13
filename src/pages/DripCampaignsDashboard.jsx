import React, { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronRight, RefreshCw, X, Clock, Mail, MailOpen, MousePointerClick, Trash2, Users, Eye, TrendingUp, Info } from "lucide-react";

export default function DripCampaignsDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [deletingId, setDeletingId] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    fetchDripStats();
    const interval = setInterval(fetchDripStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDripStats = async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");

      const res = await fetch(
        `https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/drip-stats?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setStats(data.summary || { total: 0, active: 0, completed: 0 });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteDripCampaign = async (campaignId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this drip campaign? This will cancel all scheduled emails.")) {
      return;
    }

    setDeletingId(campaignId);
    
    try {
      const token = localStorage.getItem("token");
      const plainId = campaignId.replace("campaign#", "");
      
      const res = await fetch(
        `https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/drip-campaigns/${plainId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Delete failed");
      }

      await fetchDripStats();
      alert("Drip campaign deleted successfully!");
      
    } catch (err) {
      console.error("Error deleting drip campaign:", err);
      alert(`Cannot delete drip campaign: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatsForCampaign = (campaign) => {
    return campaign.stats || {
      sent: 0,
      opened: 0,
      clicked: 0,
      openRate: "0",
      clickRate: "0",
      totalRecipients: 0
    };
  };

  const getCampaignStatus = (campaign) => {
    const created = new Date(campaign.timestamp);
    const now = new Date();
    const waitDays = campaign.drip_config?.wait_days || 2;
    const followUpTime = new Date(created.getTime() + waitDays * 24 * 60 * 60 * 1000);

    if (now < followUpTime) {
      return {
        status: "waiting",
        label: "Waiting to send",
        color: "bg-yellow-500",
        icon: Clock
      };
    } else if (now < followUpTime.getTime() + 3600000) {
      return {
        status: "sending",
        label: "Sending A/B",
        color: "bg-blue-500 animate-pulse",
        icon: Mail
      };
    } else {
      return {
        status: "completed",
        label: "Completed",
        color: "bg-green-500",
        icon: MailOpen
      };
    }
  };

  const Tooltip = ({ text, id }) => (
    <div className="relative inline-block">
      <Info 
        size={16} 
        className="ml-2 cursor-help opacity-60 hover:opacity-100 transition-opacity"
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
      />
      {showTooltip === id && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-black/90"></div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-white font-bold animate-pulse mb-4">
            🚀 LOADING DASHBOARD...
          </div>
          <div className="text-2xl text-white/60">
            Loading drip campaigns data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent mb-4">
          📊 DRIP CAMPAIGNS DASHBOARD
        </h1>
        <p className="text-2xl opacity-90">Intelligent email automation system</p>

        <button
          onClick={() => fetchDripStats(true)}
          disabled={refreshing}
          className={`mt-6 px-8 py-4 rounded-2xl font-bold text-xl transition-all ${
            refreshing ? "bg-white/20 cursor-not-allowed" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <RefreshCw className={`inline mr-2 ${refreshing ? "animate-spin" : ""}`} size={24} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="bg-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <Mail className="mx-auto mb-4" size={48} />
          <div className="text-5xl font-bold text-pink-400">{stats.total}</div>
          <div className="text-xl mt-2">Total Campaigns</div>
        </div>

        <div className="bg-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <Clock className="mx-auto mb-4 animate-pulse" size={48} />
          <div className="text-5xl font-bold text-yellow-400">{stats.active}</div>
          <div className="text-xl mt-2">Waiting to Send</div>
        </div>

        <div className="bg-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <MailOpen className="mx-auto mb-4" size={48} />
          <div className="text-5xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xl mt-2">Completed</div>
        </div>

        <div className="bg-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <TrendingUp className="mx-auto mb-4" size={48} />
          <div className="text-5xl font-bold text-cyan-400">
            {campaigns.length > 0 
              ? (campaigns.reduce((sum, c) => sum + parseFloat(getStatsForCampaign(c).openRate), 0) / campaigns.length).toFixed(1)
              : "0"
            }%
          </div>
          <div className="text-xl mt-2">Average Open Rate</div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20">
          <Mail size={120} className="mx-auto mb-6 opacity-50" />
          <h2 className="text-4xl font-bold mb-4">No Drip Campaigns Yet</h2>
          <p className="text-xl opacity-75 mb-8">
            Create your first drip campaign to start automating email marketing!
          </p>
          <button
            onClick={() => window.location.href = '/drip-builder'}
            className="px-12 py-6 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-2xl font-bold rounded-3xl hover:scale-105 transition-all shadow-2xl"
          >
            Create Drip Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {campaigns.map((campaign) => {
            const stats = getStatsForCampaign(campaign);
            const created = new Date(campaign.timestamp);
            const waitDays = campaign.drip_config?.wait_days || 2;
            const followUpTime = new Date(created.getTime() + waitDays * 24 * 60 * 60 * 1000);
            const statusInfo = getCampaignStatus(campaign);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={campaign.campaign_id}
                className="bg-white/10 rounded-3xl p-8 hover:bg-white/20 shadow-2xl relative transition-all"
              >
                <button
                  onClick={(e) => handleDeleteDripCampaign(campaign.campaign_id, e)}
                  disabled={deletingId === campaign.campaign_id}
                  className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Delete drip campaign"
                >
                  {deletingId === campaign.campaign_id ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>

                <div onClick={() => setSelectedCampaign(campaign)} className="cursor-pointer">
                  <div className="flex justify-between mb-6 pr-12">
                    <h3 className="text-2xl font-bold truncate">
                      {campaign.drip_config?.email1?.subject || "Drip Campaign"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={20} className={statusInfo.color} />
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                    </div>
                  </div>

                  {/* Enhanced Stats Display */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Users size={16} className="mr-2 text-cyan-400" />
                          <span className="text-xs">Recipients</span>
                        </div>
                        <Tooltip 
                          text="Total recipients in campaign" 
                          id={`total-${campaign.campaign_id}`}
                        />
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {stats.totalRecipients}
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Mail size={16} className="mr-2 text-blue-400" />
                          <span className="text-xs">Sent</span>
                        </div>
                        <Tooltip 
                          text="Successfully sent emails" 
                          id={`sent-${campaign.campaign_id}`}
                        />
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {stats.sent}
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Eye size={16} className="mr-2 text-green-400" />
                          <span className="text-xs">Opened</span>
                        </div>
                        <Tooltip 
                          text="Unique opens" 
                          id={`opened-${campaign.campaign_id}`}
                        />
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {stats.opened}
                        <span className="text-sm ml-2">({stats.openRate}%)</span>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <MousePointerClick size={16} className="mr-2 text-yellow-400" />
                          <span className="text-xs">Clicked</span>
                        </div>
                        <Tooltip 
                          text="Unique clicks" 
                          id={`clicked-${campaign.campaign_id}`}
                        />
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {stats.clicked}
                        <span className="text-sm ml-2">({stats.clickRate}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm opacity-75 space-y-2">
                    <div className="flex justify-between">
                      <span>Created at:</span>
                      <span>{format(created, "MM/dd/yyyy HH:mm")}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Wait time:</span>
                      <span className="font-bold text-yellow-400">
                        {waitDays < 1 
                          ? `${(waitDays * 24).toFixed(1)} hours` 
                          : `${waitDays} days`
                        }
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Expected A/B send:</span>
                      <span className="font-bold text-pink-400">
                        {format(followUpTime, "MM/dd/yyyy HH:mm")}
                      </span>
                    </div>
                    
                    {/* Warning */}
                    <div className="text-xs text-yellow-400 mt-2">
                      ⚠️ Time may vary ±1-2 minutes due to AWS EventBridge
                    </div>
                    
                    {statusInfo.status === "waiting" && (
                      <div className="flex justify-between pt-2 border-t border-white/20">
                        <span>Time remaining:</span>
                        <span className="font-bold text-cyan-400">
                          {formatDistanceToNow(followUpTime, { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-center">
                    <span className="text-xs opacity-75">Click for details</span>
                    <ChevronRight size={28} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Modal */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-10 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-8">
              <h2 className="text-4xl font-bold">📧 DRIP CAMPAIGN DETAILS</h2>
              <button onClick={() => setSelectedCampaign(null)}>
                <X size={32} />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {(() => {
                const modalStats = getStatsForCampaign(selectedCampaign);
                return (
                  <>
                    <div className="bg-white/10 rounded-2xl p-6 text-center">
                      <Users className="mx-auto mb-2" size={32} />
                      <div className="text-3xl font-bold text-cyan-400">{modalStats.totalRecipients}</div>
                      <div className="text-sm mt-1">Recipients</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-6 text-center">
                      <Mail className="mx-auto mb-2" size={32} />
                      <div className="text-3xl font-bold text-blue-400">{modalStats.sent}</div>
                      <div className="text-sm mt-1">Sent</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-6 text-center">
                      <Eye className="mx-auto mb-2" size={32} />
                      <div className="text-3xl font-bold text-green-400">{modalStats.opened}</div>
                      <div className="text-sm mt-1">Opened ({modalStats.openRate}%)</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-6 text-center">
                      <MousePointerClick className="mx-auto mb-2" size={32} />
                      <div className="text-3xl font-bold text-yellow-400">{modalStats.clicked}</div>
                      <div className="text-sm mt-1">Clicked ({modalStats.clickRate}%)</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-white/10 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <span className="opacity-75">Campaign ID:</span>
                  <span className="ml-2 font-mono font-bold">
                    {selectedCampaign.campaign_id.replace("campaign#", "")}
                  </span>
                </div>
                <div>
                  <span className="opacity-75">Wait time:</span>
                  <span className="ml-2 font-bold text-yellow-400">
                    {selectedCampaign.drip_config?.wait_days} days
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="opacity-75">Created at:</span>
                  <span className="ml-2 font-bold">
                    {format(new Date(selectedCampaign.timestamp), "MM/dd/yyyy HH:mm")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold mb-4">👥 Recipients list</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCampaign.recipients?.map((email, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-white/10 rounded-full text-sm font-mono"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="bg-white/20 hover:bg-white/30 px-12 py-6 rounded-full text-2xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}