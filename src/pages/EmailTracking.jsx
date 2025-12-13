// src/pages/EmailTracking.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function EmailTracking() {
  const { campaignId } = useParams();
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const res = await fetch(
          `https://kbm7qykb6f.execute-api.us-east-1.amazonaws.com/campaigns/${campaignId}/tracking`
        );
        const data = await res.json();
        setTrackingData(data.tracking || []);
      } catch (error) {
        console.error("Error fetching tracking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [campaignId]);

  if (loading) return <p className="p-4">Loading data...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Email Response Status</h2>
      {trackingData.length === 0 ? (
        <p>No response data available for this campaign.</p>
      ) : (
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Event Type</th>
              <th className="border px-2 py-1">Recipient</th>
              <th className="border px-2 py-1">Time</th>
            </tr>
          </thead>
          <tbody>
            {trackingData.map((item, index) => (
              <tr key={index}>
                <td className="border px-2 py-1">{item.event_type}</td>
                <td className="border px-2 py-1">{item.recipients?.join(", ")}</td>
                <td className="border px-2 py-1">{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EmailTracking;