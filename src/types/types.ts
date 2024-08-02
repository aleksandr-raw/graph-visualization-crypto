export interface Node {
    id: string;
    type: "user" | "cex" | "bridge";
    name: string;
    usdt_balance: number;
    tokens: Token[];
}

export interface Token {
    name: string;
    amount: number;
    usdt_amount: number;
}

export interface Link {
    id: string;
    sender: string;
    receiver: string;
    usdt_amount: number;
    tokens_amount: Token[];
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}
