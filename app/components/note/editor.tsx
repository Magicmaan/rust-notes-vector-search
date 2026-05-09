import React, { RefObject, useEffect, useRef } from "react";
import {
	useEditor,
	EditorContent,
	NodeViewWrapper,
	ReactNodeViewProps,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { FloatingMenu, BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { mergeAttributes, Node, nodeInputRule } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import clsx from "clsx";
import { NoteDisplay } from "@/types";
import { useNavigate } from "react-router";

const TEMPLATE_TEXT = `
:heading! hi there!

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

**Bold Text**

*Italic Text*

- List Item 1
- List Item 2
- List Item 3

[Link](https://www.example.com)

\`\`\`javascript
// Code Block
function greet() {
    
}
\`\`\`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

`;

interface NoteHeadingAttributes {
	raw: string;
	text: string;
	class: string;
}

function NoteHeading(props: ReactNodeViewProps<HTMLLabelElement>) {
	return (
		<NodeViewWrapper
			as="div"
			data-type="note-heading"
			className={clsx("rounded-md h-24 min-h-24!")}
		>
			<div
				className="absolute top-0 left-0 right-0 bottom-0 rounded-md"
				contentEditable
			>
				<h1>{props.node.attrs.text}</h1>
			</div>
		</NodeViewWrapper>
	);
}

const CustomHeadingBlock = Node.create({
	name: "note-heading",
	atom: true,
	inline: false,
	group: "block",
	defining: true,

	addAttributes() {
		return {
			raw: {
				default: ":heading! boo!",
			},
			text: {
				default: "boo!",
			},
			class: {
				default: "bg-[#ffff00] text-black",
			},
		} as Record<keyof NoteHeadingAttributes, { default: string }>;
	},
	parseHTML() {
		return [
			{
				tag: "pre[data-type='note-heading']",
				getAttrs: (node) => {
					return {
						text: node.textContent ?? "",
						class: node.getAttribute("class") ?? "bg-[#ffff00] text-black",
					};
				},
			},
		];
	},
	addNodeView() {
		return ReactNodeViewRenderer(NoteHeading);
	},
	renderHTML({ node, HTMLAttributes }) {
		return [
			"pre",
			mergeAttributes(HTMLAttributes, {
				class: clsx("bg-[#ffff00] text-black", HTMLAttributes.class),
				"data-type": "note-heading",
			}),
			node.attrs.text,
		];
	},

	parseMarkdown: (token, helpers) => {
		return {
			type: "note-heading",
			attrs: {
				raw: token.raw,
				text: token.text?.trim() ?? "",
			},
		};
	},
	renderMarkdown: (node, idx) => {
		return `:heading! ${node.attrs?.text}\n`;
	},
	markdownTokenizer: {
		name: "note-heading",
		level: "block",

		start: (src) => src.indexOf(":heading!"),
		tokenize: (src) => {
			// match lines like ":heading hello there!" capturing the text after the marker until newline
			const match = src.match(/^:heading!?[ \t]*(.*)\n/);
			if (!match) {
				return;
			}

			return {
				type: "note-heading",
				raw: match[0],
				text: match[1].trim(),
			};
		},
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: /^:heading!?[ \t]*(.*)$/,
				type: this.type,
				getAttributes: (match) => ({
					text: (match[1] ?? "").trim(),
					raw: match[0] ?? "",
				}),
			}),
		];
	},
});

function useLod<T>({
	target,
	breakpoints = [640, 768, 1024],
	steps,
	focus = false,
	focusBreakpoints = {
		focus: 2,
		unfocus: 0,
	},
}: {
	target: number;
	breakpoints?: number[];
	steps: T[];
	focus?: boolean;
	focusBreakpoints?: {
		focus: number;
		unfocus: number;
	};
}) {
	const [current, setCurrent] = React.useState<T>(steps[0]);

	useEffect(() => {
		const rootElement = window.document.documentElement;
		for (const bp of breakpoints) {
			if (target < bp) {
				setCurrent(steps[breakpoints.indexOf(bp)]);
				return;
			}
		}
		setCurrent(steps[steps.length - 1]);
	}, [breakpoints, steps, target]);

	return current;
}

export default function Editor({
	note,
	preview = false,
}: {
	note: NoteDisplay;
	preview?: boolean;
}) {
	const editor = useEditor({
		extensions: [StarterKit, Markdown, CustomHeadingBlock],
		content: TEMPLATE_TEXT,
		contentType: "markdown",
		onContentError(props) {},
		onMount({ editor }) {},
	});
	const ref = React.useRef<HTMLDivElement>(null);
	const [lod, setLod] = React.useState<"static" | "dynamic">("static");
	const htmlContent = useRef<string>("");
	useEffect(() => {
		if (editor) {
			htmlContent.current = editor.getHTML().split("\n").slice(0, 2).join("\n");
		}
	}, [editor]);
	const nav = useNavigate();

	if (preview) {
		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
			<header
				className={clsx(
					"w-full h-full flex group group-focus:opacity-0",
					"data-[static=true]:bg-red-500! pointer-events-auto",
				)}
				tabIndex={0}
				onDoubleClick={() => {
					console.log("navigating to note", note.id);
					nav(`/note/${note.id}`);
				}}
			>
				<EditorContent
					ref={ref}
					className="h-full max-h-full! [&>.tiptap]:outline-none! "
					data-interactive
					editor={editor}
				/>
			</header>
		);
	}

	return (
		<EditorContent
			ref={ref}
			className="h-full max-h-full! [&>.tiptap]:outline-none! "
			data-interactive
			editor={editor}
		/>
	);
}
