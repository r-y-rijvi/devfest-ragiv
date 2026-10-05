import { useState } from 'react';
import buildingData from './building.json';
import './App.css';

function App() {
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'
  const [startNode, setStartNode] = useState(null);
  
  // Hazard States
  const [blockedNodes, setBlockedNodes] = useState(buildingData.initial_state.blocked_nodes);
  const [blockedEdges, setBlockedEdges] = useState(buildingData.initial_state.blocked_edges);
  const [closedExits, setClosedExits] = useState(buildingData.initial_state.closed_exits);

  const resetHazards = () => {
    setBlockedNodes(buildingData.initial_state.blocked_nodes);
    setBlockedEdges(buildingData.initial_state.blocked_edges);
    setClosedExits(buildingData.initial_state.closed_exits);
    setStartNode(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>{language === 'en' ? 'Smart Escape' : 'স্মার্ট এস্কেপ'}</h1>
        <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}>
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </header>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={resetHazards}>
          {language === 'en' ? 'Reset Hazards' : 'রিসেট করুন'}
        </button>
      </div>

      {/* Map Area using SVG */}
      <svg width="800" height="500" style={{ border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
        {/* Draw Edges */}
        {buildingData.edges.map(edge => {
          const fromNode = buildingData.nodes.find(n => n.id === edge.from);
          const toNode = buildingData.nodes.find(n => n.id === edge.to);
          return (
            <line 
              key={edge.id}
              x1={fromNode.x} y1={fromNode.y} 
              x2={toNode.x} y2={toNode.y}
              stroke="gray" strokeWidth="4"
            />
          );
        })}

        {/* Draw Nodes */}
        {buildingData.nodes.map(node => (
          <circle 
            key={node.id}
            cx={node.x} cy={node.y} r="20"
            fill={node.type === 'exit' ? 'green' : 'blue'}
          />
        ))}
      </svg>
    </div>
  );
}

export default App;
