import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {GraphData, Link, Node} from "../../types/types";
import {RootState} from '../store';

interface GraphDataState {
    nodes: Node[];
    links: Link[];
}

const initialGraphDataState: GraphDataState = {
    nodes: [],
    links: []
};

const graphDataSlice = createSlice({
    name: 'graphData',
    initialState: initialGraphDataState,
    reducers: {
        updateGraphData: (state, action: PayloadAction<GraphData>) => {
            const {nodes, links} = action.payload;

            nodes.forEach(newNode => {
                const existingNodeIndex = state.nodes.findIndex(node => node.id === newNode.id);
                if (existingNodeIndex !== -1) {
                    state.nodes[existingNodeIndex] = newNode;
                } else {
                    state.nodes.push(newNode);
                }
            });

            links.forEach(newLink => {
                const existingLinkIndex = state.links.findIndex(link => link.id === newLink.id);
                if (existingLinkIndex !== -1) {
                    state.links[existingLinkIndex] = newLink;
                } else {
                    state.links.push(newLink);
                }
            });
        },
        deleteGraphData: (state) => {
            state.nodes = [];
            state.links = [];
        },
    }
});

export const {updateGraphData, deleteGraphData} = graphDataSlice.actions;

export const selectGraphData = (state: RootState) => state.graphData;

export default graphDataSlice.reducer;
