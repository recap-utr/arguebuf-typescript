import { protobuf as toProto } from "./dump";
import { protobuf as fromProto } from "./load";
import * as model from "./model";

export function copy(
  graph: model.Graph,
  data?: model.GraphConstructor
): model.Graph {
  const copy = new model.Graph(data);
  const dump = fromProto(toProto(graph));

  if (data?.nodes === undefined) {
    Object.values(dump.nodes).forEach((x) => {
      copy.addNode(x);
    });
  }
  if (data?.edges === undefined) {
    Object.values(dump.edges).forEach((x) => {
      copy.addEdge(x);
    });
  }
  if (data?.resources === undefined) {
    Object.values(dump.resources).forEach((x) => {
      copy.addResource(x);
    });
  }
  if (data?.participants === undefined) {
    Object.values(dump.participants).forEach((x) => {
      copy.addParticipant(x);
    });
  }
  if (data?.analysts === undefined) {
    Object.values(dump.analysts).forEach((x) => {
      copy.addAnalyst(x);
    });
  }
  if (data?.majorClaim === undefined) {
    copy.majorClaim = dump.majorClaim;
  }
  if (data?.userdata === undefined) {
    copy.userdata = dump.userdata;
  }
  if (data?.metadata === undefined) {
    copy.metadata = dump.metadata;
  }

  copy.metadata.update();

  return copy;
}
