/**
 * Export diagram canvas to PNG/SVG/PDF with watermark
 */

export interface RasterExportOptions {
  format: 'png' | 'svg' | 'pdf';
  quality?: number; // 0.1 to 1.0 for PNG
  watermark?: boolean;
}

/**
 * Export React Flow canvas to PNG
 */
export async function exportPNG(
  reactFlowInstance: any,
  options: RasterExportOptions = { format: 'png', watermark: true }
): Promise<Blob> {
  const canvas = await createCanvasFromReactFlow(reactFlowInstance);
  
  if (options.watermark) {
    await addWatermark(canvas);
  }
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', options.quality || 0.8);
  });
}

/**
 * Export React Flow canvas to SVG
 */
export async function exportSVG(
  reactFlowInstance: any,
  options: RasterExportOptions = { format: 'svg', watermark: true }
): Promise<string> {
  const svgElement = await createSVGFromReactFlow(reactFlowInstance);
  
  if (options.watermark) {
    await addSVGWatermark(svgElement);
  }
  
  return new XMLSerializer().serializeToString(svgElement);
}

/**
 * Export to PDF using SVG conversion
 */
export async function exportPDF(
  reactFlowInstance: any,
  options: RasterExportOptions = { format: 'pdf', watermark: true }
): Promise<Blob> {
  // For now, we'll convert to PNG and then to PDF
  // In a full implementation, you'd use jsPDF or similar
  const canvas = await createCanvasFromReactFlow(reactFlowInstance);
  
  if (options.watermark) {
    await addWatermark(canvas);
  }
  
  // This is a simplified PDF creation - in reality you'd use a proper PDF library
  const imgData = canvas.toDataURL('image/png');
  
  // Create a simple PDF-like blob (this is a placeholder)
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${canvas.width} ${canvas.height}]
/Resources <<
  /XObject <<
    /Image1 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${canvas.width}
/Height ${canvas.height}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${imgData.length}
>>
stream
${imgData}
endstream
endobj

5 0 obj
<<
/Length 44
>>
stream
q
${canvas.width} 0 0 ${canvas.height} 0 0 cm
/Image1 Do
Q
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

/**
 * Create a canvas from React Flow instance
 */
async function createCanvasFromReactFlow(reactFlowInstance: any): Promise<HTMLCanvasElement> {
  const { getNodes, getEdges, getViewport } = reactFlowInstance;
  const nodes = getNodes();
  const edges = getEdges();
  const viewport = getViewport();

  // Get the React Flow container
  const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!reactFlowElement) {
    throw new Error('React Flow container not found');
  }

  // Calculate bounds
  const bounds = calculateBounds(nodes, viewport);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = bounds.width + 100; // Add padding
  canvas.height = bounds.height + 100;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid background (optional)
  drawGrid(ctx, canvas.width, canvas.height);

  // Render nodes and edges to canvas
  await renderDiagramToCanvas(ctx, nodes, edges, bounds);

  return canvas;
}

/**
 * Create SVG from React Flow instance
 */
async function createSVGFromReactFlow(reactFlowInstance: any): Promise<SVGElement> {
  const { getNodes, getEdges, getViewport } = reactFlowInstance;
  const nodes = getNodes();
  const edges = getEdges();
  const viewport = getViewport();

  const bounds = calculateBounds(nodes, viewport);
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', (bounds.width + 100).toString());
  svg.setAttribute('height', (bounds.height + 100).toString());
  svg.setAttribute('viewBox', `0 0 ${bounds.width + 100} ${bounds.height + 100}`);

  // Add background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', '#ffffff');
  svg.appendChild(background);

  // Render diagram to SVG
  await renderDiagramToSVG(svg, nodes, edges, bounds);

  return svg;
}

/**
 * Add watermark to canvas
 */
async function addWatermark(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    // Load watermark image (Erdus logo)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load watermark image'));
      // In a real implementation, you'd load from /assets/icono-erdus-azul.png
      img.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="none"/>
          <text x="50" y="50" text-anchor="middle" dominant-baseline="central" 
                font-family="Arial, sans-serif" font-size="16" fill="#3b82f6" opacity="0.3">
            ERDUS
          </text>
        </svg>
      `);
    });

    // Calculate watermark position (center, diagonal)
    const watermarkSize = 120;
    const x = (canvas.width - watermarkSize) / 2;
    const y = (canvas.height - watermarkSize) / 2;

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.translate(x + watermarkSize / 2, y + watermarkSize / 2);
    ctx.rotate(-Math.PI / 6); // 30 degrees
    ctx.drawImage(img, -watermarkSize / 2, -watermarkSize / 2, watermarkSize, watermarkSize);
    ctx.restore();
  } catch (error) {
    console.warn('Failed to add watermark:', error);
  }
}

/**
 * Add watermark to SVG
 */
async function addSVGWatermark(svg: SVGElement): Promise<void> {
  const width = parseFloat(svg.getAttribute('width') || '0');
  const height = parseFloat(svg.getAttribute('height') || '0');

  const watermark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  watermark.setAttribute('x', (width / 2).toString());
  watermark.setAttribute('y', (height / 2).toString());
  watermark.setAttribute('text-anchor', 'middle');
  watermark.setAttribute('dominant-baseline', 'central');
  watermark.setAttribute('font-family', 'Arial, sans-serif');
  watermark.setAttribute('font-size', '24');
  watermark.setAttribute('fill', '#3b82f6');
  watermark.setAttribute('opacity', '0.12');
  watermark.setAttribute('transform', `rotate(-30, ${width / 2}, ${height / 2})`);
  watermark.textContent = 'ERDUS';

  svg.appendChild(watermark);
}

/**
 * Calculate diagram bounds
 */
function calculateBounds(nodes: any[], viewport: any) {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.measured?.width || 280;
    const height = node.measured?.height || 200;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Draw grid background on canvas
 */
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gridSize = 20;
  
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Render diagram to canvas - simplified version
 */
async function renderDiagramToCanvas(
  ctx: CanvasRenderingContext2D, 
  nodes: any[], 
  edges: any[], 
  bounds: any
): Promise<void> {
  const padding = 50;

  // Draw edges first (so they appear behind nodes)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      ctx.beginPath();
      ctx.moveTo(
        sourceNode.position.x - bounds.x + padding + (sourceNode.measured?.width || 280) / 2,
        sourceNode.position.y - bounds.y + padding + (sourceNode.measured?.height || 200) / 2
      );
      ctx.lineTo(
        targetNode.position.x - bounds.x + padding + (targetNode.measured?.width || 280) / 2,
        targetNode.position.y - bounds.y + padding + (targetNode.measured?.height || 200) / 2
      );
      ctx.stroke();
    }
  });

  // Draw nodes
  nodes.forEach(node => {
    const x = node.position.x - bounds.x + padding;
    const y = node.position.y - bounds.y + padding;
    const width = node.measured?.width || 280;
    const height = node.measured?.height || 200;

    // Draw table background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, width, height);
    
    // Draw table border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw table header
    const headerHeight = 40;
    ctx.fillStyle = node.data.color || '#3b82f6';
    ctx.fillRect(x, y, width, headerHeight);

    // Draw table name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(node.data.table.name, x + 12, y + 25);

    // Draw columns
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px monospace';
    node.data.table.columns.forEach((column: any, index: number) => {
      const columnY = y + headerHeight + 20 + (index * 22);
      let columnText = column.name + ': ' + column.type;
      
      if (column.isPrimaryKey) columnText += ' (PK)';
      if (column.references) columnText += ' → ' + column.references.table;
      
      ctx.fillText(columnText, x + 12, columnY);
    });
  });
}

/**
 * Render diagram to SVG - simplified version
 */
async function renderDiagramToSVG(
  svg: SVGElement, 
  nodes: any[], 
  edges: any[], 
  bounds: any
): Promise<void> {
  const padding = 50;

  // Draw edges
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (sourceNode.position.x - bounds.x + padding + (sourceNode.measured?.width || 280) / 2).toString());
      line.setAttribute('y1', (sourceNode.position.y - bounds.y + padding + (sourceNode.measured?.height || 200) / 2).toString());
      line.setAttribute('x2', (targetNode.position.x - bounds.x + padding + (targetNode.measured?.width || 280) / 2).toString());
      line.setAttribute('y2', (targetNode.position.y - bounds.y + padding + (targetNode.measured?.height || 200) / 2).toString());
      line.setAttribute('stroke', '#64748b');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    }
  });

  // Draw nodes
  nodes.forEach(node => {
    const x = node.position.x - bounds.x + padding;
    const y = node.position.y - bounds.y + padding;
    const width = node.measured?.width || 280;
    const height = node.measured?.height || 200;

    // Create group for the table
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Table background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', x.toString());
    background.setAttribute('y', y.toString());
    background.setAttribute('width', width.toString());
    background.setAttribute('height', height.toString());
    background.setAttribute('fill', '#ffffff');
    background.setAttribute('stroke', '#d1d5db');
    background.setAttribute('stroke-width', '2');
    group.appendChild(background);

    // Header
    const headerHeight = 40;
    const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    header.setAttribute('x', x.toString());
    header.setAttribute('y', y.toString());
    header.setAttribute('width', width.toString());
    header.setAttribute('height', headerHeight.toString());
    header.setAttribute('fill', node.data.color || '#3b82f6');
    group.appendChild(header);

    // Table name
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', (x + 12).toString());
    title.setAttribute('y', (y + 25).toString());
    title.setAttribute('fill', '#ffffff');
    title.setAttribute('font-family', 'sans-serif');
    title.setAttribute('font-size', '16');
    title.setAttribute('font-weight', 'bold');
    title.textContent = node.data.table.name;
    group.appendChild(title);

    // Columns
    node.data.table.columns.forEach((column: any, index: number) => {
      const columnY = y + headerHeight + 20 + (index * 22);
      let columnText = column.name + ': ' + column.type;
      
      if (column.isPrimaryKey) columnText += ' (PK)';
      if (column.references) columnText += ' → ' + column.references.table;
      
      const columnElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      columnElement.setAttribute('x', (x + 12).toString());
      columnElement.setAttribute('y', columnY.toString());
      columnElement.setAttribute('fill', '#1f2937');
      columnElement.setAttribute('font-family', 'monospace');
      columnElement.setAttribute('font-size', '14');
      columnElement.textContent = columnText;
      group.appendChild(columnElement);
    });

    svg.appendChild(group);
  });
}