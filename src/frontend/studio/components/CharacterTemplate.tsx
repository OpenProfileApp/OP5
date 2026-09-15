import { useEffect, useState, useCallback, useRef, ReactNode, CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    DndContext,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    useDroppable,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    CollisionDetection,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    rectSortingStrategy,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import Metadata from "../../_common/components/Metadata.js";
import TemplateField from "./TemplateField.js";
import NewRowModal from "./modals/NewRowModal.js";
import NewFieldModal, { NewFieldData } from "./modals/NewFieldModal.js";
import { toast } from "../../_common/scripts/toast.js";
import NewBlockModal from "./modals/NewBlockModal.js";
import NewCategoryModal from "./modals/NewCategoryModal.js";

export interface FieldDropZoneProps {
    id: string;
    children: ReactNode;
    className?: string;
}

export interface DragHandleProps {
    ref: (element: HTMLElement | null) => void;
    [key: string]: unknown;
}

export interface SortableProps {
    ref: (element: HTMLElement | null) => void;
    style: CSSProperties;
}

export interface SortableItemChildrenArgs {
    sortableProps: SortableProps;
    dragHandleProps: DragHandleProps;
}

export interface SortableItemProps {
    id: string;
    children: (args: SortableItemChildrenArgs) => ReactNode;
}

export function FieldDropZone({ id, children, className = "" }: FieldDropZoneProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
}

export function SortableItem({ id, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 999 : "auto",
    };

    return (
        <>
            {children({
                sortableProps: {
                    ref: setNodeRef,
                    style,
                },
                dragHandleProps: {
                    ref: setActivatorNodeRef,
                    ...attributes,
                    ...listeners,
                },
            })}
        </>
    );
}

export default function CharacterTemplate() {
    const { id } = useParams();
    const { t, ready: isTranslationReady } = useTranslation();

    const isToastActiveRef = useRef(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [targetRowId, setTargetRowId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState("identity");
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [activeYear, setActiveYear] = useState(0);
    const [activeSeries, setActiveSeries] = useState(0);

    const [template, setTemplate] = useState<Category[]>([
        {
            id: "identity",
            label: "Identity",
            single: "Identity",
            blocks: [],
        },
        { 
            id: "socials", 
            label: "Socials", 
            single: "Social",
            blocks: [],
        },
    ]);

    const currentCategory = template.find((cat) => cat.id === activeCategory);
    const currentBlock = currentCategory?.blocks?.find(t => t.id === activeBlockId);

    // Keep activeBlockId aligned with current Category
    useEffect(() => {
        if (!currentCategory || currentCategory.blocks.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveBlockId(null);
            return;
        }
    }, [activeCategory, currentCategory, activeBlockId]);

    const showToastOnce = (msg: string, options?: Record<string, unknown>): void => {
        if (isToastActiveRef.current) return;
        
        isToastActiveRef.current = true;
        toast.show(msg, options);
        
        setTimeout(() => {
            isToastActiveRef.current = false;
        }, 2000);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        const intersections = rectIntersection(args);
        const firstCollision = getFirstCollision(intersections, "id");

        if (!firstCollision) {
            return [];
        }

        const collision = intersections.find((c) => c.id === firstCollision);
        return collision ? [collision] : [];
    }, []);

    const findFieldRowInBlock = (block: Block, fieldId: string | number): Row | undefined => {
        return block.rows?.find((row) => row.fields?.some((f) => f.id === fieldId));
    };

    const handleDragOver = (event: DragOverEvent): void => {
        const { active, over } = event;
        if (!over) return;

        const activeStr = String(active.id);
        const overStr = String(over.id);

        if (!activeStr.startsWith("field:")) return;

        const activeFieldId = activeStr.replace("field:", "");

        const category = template.find((cat) => cat.id === activeCategory);
        if (!category) return;

        const currentBlock = category.blocks.find((t) => t.id === activeBlockId);
        if (!currentBlock) return;

        const sourceRow = findFieldRowInBlock(currentBlock, activeFieldId);
        if (!sourceRow) return;

        let targetRowId: string | null = null;
        let targetFieldIndex = -1;

        if (overStr.startsWith("field:")) {
            const overFieldId = overStr.replace("field:", "");
            const targetRow = findFieldRowInBlock(currentBlock, overFieldId);
            if (targetRow) {
                targetRowId = String(targetRow.id);
                targetFieldIndex = targetRow.fields?.findIndex((f) => f.id === overFieldId) ?? -1;
            }
        } else if (overStr.startsWith("row-fields:")) {
            targetRowId = overStr.replace("row-fields:", "");
        }

        if (!targetRowId || (sourceRow.id === targetRowId && overStr.startsWith("row-fields:"))) {
            return;
        }

        const targetRow = currentBlock.rows.find((r) => String(r.id) === targetRowId);
        if (!targetRow) return;

        if (sourceRow.id !== targetRowId) {
            const targetFields = targetRow.fields || [];

            if (targetFields.length >= 5) {
                showToastOnce("A row cannot contain more than 5 fields", { type: "error" });
                return;
            }

            const movedField = sourceRow.fields?.find((f) => f.id === activeFieldId);
            if (!movedField) return;

            setTemplate((prevTemplate) => {
                return prevTemplate.map((cat) => {
                    if (cat.id !== activeCategory) return cat;

                    return {
                        ...cat,
                        blocks: cat.blocks.map((block) => {
                            if (block.id !== activeBlockId) return block;

                            return {
                                ...block,
                                rows: block.rows.map((row) => {
                                    if (row.id === sourceRow.id) {
                                        return {
                                            ...row,
                                            fields: (row.fields || []).filter((f) => f.id !== activeFieldId),
                                        };
                                    }
                                    if (String(row.id) === targetRowId) {
                                        const newFields = [...(row.fields || [])];
                                        const insertIndex = targetFieldIndex >= 0 ? targetFieldIndex : newFields.length;
                                        if (!newFields.some((f) => f.id === activeFieldId)) {
                                            newFields.splice(insertIndex, 0, movedField);
                                        }
                                        return { ...row, fields: newFields };
                                    }
                                    return row;
                                }),
                            };
                        }),
                    };
                });
            });
        }
    };

    const handleAddCategory = (data: { label: string; single?: string }): void => {
        const newId = data.label.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
        
        const newCategory: Category = {
            id: newId,
            label: data.label,
            single: data.single || data.label,
            blocks: [],
        };

        setTemplate((prev) => [newCategory, ...prev]);
        
        setActiveCategory(newId);
        setActiveBlockId(null);
    };

    const handleAddBlock = (data: NewBlockData): void => {
        setTemplate((prev: Category[]) =>
            prev.map((cat) => {
                if (cat.id !== activeCategory) return cat;

                const newBlock: Block = {
                    id: data.id,
                    label: data.label,
                    description: data.description,
                    icon: data.icon,
                    type: data.type,
                    rows: data.rows ?? [],
                };

                setBlock(data.id);

                return {
                    ...cat,
                    blocks: [...(cat.blocks ?? []), newBlock],
                };
            })
        );
    };

    const handleAddRow = (data: AddRowFormData): void => {
        if (!activeBlockId) {
            toast.show("Please select or create a block first", { type: "error" });
            return;
        }

        setTemplate((prev: Category[]) =>
            prev.map((cat) => {
                if (cat.id !== activeCategory) return cat;

                return {
                    ...cat,
                    blocks: cat.blocks.map((block) => {
                        if (block.id !== activeBlockId) return block;

                        const newRow: Row = {
                            id: data.id,
                            type: data.type,
                            fields: [],
                            ...(data.label ? { label: data.label } : {}),
                        };

                        return {
                            ...block,
                            rows: [...(block.rows ?? []), newRow],
                        };
                    }),
                };
            })
        );
    };

    const handleAddField = (rowId: string, data: NewFieldData): void => {
        if (!activeBlockId) return;

        const currentCat = template.find((c) => c.id === activeCategory);
        const currentBlock = currentCat?.blocks.find((t) => t.id === activeBlockId);
        const targetRow = currentBlock?.rows.find((r) => r.id === rowId);

        if (targetRow && targetRow.fields.length >= 5) {
            toast.show("A row cannot contain more than 5 fields", { type: "error" });
            return;
        }

        setTemplate((prev: Category[]) =>
            prev.map((cat) => {
                if (cat.id !== activeCategory) return cat;

                return {
                    ...cat,
                    blocks: cat.blocks.map((block) => {
                        if (block.id !== activeBlockId) return block;

                        return {
                            ...block,
                            rows: block.rows.map((r) => {
                                if (r.id !== rowId) return r;

                                return {
                                    ...r,
                                    fields: [
                                        ...r.fields,
                                        { 
                                            id: data.id, 
                                            label: data.label, 
                                            type: data.type,
                                            placeholder: data.placeholder,
                                            value: data.value,
                                            guide: data.guide
                                        },
                                    ],
                                };
                            }),
                        };
                    }),
                };
            })
        );
    };

    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) return;

        const activeStr = String(active.id);
        const overStr = String(over.id);

        const [activeType, activeId] = activeStr.split(":");
        const [overType, overId] = overStr.split(":");

        if (activeType === "field" && overType === "field") {
            setTemplate((prev) =>
                prev.map((cat) => {
                    if (cat.id !== activeCategory) return cat;

                    return {
                        ...cat,
                        blocks: cat.blocks.map((block) => {
                            if (block.id !== activeBlockId) return block;

                            const row = block.rows.find((r) => r.fields.some((f) => f.id === activeId));
                            if (!row) return block;

                            const oldIdx = row.fields.findIndex((f) => f.id === activeId);
                            const newIdx = row.fields.findIndex((f) => f.id === overId);

                            if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                                return {
                                    ...block,
                                    rows: block.rows.map((r) =>
                                        r.id === row.id
                                            ? { ...r, fields: arrayMove(r.fields, oldIdx, newIdx) }
                                            : r
                                    ),
                                };
                            }
                            return block;
                        }),
                    };
                })
            );
            return;
        }

        if (activeType !== overType) return;

        if (activeType === "category") {
            setTemplate((prev) => {
                const oldIndex = prev.findIndex((c) => c.id === activeId);
                const newIndex = prev.findIndex((c) => c.id === overId);
                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    return arrayMove(prev, oldIndex, newIndex);
                }
                return prev;
            });
            return;
        }

        setTemplate((prev) =>
            prev.map((category) => {
                if (category.id !== activeCategory) return category;

                if (activeType === "block" && category.blocks) {
                    const oldIndex = category.blocks.findIndex((t) => t.id === activeId);
                    const newIndex = category.blocks.findIndex((t) => t.id === overId);

                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        return {
                            ...category,
                            blocks: arrayMove(category.blocks, oldIndex, newIndex),
                        };
                    }
                    return category;
                }

                if (activeType === "row") {
                    return {
                        ...category,
                        blocks: category.blocks.map((block) => {
                            if (block.id !== activeBlockId) return block;

                            const oldIndex = block.rows.findIndex((r) => r.id === activeId);
                            const newIndex = block.rows.findIndex((r) => r.id === overId);

                            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                                return {
                                    ...block,
                                    rows: arrayMove(block.rows, oldIndex, newIndex),
                                };
                            }
                            return block;
                        }),
                    };
                }

                return category;
            })
        );
    };

    useEffect(() => {
        if (!activeBlockId || activeBlockId === "about") {
            history.pushState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        } else {
            window.location.hash = activeBlockId;
        }
    }, [activeBlockId]);

    const setBlock = (block?: string | null): void => {
        if (!block || block === "about") {
            setActiveBlockId(null);
        } else {
            setActiveBlockId(block);
        }
    };

    useEffect(() => {
        const updateBlock = () => {
            const hash = window.location.hash.replace("#", "");
            setActiveBlockId(hash ? hash : null);
        };

        window.addEventListener("hashchange", updateBlock);
        updateBlock();

        return () => window.removeEventListener("hashchange", updateBlock);
    }, []);

    if (!isTranslationReady) return null;

    return (
        <>
            <Metadata title="Development" allowIndex="false" />

            <NewCategoryModal onAddCategory={handleAddCategory} />
            <NewRowModal onAddRow={handleAddRow} />
            <NewFieldModal targetRowId={targetRowId} onAddField={handleAddField} />

            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="drawer lg:drawer-open">
                    <input 
                        id="my-drawer-4" 
                        type="checkbox" 
                        checked={drawerOpen}
                        onChange={(e) => setDrawerOpen(e.target.checked)}
                        className="drawer-toggle" 
                    />

                    <div className="drawer-content border-l border-base-300">
                        <nav className="navbar w-full bg-base-100">
                            <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
                                <span className="flex h-8 w-4 leading-none items-center justify-center">
                                    <span className="font-nerdfont text-xl is-drawer-close:hidden">
                                        
                                    </span>
                                </span>
                            </label>
                            <div className="px-4 w-full text-center">
                                Example Character Here
                                <div className="text-sub text-xs">By Author</div>
                            </div>
                        </nav>

                        <nav className="w-full bg-base-100 border-b border-base-300 hidden">
                            <div className="mx-4">
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={1}
                                    value={activeSeries}
                                    onChange={(e) => setActiveSeries(Number(e.target.value))}
                                    className="range range-primary w-full h-2"
                                />

                                <div className="flex justify-between text-xs opacity-60">
                                    <span>Original Film</span>
                                    <span>Tv Series</span>
                                    <span>Film Remake</span>
                                </div>

                                <div className="hidden mt-2 text-center text-sm font-medium">
                                    {activeSeries}
                                </div>
                            </div>

                            <div className="mx-4 my-4">
                                <input
                                    type="range"
                                    min={2000}
                                    max={2020}
                                    step={1}
                                    value={activeYear}
                                    onChange={(e) => setActiveYear(Number(e.target.value))}
                                    className="range range-primary w-full h-2"
                                />

                                <div className="flex justify-between text-xs opacity-60">
                                    <span>2000</span>
                                    <span>2005</span>
                                    <span>2010</span>
                                    <span>2015</span>
                                    <span>2020</span>
                                </div>

                                <div className="hidden mt-2 text-center text-sm font-medium">
                                    {activeYear}
                                </div>
                            </div>
                            
                            <div 
                                className="tabs tabs-lift overflow-x-auto flex-nowrap scrollbar-none w-full"
                                onWheel={(e) => {
                                    if (e.deltaY !== 0) {
                                        e.currentTarget.scrollLeft += e.deltaY;
                                    }
                                }}
                            >
                                <SortableContext
                                    items={currentCategory?.blocks?.map(block => `block:${block.id}`) ?? []}
                                >
                                    {currentCategory?.blocks?.map(block => (
                                        <SortableItem key={block.id} id={`block:${block.id}`}>
                                            {({ sortableProps, dragHandleProps }) => (
                                                <button
                                                    {...sortableProps}
                                                    className={`tab flex-1 min-w-[max-content] px-4 ${
                                                        activeBlockId === block.id ? "tab-active bg-base-200" : ""
                                                    }`}
                                                    onClick={() => setBlock(block.id)}
                                                >
                                                    <span
                                                        {...dragHandleProps}
                                                        className="flex items-center cursor-grab touch-none"
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            <div className="flex w-5 items-center justify-center">
                                                                <span className="text-2xl leading-none font-nerdfont">
                                                                    󰇝
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </span>
                                                
                                                    <span className="flex-1">
                                                        {block.label}
                                                    </span>
                                                </button>
                                            )}
                                        </SortableItem>
                                    ))}
                                    
                                    <button className="btn btn-accent text-2xl shrink-0">
                                        +
                                    </button>
                                </SortableContext>
                            </div>
                        </nav>

                        <div className="flex flex-col items-center p-4 w-full">
                            <div className="bg-base-100 border border-base-300 p-4 rounded-lg z-1 w-full max-w-5xl">

                                {!activeBlockId ? (
                                    <div className="p-2 md:p-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">Select {currentCategory?.label}</h2>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                            <fieldset className="fieldset flex-1">
                                                <legend className="fieldset-legend">Search</legend>
                                                <label className="input w-full">
                                                    <span className="font-nerdfont text-base mr-1"></span>
                                                    <input type="search" placeholder="???..." />
                                                </label>
                                            </fieldset>

                                            <fieldset className="fieldset shrink-0 w-full sm:w-60">
                                                <legend className="fieldset-legend">Filter</legend>
                                                <select defaultValue="updated" className="select w-full">
                                                    <option value="updated">?????</option>
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                    <option value="popular-desc">Most Popular</option>
                                                    <option value="popular-asc">Least Popular</option>
                                                    <option value="name-asc">Name (A-Z)</option>
                                                    <option value="name-desc">Name (Z-A)</option>
                                                </select>
                                            </fieldset>
                                        </div>

                                        <SortableContext
                                            items={currentCategory?.blocks?.map(block => `block:${block.id}`) ?? []}
                                            strategy={rectSortingStrategy}
                                        >
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {currentCategory?.blocks?.map(block => (
                                                    <SortableItem key={block.id} id={`block:${block.id}`}>
                                                        {({ sortableProps, dragHandleProps }) => (
                                                            <button
                                                                {...sortableProps}
                                                                className="aspect-square relative flex flex-col items-center justify-center p-2 bg-base-200 hover:bg-base-300 border border-base-300 rounded transition-all shadow-xs cursor-pointer"
                                                                onClick={() => setBlock(block.id)}
                                                            >
                                                                <div
                                                                    {...dragHandleProps}
                                                                    className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing touch-none"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className="text-2xl leading-none font-nerdfont">
                                                                        󰇛
                                                                    </span>
                                                                </div>

                                                                {/* ADD MORE MENU HERE TO COPY AND DELETE AND OPEN AND STUFF */}
                                                                <div
                                                                    className="absolute top-2 right-2 p-1 touch-none"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className="text-lg leading-none font-nerdfont">
                                                                        󰇘
                                                                    </span>
                                                                </div>
                                                                
                                                                <img 
                                                                    className="h-20" 
                                                                    src={
                                                                        {
                                                                            book: "https://openmoji.org/data/color/svg/1F4DA.svg",
                                                                            author: "https://openmoji.org/data/color/svg/270F.svg",
                                                                            movie: "https://openmoji.org/data/color/svg/1F3AC.svg",
                                                                        }[block?.type || ""] ?? block?.icon ?? ""
                                                                    } 
                                                                    alt={block?.label} 
                                                                />
                                                                <span className="text-lg font-semibold mt-2">{block.label}</span>
                                                                <span className="text-xs text-sub mt-1">{block.description || block.type}</span>
                                                            </button>
                                                        )}
                                                    </SortableItem>
                                                ))}

                                                <NewBlockModal onAddBlock={handleAddBlock} initialCategory={currentCategory?.id} />

                                                <button
                                                    className="aspect-square flex flex-col items-center justify-center p-6 border-2 border-dashed border-base-300 hover:border-accent rounded transition-all text-accent cursor-pointer min-h-[160px]"
                                                    onClick={() => (document.getElementById("new-block") as HTMLDialogElement | null)?.showModal()}
                                                >
                                                    <span className="text-3xl font-bold">+</span>
                                                    <span className="text-sm font-medium mt-1">Add {currentCategory?.single}</span>
                                                </button>
                                            </div>
                                        </SortableContext>
                                    </div>
                                ) : (
                                    <div className="p-2 md:p-4">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-300">
                                            <button
                                                className="btn btn-ghost btn-sm gap-2 text-base font-normal"
                                                onClick={() => setBlock(null)}
                                            >
                                                <span className="text-xl leading-none">←</span> Back to All
                                            </button>
                                            <div className="h-5 w-px bg-base-300" />
                                            <h2 className="text-xl font-bold">
                                                {currentCategory?.blocks?.find(t => t.id === activeBlockId)?.label ?? activeBlockId}
                                            </h2>
                                        </div>

                                        <SortableContext
                                            items={currentBlock?.rows?.map(row => `row:${row.id}`) ?? []}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {currentBlock?.rows?.map(row => (
                                                    <SortableItem key={row.id} id={`row:${row.id}`}>
                                                        {({ sortableProps, dragHandleProps }) => (
                                                            <div {...sortableProps} className="flex gap-3">
                                                                <span
                                                                    {...dragHandleProps}
                                                                    className="flex items-center cursor-grab touch-none"
                                                                >
                                                                    <div className="flex h-full items-center justify-center py-2">
                                                                        <div className="flex h-full w-5 items-center justify-center rounded bg-base-300">
                                                                            <span className="text-2xl leading-none font-nerdfont">
                                                                                󰇝
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </span>

                                                                {(() => {
                                                                    switch (row.type) {
                                                                        case "media":
                                                                            return (
                                                                                <div className="flex-1 min-w-0 w-full min-h-[44px] p-4 border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center bg-base-200/50 hover:bg-base-200 transition-colors cursor-pointer">
                                                                                    <div className="flex flex-col items-center gap-2 text-sub">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                        </svg>
                                                                                        <div className="text-sm font-medium text-center">
                                                                                            <span className="text-primary underline">Upload media</span> or drag & drop files here
                                                                                        </div>
                                                                                        <span className="text-xs text-sub">PNG, JPG, MP4, PDF up to 10MB</span>
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                        case "split":
                                                                            return (
                                                                                <div className="flex-1 min-w-0 w-full min-h-[44px] grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-base-200/30 rounded-lg border border-base-300">
                                                                                    <div className="p-3 bg-base-100 rounded border border-dashed border-base-300 flex items-center justify-center min-h-[60px]">
                                                                                        <span className="text-xs text-sub font-medium">Left Column Content</span>
                                                                                    </div>
                                                                                    <div className="p-3 bg-base-100 rounded border border-dashed border-base-300 flex items-center justify-center min-h-[60px]">
                                                                                        <span className="text-xs text-sub font-medium">Right Column Content</span>
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                        case "timeline":
                                                                            return (
                                                                                <div className="flex-1 min-w-0 w-full min-h-[44px] p-4 bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
                                                                                    <div className="flex items-center justify-between w-full relative min-w-[320px] py-2">
                                                                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-base-300 -translate-y-1/2 z-0" />
                                                                                        
                                                                                        {["Step 1", "Step 2", "In Progress", "Review"].map((label, index) => (
                                                                                            <div key={index} className="relative z-10 flex flex-col items-center gap-1 bg-base-100 px-2">
                                                                                                <div className={`w-4 h-4 rounded-full border-2 ${index <= 1 ? "bg-primary border-primary" : "bg-base-100 border-base-300"}`} />
                                                                                                <span className="text-xs font-semibold text-sub">{label}</span>
                                                                                                <span className="text-[10px] text-sub">Jul {10 + index}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                        case "calendar":
                                                                            return (
                                                                                <div className="flex-1 min-w-0 w-full min-h-[44px] p-3 bg-base-100 rounded-lg border border-base-300">
                                                                                    <div className="flex items-center justify-between mb-3 px-1">
                                                                                        <span className="text-sm font-bold text-sub">July 2026</span>
                                                                                        <div className="flex gap-1 text-xs text-sub">
                                                                                            <span className="px-2 py-0.5 rounded bg-base-200">Today</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-sub mb-1">
                                                                                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                                                                            <div key={idx}>{day}</div>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                                                                        {Array.from({ length: 14 }).map((_, i) => {
                                                                                            const dayNum = i + 1;
                                                                                            const isSelected = dayNum === 15;
                                                                                            return (
                                                                                                <div 
                                                                                                    key={i} 
                                                                                                    className={`py-1 rounded cursor-pointer transition-colors ${
                                                                                                        isSelected 
                                                                                                            ? "bg-primary text-primary-content font-bold" 
                                                                                                            : "hover:bg-base-200 text-sub"
                                                                                                    }`}
                                                                                                >
                                                                                                    {dayNum}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                        case "field":
                                                                        default:
                                                                            return (
                                                                                <FieldDropZone
                                                                                    id={`row-fields:${row.id}`}
                                                                                    className="flex-1 min-w-0 w-full min-h-[44px]"
                                                                                >
                                                                                    <SortableContext
                                                                                        items={(row.fields || []).map(f => `field:${f.id}`)}
                                                                                        strategy={rectSortingStrategy}
                                                                                    >
                                                                                        <div className="flex w-full gap-3 min-w-0 min-h-[44px]">
                                                                                            {(row.fields || []).map(field => (
                                                                                                <SortableItem key={field.id} id={`field:${field.id}`}>
                                                                                                    {({ sortableProps: fSortProps, dragHandleProps: fDragProps }) => (
                                                                                                        <div {...fSortProps} className="flex-1 min-w-0">
                                                                                                            <TemplateField
                                                                                                                id={field.id}
                                                                                                                type={field.type}
                                                                                                                label={field.label}
                                                                                                                placeholder={field.placeholder}
                                                                                                                guide={field.guide}
                                                                                                                value={field.value}
                                                                                                                options={field.options}
                                                                                                                thoughts={field.thoughts}
                                                                                                                comments={field.comments}
                                                                                                                dragHandleProps={{
                                                                                                                    ...fDragProps,
                                                                                                                    className: `${fDragProps.className || ""} touch-none`,
                                                                                                                }}
                                                                                                            />
                                                                                                        </div>
                                                                                                    )}
                                                                                                </SortableItem>
                                                                                            ))}
                                                                                        </div>
                                                                                    </SortableContext>
                                                                                </FieldDropZone>
                                                                            );
                                                                        }
                                                                })()}

                                                                {(!row.type || row.type === "field") && (
                                                                    <button
                                                                        className="btn btn-accent text-2xl w-10 mt-10"
                                                                        onClick={() => {
                                                                            if ((row.fields?.length || 0) >= 5) {
                                                                                toast.show("A row cannot contain more than 5 fields", { type: "error" });
                                                                                return;
                                                                            }
                                                                            setTargetRowId(row.id);
                                                                            (document.getElementById("new-field") as HTMLDialogElement | null)?.showModal();
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </SortableItem>
                                                ))}
                                            </div>
                                        </SortableContext>

                                        <button
                                            className="btn btn-accent text-2xl w-full mt-2"
                                            onClick={() => (document.getElementById("new-row") as HTMLDialogElement | null)?.showModal()}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="drawer-side is-drawer-close:overflow-visible">
                        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                        <div className="flex min-h-full flex-col items-center justify-center bg-base-100 is-drawer-close:w-14 is-drawer-open:w-64">
                            <div className="menu w-full">
                                <SortableContext items={template.map(category => `category:${category.id}`)}>
                                    <ul>
                                        {template.map(category => (
                                            <SortableItem key={category.id} id={`category:${category.id}`}>
                                                {({ sortableProps, dragHandleProps }) => (
                                                    <li {...sortableProps}>
                                                        <button
                                                            className="flex items-center h-12 gap-4 tooltip tooltip-accent tooltip-right"
                                                            data-tip={category.label}
                                                            onClick={() => {
                                                                setActiveCategory(category.id);
                                                                setBlock(null);
                                                            }}
                                                        >
                                                            <span
                                                                {...dragHandleProps}
                                                                className="flex items-center cursor-grab touch-none"
                                                            >
                                                                <div className="flex items-center justify-center py-2">
                                                                    <div className="flex w-5 items-center justify-center">
                                                                        <span className="text-2xl leading-none font-nerdfont">
                                                                            󰇝
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </span>

                                                            <span className="font-nerdfont text-xl flex h-8 w-4 leading-none items-center justify-center">
                                                                
                                                            </span>

                                                            <span className="is-drawer-close:hidden text-sm">
                                                                {category.label}
                                                            </span>
                                                        </button>
                                                    </li>
                                                )}
                                            </SortableItem>
                                        ))}

                                        <button 
                                            className="btn btn-accent text-2xl w-full mt-2"
                                            onClick={() => {
                                                const modal = document.getElementById("new-category") as HTMLDialogElement | null;
                                                modal?.showModal();
                                            }}
                                        >
                                            +
                                        </button>
                                    </ul>
                                </SortableContext>
                            </div>
                        </div>
                    </div>
                </div>
            </DndContext>
        </>
    );
}
