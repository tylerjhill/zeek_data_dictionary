import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZeekLogType } from '../data/zeekLogs';

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
            links.push({
              source: log.id,
              target: relatedId,
              strength: 1
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
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))');

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
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
        
        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

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
  }, [data, activeNodes, dimensions, selectedNode, onNodeClick]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{ minHeight: '500px' }}
      />
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