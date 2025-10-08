export async function toClipBoard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

export function downloadData(data: any, filename: string, options?: BlobPropertyBag): void {
    const blob = new Blob([data], options);
    const url = URL.createObjectURL(blob);
    downloadURL(url, filename);
    URL.revokeObjectURL(url);
}

export function downloadURL(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function dragAndDrop(onFile: (file: File) => void) {
    document.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    document.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer?.files.length) {
            onFile(event.dataTransfer.files[0]);
        }
    });
}
