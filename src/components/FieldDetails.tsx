import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZeekLogType, ZeekField } from '../data/zeekLogs';
import { Search, Filter, FileText, Copy, Check } from 'lucide-react';

interface FieldDetailsProps {
  logType: ZeekLogType | null;
}

const getTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'time': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'string': 'text-green-400 bg-green-400/10 border-green-400/20',
    'addr': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'port': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'count': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'bool': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'interval': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'enum': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    'vector': 'text-red-400 bg-red-400/10 border-red-400/20',
    'set': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'record': 'text-violet-400 bg-violet-400/10 border-violet-400/20'
  };
  return colors[type] || 'text-slate-400 bg-slate-400/10 border-slate-400/20';
};

export const FieldDetails: React.FC<FieldDetailsProps> = ({ logType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOptional, setShowOptional] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!logType) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Select a Log Type
          </h3>
          <p className="text-sm text-slate-400">
            Choose a log type from the sidebar to view its field details
          </p>
        </div>
      </div>
    );
  }

  const filteredFields = logType.fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOptional = showOptional || !field.optional;
    return matchesSearch && matchesOptional;
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(text);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${logType.color}20` }}
          >
            <FileText 
              className="w-6 h-6" 
              style={{ color: logType.color }} 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{logType.name}</h2>
            <p className="text-sm text-slate-400">{logType.category} • {logType.fields.length} fields</p>
          </div>
        </div>
        
        <p className="text-slate-300 mb-4">{logType.description}</p>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowOptional(!showOptional)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors
              ${showOptional 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Optional Fields</span>
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredFields.map((field: ZeekField, index) => (
            <motion.div
              key={field.name}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <code className="font-mono text-sm text-slate-100 bg-slate-900/50 px-2 py-1 rounded">
                      {field.name}
                    </code>
                    {field.optional && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
                        Optional
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${getTypeColor(field.type)}`}>
                      {field.type}
                    </span>
                    <button
                      onClick={() => copyToClipboard(field.name)}
                      className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      title="Copy field name"
                    >
                      {copiedField === field.name ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed">
                  {field.description}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFields.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400">No fields match your search criteria</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-6 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">
              <span className="font-medium">{filteredFields.length}</span> of {logType.fields.length} fields
            </span>
            <span className="text-slate-400">
              {logType.fields.filter(f => !f.optional).length} required
            </span>
          </div>
          
          {logType.relatedLogs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Related:</span>
              <div className="flex space-x-1">
                {logType.relatedLogs.slice(0, 3).map(relatedId => (
                  <span
                    key={relatedId}
                    className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
                  >
                    {relatedId}
                  </span>
                ))}
                {logType.relatedLogs.length > 3 && (
                  <span className="text-xs text-slate-400">
                    +{logType.relatedLogs.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};