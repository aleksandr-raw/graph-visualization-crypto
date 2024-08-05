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
    const [address, setAddress] = useState<string>('');
    const [nodePositions, setNodePositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const [getMessages, {data: newGraphData}] = useGetMessagesMutation();

    const dispatch = useDispatch();
    const graphData = useSelector(selectGraphData);
    const deleteData = () => {
        dispatch(deleteGraphData());
    }

    useEffect(() => {
        if (newGraphData) {
            dispatch(updateGraphData(newGraphData));
        }
    }, [newGraphData, dispatch]);

    useEffect(() => {
        if (!graphData?.nodes) return;

        if (svgRef.current) {
            const svg = select<SVGSVGElement, unknown>(svgRef.current);

            const nodes = graphData.nodes.map((node) => ({...node})) as TransformedNode[];
            const links = graphData.links.map((link) => ({...link})) as TransformedLink[];

            const simulation = forceSimulation(nodes)
                .force("link", forceLink(links).id((d: any) => d.id))
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
                        return;
                    } else {
                        const relatedLinks = links.filter(link => link.source === node.id || link.target === node.id);
                        let offsetX = 0;
                        let offsetY = 0;
                        if (relatedLinks.length === 1) {
                            offsetX = relatedLinks[0].target === node.id ? 500 : -500;
                        } else if (relatedLinks.length === 2) {
                            const total = relatedLinks.reduce((acc, link) => {
                                return acc + (link.target === node.id ? link.usdt_amount : -link.usdt_amount);
                            }, 0);
                            offsetX = total > 0 ? 500 : -500;
                        }
                        node.x = (width / 2) + offsetX;
                        node.y = (height / 2) + offsetY;
                    }
                }
            });

            svg.append("defs").selectAll("marker")
                .data(links.map(d => d.id))
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
                .data(links)
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
                    handleHandleMainAddresses(d.id);
                    getMessages(d.id);
                })
                .on('click', (event, d) => {
                    console.log(d);
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
                g.attr("transform", event.transform);
                zoomRef.current = event.transform;
            };

            svg.call(zoom<SVGSVGElement, unknown>().on("zoom", zoomed));

            simulation.alpha(1).restart();

            return () => {
                simulation.stop();
                svg.selectAll("*").remove();
            };
        }
    }, [graphData, nodePositions, mainAddresses]);

    const handleHandleMainAddresses = useCallback((address: string) => {
        setMainAddresses((prev) => prev.includes(address) ? prev : [...prev, address]);
    }, []);

    return (
        <div className="App">
            <div className={"controls-wrapper"}>
                <div className={'input-wrapper'}>
                    <input type="text" onChange={(e) => setAddress(e.target.value)} value={address}/>
                    <span className={'clear-btn'} onClick={() => setAddress('')}>X</span>
                </div>
                <button onClick={() => {
                    handleHandleMainAddresses(address);
                    getMessages(address)
                }}>Get messages
                </button>
                <button onClick={() => {
                    handleHandleMainAddresses("0x1234567890abcdef");
                    getMessages("0x1234567890abcdef")
                }}>Get! 0x1234567890abcdef
                </button>
                <button onClick={() => {
                    handleHandleMainAddresses("0x0987654321abcdef");
                    getMessages("0x0987654321abcdef")
                }}>Get! 0x0987654321abcdef
                </button>
                <button onClick={() => {
                    handleHandleMainAddresses("0x0987123456fedcab");
                    getMessages("0x0987123456fedcab")
                }}>Get! 0x0987123456fedcab
                </button>
                <button onClick={deleteData}>Delete GraphData</button>
            </div>
            <svg className={'graph'} ref={svgRef}></svg>
        </div>
    );
}
