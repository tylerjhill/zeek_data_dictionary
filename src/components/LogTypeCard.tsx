import React from 'react';
import { motion } from 'framer-motion';
import { ZeekLogType, ZeekField } from '../data/zeekLogs';
import { FileText, Network, Shield, Database } from 'lucide-react';

interface LogTypeCardProps {
  logType: ZeekLogType;
  isActive: boolean;
  onToggle: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Network': return Network;
    case 'Security': return Shield;
    case 'Content': return Database;
    default: return FileText;
  }
};

const getTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'time': 'text-blue-400',
    'string': 'text-green-400',
    'addr': 'text-purple-400',
    'port': 'text-yellow-400',
    'count': 'text-orange-400',
    'bool': 'text-pink-400',
    'interval': 'text-cyan-400',
    'enum': 'text-indigo-400',
    'vector': 'text-red-400',
    'set': 'text-emerald-400',
    'record': 'text-violet-400'
  };
  return colors[type] || 'text-slate-400';
};

export const LogTypeCard: React.FC<LogTypeCardProps> = ({
  logType,
  isActive,
  onToggle,
  isSelected,
  onSelect
}) => {
  const IconComponent = getCategoryIcon(logType.category);

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300
        ${isSelected 
          ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' 
          : isActive 
            ? 'border-slate-600 shadow-lg shadow-slate-900/50' 
            : 'border-slate-700 hover:border-slate-600'
        }
        ${isActive ? 'bg-slate-800/90' : 'bg-slate-800/50'}
        backdrop-blur-sm hover:shadow-xl cursor-pointer
      `}
      onClick={() => onSelect(logType.id)}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${logType.color}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: logType.color }} 
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{logType.name}</h3>
              <p className="text-xs text-slate-400">{logType.category}</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(logType.id);
            }}
            className={`
              w-12 h-6 rounded-full transition-colors duration-200 relative
              ${isActive ? 'bg-blue-500' : 'bg-slate-600'}
            `}
          >
            <motion.div
              animate={{ x: isActive ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>
        
        <p className="text-sm text-slate-300 mt-2">{logType.description}</p>
      </div>

      {/* Fields List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-200">
            Fields ({logType.fields.length})
          </h4>
          <div className="text-xs text-slate-400">
            {logType.fields.filter(f => !f.optional).length} required
          </div>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {logType.fields.slice(0, 8).map((field: ZeekField) => (
            <div key={field.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-slate-300 font-mono truncate">
                  {field.name}
                </span>
                {field.optional && (
                  <span className="text-xs text-slate-500 bg-slate-700 px-1 rounded">
                    opt
                  </span>
                )}
              </div>
              <span className={`font-mono text-xs ${getTypeColor(field.type)}`}>
                {field.type}
              </span>
            </div>
          ))}
          
          {logType.fields.length > 8 && (
            <div className="text-xs text-slate-400 text-center py-1">
              +{logType.fields.length - 8} more fields
            </div>
          )}
        </div>
      </div>

      {/* Related Logs */}
      {logType.relatedLogs.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Related Logs
          </h4>
          <div className="flex flex-wrap gap-1">
            {logType.relatedLogs.map(relatedId => (
              <span
                key={relatedId}
                className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full"
              >
                {relatedId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};