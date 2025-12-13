import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Edit3 } from "lucide-react";

const templates = [
  { 
    id: 1, 
    name: "Welcome Email", 
    thumbnail: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop", 
    category: "Welcome" 
  },
  { 
    id: 2, 
    name: "Black Friday Sale", 
    thumbnail: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop", 
    category: "Promotion" 
  },
  { 
    id: 3, 
    name: "Abandoned Cart", 
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", 
    category: "Recovery" 
  },
  { 
    id: 4, 
    name: "Newsletter Weekly", 
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop", 
    category: "Newsletter" 
  },
];

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