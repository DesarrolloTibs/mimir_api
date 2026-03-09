export function recursiveCharacterSplit(
    text: string,
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
): string[] {
    // Separators in order of preference: paragraph, newline, sentence, word, character
    const separators = ['\n\n', '\n', '. ', ' ', ''];
    return _splitText(text, separators, chunkSize, chunkOverlap);
}

function _splitText(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
): string[] {
    const finalChunks: string[] = [];
    let separator = separators[separators.length - 1]; // Default to character split

    for (const s of separators) {
        if (s === '') {
            separator = s;
            break;
        }
        if (text.includes(s)) {
            separator = s;
            break;
        }
    }

    const splits = separator ? text.split(separator) : [text];
    let goodSplits: string[] = [];

    for (const s of splits) {
        if (s.length < chunkSize) {
            goodSplits.push(s);
        } else {
            if (goodSplits.length > 0) {
                const mergedText = _mergeSplits(goodSplits, separator);
                finalChunks.push(..._mergeWithOverlap(mergedText, chunkSize, chunkOverlap));
                goodSplits = [];
            }

            const newSeparators = separators.slice(separators.indexOf(separator) + 1);
            if (newSeparators.length === 0) {
                finalChunks.push(..._mergeWithOverlap([s], chunkSize, chunkOverlap));
            } else {
                const subChunks = _splitText(s, newSeparators, chunkSize, chunkOverlap);
                finalChunks.push(...subChunks);
            }
        }
    }

    if (goodSplits.length > 0) {
        const mergedText = _mergeSplits(goodSplits, separator);
        finalChunks.push(..._mergeWithOverlap(mergedText, chunkSize, chunkOverlap));
    }

    return finalChunks;
}

function _mergeSplits(splits: string[], separator: string): string[] {
    const docs: string[] = [];
    let currentDoc = '';
    for (const t of splits) {
        if (currentDoc === '') {
            currentDoc = t;
        } else {
            currentDoc += separator + t;
        }
        docs.push(currentDoc);
        currentDoc = '';
    }
    return docs;
}

function _mergeWithOverlap(
    docs: string[],
    chunkSize: number,
    chunkOverlap: number,
): string[] {
    const merged: string[] = [];
    let currentChunk = '';

    for (const doc of docs) {
        if (currentChunk.length + doc.length > chunkSize && currentChunk.length > 0) {
            merged.push(currentChunk.trim());

            // Calculate overlap back from the end of the current chunk
            let overlapStart = currentChunk.length - chunkOverlap;
            if (overlapStart < 0) overlapStart = 0;

            // Try to find a space near the overlap start to avoid cutting words
            let spaceIndex = currentChunk.indexOf(' ', overlapStart);
            if (spaceIndex === -1) spaceIndex = overlapStart;

            currentChunk = currentChunk.substring(spaceIndex).trim() + ' ';
        }
        currentChunk += doc + ' ';
    }

    if (currentChunk.trim().length > 0) {
        merged.push(currentChunk.trim());
    }

    return merged;
}
