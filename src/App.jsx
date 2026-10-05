import { useState, useMemo } from 'react';
import buildingData from './building.json';
import './App.css';

function App() {
  const [language, setLanguage] = useState('en');
  const [startNode, setStartNode] = useState(null);
  
  // 'start' = click sets starting node, 'hazard' = click blocks/unblocks
  const [actionMode, setActionMode] = useState('start'); 
  
  const [blockedNodes, setBlockedNodes] = useState(buildingData.initial_state.blocked_nodes || []);
  const [blockedEdges, setBlockedEdges] = useState(buildingData.initial_state.blocked_edges || []);
  const [closedExits, setClosedExits] = useState(buildingData.initial_state.closed_exits || []);

  const resetHazards = () => {
    setBlockedNodes(buildingData.initial_state.blocked_nodes || []);
    setBlockedEdges(buildingData.initial_state.blocked_edges || []);
    setClosedExits(buildingData.initial_state.closed_exits || []);
    setStartNode(null);
  };

  // Click Handlers
  const handleNodeClick = (node) => {
    if (actionMode === 'start') {
      if (node.type !== 'exit' && !blockedNodes.includes(node.id)) {
        setStartNode(node.id);
      }
    } else {
      if (node.type === 'exit') {
        setClosedExits(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]);
      } else {
        setBlockedNodes(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]);
        // If we block the current start node, the route will auto-fail, which satisfies the rulebook!
      }
    }
  };

  const handleEdgeClick = (edgeId) => {
    if (actionMode === 'hazard') {
      setBlockedEdges(prev => prev.includes(edgeId) ? prev.filter(id => id !== edgeId) : [...prev, edgeId]);
    }
  };

  // Dijkstra Implementation
  const routeResult = useMemo(() => {
    if (!startNode) return null;
    if (blockedNodes.includes(startNode)) return { error: 'Starting location blocked', bnError: 'শুরুর স্থান অবরুদ্ধ' };

    const adj = {};
    buildingData.nodes.forEach(n => { adj[n.id] = []; });
    
    buildingData.edges.forEach(e => {
      if (blockedEdges.includes(e.id)) return;
      if (blockedNodes.includes(e.from) || blockedNodes.includes(e.to)) return;
      adj[e.from].push({ to: e.to, cost: e.cost });
      adj[e.to].push({ to: e.from, cost: e.cost });
    });

    const dist = {};
    const paths = {};
    buildingData.nodes.forEach(n => {
      dist[n.id] = Infinity;
      paths[n.id] = [];
    });
    
    dist[startNode] = 0;
    paths[startNode] = [startNode];
    
    const unvisited = buildingData.nodes.map(n => n.id).filter(id => !blockedNodes.includes(id));

    while (unvisited.length > 0) {
      unvisited.sort((a, b) => dist[a] - dist[b]);
      const current = unvisited.shift();

      if (dist[current] === Infinity) break;

      adj[current].forEach(neighbor => {
        if (unvisited.includes(neighbor.to)) {
          const newDist = dist[current] + neighbor.cost;
          const newPath = [...paths[current], neighbor.to];

          if (newDist < dist[neighbor.to]) {
            dist[neighbor.to] = newDist;
            paths[neighbor.to] = newPath;
          } else if (newDist === dist[neighbor.to]) {
            if (newPath.join(',') < paths[neighbor.to].join(',')) {
              paths[neighbor.to] = newPath;
            }
          }
        }
      });
    }

    let validExits = buildingData.nodes.filter(n => 
      n.type === 'exit' && !closedExits.includes(n.id) && dist[n.id] !== Infinity
    );

    if (validExits.length === 0) return { error: 'No route available', bnError: 'কোনো রুট উপলব্ধ নেই' };

    validExits.sort((a, b) => {
      if (dist[a.id] !== dist[b.id]) return dist[a.id] - dist[b.id];
      if (a.id !== b.id) return a.id.localeCompare(b.id);
      return paths[a.id].join(',').localeCompare(paths[b.id].join(','));
    });

    const bestExit = validExits[0].id;
    return { path: paths[bestExit], cost: dist[bestExit], exit: bestExit };
  }, [startNode, blockedNodes, blockedEdges, closedExits]);

  const isEdgeInRoute = (from, to) => {
    if (!routeResult || routeResult.error) return false;
    const path = routeResult.path;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === from && path[i+1] === to) || (path[i] === to && path[i+1] === from)) return true;
    }
    return false;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{language === 'en' ? 'Smart Escape' : 'স্মার্ট এস্কেপ'}</h2>
        <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </header>

      {/* Controls Area */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActionMode(actionMode === 'start' ? 'hazard' : 'start')}
          style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: actionMode === 'start' ? '#2196F3' : '#f44336', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        >
          {actionMode === 'start' 
            ? (language === 'en' ? 'Mode: Setting Start Location' : 'মোড: শুরুর স্থান নির্বাচন') 
            : (language === 'en' ? 'Mode: Toggling Hazards' : 'মোড: বিপদ টগল করা')}
        </button>

        <button onClick={resetHazards} style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>
          {language === 'en' ? 'Reset Hazards' : 'রিসেট করুন'}
        </button>
        
        <div style={{ padding: '10px', backgroundColor: '#eee', borderRadius: '5px', flex: 1, minWidth: '300px' }}>
          <strong>{language === 'en' ? 'Status: ' : 'স্ট্যাটাস: '}</strong>
          {!startNode ? (
            language === 'en' ? 'Select a starting room/junction' : 'একটি শুরুর স্থান নির্বাচন করুন'
          ) : routeResult?.error ? (
            <span style={{ color: 'red', fontWeight: 'bold' }}>{language === 'en' ? routeResult.error : routeResult.bnError}</span>
          ) : (
            <span>
              {language === 'en' ? 'Route: ' : 'রুট: '} {routeResult.path.join(' → ')} 
              <strong style={{ marginLeft: '15px' }}>{language === 'en' ? 'Cost: ' : 'খরচ: '} {routeResult.cost}</strong>
            </span>
          )}
        </div>
      </div>

      {/* SVG Map */}
      <svg width="800" height="450" style={{ backgroundColor: '#fff', border: '2px solid #333', borderRadius: '8px' }}>
        {/* Draw Edges */}
        {buildingData.edges.map(edge => {
          const fromNode = buildingData.nodes.find(n => n.id === edge.from);
          const toNode = buildingData.nodes.find(n => n.id === edge.to);
          const inRoute = isEdgeInRoute(edge.from, edge.to);
          const isBlocked = blockedEdges.includes(edge.id);
          
          return (
            <g key={edge.id} style={{ cursor: actionMode === 'hazard' ? 'pointer' : 'default' }}>
              {/* Invisible wide line for easier clicking */}
              <line 
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                stroke="transparent" strokeWidth="25"
                onClick={() => handleEdgeClick(edge.id)}
              />
              {/* Visible edge line */}
              <line 
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                stroke={isBlocked ? "#f44336" : inRoute ? "gold" : "#ccc"} 
                strokeWidth={inRoute && !isBlocked ? "8" : "4"}
                strokeDasharray={isBlocked ? "5,5" : "none"}
                style={{ pointerEvents: 'none' }}
              />
              <text 
                x={(fromNode.x + toNode.x) / 2} y={(fromNode.y + toNode.y) / 2 - 12} 
                fill={isBlocked ? "#f44336" : "#555"} fontSize="14" fontWeight="bold" textAnchor="middle"
                style={{ pointerEvents: 'none' }}>
                {isBlocked ? 'X' : edge.cost}
              </text>
            </g>
          );
        })}

        {/* Draw Nodes */}
        {buildingData.nodes.map(node => {
          const isExit = node.type === 'exit';
          const isStart = node.id === startNode;
          const isBlocked = blockedNodes.includes(node.id) || closedExits.includes(node.id);
          
          return (
            <g 
              key={node.id} 
              onClick={() => handleNodeClick(node)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <circle 
                cx={node.x} cy={node.y} r="24"
                fill={isBlocked ? '#ffebee' : isExit ? '#4CAF50' : isStart ? '#2196F3' : '#fff'}
                stroke={isBlocked ? '#f44336' : isExit ? '#2E7D32' : isStart ? '#1565C0' : '#666'}
                strokeWidth={isBlocked ? "4" : "3"}
                strokeDasharray={isBlocked ? "4,4" : "none"}
              />
              <text 
                x={node.x} y={node.y + 5} 
                fill={isBlocked ? "#f44336" : isExit || isStart ? "#fff" : "#000"} 
                fontSize="14" fontWeight="bold" textAnchor="middle">
                {node.id}
              </text>
              <text 
                x={node.x} y={node.y + 40} 
                fill="#333" fontSize="12" textAnchor="middle">
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default App;