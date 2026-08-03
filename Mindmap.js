import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MindMap = () => {
  const svgRef = useRef();
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem("mindmap-nodes");
    return saved ? JSON.parse(saved) : [{ id: 1, text: "Main Idea", x: 400, y: 300 }];
  });
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem("mindmap-links");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("mindmap-nodes", JSON.stringify(nodes));
    localStorage.setItem("mindmap-links", JSON.stringify(links));
  }, [nodes, links]);

  // Export JSON
  const exportJSON = () => {
    const data = { nodes, links };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindmap.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      setNodes(data.nodes || []);
      setLinks(data.links || []);
    };
    reader.readAsText(file);
  };

  // Export PNG
  const exportPNG = async () => {
    const svgElement = svgRef.current;
    const canvas = await html2canvas(svgElement);
    const link = document.createElement("a");
    link.download = "mindmap.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Export PDF
  const exportPDF = async () => {
    const svgElement = svgRef.current;
    const canvas = await html2canvas(svgElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 180);
    pdf.save("mindmap.pdf");
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom + Pan
    const zoom = d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Draw links
    g.selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", (d) => nodes.find((n) => n.id === d.source).x)
      .attr("y1", (d) => nodes.find((n) => n.id === d.source).y)
      .attr("x2", (d) => nodes.find((n) => n.id === d.target).x)
      .attr("y2", (d) => nodes.find((n) => n.id === d.target).y)
      .attr("stroke", "#333")
      .attr("stroke-width", 2);

    // Drag behavior
    const drag = d3.drag()
      .on("drag", (event, d) => {
        d.x = event.x;
        d.y = event.y;
        setNodes([...nodes]);
      });

    // Draw nodes
    const nodeGroup = g.selectAll("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(drag)
      .on("dblclick", (event, d) => {
        const newId = nodes.length + 1;
        const newNode = { id: newId, text: `Node ${newId}`, x: d.x + 120, y: d.y + 50 };
        setNodes([...nodes, newNode]);
        setLinks([...links, { source: d.id, target: newId }]);
      });

    nodeGroup.append("circle")
      .attr("r", 40)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", "#4f46e5");

    nodeGroup.append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "white")
      .text((d) => d.text);

  }, [nodes, links]);

  return (
    <div>
      <div style={{ margin: "10px", textAlign: "center" }}>
        <button onClick={exportJSON}>Export JSON</button>
        <input type="file" accept=".json" onChange={importJSON} />
        <button onClick={exportPNG}>Export PNG</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>
      <svg
        ref={svgRef}
        width="1000"
        height="600"
        style={{ border: "1px solid #ccc", background: "#f9fafb" }}
      ></svg>
    </div>
  );
};

export default MindMap;
