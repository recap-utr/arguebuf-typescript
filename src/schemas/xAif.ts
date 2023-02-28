export interface Graph {
    aif: Aif,
    ova: Ova,
}

export interface Ova {
    firstname: string,
    surname: string,
    nodes: Array<ovaNode>,
    edges: Array<ovaEdge>,
    text: ovaText
}

export interface Aif {
    nodes: Array<aifNode>,
    edges: Array<aifEdge>,
    schemeFulfillments: Array<aifSchemeFulfillment>,
    locutions: Array<aifLocution>,
    participants: Array<aifParticipant>,
}

export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export interface aifNode {
    nodeID: string,
    text: string,
    type: NodeType,
}

export interface aifEdge {
    edgeID: number,
    fromID: string,
    toID: string,
}

export interface aifSchemeFulfillment {
    nodeID: string,
    schemeID: string,
}

export interface aifLocution {
    nodeID: string,
    personID: number,
}

export interface aifParticipant {
    participantID: number,
    firstname: string,
    surname: string,
}


export interface ovaNode {
    nodeID: string,
    visible: boolean,
    x: number,
    y: number,
    timestamp: string,
}

export interface ovaEdge {
    fromID: string,
    toID: string,
    visible: boolean,
}

export interface ovaText {
    txt: string,
    url: string,
}