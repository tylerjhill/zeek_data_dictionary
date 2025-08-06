import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZeekLogType } from '../data/zeekLogs';
import { ArrowRight, Code, BookOpen, Lightbulb, Copy, Check } from 'lucide-react';

interface CorrelationExample {
  title: string;
  scenario: string;
  startLog: string;
  steps: {
    description: string;
    query: string;
    targetLog: string;
  }[];
  useCase: string;
}

interface CorrelationExamplesProps {
  logType: ZeekLogType | null;
  allLogTypes: ZeekLogType[];
}

export const CorrelationExamples: React.FC<CorrelationExamplesProps> = ({
  logType,
  allLogTypes
}) => {
  const [selectedExample, setSelectedExample] = useState<number>(0);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  if (!logType) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Correlation Examples
          </h3>
          <p className="text-sm text-slate-400">
            Select a log type to see practical correlation examples
          </p>
        </div>
      </div>
    );
  }

  const getCorrelationExamples = (log: ZeekLogType): CorrelationExample[] => {
    const examples: CorrelationExample[] = [];

    // Connection-based examples
    if (log.id === 'conn') {
      examples.push({
        title: 'Suspicious Connection Investigation',
        scenario: 'A connection to an unusual port was detected. Investigate what application data was transferred.',
        startLog: 'conn',
        steps: [
          {
            description: 'Find the connection record',
            query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h id.resp_p | grep "192.168.1.100"',
            targetLog: 'conn'
          },
          {
            description: 'Look for HTTP traffic on this connection',
            query: 'cat http.log | zeek-cut ts uid method host uri | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'http'
          },
          {
            description: 'Check for file transfers',
            query: 'cat files.log | zeek-cut ts uid filename mime_type | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'files'
          }
        ],
        useCase: 'Incident Response - Malware Communication'
      });
    }

    if (log.id === 'dns') {
      examples.push({
        title: 'DNS Tunneling Detection',
        scenario: 'Unusual DNS query patterns detected. Correlate with connection data to identify potential tunneling.',
        startLog: 'dns',
        steps: [
          {
            description: 'Find suspicious DNS queries',
            query: 'cat dns.log | zeek-cut ts uid query qtype_name | grep -E "\\.(tk|ml|ga)$"',
            targetLog: 'dns'
          },
          {
            description: 'Correlate with connection logs',
            query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h proto | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'conn'
          },
          {
            description: 'Check for unusual patterns',
            query: 'cat weird.log | zeek-cut ts uid name | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'weird'
          }
        ],
        useCase: 'Threat Hunting - Data Exfiltration'
      });
    }

    if (log.id === 'http') {
      examples.push({
        title: 'Web-based Attack Analysis',
        scenario: 'Suspicious HTTP request detected. Trace the full attack chain from connection to file analysis.',
        startLog: 'http',
        steps: [
          {
            description: 'Identify the HTTP request',
            query: 'cat http.log | zeek-cut ts uid method host uri status_code | grep "exploit"',
            targetLog: 'http'
          },
          {
            description: 'Find the underlying connection',
            query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h service | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'conn'
          },
          {
            description: 'Check for downloaded files',
            query: 'cat files.log | zeek-cut ts uid filename mime_type md5 | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'files'
          },
          {
            description: 'Analyze PE files if downloaded',
            query: 'cat pe.log | zeek-cut ts uid machine compile_ts | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'pe'
          }
        ],
        useCase: 'Malware Analysis - Drive-by Download'
      });
    }

    if (log.id === 'ssl') {
      examples.push({
        title: 'Certificate-based Investigation',
        scenario: 'Suspicious SSL certificate detected. Investigate certificate details and related connections.',
        startLog: 'ssl',
        steps: [
          {
            description: 'Find SSL handshake details',
            query: 'cat ssl.log | zeek-cut ts uid server_name cert_chain_fuids | grep "suspicious.com"',
            targetLog: 'ssl'
          },
          {
            description: 'Get certificate details',
            query: 'cat x509.log | zeek-cut ts id certificate.serial certificate.subject | grep "FHGtsSM8rjVqGNMFxP"',
            targetLog: 'x509'
          },
          {
            description: 'Check connection patterns',
            query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h duration bytes | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'conn'
          }
        ],
        useCase: 'Certificate Analysis - C2 Communication'
      });
    }

    if (log.id === 'files') {
      examples.push({
        title: 'File-based Threat Analysis',
        scenario: 'Malicious file detected. Trace its origin and analyze its properties across multiple log types.',
        startLog: 'files',
        steps: [
          {
            description: 'Identify the file transfer',
            query: 'cat files.log | zeek-cut ts uid filename mime_type md5 | grep "malware.exe"',
            targetLog: 'files'
          },
          {
            description: 'Find the connection that transferred it',
            query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h service | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'conn'
          },
          {
            description: 'Check HTTP context if web-based',
            query: 'cat http.log | zeek-cut ts uid method host uri | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'http'
          },
          {
            description: 'Analyze PE structure',
            query: 'cat pe.log | zeek-cut ts uid machine compile_ts | grep "CTo78A11g7CYbbOHvj"',
            targetLog: 'pe'
          }
        ],
        useCase: 'Malware Analysis - File Attribution'
      });
    }

    // Add time-based correlation example for any log type
    examples.push({
      title: 'Timeline-based Investigation',
      scenario: `Investigate all network activity around the time of a ${log.name} event for comprehensive incident analysis.`,
      startLog: log.id,
      steps: [
        {
          description: `Find the ${log.name} event timestamp`,
          query: `cat ${log.id}.log | zeek-cut ts uid | head -1`,
          targetLog: log.id
        },
        {
          description: 'Find all connections in time window',
          query: 'cat conn.log | zeek-cut ts uid id.orig_h id.resp_h | awk \'$1 >= 1609459200 && $1 <= 1609459260\'',
          targetLog: 'conn'
        },
        {
          description: 'Check for DNS activity',
          query: 'cat dns.log | zeek-cut ts uid query | awk \'$1 >= 1609459200 && $1 <= 1609459260\'',
          targetLog: 'dns'
        },
        {
          description: 'Look for any weird activity',
          query: 'cat weird.log | zeek-cut ts uid name | awk \'$1 >= 1609459200 && $1 <= 1609459260\'',
          targetLog: 'weird'
        }
      ],
      useCase: 'Incident Response - Timeline Analysis'
    });

    return examples;
  };

  const examples = getCorrelationExamples(logType);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuery(text);
      setTimeout(() => setCopiedQuery(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getLogColor = (logId: string) => {
    const log = allLogTypes.find(l => l.id === logId);
    return log?.color || '#64748b';
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
            <Lightbulb 
              className="w-6 h-6" 
              style={{ color: logType.color }} 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Correlation Examples</h2>
            <p className="text-sm text-slate-400">{logType.name} • {examples.length} scenarios</p>
          </div>
        </div>
        
        <p className="text-slate-300 text-sm">
          Practical examples showing how to correlate <span className="font-semibold" style={{ color: logType.color }}>{logType.name}</span> events 
          with other log types for effective threat hunting and incident response.
        </p>
      </div>

      {/* Example Selector */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setSelectedExample(index)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedExample === index
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
                }
              `}
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Example */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {examples[selectedExample] && (
            <motion.div
              key={selectedExample}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Scenario Description */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-slate-100">Scenario</h3>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                    {examples[selectedExample].useCase}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {examples[selectedExample].scenario}
                </p>
              </div>

              {/* Investigation Steps */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-100 flex items-center space-x-2">
                  <Code className="w-5 h-5 text-green-400" />
                  <span>Investigation Steps</span>
                </h3>

                {examples[selectedExample].steps.map((step, stepIndex) => (
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: stepIndex * 0.1 }}
                    className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
                          {stepIndex + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-300 font-medium">
                            {step.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getLogColor(step.targetLog) }}
                          />
                          <span className="text-xs text-slate-400">
                            {step.targetLog}.log
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-mono">Command:</span>
                          <button
                            onClick={() => copyToClipboard(step.query)}
                            className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                            title="Copy command"
                          >
                            {copiedQuery === step.query ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <code className="text-sm text-slate-100 font-mono break-all">
                          {step.query}
                        </code>
                      </div>
                    </div>

                    {stepIndex < examples[selectedExample].steps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tips Footer */}
      <div className="p-6 border-t border-slate-700 bg-slate-800/30">
        <h4 className="text-sm font-medium text-slate-200 mb-3">Pro Tips</h4>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Always start with connection UIDs for the most reliable correlation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Use time windows (±60 seconds) when UIDs aren't available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span>Combine multiple pivot points for comprehensive analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};