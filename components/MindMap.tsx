import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { MindMapNode } from '../types';

interface MindMapProps {
    data: MindMapNode;
    onNodeSelect: (node: MindMapNode | null) => void;
    selectedNode: MindMapNode | null;
    isFocusMode: boolean;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeSelect, selectedNode, isFocusMode }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);


    useEffect(() => {
        if (!svgRef.current || !gRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        const svgNode = svg.node();
        if (!svgNode) return;

        const { width, height } = svgNode.getBoundingClientRect();

        // Guard against rendering when container has no size, preventing layout errors.
        if (width === 0 || height === 0) {
            return;
        }
        
        const root = d3.hierarchy(data);
        
        // Dynamic radius calculation to ensure enough space for nodes
        const leaves = root.leaves();
        const leafCount = leaves.length || 1;
        const spacePerLeaf = 35; // Increased pixel space for each leaf node
        const requiredCircumference = leafCount * spacePerLeaf; 
        const calculatedRadius = requiredCircumference / (2 * Math.PI);
        // Ensure the map is at least a minimum size
        const minRadius = Math.min(width, height) / 2.5;
        const radius = Math.max(calculatedRadius, minRadius);

        const treeLayout = d3.tree<MindMapNode>().size([2 * Math.PI, radius]);
        treeLayout(root as any);

        g.selectAll('*').remove(); // Clear previous render

        // Subtle, theme-aware links
        g.append('g')
            .attr('fill', 'none')
            .attr('stroke', isDarkMode ? '#475569' : '#cbd5e1') // slate-600 dark, slate-300 light
            .attr('stroke-width', 1)
            .selectAll('path')
            .data(root.links())
            .join('path')
            .attr('d', d3.linkRadial<any, any>()
                .angle(d => d.x)
                .radius(d => d.y) as any
            );

        const node = g.append('g')
            .selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .on('click', (event, d) => {
                onNodeSelect(d.data);
                event.stopPropagation();
            })
            .style('cursor', 'pointer');
        
        // Theme-aware node circles
        node.append('circle')
            .attr('r', 5)
            .attr('fill', d => {
                if (d.children) {
                    return isDarkMode ? '#38bdf8' : '#0ea5e9'; // brand-400 dark, brand-500 light
                } else {
                    return isDarkMode ? '#0c4a6e' : '#e0f2fe'; // brand-900 dark, brand-100 light
                }
            })
            .attr('stroke', isDarkMode ? '#38bdf8' : '#0ea5e9') // brand-400 dark, brand-500 light
            .attr('stroke-width', 1.5);

        // Improved text rendering for readability
        const text = node.append('text')
            .attr('transform', d => `rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr('dy', '0.31em')
            .attr('x', d => d.x < Math.PI ? 8 : -8)
            .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('fill', isDarkMode ? '#f9fafb' : '#1f2937') // gray-50 or gray-800
            .text(d => d.data.title);

        // Add a halo for readability
        text.clone(true).lower()
            .attr('stroke-linejoin', 'round')
            .attr('stroke-width', 3)
            .attr('stroke', isDarkMode ? '#111827' : '#f9fafb'); // bg-gray-900 or bg-gray-50

        if (!zoomRef.current) {
            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.05, 5])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                });
            svg.call(zoomRef.current);
        }
        
        // Zoom to fit the entire mind map on initial render
        const bounds = g.node()!.getBBox();
        const padding = 100;
        const scale = Math.min(
            width / (bounds.width + padding * 2), 
            height / (bounds.height + padding * 2)
        );

        const initialTransform = d3.zoomIdentity
            .translate(
                width / 2 - (bounds.x + bounds.width / 2) * scale,
                height / 2 - (bounds.y + bounds.height / 2) * scale
            )
            .scale(scale);
        
        svg.transition().duration(750).call(zoomRef.current.transform, initialTransform);

        svg.on('click', () => onNodeSelect(null));

    }, [data, onNodeSelect]);

    useEffect(() => {
        if (!gRef.current) return;
        const g = d3.select(gRef.current);
        const isDarkMode = document.documentElement.classList.contains('dark');

        if (isFocusMode && selectedNode) {
            const ancestors = new Set();
            let current = d3.hierarchy(data).descendants().find(d => d.data === selectedNode);
            while (current) {
                ancestors.add(current.data);
                current = current.parent as any;
            }

            // Filter for elements with data to avoid errors on container <g> elements
            g.selectAll<SVGGElement, d3.HierarchyNode<MindMapNode>>('g')
                .filter(d => d) 
                .transition().duration(300)
                .attr('opacity', d => ancestors.has(d.data) ? 1 : 0.15);

            g.selectAll('path')
                .transition().duration(300)
                .attr('stroke-opacity', d => ancestors.has((d as any).source.data) && ancestors.has((d as any).target.data) ? 1 : 0.1);
            
            g.selectAll<SVGCircleElement, d3.HierarchyNode<MindMapNode>>('circle')
               .transition().duration(300)
               .attr('r', d => d.data === selectedNode ? 8 : 5)
               .attr('fill', d => {
                   if (d.data === selectedNode) return '#f59e0b'; // amber-500
                   if (d.children) return isDarkMode ? '#38bdf8' : '#0ea5e9';
                   return isDarkMode ? '#0c4a6e' : '#e0f2fe';
                });

        } else {
            g.selectAll('g').transition().duration(300).attr('opacity', 1);
            g.selectAll('path').transition().duration(300).attr('stroke-opacity', 1);
            g.selectAll<SVGCircleElement, d3.HierarchyNode<MindMapNode>>('circle')
               .transition().duration(300)
               .attr('r', 5)
               .attr('fill', d => {
                    if (d.children) {
                        return isDarkMode ? '#38bdf8' : '#0ea5e9';
                    } else {
                        return isDarkMode ? '#0c4a6e' : '#e0f2fe';
                    }
                });
        }
    }, [isFocusMode, selectedNode, data]);


    return (
        <svg id="mindmap-svg" ref={svgRef} className="w-full h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <g ref={gRef}></g>
        </svg>
    );
};

export default MindMap;