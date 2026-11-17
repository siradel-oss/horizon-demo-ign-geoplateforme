import { ref, type InjectionKey } from "vue";

export class DraggableService {
    dragHandlePressed = ref<boolean>(false);
    draggedIndex = ref<number | null>(null);
    dragOverIndex = ref<number | null>(null);
    onReorder: ((from: number, to: number) => void) | null = null;

    setOnReorderCallback(callback: (from: number, to: number) => void) {
        this.onReorder = callback;
    }

    handleDragStart(event: DragEvent, index: number) {
        if (!event.dataTransfer) return;

        this.draggedIndex.value = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", index.toString());
    }

    handleDragEnd(event: DragEvent) {
        this.draggedIndex.value = null;
        this.dragOverIndex.value = null;
        this.dragHandlePressed.value = false;
    }

    handleDrop(event: DragEvent, dropIndex: number) {
        const sourceIndex = this.draggedIndex.value;
        if (sourceIndex !== null && sourceIndex !== dropIndex) {
            this.onReorder?.(sourceIndex, dropIndex);
        }

        this.handleDragEnd(event);
    }

    handleDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        this.dragOverIndex.value = index;
    }

    handleDragLeave(event: DragEvent) {
        this.dragOverIndex.value = null;
    }

    startDrag() {
        this.dragHandlePressed.value = true;
    }

    isBeingDragged(index: number): boolean {
        return this.draggedIndex.value === index;
    }

    isDraggedOver(index: number): boolean {
        return this.dragOverIndex.value === index && this.draggedIndex.value !== index;
    }
}

export const DRAGGABLE_SERVICE_KEY: InjectionKey<DraggableService> = Symbol("DraggableService");
