import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { zeekLogs, categories } from './data/zeekLogs';
import { GraphVisualization } from './components/GraphVisualization';
import { LogTypeCard } from './components/LogTypeCard';
import { FieldDetails } from './components/FieldDetails';
import { PivotPanel } from './components/PivotPanel';
import { CorrelationExamples } from './components/CorrelationExamples';
import { CategoryFilter } from './components/CategoryFilter';
import { SearchBar } from './components/SearchBar';
import { Database, Github, ExternalLink, Menu, X, Link2, Lightbulb, FileText } from 'lucide-react';

function App() {
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set(['conn', 'dns', 'http', 'files', 'ftp', 'ssl', 'x509', 'smtp', 'ssh', 'pe', 'dhcp', 'ntp', 'smb_files', 'smb_mapping', 'dce_rpc', 'kerberos', 'ntlm', 'irc', 'ldap', 'ldap_search', 'postgresql', 'quic', 'rdp', 'traceroute', 'tunnel', 'dpd', 'known_certs', 'known_services', 'software','weird', 'notice', 'capture_loss', 'reporter']));
  const [selectedNode, setSelectedNode] = useState<string | null>('conn');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'fields' | 'pivots' | 'examples'>('fields');

  const filteredLogs = useMemo(() => {
    return zeekLogs.filter(log => {
      // Category filter
      if (!selectedCategories.has(log.category)) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = log.name.toLowerCase().includes(query);
        const matchesDescription = log.description.toLowerCase().includes(query);
        const matchesFields = log.fields.some(field => 
          field.name.toLowerCase().includes(query) || 
          field.description.toLowerCase().includes(query)
        );
        
        if (!matchesName && !matchesDescription && !matchesFields) return false;
      }
      
      return true;
    });
  }, [selectedCategories, searchQuery]);

  const selectedLogType = selectedNode ? zeekLogs.find(log => log.id === selectedNode) : null;

  const toggleNode = (nodeId: string) => {
    setActiveNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        if (selectedNode === nodeId) {
          setSelectedNode(null);
        }
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleAllInCategory = (categoryId: string, enable: boolean) => {
    const categoryLogs = zeekLogs.filter(log => log.category === categoryId);
    setActiveNodes(prev => {
      const newSet = new Set(prev);
      categoryLogs.forEach(log => {
        if (enable) {
          newSet.add(log.id);
        } else {
          newSet.delete(log.id);
          if (selectedNode === log.id) {
            setSelectedNode(null);
          }
        }
      });
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Zeek Logs Dictionary</h1>
                <p className="text-sm text-slate-400">Interactive Network Security Monitor Log Reference</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <a
              href="https://docs.zeek.org/en/master/logs/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Official Docs</span>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ 
            x: sidebarOpen ? 0 : -384,
            width: sidebarOpen ? 384 : 0
          }}
          className="lg:animate-none lg:x-0 lg:w-96 fixed lg:relative z-40 h-full bg-slate-900/95 backdrop-blur border-r border-slate-700 overflow-hidden"
        >
          <div className="w-96 h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-700">
              <SearchBar onSearch={setSearchQuery} />
            </div>

            {/* Category Filters */}
            <div className="p-4 border-b border-slate-700">
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryToggle={toggleCategory}
              />
            </div>

            {/* Log Types */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300">
                  Log Types ({filteredLogs.length})
                </h3>
                <div className="text-xs text-slate-400">
                  {activeNodes.size} active
                </div>
              </div>

              {categories.map(category => {
                const categoryLogs = filteredLogs.filter(log => log.category === category.id);
                if (categoryLogs.length === 0) return null;

                const activeCategoryLogs = categoryLogs.filter(log => activeNodes.has(log.id));
                const allActive = activeCategoryLogs.length === categoryLogs.length;
                const someActive = activeCategoryLogs.length > 0;

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium" style={{ color: category.color }}>
                        {category.name} ({categoryLogs.length})
                      </h4>
                      <button
                        onClick={() => toggleAllInCategory(category.id, !allActive)}
                        className={`
                          text-xs px-2 py-1 rounded transition-colors
                          ${someActive 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                          }
                        `}
                      >
                        {allActive ? 'Disable All' : 'Enable All'}
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {categoryLogs.map(logType => (
                        <LogTypeCard
                          key={logType.id}
                          logType={logType}
                          isActive={activeNodes.has(logType.id)}
                          onToggle={toggleNode}
                          isSelected={selectedNode === logType.id}
                          onSelect={setSelectedNode}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400">No log types match your criteria</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Graph Visualization */}
          <div className="flex-1 relative">
            <GraphVisualization
              data={zeekLogs}
              activeNodes={activeNodes}
              onNodeClick={setSelectedNode}
              selectedNode={selectedNode}
            />
            
            {/* Graph Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-2">Graph Stats</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nodes:</span>
                    <span className="text-slate-200">{activeNodes.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selected:</span>
                    <span className="text-blue-400">{selectedNode || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Field Details Panel */}
          <div className="w-96 border-l border-slate-700 bg-slate-900/50 backdrop-blur flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setRightPanelView('fields')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors
                  ${rightPanelView === 'fields'
                    ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }
                `}
              >
                <FileText className="w-4 h-4" />
                <span>Fields</span>
              </button>
              <button
                onClick={() => setRightPanelView('pivots')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors
                  ${rightPanelView === 'pivots'
                    ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }
                `}
              >
                <Link2 className="w-4 h-4" />
                <span>Pivots</span>
              </button>
              <button
                onClick={() => setRightPanelView('examples')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors
                  ${rightPanelView === 'examples'
                    ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }
                `}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Examples</span>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1">
              {rightPanelView === 'fields' && <FieldDetails logType={selectedLogType} />}
              {rightPanelView === 'pivots' && (
                <PivotPanel 
                  logType={selectedLogType} 
                  allLogTypes={zeekLogs}
                  onLogTypeSelect={setSelectedNode}
                />
              )}
              {rightPanelView === 'examples' && (
                <CorrelationExamples 
                  logType={selectedLogType} 
                  allLogTypes={zeekLogs}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;