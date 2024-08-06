import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import {useGetMessagesMutation} from "./store/api";
import {
    D3DragEvent,
    drag,
    forceCenter,
    forceLink,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY,
    select,
    zoom,
    ZoomTransform
} from "d3";
import {useDispatch, useSelector} from "react-redux";
import {deleteGraphData, selectGraphData, updateGraphData} from "./store/graphData/graphDataSlice";
import {TransformedLink, TransformedNode} from "./types/types";

const width = 900;
const height = 600;

export const App = () => {
    const [mainAddresses, setMainAddresses] = useState<string[]>([]);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const zoomRef = useRef<ZoomTransform | null>(null);
    const [address, setAddress] = useState<string>('0x');
    const [nodePositions, setNodePositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const [groupedNodes, setGroupedNodes] = useState<string[]>([])
    const [getMessages, {data: newGraphData}] = useGetMessagesMutation();


    const dispatch = useDispatch();
    const graphData = useSelector(selectGraphData);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        if (!value.startsWith('0x')) {
            value = '0x' + value.replace(/^0x/, '');
        }

        if (value.length > 18) {
            value = value.slice(0, 18);
        }
        value = value.slice(0, 2) + value.slice(2).toUpperCase();

        setAddress(value);
    };

    const deleteData = () => {
        dispatch(deleteGraphData());
    }

    const handleMainAddresses = useCallback((address: string) => {
        setMainAddresses((prev) => prev.includes(address) ? prev : [...prev, address]);
    }, []);

    const handleNodeClick = useCallback((nodeId: string) => {
        if (!mainAddresses.includes(nodeId)) {
            return;
        }
        setGroupedNodes((prevGroupedNodes) => {
            return prevGroupedNodes.includes(nodeId) ? prevGroupedNodes.filter(n => n !== nodeId) : [...prevGroupedNodes, nodeId];
        });
    }, [mainAddresses]);

    useEffect(() => {
        if (newGraphData) {
            dispatch(updateGraphData(newGraphData));
        }
    }, [newGraphData, dispatch]);

    useEffect(() => {
        if (!graphData?.nodes || !svgRef.current) {
            return;
        }

        const svg = select<SVGSVGElement, unknown>(svgRef.current);

        const allLinks: Record<string, TransformedLink[]> = {
            shown: [],
            hidden: []
        }

        graphData.links.forEach(link => {
            if (!groupedNodes.includes(link.sender) && !groupedNodes.includes(link.receiver)) {
                allLinks.shown.push({...link} as TransformedLink);
            } else if (mainAddresses.includes(link.sender) && mainAddresses.includes(link.receiver)) {
                allLinks.shown.push({...link} as TransformedLink);
            } else {
                allLinks.hidden.push({...link} as TransformedLink);
            }
        });

        const nodes = graphData.nodes.map((node) => ({...node})).filter(node => {
            return groupedNodes.includes(node.id) || allLinks.shown.some(link => link.sender === node.id || link.receiver === node.id)
        }) as TransformedNode[];


        const simulation = forceSimulation(nodes)
            .force("link", forceLink(allLinks.shown).id((d: any) => d.id))
            .force("charge", forceManyBody().strength(-400))
            .force("center", forceCenter(width / 2, height / 2))
            .force("x", forceX())
            .force("y", forceY());

        nodes.forEach(node => {
            if (nodePositions[node.id]) {
                node.x = nodePositions[node.id].x;
                node.y = nodePositions[node.id].y;
            } else {
                if (mainAddresses.includes(node.id)) {
                    node.x = width / 2;
                    node.y = height / 2;
                }
            }
        });

        svg.append("defs").selectAll("marker")
            .data(allLinks.shown.map(d => d.id))
            .join("marker")
            .attr("id", d => `arrow-${d}`)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -0.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("fill", 'black')
            .attr("d", "M0,-5L10,0L0,5");

        const g = svg.append("g");


        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(allLinks.shown)
            .enter().append("line")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .join("path")
            .attr("marker-end", d => `url(${new URL(`#arrow-${d.id}`, window.location.href)})`);

        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("r", (d) => mainAddresses.includes(d.id) ? 10 : 5)
            .attr("fill", d => {
                switch (d.type) {
                    case "user":
                        return "blue";
                    case "cex":
                        return "red";
                    case "bridge":
                        return "green";
                    default:
                        return "gray";
                }
            })
            .on('dblclick', (event, d) => {
                handleMainAddresses(d.id);
                getMessages(d.id);
            })
            .on('click', (event, d) => {
                handleNodeClick(d.id);
            });

        const labels = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("dy", "1em")
            .attr("dx", "1em")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .text(d => `${d.id}`);

        const ticked = () => {
            node
                .attr("cx", d => d.x!)
                .attr("cy", d => d.y!);

            link
                .attr("x1", d => (d.source as TransformedNode).x!)
                .attr("y1", d => (d.source as TransformedNode).y!)
                .attr("x2", d => (d.target as TransformedNode).x!)
                .attr("y2", d => (d.target as TransformedNode).y!);

            labels
                .attr("x", d => d.x!)
                .attr("y", d => d.y!);
        }

        let positionsChanged = false;
        const newNodePositions: { [key: string]: { x: number, y: number } } = {};
        nodes.forEach(node => {
            newNodePositions[node.id] = {x: node.x!, y: node.y!};

            if (!nodePositions[node.id] || (nodePositions[node.id].x !== node.x! || nodePositions[node.id].y !== node.y!)) {
                positionsChanged = true;
            }
        });

        if (positionsChanged) {
            setNodePositions(newNodePositions);
        }

        simulation.nodes(nodes).on("tick", ticked);

        const dragstarted = (event: D3DragEvent<SVGCircleElement, TransformedNode, TransformedNode>) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        };

        const dragged = (event: D3DragEvent<SVGCircleElement, TransformedNode, TransformedNode>) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
            ticked();
        };

        const dragended = (event: D3DragEvent<SVGCircleElement, TransformedNode, TransformedNode>) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        };

        node.call(drag<SVGCircleElement, TransformedNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        const zoomed = (event: any) => {
            if (event.sourceEvent.type === 'dblclick') {
                return;
            }
            g.attr("transform", event.transform);
            zoomRef.current = event.transform;
        };

        svg.call(zoom<SVGSVGElement, unknown>().on("zoom", zoomed));

        simulation.alpha(1).restart();

        return () => {
            simulation.stop();
            svg.selectAll("*").remove();
        };
    }, [graphData, nodePositions, mainAddresses, groupedNodes, handleMainAddresses, getMessages, handleNodeClick]);

    return (
        <div className="App">
            <div className={"controls-wrapper"}>
                <div className={'input-wrapper'}>
                    <input type="text" onChange={handleInputChange} value={address}/>
                    <span className={'clear-btn'} onClick={() => setAddress('0x')}>X</span>
                </div>
                <button onClick={() => {
                    handleMainAddresses(address);
                    getMessages(address)
                }}>Get data
                </button>
            </div>
            <div className={'graph-wrapper'}>
                <button className={'delete-btn'} onClick={deleteData}>Clear</button>
                <svg className={'graph'} ref={svgRef}></svg>
            </div>
        </div>
    );
}
