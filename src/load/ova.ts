import * as date from "../date.js";
import * as model from "../model/index.js";
import { NodeType } from "../schemas/aif.js";
import * as ovaSchema from "../schemas/ova.js";

const aif2scheme = (scheme: NodeType) => {
  switch (scheme) {
    case "RA":
      return "support";
    case "CA":
      return "attack";
    case "MA":
      return "rephrase";
    case "PA":
      return "preference";
    default:
      return undefined;
  }
};

const text2support = (text: string) => {
  switch (text) {
    case "Alternatives":
      return model.Support.ALTERNATIVES;
    case "Analogy":
      return model.Support.ANALOGY;
    case "Arbitrary Verbal Classification":
      return model.Support.VERBAL_CLASSIFICATION;
    case "Argument From Authority":
      return model.Support.DEFAULT;
    case "Argument From Goodwill":
      return model.Support.DEFAULT;
    case "Argument From Moral Virtue":
      return model.Support.DEFAULT;
    case "Argument From Practical Wisdom":
      return model.Support.DEFAULT;
    case "Argument From Virtue/Goodwill":
      return model.Support.DEFAULT;
    case "Argument From Wisdom/Goodwill":
      return model.Support.DEFAULT;
    case "Argument From Wisdom/Virtue":
      return model.Support.DEFAULT;
    case "Argument From Wisdom/Virtue/Goodwill":
      return model.Support.DEFAULT;
    case "Authority":
      return model.Support.DEFAULT;
    case "Bias":
      return model.Support.BIAS;
    case "Causal Slippery Slope":
      return model.Support.SLIPPERY_SLOPE;
    case "Cause To Effect":
      return model.Support.CAUSE_TO_EFFECT;
    case "Circumstantial Ad Hominem":
      return model.Support.CIRCUMSTANTIAL_AD_HOMINEM;
    case "Commitment":
      return model.Support.COMMITMENT;
    case "Composition":
      return model.Support.COMPOSITION;
    case "Consequences":
      return model.Support.CONSEQUENCES;
    case "Correlation To Cause":
      return model.Support.CORRELATION_TO_CAUSE;
    case "Danger Appeal":
      return model.Support.DANGER_APPEAL;
    case "Default Inference":
      return model.Support.DEFAULT;
    case "Definitional":
      return model.Support.DEFAULT;
    case "Definition To Verbal Classification":
      return model.Support.VERBAL_CLASSIFICATION;
    case "Dilemma":
      return model.Support.DEFAULT;
    case "Direct Ad Hominem":
      return model.Support.GENERIC_AD_HOMINEM;
    case "Division":
      return model.Support.DIVISION;
    case "Efficient Cause":
      return model.Support.DEFAULT;
    case "Established Rule":
      return model.Support.DEFAULT;
    case "Ethotic":
      return model.Support.ETHOTIC;
    case "Evidence To Hypothesis":
      return model.Support.EVIDENCE_TO_HYPOTHESIS;
    case "Example":
      return model.Support.EXAMPLE;
    case "Exceptional Case":
      return model.Support.EXCEPTIONAL_CASE;
    case "Expert Opinion":
      return model.Support.EXPERT_OPINION;
    case "Falsification Of Hypothesis":
      return model.Support.DEFAULT;
    case "Fear Appeal":
      return model.Support.FEAR_APPEAL;
    case "Final Cause":
      return model.Support.DEFAULT;
    case "Formal Cause":
      return model.Support.DEFAULT;
    case "From-all-the-more-so-OR-all-the-less-so":
      return model.Support.DEFAULT;
    case "From-alternatives":
      return model.Support.ALTERNATIVES;
    case "From-analogy":
      return model.Support.ANALOGY;
    case "From-authority":
      return model.Support.DEFAULT;
    case "From-conjugates-OR-derivates":
      return model.Support.DEFAULT;
    case "From-correlates":
      return model.Support.DEFAULT;
    case "From-definition":
      return model.Support.DEFAULT;
    case "From-description":
      return model.Support.DEFAULT;
    case "From-efficient-cause":
      return model.Support.DEFAULT;
    case "From-final-OR-instrumental-cause":
      return model.Support.DEFAULT;
    case "From-formal-cause":
      return model.Support.DEFAULT;
    case "From-genus-and-species":
      return model.Support.DEFAULT;
    case "From-material-cause":
      return model.Support.DEFAULT;
    case "From-ontological-implications":
      return model.Support.DEFAULT;
    case "From-opposition":
      return model.Support.OPPOSITIONS;
    case "From-parts-and-whole":
      return model.Support.DIVISION;
    case "From-place":
      return model.Support.DEFAULT;
    case "From-promising-and-warning":
      return model.Support.DEFAULT;
    case "From-termination-and-inception":
      return model.Support.DEFAULT;
    case "From-time":
      return model.Support.DEFAULT;
    case "Full Slippery Slope":
      return model.Support.FULL_SLIPPERY_SLOPE;
    case "Generic Ad Hominem":
      return model.Support.GENERIC_AD_HOMINEM;
    case "Gradualism":
      return model.Support.GRADUALISM;
    case "Ignorance":
      return model.Support.IGNORANCE;
    case "Inconsistent Commitment":
      return model.Support.INCONSISTENT_COMMITMENT;
    case "Informant Report":
      return model.Support.DEFAULT;
    case "Interaction Of Act And Person":
      return model.Support.INTERACTION_OF_ACT_AND_PERSON;
    case "Material Cause":
      return model.Support.DEFAULT;
    case "Mereological":
      return model.Support.DEFAULT;
    case "Modus Ponens":
      return model.Support.DEFAULT;
    case "Need For Help":
      return model.Support.NEED_FOR_HELP;
    case "Negative Consequences":
      return model.Support.NEGATIVE_CONSEQUENCES;
    case "Opposition":
      return model.Support.OPPOSITIONS;
    case "Paraphrase":
      return model.Support.DEFAULT;
    case "Perception":
      return model.Support.PERCEPTION;
    case "Popular Opinion":
      return model.Support.POPULAR_OPINION;
    case "Popular Practice":
      return model.Support.POPULAR_PRACTICE;
    case "Position To Know":
      return model.Support.POSITION_TO_KNOW;
    case "Positive Consequences":
      return model.Support.POSITIVE_CONSEQUENCES;
    case "Practical Evaluation":
      return model.Support.DEFAULT;
    case "Practical Reasoning":
      return model.Support.PRACTICAL_REASONING;
    case "Practical Reasoning From Analogy":
      return model.Support.PRACTICAL_REASONING_FROM_ANALOGY;
    case "Pragmatic Argument From Alternatives":
      return model.Support.PRAGMATIC_ALTERNATIVES;
    case "Pragmatic Inconsistency":
      return model.Support.PRAGMATIC_INCONSISTENCY;
    case "Precedent Slippery Slope":
      return model.Support.PRECEDENT_SLIPPERY_SLOPE;
    case "Reframing":
      return model.Support.DEFAULT;
    case "Rules":
      return model.Support.RULES;
    case "Sign":
      return model.Support.SIGN;
    case "Two Person Practical Reasoning":
      return model.Support.TWO_PERSON_PRACTICAL_REASONING;
    case "Vagueness Of Verbal Classification":
      return model.Support.VERBAL_CLASSIFICATION;
    case "Vague Verbal Classification":
      return model.Support.VERBAL_CLASSIFICATION;
    case "Value Based Practical Reasoning":
      return model.Support.PRACTICAL_REASONING;
    case "Values":
      return model.Support.VALUES;
    case "Verbal Classification":
      return model.Support.VERBAL_CLASSIFICATION;
    case "Verbal Slippery Slope":
      return model.Support.VERBAL_SLIPPERY_SLOPE;
    case "Waste":
      return model.Support.WASTE;
    case "Witness Testimony":
      return model.Support.WITNESS_TESTIMONY;
    default:
      return model.Support.DEFAULT;
  }
};

export function ova(obj: ovaSchema.Graph): model.Graph {
  const nodes: Record<string, model.Node> = {};
  const edges: Record<string, model.Edge> = {};

  const participants = Object.entries(obj.participants).map(
    ([, p]) =>
      new model.Participant({
        name: p.firstname + p.surname,
        id: p.id.toString(),
      }),
  );

  let majorClaim;
  obj.nodes.forEach((n) => {
    let node;
    if (n.type === "I") {
      node = atomFromOva(n);
    } else {
      node = schemeFromOva(n);
    }

    if (node !== undefined) {
      nodes[node.id] = node;

      if (n.majorClaim && node.type === "atom") {
        majorClaim = node.text;
      }
    }
  });

  obj.edges.forEach((e) => {
    const edge = edgeFromOva(e, nodes);
    if (edge !== undefined) {
      edges[edge.id] = edge;
    }
  });

  return new model.Graph({
    nodes: nodes,
    edges: edges,
    resources: [resourceFromOva(obj.analysis)],
    participants: participants,
    analysts:
      obj.analysis.annotatorName !== undefined
        ? [new model.Analyst({ name: obj.analysis.annotatorName })]
        : [],
    majorClaim: majorClaim,
  });
}

function resourceFromOva(obj: ovaSchema.Analysis): model.Resource {
  return new model.Resource({
    text: obj.plain_txt === undefined ? "" : obj.plain_txt,
    title: obj.documentTitle === undefined ? "" : obj.documentTitle,
    source: obj.documentSource === undefined ? "" : obj.documentSource,
  });
}

function schemeFromOva(obj: ovaSchema.Node): model.SchemeNode | undefined {
  const ovaType = obj.type;
  const ovaScheme = obj.text;

  const schemeType = aif2scheme(ovaType);
  if (schemeType !== undefined) {
    let scheme: model.Scheme;

    switch (schemeType) {
      case "attack":
        scheme = {
          case: "attack",
          value: model.Attack.DEFAULT,
        };
        break;
      case "preference":
        scheme = {
          case: "preference",
          value: model.Preference.DEFAULT,
        };
        break;
      case "rephrase":
        scheme = {
          case: "rephrase",
          value: model.Rephrase.DEFAULT,
        };
        break;
      default: {
        // support
        const foundScheme = text2support(ovaScheme);
        scheme = {
          case: "support",
          value:
            foundScheme !== undefined ? foundScheme : model.Support.DEFAULT,
        };
        break;
      }
    }

    const premise_descriptors = Object.entries(obj.descriptors)
      .filter(([description]) =>
        description.toLowerCase().startsWith("s_conclusion"),
      )
      .map(([, node_id]) => node_id.toString());

    const timestamp =
      obj.date === undefined
        ? date.now()
        : date.parse(obj.date, ovaSchema.DATE_FORMAT);

    return new model.SchemeNode({
      id: obj.id.toString(),
      metadata: new model.Metadata({
        created: timestamp,
        updated: timestamp,
      }),
      premise_descriptors: premise_descriptors,
      scheme: scheme,
    });
  } else {
    throw new Error("SchemeType undefined!");
  }
}

function atomFromOva(obj: ovaSchema.Node): model.AtomNode {
  const timestamp =
    obj.date === undefined
      ? date.now()
      : date.parse(obj.date, ovaSchema.DATE_FORMAT);
  return new model.AtomNode({
    id: obj.id.toString(),
    text: obj.text,
    metadata: new model.Metadata({
      created: timestamp,
      updated: timestamp,
    }),
  });
}

function edgeFromOva(
  obj: ovaSchema.Edge,
  nodes: Record<string, model.Node>,
): model.Edge | undefined {
  const source_id = obj.from.id;
  const target_id = obj.to.id;
  const timestamp =
    obj.date === undefined
      ? date.now()
      : date.parse(obj.date, ovaSchema.DATE_FORMAT);

  if (nodes[source_id] !== undefined && nodes[target_id] !== undefined) {
    return new model.Edge({
      source: source_id.toString(),
      target: target_id.toString(),
      metadata: new model.Metadata({
        created: timestamp,
        updated: timestamp,
      }),
    });
  } else {
    throw new Error("Source- or target-node undefined!");
  }
}
