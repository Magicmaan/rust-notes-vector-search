import { NoteDisplay, type Note as NoteType } from "@/types";

export type CanvasCardIconKey =
	| "target"
	| "user"
	| "lightbulb"
	| "chart"
	| "scale"
	| "roadmap"
	| "warning"
	| "spark"
	| "pen"
	| "question";

export type CanvasCardKind = "text" | "bullets" | "roadmap";

export type CanvasCardState = "default" | "selected";

export type CanvasRoadmapColumn = {
	title: string;
	items: Array<{ label: string; done: boolean }>;
	period: string;
};

export type CanvasCardMock = {
	id: string;
	title: string;
	icon: CanvasCardIconKey;
	kind: CanvasCardKind;
	state: CanvasCardState;
	tag: string;
	accent: string;
	lines?: string[];
	roadmap?: CanvasRoadmapColumn[];
	layout: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	backgroundColor?: string;
};

export const thoughtSpaceCardMocks: CanvasCardMock[] = [
	{
		id: "1",
		title: "Mission",
		icon: "target",
		kind: "text",
		state: "default",
		tag: "#product",
		accent: "#f08b63",
		lines: [
			"Build a tool that helps",
			"thinkers organize complex",
			"ideas visually.",
		],
		layout: { x: 8, y: 10, width: 15, height: 14 },
	},
	{
		id: "2",
		title: "User Needs",
		icon: "user",
		kind: "bullets",
		state: "default",
		tag: "#research",
		accent: "#89d774",
		lines: [
			"Visual organization",
			"Flexible structure",
			"Focus & clarity",
			"Offline first",
		],
		layout: { x: 26, y: 10, width: 15, height: 16 },
	},
	{
		id: "3",
		title: "Core Idea",
		icon: "lightbulb",
		kind: "text",
		state: "selected",
		tag: "#ideas",
		accent: "#ebd06b",
		lines: [
			"A spatial canvas where",
			"notes live on an infinite",
			"grid, connecting ideas",
			"naturally.",
		],
		layout: { x: 44, y: 10, width: 18, height: 16 },
		backgroundColor: "#5f7d6a",
	},
	{
		id: "4",
		title: "Success Metrics",
		icon: "chart",
		kind: "bullets",
		state: "default",
		tag: "#product",
		accent: "#e4c35b",
		lines: [
			"Daily active users",
			"Canvas creations",
			"Retention rate",
			"User satisfaction",
		],
		layout: { x: 67, y: 10, width: 16, height: 15 },
	},
	{
		id: "5",
		title: "Key Principles",
		icon: "scale",
		kind: "bullets",
		state: "default",
		tag: "#product",
		accent: "#83a7ef",
		lines: [
			"Simple, not simplistic",
			"Powerful by default",
			"Local first, always",
			"Beautiful & calm",
		],
		layout: { x: 8, y: 28, width: 16, height: 16 },
	},
	{
		id: "6",
		title: "Product Roadmap",
		icon: "roadmap",
		kind: "roadmap",
		state: "default",
		tag: "#roadmap",
		accent: "#af8bf6",
		roadmap: [
			{
				title: "MVP",
				items: [
					{ label: "Canvas basics", done: true },
					{ label: "Notes & cards", done: false },
					{ label: "Linking", done: false },
				],
				period: "Q2 2024",
			},
			{
				title: "Next",
				items: [
					{ label: "Backlinks", done: false },
					{ label: "Templates", done: false },
					{ label: "Mobile app", done: false },
				],
				period: "Q3 2024",
			},
			{
				title: "Future",
				items: [
					{ label: "Collaboration", done: false },
					{ label: "Publish & share", done: false },
					{ label: "API & plugins", done: false },
				],
				period: "Q4 2024+",
			},
		],
		layout: { x: 27, y: 29, width: 29, height: 15 },
	},
	{
		id: "7",
		title: "Potential Risks",
		icon: "warning",
		kind: "bullets",
		state: "default",
		tag: "#product",
		accent: "#ea8f6e",
		lines: [
			"Complexity creep",
			"Performance at scale",
			"Mobile parity",
			"Adoption barrier",
		],
		layout: { x: 58, y: 29, width: 16, height: 15 },
	},
	{
		id: "8",
		title: "Inspiration",
		icon: "spark",
		kind: "text",
		state: "default",
		tag: "#inspiration",
		accent: "#e8c465",
		lines: [
			"Miro's spatial freedom",
			"meets Obsidian's focus",
			"and Notion's polish.",
		],
		layout: { x: 22, y: 48, width: 14, height: 12 },
	},
	{
		id: "9",
		title: "Design Direction",
		icon: "pen",
		kind: "text",
		state: "default",
		tag: "#design",
		accent: "#74c6eb",
		lines: [
			"Calm, minimal, and tactile.",
			"Dark mode first. Subtle",
			"details that feel intelligent.",
		],
		layout: { x: 38, y: 48, width: 16, height: 12 },
	},
	{
		id: "10",
		title: "Open Questions",
		icon: "question",
		kind: "bullets",
		state: "default",
		tag: "#ideas",
		accent: "#c58bf5",
		lines: [
			"How might we make large canvases feel effortless?",
			"What's the right balance of structure vs. freedom?",
			"How do we help users discover features?",
		],
		layout: { x: 55, y: 48, width: 26, height: 12 },
	},
];

const cardById = new Map(thoughtSpaceCardMocks.map((card) => [card.id, card]));

export function getThoughtSpaceCardMock(id: string): CanvasCardMock | undefined {
	return cardById.get(id);
}

export function buildInitialThoughtSpaceDisplays(
	defaultNoteColor: string,
): NoteDisplay[] {
	const now = new Date();

	return thoughtSpaceCardMocks.map((card) => {
		const note: NoteType = {
			id: card.id,
			title: card.title,
			content: (card.lines ?? []).join("\n"),
			createdAt: now,
			updatedAt: now,
		};

		return new NoteDisplay({
			x: card.layout.x,
			y: card.layout.y,
			width: card.layout.width,
			height: card.layout.height,
			note,
			stat: card.state === "selected",
			backgroundColor: card.backgroundColor ?? defaultNoteColor,
		});
	});
}
