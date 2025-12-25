// src/templates/TemplateEditor.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import grapesjsPresetWebpage from "grapesjs-preset-webpage";
import { Save, ArrowLeft, History, Trash2 } from "lucide-react";

export default function TemplateEditor() {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const templateName = location.state?.templateName || "New Template";
  const templateId = location.state?.templateId;

  useEffect(() => {
    if (!editorRef.current || editor) return;

    // Clear old GrapesJS storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('gjs-')) {
        localStorage.removeItem(key);
      }
    });

    const gjsEditor = grapesjs.init({
      container: "#gjs",
      height: "100vh",
      width: "100%",
      fromElement: false,
      storageManager: { 
        type: "local", 
        autosave: false,
        autoload: false,
        id: `gjs-template-${templateId || 'new'}`
      },
      plugins: [grapesjsPresetWebpage],
      pluginsOpts: {
        [grapesjsPresetWebpage]: {
          formsOpts: true,
          navbarOpts: true,
        }
      },
      canvas: {
        styles: [
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        ]
      }
    });

    // Load template content based on ID
    const templateContent = getTemplateContent(templateId);
    if (templateContent) {
      gjsEditor.setComponents(templateContent);
    }

    setEditor(gjsEditor);

    return () => {
      if (gjsEditor) {
        try {
          gjsEditor.destroy();
        } catch (e) {
          console.error("Error destroying editor:", e);
        }
      }
    };
  }, [templateId]);

  // ✅ FIX: Thêm đầy đủ 6 templates
  const getTemplateContent = (id) => {
    const templates = {
      // 1. WELCOME EMAIL
      1: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          <tr><td align="center" style="padding:60px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr><td style="padding:50px 40px;text-align:center;border-bottom:1px solid #e9ecef;">
                <h1 style="font-size:36px;font-weight:600;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.5px;">Welcome to Our Community</h1>
                <p style="font-size:18px;color:#6c757d;margin:0;line-height:1.6;">We're excited to have you on board</p>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#495057;line-height:1.8;margin:0 0 30px;">
                  Thank you for joining us. You're now part of a community that values quality, innovation, and excellence.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center">
                    <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 48px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Get Started Now</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `,
      
      // 2. PROMOTIONAL EMAIL
      2: `
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
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center">
                    <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:18px 60px;text-decoration:none;font-weight:600;border-radius:8px;font-size:18px;">Shop Now</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `,
      
      // 3. ABANDONED CART
      3: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          <tr><td align="center" style="padding:60px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr><td style="padding:40px 40px 30px;">
                <h1 style="font-size:32px;font-weight:600;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.5px;">Your Cart is Waiting</h1>
                <p style="font-size:16px;color:#6c757d;margin:0;line-height:1.6;">Complete your purchase before these items are gone</p>
              </td></tr>
              <tr><td style="padding:0 40px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center">
                    <a href="#" style="display:inline-block;background:#0066cc;color:#ffffff;padding:16px 48px;text-decoration:none;font-weight:600;border-radius:8px;font-size:16px;">Complete My Order</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `,
      
      // 4. NEWSLETTER
      4: `
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
                  Discover the latest trends and best practices that are shaping the industry.
                </p>
                <a href="#" style="color:#0066cc;text-decoration:none;font-weight:600;font-size:15px;">Read More</a>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `,
      
      // 5. ORDER CONFIRMATION
      5: `
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
      `,
      
      // 6. FEEDBACK REQUEST
      6: `
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
    };

    return templates[id] || null;
  };

  const handleSave = () => {
    if (!editor) return;
    
    setIsSaving(true);
    const html = editor.getHtml();
    const css = editor.getCss();
    const timestamp = Date.now();
    
    const savedTemplate = {
      html, 
      css, 
      name: templateName,
      createdAt: new Date().toISOString(),
      templateId: templateId || 'custom'
    };
    
    localStorage.setItem(`template_${timestamp}`, JSON.stringify(savedTemplate));
    
    alert("Template saved successfully!");
    setIsSaving(false);
  };

  const handleClearCanvas = () => {
    if (editor && window.confirm("Clear all content and start over?")) {
      editor.setComponents('');
      editor.setStyle('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-2xl px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            <ArrowLeft size={28} />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {templateName}
          </h1>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleClearCanvas}
            className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold flex items-center gap-3 hover:bg-red-200 transition"
            title="Clear canvas"
          >
            <Trash2 size={24} />
            Clear
          </button>
          
          <button 
            className="px-6 py-3 bg-gray-200 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-300 transition"
            onClick={() => alert("Version Control feature is under development!")}
          >
            <History size={24} />
            Version
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-10 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 transition shadow-2xl ${
              isSaving 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105"
            }`}
          >
            <Save size={28} />
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div id="gjs" ref={editorRef} className="flex-1" />
    </div>
  );
}