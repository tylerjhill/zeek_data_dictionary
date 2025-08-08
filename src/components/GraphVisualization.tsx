import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZeekLogType } from '../data/zeekLogs';
import { Settings, Eye, EyeOff } from 'lucide-react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: string;
  color: string;
  radius: number;
  connections: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  strength: number;
  pivotProperties: string[];
  connectionCount: number;
}

interface GraphVisualizationProps {
  data: ZeekLogType[];
  activeNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  selectedNode: string | null;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  activeNodes,
  onNodeClick,
  selectedNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showPivotLabels, setShowPivotLabels] = useState(false);
  const [showConnectionStrength, setShowConnectionStrength] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Filter data based on active nodes
    const filteredData = data.filter(log => activeNodes.has(log.id));
    
    if (filteredData.length === 0) return;

    // Helper function to find common pivot properties between two log types
    const findPivotProperties = (log1: ZeekLogType, log2: ZeekLogType): string[] => {
      const pivots: string[] = [];
      
      // Check for common UID fields
      if (log1.fields.some(f => f.name === 'uid') && log2.fields.some(f => f.name === 'uid')) {
        pivots.push('uid');
      }
      
      // Check for IP address fields
      const hasIpFields1 = log1.fields.some(f => f.name.includes('id.orig_h') || f.name.includes('id.resp_h'));
      const hasIpFields2 = log2.fields.some(f => f.name.includes('id.orig_h') || f.name.includes('id.resp_h'));
      if (hasIpFields1 && hasIpFields2) {
        pivots.push('IP');
      }
      
      // Check for file hash fields
      const hasHashFields1 = log1.fields.some(f => f.name.includes('hash') || f.name === 'md5' || f.name === 'sha1');
      const hasHashFields2 = log2.fields.some(f => f.name.includes('hash') || f.name === 'md5' || f.name === 'sha1');
      if (hasHashFields1 && hasHashFields2) {
        pivots.push('hash');
      }
      
      // Check for hostname/FQDN fields
      const hasHostFields1 = log1.fields.some(f => f.name === 'query' || f.name === 'host' || f.name === 'server_name');
      const hasHostFields2 = log2.fields.some(f => f.name === 'query' || f.name === 'host' || f.name === 'server_name');
      if (hasHostFields1 && hasHostFields2) {
        pivots.push('hostname');
      }
      
      // Always include timestamp as a pivot
      pivots.push('ts');
      
      return pivots;
    };
    // Create nodes with connection count for sizing
    const nodes: Node[] = filteredData.map(log => {
      const connections = log.relatedLogs.filter(relatedId => 
        activeNodes.has(relatedId)
      ).length;
      
      return {
        id: log.id,
        name: log.name,
        category: log.category,
        color: log.color,
        radius: Math.max(20, 15 + connections * 5),
        connections
      };
    });

    // Create links based on relationships
    const links: Link[] = [];
    filteredData.forEach(log => {
      log.relatedLogs.forEach(relatedId => {
        if (activeNodes.has(relatedId) && log.id !== relatedId) {
          const existingLink = links.find(link => 
            (link.source === log.id && link.target === relatedId) ||
            (link.source === relatedId && link.target === log.id)
          );
          
          if (!existingLink) {
            const sourceLog = filteredData.find(l => l.id === log.id)!;
            const targetLog = filteredData.find(l => l.id === relatedId)!;
            const pivotProps = findPivotProperties(sourceLog, targetLog);
            
            links.push({
              source: log.id,
              target: relatedId,
              strength: 1,
              pivotProperties: pivotProps,
              connectionCount: pivotProps.length
            });
          }
        }
      });
    });

    // Set up simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Create container group
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create color scale for connection strength
    const maxConnections = Math.max(...links.map(l => l.connectionCount), 1);
    const connectionColorScale = d3.scaleLinear<string>()
      .domain([1, maxConnections])
      .range(['#00AB4920', '#00AB49FF']);
    // Create gradient definitions
    const defs = svg.append('defs');
    nodes.forEach(node => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${node.id}`)
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(node.color)?.brighter(0.5)?.toString() || node.color);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', node.color);
    });

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => showConnectionStrength ? connectionColorScale(d.connectionCount) : '#334155')
      .attr('stroke-width', d => showConnectionStrength ? Math.max(2, d.connectionCount * 1.5) : 2)
      .attr('stroke-opacity', d => showConnectionStrength ? 0.8 : 0.6)
      .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))');

    // Create pivot property labels on links
    const linkLabels = g.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#00AB49')
      .attr('text-anchor', 'middle')
      .attr('dy', '-5')
      .style('pointer-events', 'none')
      .style('opacity', showPivotLabels ? 1 : 0)
      .style('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.8)')
      .text(d => d.pivotProperties.slice(0, 2).join(', '));
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#gradient-${d.id})`)
      .attr('stroke', d => selectedNode === d.id ? '#fbbf24' : '#1e293b')
      .attr('stroke-width', d => selectedNode === d.id ? 4 : 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#f8fafc')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.8)');

    // Add category labels below nodes
    const categoryLabels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.category)
      .attr('font-size', '9px')
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 15)
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.8)');

    // Node interactions
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2)
          .style('filter', 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))');
        
        // Highlight connected nodes and links
        const connectedNodes = new Set<string>();
        links.forEach(link => {
          if (typeof link.source === 'object' && typeof link.target === 'object') {
            if (link.source.id === d.id) connectedNodes.add(link.target.id);
            if (link.target.id === d.id) connectedNodes.add(link.source.id);
          }
        });

        node.style('opacity', n => n.id === d.id || connectedNodes.has(n.id) ? 1 : 0.3);
        link.style('opacity', l => {
          const source = typeof l.source === 'object' ? l.source.id : l.source;
          const target = typeof l.target === 'object' ? l.target.id : l.target;
          return source === d.id || target === d.id ? 1 : 0.1;
        });
        linkLabels.style('opacity', l => {
          const source = typeof l.source === 'object' ? l.source.id : l.source;
          const target = typeof l.target === 'object' ? l.target.id : l.target;
          return (source === d.id || target === d.id) && showPivotLabels ? 1 : 0;
        });
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
        
        node.style('opacity', 1);
        link.style('opacity', 0.6);
        linkLabels.style('opacity', showPivotLabels ? 1 : 0);
      });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      linkLabels
        .attr('x', d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', d => ((d.source as Node).y! + (d.target as Node).y!) / 2);
      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);

      categoryLabels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, activeNodes, dimensions, selectedNode, onNodeClick, showPivotLabels, showConnectionStrength]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{ minHeight: '500px' }}
      />
      
      {/* Graph Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Visualization Controls */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Graph Controls</span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowPivotLabels(!showPivotLabels)}
              className={`
                flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${showPivotLabels
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {showPivotLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Pivot Labels</span>
            </button>
            
            <button
              onClick={() => setShowConnectionStrength(!showConnectionStrength)}
              className={`
                flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${showConnectionStrength
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {showConnectionStrength ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Connection Strength</span>
            </button>
          </div>
        </div>
        
        {/* Graph Stats */}
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
        
        {/* Legend */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-2">Connection Legend</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-green-400 opacity-30"></div>
              <span className="text-slate-400">Weak (1-2 pivots)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-green-400 opacity-60"></div>
              <span className="text-slate-400">Medium (3-4 pivots)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1.5 bg-green-400"></div>
              <span className="text-slate-400">Strong (5+ pivots)</span>
            </div>
          </div>
        </div>
      </div>
      
      {activeNodes.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No Log Types Selected
            </h3>
            <p className="text-sm text-slate-400">
              Enable some log types from the sidebar to see the relationship graph
            </p>
          </div>
        </div>
      )}
    </div>
  );
};