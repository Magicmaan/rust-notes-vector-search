"use client";
import * as React from "react";
import { Menubar } from "@base-ui/react/menubar";
import { Menu } from "@base-ui/react/menu";

import { FormatPaint as Paintbrush } from "@project-lary/react-material-symbols-400-rounded";
import { useEffect } from "react";
import type { NoteDisplay } from "@/types";
import clsx from "clsx";
import { useEditorGridStore } from "@/providers/editor/store";
import { NoteDisplay as NoteDisplayModel } from "@/types";

function MenuItem({ children }: { children: React.ReactNode }) {
	return (
		<Menu.Item data-attribute="menu-item" className={"flex"}>
			{children}
		</Menu.Item>
	);
}

function MenuTrigger({ children }: { children: React.ReactNode }) {
	return (
		<Menu.Trigger
			data-attribute="menu-trigger"
			className={
				"w-18 h-18 text-lg flex text-center justify-center items-center rounded-md bg-primary-300/90 border-4 border-(--border)"
			}
		>
			{children}
		</Menu.Trigger>
	);
}

function MenuPositioner({
	children,
	id,
	className,
}: {
	children: React.ReactNode;
	id: string;
	className?: string;
}) {
	const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

	const { verticalOffset, horizontalOffset } = React.useContext(MenuBarContext);

	useEffect(() => {
		if (!container) {
			const el = document.querySelector(`#note-${id}`) as HTMLDivElement | null;

			if (!el) {
				console.error(`MenuPositioner: element with id "note-${id}" not found`);
				return;
			}
			const h = el.querySelector('[role="menubar"]') as HTMLDivElement | null;
			if (!h) {
				console.error(
					`MenuPositioner: menubar element not found in "note-${id}"`,
				);
				return;
			}
			setContainer(h);
		}
	}, [container, id]);

	return (
		<Menu.Portal container={container} className={"isolate z-50"}>
			<Menu.Positioner
				data-attribute="menu-positioner"
				id={`menu-positioner-${id}`}
				className={clsx("absolute -top-[calc(200%)]! translate-x-1", className)}
				sideOffset={verticalOffset}
				alignOffset={horizontalOffset}
				style={{
					positionAnchor: "--anchor",
					bottom: "anchor(bottom)",
					position: "absolute",
				}}
			>
				<Menu.Popup
					className={clsx(
						className,
						"rounded-(--border-radius) flex flex-row justify-start items-center gap-1 overflow-hidden p-1 pt-2 bg-primary-300/90 border border-primary-400 shadow-lg shadow-black/30 backdrop-blur-xs",
					)}
				>
					<form className="gap-2 flex flex-row w-full items-center">
						{children}
					</form>
				</Menu.Popup>
			</Menu.Positioner>
		</Menu.Portal>
	);
}

const MenuBarContext = React.createContext<{
	verticalOffset?: number;
	horizontalOffset?: number;
}>({
	verticalOffset: -4,
	horizontalOffset: 2,
});

function MenuBarRoot({
	children,
	className,
	horizontalOffset,
	verticalOffset,
}: {
	children: React.ReactNode;
	className?: string;
	horizontalOffset?: number;
	verticalOffset?: number;
}) {
	const value = React.useMemo(() => {
		return {
			verticalOffset,
			horizontalOffset,
		};
	}, [verticalOffset, horizontalOffset]);

	return (
		<MenuBarContext.Provider value={value}>
			<Menubar className={clsx("flex flex-row gap-2 ", className)}>
				<Menu.Root>{children}</Menu.Root>
			</Menubar>
		</MenuBarContext.Provider>
	);
}

function MenuBarItemRoot({
	children,
	id,
	menuBarRootClassname,
	menuPositionerClassname,
}: {
	children: React.ReactNode;
	id: string;
	menuBarRootClassname?: string;
	menuPositionerClassname?: string;
	menuPopupClassname?: string;
}) {
	const trigger = React.Children.toArray(children).find((child) => {
		if (React.isValidElement(child)) {
			return child.type === MenuTrigger;
		}
		return false;
	});

	const menuItems = React.Children.toArray(children).filter((child) => {
		if (React.isValidElement(child)) {
			return child.type === MenuItem;
		}
		return false;
	});
	return (
		<MenuBarRoot
			className={menuBarRootClassname}
			horizontalOffset={-4}
			verticalOffset={-2}
		>
			{trigger}
			<MenuPositioner id={id} className={menuPositionerClassname}>
				{menuItems}
			</MenuPositioner>
		</MenuBarRoot>
	);
}

const ColorSquare = ({ color }: { color: string }) => (
	<span className="border rounded-lg border-foreground-muted/25 hover:bg-primary-200 size-8 flex overflow-hidden">
		<span className="size-full" style={{ backgroundColor: color }} />
	</span>
);

export default function NoteMenubar({ element }: { element: NoteDisplay }) {
	const updateElement = useEditorGridStore((s) => s.updateElement);
	const revealRafRef = React.useRef<number | null>(null);
	const revealTimeoutRef = React.useRef<number | null>(null);

	const colorOptions = React.useMemo(
		() => [
			{ id: "red", value: "#e06a6a" },
			{ id: "green", value: "#78c26d" },
			{ id: "blue", value: "#6f95ea" },
		],
		[],
	);

	const setColor = React.useCallback(
		(color: string, e: React.MouseEvent<HTMLButtonElement>) => {
			const applyColor = () => {
				updateElement(
					element.id,
					new NoteDisplayModel({
						x: element.x,
						y: element.y,
						width: element.width,
						height: element.height,
						note: element.note,
						stat: element.stat,
						backgroundColor: color,
					}),
				);
			};

			const noteElement = e.currentTarget.closest(
				".note",
			) as HTMLDivElement | null;

			if (!noteElement) {
				applyColor();
				return;
			}
			const noteSurface = noteElement.querySelector(
				".canvas-element-content",
			) as HTMLButtonElement | null;
			if (!noteSurface) {
				applyColor();
				return;
			}

			const rect = noteElement.getBoundingClientRect();
			const localX = e.clientX - rect.left;
			const localY = e.clientY - rect.top;
			const maxX = Math.max(localX, rect.width - localX);
			const maxY = Math.max(localY, rect.height - localY);
			const revealRadius = Math.hypot(maxX, maxY);
			const revealDiameter = Math.ceil(revealRadius * 2);
			noteElement.style.setProperty("--note-reveal-x", `${localX}px`);
			noteElement.style.setProperty("--note-reveal-y", `${localY}px`);
			noteElement.style.setProperty("--note-reveal-color", color);
			noteElement.style.setProperty(
				"--note-reveal-size",
				`${revealDiameter}px`,
			);

			if (revealRafRef.current !== null) {
				window.cancelAnimationFrame(revealRafRef.current);
			}
			noteElement.classList.remove("note-color-reveal");
			if (revealTimeoutRef.current !== null) {
				window.clearTimeout(revealTimeoutRef.current);
			}

			const finalizeColorChange = () => {
				applyColor();
				noteElement.classList.remove("note-color-reveal");
				revealTimeoutRef.current = null;
			};

			const onAnimationEnd = (event: AnimationEvent) => {
				if (event.animationName !== "NoteColorCircleReveal") {
					return;
				}
				noteSurface.removeEventListener("animationend", onAnimationEnd);
				if (revealTimeoutRef.current !== null) {
					window.clearTimeout(revealTimeoutRef.current);
				}
				finalizeColorChange();
			};
			noteSurface.addEventListener("animationend", onAnimationEnd);

			revealRafRef.current = window.requestAnimationFrame(() => {
				noteElement.classList.add("note-color-reveal");
			});

			// Fallback if animation events don't fire (e.g. reduced motion / environment quirks).
			revealTimeoutRef.current = window.setTimeout(() => {
				noteSurface.removeEventListener("animationend", onAnimationEnd);
				finalizeColorChange();
			}, 320);
		},
		[
			element.height,
			element.id,
			element.note,
			element.stat,
			element.width,
			element.x,
			element.y,
			updateElement,
		],
	);

	React.useEffect(() => {
		return () => {
			if (revealRafRef.current !== null) {
				window.cancelAnimationFrame(revealRafRef.current);
			}
			if (revealTimeoutRef.current !== null) {
				window.clearTimeout(revealTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div
			data-slot="menubar"
			style={
				{
					transform: `scale(var(--inverse-zoom))`,
					transformOrigin: "top left",
					anchorName: "--anchor",
				} as React.CSSProperties
			}
			className="group absolute top-0 left-0 auto ml-1 -mt-2 -translate-y-[calc(100%*var(--inverse-zoom))] isolate z-100"
		>
			<MenuBarRoot
				horizontalOffset={0}
				verticalOffset={-4}
				className={clsx(
					"group transition-[opacity,scale,translate] duration-200 ease-in origin-bottom",
					"opacity-0 scale-x-0 translate-y-full",
					"group-focus-within:opacity-100 group-focus-within:scale-x-100 group-focus-within:translate-y-0",
				)}
			>
				<MenuBarItemRoot id={element.id} menuPopupClassname="bg-transparent!">
					<MenuTrigger>
						<Paintbrush className="size-9" />
					</MenuTrigger>
					{colorOptions.map((option) => (
						<MenuItem key={option.id}>
							<button
								type="button"
								className="inline-flex"
								onClick={(e) => setColor(option.value, e)}
							>
								<ColorSquare color={option.value} />
							</button>
						</MenuItem>
					))}
				</MenuBarItemRoot>
			</MenuBarRoot>
		</div>
	);
}
