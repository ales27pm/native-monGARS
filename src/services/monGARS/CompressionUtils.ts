// Compression utilities for native-monGARS
// Note: Using simple string-based compression for React Native compatibility
// In production, you would use a proper compression library like pako

export function compress(input: Uint8Array): Uint8Array {
  // Simple compression simulation - in production use pako.deflate(input)
  const text = new TextDecoder().decode(input);
  
  // Basic RLE compression for demo purposes
  let compressed = '';
  let count = 1;
  
  for (let i = 0; i < text.length; i++) {
    if (i === text.length - 1 || text[i] !== text[i + 1]) {
      if (count > 1) {
        compressed += `${count}${text[i]}`;
      } else {
        compressed += text[i];
      }
      count = 1;
    } else {
      count++;
    }
  }
  
  return new TextEncoder().encode(compressed);
}

export function decompress(input: Uint8Array): Uint8Array {
  // Simple decompression - in production use pako.inflate(input)
  const compressed = new TextDecoder().decode(input);
  let decompressed = '';
  
  for (let i = 0; i < compressed.length; i++) {
    const char = compressed[i];
    if (/\d/.test(char) && i + 1 < compressed.length) {
      const count = parseInt(char, 10);
      const nextChar = compressed[i + 1];
      decompressed += nextChar.repeat(count);
      i++; // Skip the next character as we've processed it
    } else {
      decompressed += char;
    }
  }
  
  return new TextEncoder().encode(decompressed);
}

// Alternative: Use simple string compression
export function compressString(text: string): string {
  // Base64 encoding as simple compression
  return Buffer.from(text, 'utf8').toString('base64');
}

export function decompressString(compressed: string): string {
  try {
    return Buffer.from(compressed, 'base64').toString('utf8');
  } catch (error) {
    console.warn('Decompression failed, returning original:', error);
    return compressed;
  }
}