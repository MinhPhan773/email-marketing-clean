import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Edit3 } from "lucide-react";

const templates = [
  // 1. WELCOME EMAIL
  { 
    id: 1, 
    name: "Welcome New User", 
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop", 
    category: "Welcome",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="padding:50px 40px;text-align:center;border-bottom:1px solid #e9ecef;">
              <h1 style="font-size:36px;font-weight:600;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.5px;">Welcome to Our Community</h1>
              <p style="font-size:18px;color:#6c757d;margin:0;line-height:1.6;">We're excited to have you on board</p>
            </td></tr>
            <tr><td style="padding:40px;">
              <p style="font-size:16px;color:#495057;line-height:1.8;margin:0 0 30px;">
                Thank you for joining us. You're now part of a community that values quality, innovation, and excellence. Here's what you can expect:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 35px;">
                <tr>
                  <td style="padding:20px;background:#f8f9fa;border-radius:8px;margin-bottom:12px;">
                    <h3 style="font-size:18px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Exclusive Content</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0;line-height:1.6;">Access premium resources and insights</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 35px;">
                <tr>
                  <td style="padding:20px;background:#f8f9fa;border-radius:8px;margin-bottom:12px;">
                    <h3 style="font-size:18px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Priority Support</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0;line-height:1.6;">Get help whenever you need it</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;">
                <tr>
                  <td style="padding:20px;background:#f8f9fa;border-radius:8px;">
                    <h3 style="font-size:18px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Regular Updates</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0;line-height:1.6;">Stay informed about new features</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center">
                  <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 48px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Get Started Now</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:30px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:14px;color:#6c757d;margin:0;">Need help? Contact us at <a href="mailto:support@oachxalach.com" style="color:#0066cc;text-decoration:none;">support@oachxalach.com</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  },

  // 2. PROMOTIONAL EMAIL
  { 
    id: 2, 
    name: "Special Offer Campaign", 
    thumbnail: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop", 
    category: "Promotion",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="background:#0066cc;padding:30px 40px;text-align:center;">
              <p style="font-size:14px;color:#ffffff;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Limited Time Offer</p>
              <h1 style="font-size:42px;font-weight:700;color:#ffffff;margin:0;letter-spacing:-1px;">Save 30% Today</h1>
            </td></tr>
            <tr><td style="padding:40px;">
              <p style="font-size:18px;color:#495057;line-height:1.8;margin:0 0 30px;text-align:center;">
                Don't miss out on this exclusive opportunity to save on all our premium products.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff5e6;border-left:4px solid #ff9500;padding:20px;margin:0 0 35px;">
                <tr><td>
                  <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Use Promo Code:</p>
                  <p style="font-size:28px;color:#ff9500;margin:0;font-weight:700;letter-spacing:2px;">SAVE30</p>
                </td></tr>
              </table>
              <p style="font-size:15px;color:#6c757d;line-height:1.7;margin:0 0 35px;">
                This offer is valid for the next 48 hours only. Shop now and enjoy premium quality at an unbeatable price.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center">
                  <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:18px 60px;text-decoration:none;font-weight:600;border-radius:8px;font-size:18px;">Shop Now</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:25px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:13px;color:#6c757d;margin:0;">Offer expires in 48 hours. Terms and conditions apply.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  },

  // 3. ABANDONED CART
  { 
    id: 3, 
    name: "Cart Reminder", 
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", 
    category: "Recovery",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="padding:40px 40px 30px;">
              <h1 style="font-size:32px;font-weight:600;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.5px;">Your Cart is Waiting</h1>
              <p style="font-size:16px;color:#6c757d;margin:0;line-height:1.6;">Complete your purchase before these items are gone</p>
            </td></tr>
            <tr><td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;border-radius:8px;padding:25px;">
                <tr>
                  <td style="padding-bottom:20px;border-bottom:1px solid #e9ecef;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70%">
                          <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">Premium Product Name</p>
                          <p style="font-size:14px;color:#6c757d;margin:5px 0 0;">Quantity: 1</p>
                        </td>
                        <td width="30%" align="right">
                          <p style="font-size:18px;color:#1a1a1a;margin:0;font-weight:600;">$99.00</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70%">
                          <p style="font-size:18px;color:#1a1a1a;margin:0;font-weight:700;">Total</p>
                        </td>
                        <td width="30%" align="right">
                          <p style="font-size:22px;color:#0066cc;margin:0;font-weight:700;">$99.00</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e8f4ff;border-left:4px solid #0066cc;padding:20px;border-radius:4px;">
                <tr><td>
                  <p style="font-size:15px;color:#004085;margin:0 0 5px;font-weight:600;">Special offer for you!</p>
                  <p style="font-size:14px;color:#004085;margin:0;">Use code <strong>COMEBACK10</strong> for 10% off</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center">
                  <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 48px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Complete My Order</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:25px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:13px;color:#6c757d;margin:0;">This cart will be saved for 7 days</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  },

  // 4. NEWSLETTER
  { 
    id: 4, 
    name: "Weekly Newsletter", 
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop", 
    category: "Newsletter",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="padding:40px 40px 30px;border-bottom:3px solid #0066cc;">
              <h1 style="font-size:32px;font-weight:600;color:#1a1a1a;margin:0 0 8px;letter-spacing:-0.5px;">This Week's Highlights</h1>
              <p style="font-size:15px;color:#6c757d;margin:0;">Your weekly dose of insights and updates</p>
            </td></tr>
            <tr><td style="padding:35px 40px;">
              <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 15px;font-weight:600;">Featured Article</h2>
              <p style="font-size:16px;color:#495057;line-height:1.8;margin:0 0 20px;">
                Discover the latest trends and best practices that are shaping the industry. Learn how successful companies are adapting to change.
              </p>
              <a href="#" style="color:#0066cc;text-decoration:none;font-weight:600;font-size:15px;">Read More →</a>
            </td></tr>
            <tr><td style="padding:0 40px 35px;">
              <div style="height:1px;background:#e9ecef;margin:0 0 35px;"></div>
              <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 20px;font-weight:600;">Quick Updates</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 20px;">
                    <h3 style="font-size:17px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Product Launch Success</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0;line-height:1.6;">Our new product exceeded expectations with record-breaking sales.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 20px;">
                    <h3 style="font-size:17px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Industry Recognition</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0;line-height:1.6;">We've been awarded Best Innovation of the Year 2025.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <h3 style="font-size:17px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Upcoming Webinar</h3>
                    <p style="font-size:15px;color:#6c757d;margin:0 0 12px;line-height:1.6;">Join us next Tuesday for an exclusive webinar on growth strategies.</p>
                    <a href="#" style="color:#0066cc;text-decoration:none;font-weight:600;font-size:14px;">Register Now →</a>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:30px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:13px;color:#6c757d;margin:0 0 8px;">You're receiving this because you subscribed to our newsletter</p>
              <a href="#" style="color:#0066cc;text-decoration:none;font-size:13px;">Unsubscribe</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  },

  // 5. ORDER CONFIRMATION
  { 
    id: 5, 
    name: "Order Confirmation", 
    thumbnail: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=300&fit=crop", 
    category: "Welcome",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="padding:40px 40px 30px;text-align:center;background:#e8f5e9;">
              <h1 style="font-size:36px;font-weight:600;color:#2e7d32;margin:0 0 8px;">Order Confirmed!</h1>
              <p style="font-size:16px;color:#558b2f;margin:0;">Thank you for your purchase</p>
            </td></tr>
            <tr><td style="padding:35px 40px;">
              <p style="font-size:16px;color:#495057;margin:0 0 25px;line-height:1.7;">
                Hi <strong>Customer Name</strong>,<br>Your order has been confirmed and will be shipped soon.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;border-radius:8px;padding:20px;margin:0 0 30px;">
                <tr>
                  <td>
                    <p style="font-size:14px;color:#6c757d;margin:0 0 5px;">Order Number</p>
                    <p style="font-size:18px;color:#1a1a1a;margin:0;font-weight:600;">#ORD-12345</p>
                  </td>
                  <td align="right">
                    <p style="font-size:14px;color:#6c757d;margin:0 0 5px;">Order Date</p>
                    <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">Dec 25, 2025</p>
                  </td>
                </tr>
              </table>
              <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 20px;font-weight:600;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e9ecef;border-bottom:1px solid #e9ecef;margin:0 0 25px;">
                <tr>
                  <td style="padding:20px 0;border-bottom:1px solid #e9ecef;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70%">
                          <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">Product Name</p>
                          <p style="font-size:14px;color:#6c757d;margin:5px 0 0;">Qty: 1</p>
                        </td>
                        <td width="30%" align="right">
                          <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">$99.00</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70%">
                          <p style="font-size:18px;color:#1a1a1a;margin:0;font-weight:700;">Total</p>
                        </td>
                        <td width="30%" align="right">
                          <p style="font-size:20px;color:#2e7d32;margin:0;font-weight:700;">$99.00</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center">
                  <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 40px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Track Your Order</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:30px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:14px;color:#6c757d;margin:0;">Questions? Contact us at <a href="mailto:support@oachxalach.com" style="color:#0066cc;text-decoration:none;">support@oachxalach.com</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  },

  // 6. FEEDBACK REQUEST
  { 
    id: 6, 
    name: "Feedback Request", 
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop", 
    category: "Newsletter",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td align="center" style="padding:60px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr><td style="padding:40px;text-align:center;">
              <h1 style="font-size:32px;font-weight:600;color:#1a1a1a;margin:0 0 15px;letter-spacing:-0.5px;">We Value Your Opinion</h1>
              <p style="font-size:16px;color:#6c757d;margin:0 0 35px;line-height:1.6;">Help us improve by sharing your experience</p>
              <p style="font-size:15px;color:#495057;line-height:1.7;margin:0 0 35px;">
                Your feedback matters to us. Take 2 minutes to let us know how we're doing and help us serve you better.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 35px;">
                <tr><td align="center">
                  <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 48px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Share Feedback</a>
                </td></tr>
              </table>
              <p style="font-size:14px;color:#6c757d;margin:0;">Takes less than 2 minutes</p>
            </td></tr>
            <tr><td style="padding:30px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;">
              <p style="font-size:13px;color:#6c757d;margin:0;">Thank you for being a valued customer</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `
  }
];

const categories = ["All", "Welcome", "Promotion", "Recovery", "Newsletter"];

function TemplateLibrary() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleUseTemplate = (template) => {
    navigate("/template-editor", { state: { templateId: template.id, templateName: template.name } });
  };

  const filteredTemplates = selectedCategory === "All" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          📚 Template Library
        </h1>
        <p className="text-2xl text-gray-600">Ready-made templates – Customize in 30 seconds!</p>
      </div>

      <div className="flex justify-between items-center mb-10">
        <div className="flex gap-4">
          {["All", "Welcome", "Promotion", "Recovery", "Newsletter"].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                selectedCategory === cat 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl scale-110" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/template-editor")}
          className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:scale-105 transition shadow-2xl"
        >
          <Plus size={32} />
          Create New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredTemplates.map(template => (
          <div key={template.id} className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="aspect-video overflow-hidden bg-gray-100">
              <img 
                src={template.thumbnail} 
                alt={template.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x300/667eea/ffffff?text=Email+Template";
                }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-6">📁 {template.category}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:scale-105 transition"
                >
                  ✨ Use Now
                </button>
                <button 
                  className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  title="Copy"
                >
                  <Copy size={24} />
                </button>
                <button 
                  className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  title="Edit"
                >
                  <Edit3 size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemplateLibrary;