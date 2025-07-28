export async function toClipBoard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

export function download(data: any, filename: string, options?: BlobPropertyBag) {
    const blob = new Blob([data], options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
