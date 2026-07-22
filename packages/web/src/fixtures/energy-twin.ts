export type TwinNode = {
  id: string;
  name: string;
  kw: number;
  kind: "asset" | "section";
  children?: TwinNode[];
  edgeFromParent?: { transferKw: number; lossPct?: number };
};

/** Cement-plant energy hierarchy for 2D expandable twin (fixture). */
export const energyTwinFixture: TwinNode = {
  id: "eb_incomer",
  name: "EB Incomer",
  kw: 863,
  kind: "asset",
  children: [
    {
      id: "utility_incomer",
      name: "Utility Incomer",
      kw: 322.21,
      kind: "asset",
      edgeFromParent: { transferKw: 324, lossPct: 0.6 },
    },
    {
      id: "section_pyro",
      name: "Pyro section",
      kw: 412,
      kind: "section",
      edgeFromParent: { transferKw: 418, lossPct: 1.4 },
      children: [
        {
          id: "kiln_1",
          name: "Kiln 1",
          kw: 286,
          kind: "asset",
          edgeFromParent: { transferKw: 290, lossPct: 1.4 },
        },
        {
          id: "preheater",
          name: "Preheater fan",
          kw: 74,
          kind: "asset",
          edgeFromParent: { transferKw: 76, lossPct: 2.6 },
        },
        {
          id: "cooler",
          name: "Grate cooler",
          kw: 52,
          kind: "asset",
          edgeFromParent: { transferKw: 52, lossPct: 0 },
        },
      ],
    },
    {
      id: "section_grind",
      name: "Grinding section",
      kw: 98.4,
      kind: "section",
      edgeFromParent: { transferKw: 102, lossPct: 3.5 },
      children: [
        {
          id: "cm_1",
          name: "Cement Mill 1",
          kw: 58.2,
          kind: "asset",
          edgeFromParent: { transferKw: 60, lossPct: 3 },
        },
        {
          id: "mill_2",
          name: "Raw Mill 2",
          kw: 40.2,
          kind: "asset",
          edgeFromParent: { transferKw: 42, lossPct: 4.3 },
        },
      ],
    },
    {
      id: "section_util",
      name: "Utilities & packing",
      kw: 30.4,
      kind: "section",
      edgeFromParent: { transferKw: 31, lossPct: 1.9 },
      children: [
        {
          id: "comp_2",
          name: "Compressor 2",
          kw: 14.67,
          kind: "asset",
          edgeFromParent: { transferKw: 15, lossPct: 2.2 },
        },
        {
          id: "pack_1",
          name: "Packing line 1",
          kw: 9.1,
          kind: "asset",
          edgeFromParent: { transferKw: 9.2, lossPct: 1.1 },
        },
        {
          id: "hvac_admin",
          name: "Admin HVAC",
          kw: 6.63,
          kind: "asset",
          edgeFromParent: { transferKw: 6.8, lossPct: 2.5 },
        },
      ],
    },
  ],
};

export function countTwinLeaves(node: TwinNode): number {
  if (!node.children?.length) return 1;
  return node.children.reduce((s, c) => s + countTwinLeaves(c), 0);
}
