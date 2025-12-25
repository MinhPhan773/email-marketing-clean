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

    // IMPORTANT: Clear localStorage before init to avoid conflicts
    const storageId = `gjs-template-${templateId || 'new'}`;
    
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
        autosave: false,  // Disable autosave
        autoload: false,  // Disable autoload
        id: storageId
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

  // Separate template content logic into function
  const getTemplateContent = (id) => {
    const templates = {
      1: `
        <div style="padding:60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align:center; color:white;">
          <h1 style="font-size:48px; margin-bottom:20px;">Hello {{email}}!</h1>
          <p style="font-size:24px; margin-bottom:40px;">Welcome to an amazing journey!</p>
          <a href="#" style="background:#fff; color:#667eea; padding:16px 40px; border-radius:50px; font-weight:bold; text-decoration:none;">Get Started</a>
        </div>
      `,
      2: `
        <div style="padding:80px 20px; background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); text-align:center; color:white;">
          <h1 style="font-size:60px; font-weight:bold; margin-bottom:20px;">BLACK FRIDAY SALE</h1>
          <p style="font-size:28px; margin-bottom:30px;">Up to 70% OFF - Limited 48 Hours!</p>
          <a href="#" style="background:#fff; color:#ff0844; padding:20px 50px; border-radius:50px; font-weight:bold; text-decoration:none; font-size:24px;">SHOP NOW</a>
        </div>
      `,
      3: `
        <div style="padding:60px 20px; background:#f3f4f6; text-align:center;">
          <h1 style="font-size:48px; color:#1f2937; margin-bottom:20px;">You have items in your cart!</h1>
          <p style="font-size:24px; color:#6b7280; margin-bottom:40px;">Don't miss 20% OFF when you complete your order today!</p>
          <a href="#" style="background:#10b981; color:white; padding:16px 40px; border-radius:12px; font-weight:bold; text-decoration:none;">Complete Order</a>
        </div>
      `,
      4: `
        <div style="padding:60px 20px; background:white;">
          <h1 style="font-size:48px; color:#1f2937; text-align:center; margin-bottom:40px;">This Week's Newsletter</h1>
          <div style="max-width:600px; margin:0 auto; line-height:1.8; font-size:18px; color:#374151;">
            <h2 style="font-size:28px; color:#7c3aed; margin:30px 0 15px;">Highlights</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
            <h2 style="font-size:28px; color:#7c3aed; margin:30px 0 15px;">Tips & Tricks</h2>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.</p>
            <a href="#" style="display:inline-block; margin-top:30px; background:#7c3aed; color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold;">Read More</a>
          </div>
        </div>
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
    
    // Save with unique timestamp
    const savedTemplate = {
      html, 
      css, 
      name: templateName,
      createdAt: new Date().toISOString(),
      templateId: templateId || 'custom' // Track original template ID
    };
    
    localStorage.setItem(`template_${timestamp}`, JSON.stringify(savedTemplate));
    
    // Success feedback
    alert("✅ Template saved successfully!");
    setIsSaving(false);
    
    // Optional: Navigate to templates page
    // setTimeout(() => navigate('/templates'), 1500);
  };

  const handleClearCanvas = () => {
    if (editor && window.confirm("⚠️ Clear all content and start over?")) {
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
            ✨ {templateName}
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
            onClick={() => alert("💡 Version Control feature is under development!")}
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