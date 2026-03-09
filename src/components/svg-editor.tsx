import React from 'react';

interface SVGEditorProps {
  className?: string;
}

export const SVGEditor: React.FC<SVGEditorProps> = ({ className }) => {
  return (
    <div className={className} role="main">
      {/* Toolbar */}
      <div data-testid="toolbar" className="toolbar">
        <button data-testid="tool-select" className="tool-button active">
          Select
        </button>
        <button data-testid="tool-rectangle" className="tool-button">
          Rectangle
        </button>
        <button data-testid="tool-circle" className="tool-button">
          Circle
        </button>
        <button data-testid="tool-pen" className="tool-button">
          Pen
        </button>
        <button data-testid="undo-button" className="action-button">
          Undo
        </button>
        <button data-testid="redo-button" className="action-button">
          Redo
        </button>
        <button data-testid="export-button" className="action-button">
          Export
        </button>
        <input 
          data-testid="file-input" 
          type="file" 
          accept=".svg" 
          style={{ display: 'none' }}
        />
      </div>
      
      {/* Main Canvas Area */}
      <div className="editor-main">
        <svg 
          data-testid="svg-canvas" 
          className="svg-canvas"
          width="800" 
          height="600"
          viewBox="0 0 800 600"
        >
          {/* SVG content will be rendered here */}
        </svg>
      </div>
      
      {/* Properties Panel */}
      <div data-testid="properties-panel" className="properties-panel">
        <div className="property-group">
          <label htmlFor="fill-color">Fill Color</label>
          <input 
            id="fill-color"
            aria-label="Fill Color"
            type="color" 
            defaultValue="#000000"
          />
        </div>
        <div className="property-group">
          <label htmlFor="stroke-color">Stroke Color</label>
          <input 
            id="stroke-color"
            aria-label="Stroke Color"
            type="color" 
            defaultValue="#000000"
          />
        </div>
        <div className="property-group">
          <label htmlFor="stroke-width">Stroke Width</label>
          <input 
            id="stroke-width"
            aria-label="Stroke Width"
            type="number" 
            defaultValue="1"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export default SVGEditor;