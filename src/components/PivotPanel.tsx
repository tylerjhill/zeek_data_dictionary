import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZeekLogType } from '../data/zeekLogs';
import { ArrowRight, Copy, Check, Database, Link2, Clock, MapPin } from 'lucide-react';

interface PivotPoint {
  field: string;
  description: string;
  targetLogs: string[];
  pivotType: 'uid' | 'ip' | 'time' | 'hash' | 'identifier';
  example: string;
}

interface PivotPanelProps {
  logType: ZeekLogType | null;
  allLogTypes: ZeekLogType[];
  onLogTypeSelect: (logId: string) => void;
}

const getPivotIcon = (type: string) => {
  switch (type) {
    case 'uid': return Link2;
    case 'ip': return MapPin;
    case 'time': return Clock;
    case 'hash': return Database;
    default: return Database;
  }
};

const getPivotColor = (type: string) => {
  switch (type) {
    case 'uid': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'ip': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'time': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'hash': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

export const PivotPanel: React.FC<PivotPanelProps> = ({
  logType,
  allLogTypes,
  onLogTypeSelect
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPivot, setSelectedPivot] = useState<PivotPoint | null>(null);

  if (!logType) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Select a Log Type
          </h3>
          <p className="text-sm text-slate-400">
            Choose a log type to see available pivot points for correlation
          </p>
        </div>
      </div>
    );
  }

  // Define pivot points based on log type
  const getPivotPoints = (log: ZeekLogType): PivotPoint[] => {
    const pivots: PivotPoint[] = [];

    // Connection UID pivots (most common)
    if (log.fields.some(f => f.name === 'uid')) {
      pivots.push({
        field: 'uid',
        description: 'Connection identifier - links to conn.log and other connection-based logs',
        targetLogs: ['conn', 'dns', 'http', 'ssl', 'ssh', 'ftp', 'smtp', 'files', 'pe', 'dhcp', 'ntp', 'irc', 'ldap', 'postgresql', 'quic', 'rdp'],
        pivotType: 'uid',
        example: 'CTo78A11g7CYbbOHvj'
      });
    }

    // IP address pivots
    if (log.fields.some(f => f.name.includes('id.orig_h') || f.name.includes('id.resp_h'))) {
      pivots.push({
        field: 'id.orig_h / id.resp_h',
        description: 'Source/destination IP addresses - correlate across all network logs',
        targetLogs: ['conn', 'dns', 'http', 'ssl', 'ssh', 'ftp', 'smtp', 'dhcp', 'ntp', 'weird', 'notice'],
        pivotType: 'ip',
        example: '192.168.1.100'
      });
    }

    // File hash pivots
    if (log.fields.some(f => f.name.includes('hash') || f.name === 'md5' || f.name === 'sha1' || f.name === 'sha256')) {
      pivots.push({
        field: 'File Hashes (md5/sha1/sha256)',
        description: 'File hashes - correlate file analysis across files.log, pe.log, and x509.log',
        targetLogs: ['files', 'pe', 'x509', 'smb_files'],
        pivotType: 'hash',
        example: 'd41d8cd98f00b204e9800998ecf8427e'
      });
    }

    // Certificate pivots
    if (log.fields.some(f => f.name.includes('certificate') || f.name === 'serial')) {
      pivots.push({
        field: 'Certificate Serial/Fingerprint',
        description: 'Certificate identifiers - link SSL/TLS connections to certificate details',
        targetLogs: ['ssl', 'x509', 'known_certs'],
        pivotType: 'hash',
        example: '00:a1:2b:3c:4d:5e:6f'
      });
    }

    // Hostname/FQDN pivots
    if (log.fields.some(f => f.name === 'query' || f.name === 'host' || f.name === 'server_name')) {
      pivots.push({
        field: 'Hostname/FQDN',
        description: 'Domain names and hostnames - correlate DNS queries with HTTP/SSL traffic',
        targetLogs: ['dns', 'http', 'ssl', 'smtp', 'known_hosts'],
        pivotType: 'identifier',
        example: 'example.com'
      });
    }

    // Software version pivots
    if (log.fields.some(f => f.name === 'name' || f.name === 'version') && log.id === 'software') {
      pivots.push({
        field: 'Software Name/Version',
        description: 'Software identification - correlate with connection logs to identify services',
        targetLogs: ['conn', 'http', 'ssl', 'ssh', 'ftp', 'smtp'],
        pivotType: 'identifier',
        example: 'Apache/2.4.41'
      });
    }

    // Time-based pivots (always available)
    pivots.push({
      field: 'ts (timestamp)',
      description: 'Timestamp - temporal correlation across all log types for incident timeline',
      targetLogs: allLogTypes.map(l => l.id),
      pivotType: 'time',
      example: '1609459200.123456'
    });

    return pivots;
  };

  const pivotPoints = getPivotPoints(logType);

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
            <Link2 
              className="w-6 h-6" 
              style={{ color: logType.color }} 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Pivot Points</h2>
            <p className="text-sm text-slate-400">{logType.name} • {pivotPoints.length} pivot fields</p>
          </div>
        </div>
        
        <p className="text-slate-300 text-sm">
          Use these fields to correlate <span className="font-semibold" style={{ color: logType.color }}>{logType.name}</span> events 
          with other log types for comprehensive incident analysis.
        </p>
      </div>

      {/* Pivot Points List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {pivotPoints.map((pivot, index) => {
            const IconComponent = getPivotIcon(pivot.pivotType);
            const isSelected = selectedPivot?.field === pivot.field;
            
            return (
              <motion.div
                key={pivot.field}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`
                  bg-slate-800/50 backdrop-blur rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer
                  ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700 hover:border-slate-600'}
                `}
                onClick={() => setSelectedPivot(isSelected ? null : pivot)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border ${getPivotColor(pivot.pivotType)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <code className="font-mono text-sm text-slate-100 bg-slate-900/50 px-2 py-1 rounded">
                          {pivot.field}
                        </code>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${getPivotColor(pivot.pivotType)}`}>
                            {pivot.pivotType}
                          </span>
                          <span className="text-xs text-slate-400">
                            → {pivot.targetLogs.length} log types
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(pivot.field);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      title="Copy field name"
                    >
                      {copiedField === pivot.field ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    {pivot.description}
                  </p>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Example:</span>
                    <code className="bg-slate-900/50 px-2 py-1 rounded text-slate-300">
                      {pivot.example}
                    </code>
                  </div>

                  {/* Target Logs */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-slate-700"
                      >
                        <h4 className="text-sm font-medium text-slate-200 mb-3">
                          Correlate with these log types:
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {pivot.targetLogs.slice(0, 8).map(targetLogId => {
                            const targetLog = allLogTypes.find(l => l.id === targetLogId);
                            if (!targetLog) return null;
                            
                            return (
                              <motion.button
                                key={targetLogId}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLogTypeSelect(targetLogId);
                                }}
                                className="flex items-center space-x-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-all text-left"
                              >
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: targetLog.color }}
                                />
                                <span className="text-xs text-slate-300 truncate">
                                  {targetLog.name}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
                              </motion.button>
                            );
                          })}
                        </div>
                        
                        {pivot.targetLogs.length > 8 && (
                          <div className="text-xs text-slate-400 text-center mt-2">
                            +{pivot.targetLogs.length - 8} more log types
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-slate-700 bg-slate-800/30">
        <h4 className="text-sm font-medium text-slate-200 mb-3">Quick Correlation Tips</h4>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Use <code className="text-slate-300">uid</code> for connection-based correlation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Use IP addresses for host-based analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span>Use timestamps for temporal correlation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
            <span>Use hashes for file-based investigations</span>
          </div>
        </div>
      </div>
    </div>
  );
};