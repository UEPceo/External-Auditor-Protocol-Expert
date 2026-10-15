import { unzlibSync, inflateSync } from 'fflate';
import {
  ForensicReport,
  CentralDirectoryEntry,
  LocalHeaderData,
  ExtractedDocument
} from '../types/audit';

// Common compression method map according to PKWARE APPNOTE
const COMPRESSION_METHODS: Record<number, string> = {
  0: 'Stored (No compression)',
  1: 'Shrunk',
  6: 'Imploded',
  8: 'Deflated',
  9: 'Enhanced Deflating (Deflate64)',
  10: 'PKWARE DCL Imploded',
  12: 'BZIP2',
  14: 'LZMA',
  19: 'IBM z/OS CMPSC',
  93: 'Zstandard (RFC 8478)',
  95: 'XZ / LZMA2',
  98: 'PPMd',
  99: 'WinZip AES Encryption'
};

export class ZipForensicsEngine {
  /**
   * Main forensic analysis entry point for raw ArrayBuffer
   */
  public static analyzeZip(buffer: ArrayBuffer, fileName: string): {
    forensics: ForensicReport;
    documents: ExtractedDocument[];
  } {
    const dataView = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    const fileSizeBytes = buffer.byteLength;

    const tamperFindings: string[] = [];
    const maliciousDetails: string[] = [];
    const structuralAnomalies: string[] = [];

    // 1. Locate End of Central Directory (EOCD)
    // EOCD signature is 0x06054b50 (little endian: 0x50, 0x4b, 0x05, 0x06)
    // It is normally located within the last 65,557 bytes of the file.
    let eocdOffset = -1;
    const searchLimit = Math.max(0, fileSizeBytes - 65557);

    for (let i = fileSizeBytes - 22; i >= searchLimit; i--) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x05 &&
        bytes[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      // Corrupt or non-ZIP file
      return {
        forensics: {
          fileName,
          fileSizeBytes,
          totalEntriesDeclared: 0,
          totalEntriesFoundInCD: 0,
          totalLocalHeadersFound: 0,
          ghostEntriesInSlackSpace: 0,
          hasZip64: false,
          eocdOffset: -1,
          centralDirectoryOffset: -1,
          centralDirectorySize: -1,
          isTampered: true,
          tamperFindings: ['EOCD (End of Central Directory) record not found. Archive is truncated or invalid.'],
          maliciousConstructs: {
            pathTraversalCount: 0,
            symlinkCount: 0,
            zipBombDetected: false,
            maxCompressionRatio: 1,
            cumulativeUncompressedBytes: 0,
            duplicateEntries: [],
            details: ['Corrupted archive boundary.']
          },
          structuralIntegrity: {
            validStructure: false,
            compressionMethodsUsed: [],
            encryptedEntriesCount: 0,
            encryptionTypes: [],
            anomalies: ['Failed to locate valid EOCD signature 0x06054b50']
          },
          entries: []
        },
        documents: []
      };
    }

    // Parse EOCD fields
    const totalEntriesDeclared = dataView.getUint16(eocdOffset + 10, true);
    const cdSize = dataView.getUint32(eocdOffset + 12, true);
    const cdOffset = dataView.getUint32(eocdOffset + 16, true);

    // Check for Zip64 Locator (0x07064b50)
    let hasZip64 = false;
    if (eocdOffset >= 20) {
      const maybeLocatorSig = dataView.getUint32(eocdOffset - 20, true);
      if (maybeLocatorSig === 0x07064b50) {
        hasZip64 = true;
      }
    }

    // 2. Scan Central Directory records (0x02014b50)
    const entries: CentralDirectoryEntry[] = [];
    const seenNames = new Set<string>();
    const duplicateNames: string[] = [];
    let currentCDOffset = cdOffset;
    let cdEntriesFound = 0;

    let pathTraversalCount = 0;
    let symlinkCount = 0;
    let encryptedCount = 0;
    const encryptionTypesFound = new Set<string>();
    const compressionMethodsMap = new Map<string, number>();

    let cumulativeUncompressedBytes = 0;
    let maxRatio = 1;

    const referencedLocalOffsets = new Set<number>();

    // Safety guard against infinite loops in corrupt files
    while (currentCDOffset + 46 <= fileSizeBytes && cdEntriesFound < 65535) {
      const sig = dataView.getUint32(currentCDOffset, true);
      if (sig !== 0x02014b50) {
        // End of central directory or anomaly
        break;
      }

      cdEntriesFound++;
      const versionMadeBy = dataView.getUint16(currentCDOffset + 4, true);
      const versionNeeded = dataView.getUint16(currentCDOffset + 6, true);
      const bitFlag = dataView.getUint16(currentCDOffset + 8, true);
      const compressionMethod = dataView.getUint16(currentCDOffset + 10, true);
      const lastModTime = dataView.getUint16(currentCDOffset + 12, true);
      const lastModDate = dataView.getUint16(currentCDOffset + 14, true);
      const crc32 = dataView.getUint32(currentCDOffset + 16, true);
      const compressedSize = dataView.getUint32(currentCDOffset + 20, true);
      const uncompressedSize = dataView.getUint32(currentCDOffset + 24, true);
      const fileNameLength = dataView.getUint16(currentCDOffset + 28, true);
      const extraFieldLength = dataView.getUint16(currentCDOffset + 30, true);
      const fileCommentLength = dataView.getUint16(currentCDOffset + 32, true);
      const diskNumberStart = dataView.getUint16(currentCDOffset + 34, true);
      const internalFileAttributes = dataView.getUint16(currentCDOffset + 36, true);
      const externalFileAttributes = dataView.getUint32(currentCDOffset + 38, true);
      const relativeOffsetOfLocalHeader = dataView.getUint32(currentCDOffset + 42, true);

      // Parse fileName
      const nameBytes = bytes.slice(currentCDOffset + 46, currentCDOffset + 46 + fileNameLength);
      const fileNameStr = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes);

      // Duplicate entry check
      if (seenNames.has(fileNameStr)) {
        duplicateNames.push(fileNameStr);
        maliciousDetails.push(`Duplicate entry detected in Central Directory: "${fileNameStr}". Potential file overwrite or extraction collision attack.`);
      } else {
        seenNames.add(fileNameStr);
      }

      // Symlink check: external attributes high 16 bits (POSIX S_IFLNK is 0120000 = 0xA000 in hex)
      const isSymlink = (externalFileAttributes >>> 16 & 0o170000) === 0o120000;
      if (isSymlink) {
        symlinkCount++;
        maliciousDetails.push(`Symlink entry detected: "${fileNameStr}". Potential arbitrary filesystem link escape.`);
      }

      // Encryption detection
      const isEncrypted = (bitFlag & 0x0001) !== 0;
      let encryptionType = 'None';
      if (isEncrypted) {
        encryptedCount++;
        if (compressionMethod === 99) {
          encryptionType = 'WinZip AES-128/256';
        } else {
          encryptionType = 'Legacy ZipCrypto (Vulnerable to Biham-Kocher plaintext attack)';
        }
        encryptionTypesFound.add(encryptionType);
      }

      // Compression method
      const methodName = COMPRESSION_METHODS[compressionMethod] || `Unknown (${compressionMethod})`;
      compressionMethodsMap.set(methodName, (compressionMethodsMap.get(methodName) || 0) + 1);

      // Compression ratio & zip bomb check
      const ratio = uncompressedSize / Math.max(1, compressedSize);
      if (ratio > maxRatio) maxRatio = ratio;
      cumulativeUncompressedBytes += uncompressedSize;

      // Path traversal check
      let traversalDetected = false;
      let traversalReason: string | undefined;

      if (fileNameStr.includes('../') || fileNameStr.includes('..\\')) {
        traversalDetected = true;
        traversalReason = 'Relative path traversal directory escape ("../")';
      } else if (fileNameStr.startsWith('/') || fileNameStr.startsWith('\\')) {
        traversalDetected = true;
        traversalReason = 'Absolute path injection (leading slash)';
      } else if (/^[A-Za-z]:[\\/]/.test(fileNameStr)) {
        traversalDetected = true;
        traversalReason = 'Windows drive-letter absolute path';
      } else if (fileNameStr.includes('\0')) {
        traversalDetected = true;
        traversalReason = 'Null-byte injection in path name';
      }

      if (traversalDetected) {
        pathTraversalCount++;
        maliciousDetails.push(`Path traversal attempt in "${fileNameStr}": ${traversalReason}`);
      }

      referencedLocalOffsets.add(relativeOffsetOfLocalHeader);

      // Check local header correspondence
      let crcMismatch = false;
      let sizeMismatch = false;
      let offsetAnomaly = false;
      const entryNotes: string[] = [];
      let localHeaderParsed: LocalHeaderData | undefined;

      if (relativeOffsetOfLocalHeader + 30 > fileSizeBytes) {
        offsetAnomaly = true;
        tamperFindings.push(`Local header offset for "${fileNameStr}" (0x${relativeOffsetOfLocalHeader.toString(16)}) exceeds archive size (0x${fileSizeBytes.toString(16)}).`);
        entryNotes.push('Local header offset outside file boundary');
      } else {
        const localSig = dataView.getUint32(relativeOffsetOfLocalHeader, true);
        if (localSig !== 0x04034b50) {
          offsetAnomaly = true;
          tamperFindings.push(`Offset 0x${relativeOffsetOfLocalHeader.toString(16)} does not point to valid Local File Header (found 0x${localSig.toString(16)} instead of 0x04034b50). Archive structure tampered.`);
          entryNotes.push('Invalid local header signature');
        } else {
          // Parse local header
          const lVersionNeeded = dataView.getUint16(relativeOffsetOfLocalHeader + 4, true);
          const lBitFlag = dataView.getUint16(relativeOffsetOfLocalHeader + 6, true);
          const lCompMethod = dataView.getUint16(relativeOffsetOfLocalHeader + 8, true);
          const lModTime = dataView.getUint16(relativeOffsetOfLocalHeader + 10, true);
          const lModDate = dataView.getUint16(relativeOffsetOfLocalHeader + 12, true);
          const lCrc32 = dataView.getUint32(relativeOffsetOfLocalHeader + 14, true);
          const lCompSize = dataView.getUint32(relativeOffsetOfLocalHeader + 18, true);
          const lUncompSize = dataView.getUint32(relativeOffsetOfLocalHeader + 22, true);
          const lNameLen = dataView.getUint16(relativeOffsetOfLocalHeader + 26, true);
          const lExtraLen = dataView.getUint16(relativeOffsetOfLocalHeader + 28, true);

          const lNameBytes = bytes.slice(
            relativeOffsetOfLocalHeader + 30,
            relativeOffsetOfLocalHeader + 30 + lNameLen
          );
          const lFileNameStr = new TextDecoder('utf-8', { fatal: false }).decode(lNameBytes);

          localHeaderParsed = {
            signature: localSig,
            versionNeeded: lVersionNeeded,
            bitFlag: lBitFlag,
            compressionMethod: lCompMethod,
            lastModTime: lModTime,
            lastModDate: lModDate,
            crc32: lCrc32,
            compressedSize: lCompSize,
            uncompressedSize: lUncompSize,
            fileNameLength: lNameLen,
            extraFieldLength: lExtraLen,
            fileName: lFileNameStr,
            dataOffset: relativeOffsetOfLocalHeader + 30 + lNameLen + lExtraLen
          };

          // 1.1 Tamper Detection: CRC32 mismatch
          // Note: bit 3 of bitFlag indicates streaming data descriptor, but central directory must still match if data descriptor was written!
          const dataDescriptorUsed = (bitFlag & 0x0008) !== 0;
          if (!dataDescriptorUsed && lCrc32 !== 0 && lCrc32 !== crc32) {
            crcMismatch = true;
            tamperFindings.push(
              `CRC32 mismatch on "${fileNameStr}": Central Directory declares 0x${crc32.toString(16).toUpperCase()}, but Local File Header at 0x${relativeOffsetOfLocalHeader.toString(16)} declares 0x${lCrc32.toString(16).toUpperCase()}. Forensic indicator of post-hoc file modification.`
            );
            entryNotes.push(`CRC32 mismatch (CD: 0x${crc32.toString(16)} != Local: 0x${lCrc32.toString(16)})`);
          }

          // Size declaration conflicts
          if (!dataDescriptorUsed && (lCompSize !== 0 && lCompSize !== compressedSize)) {
            sizeMismatch = true;
            tamperFindings.push(
              `Compressed size conflict for "${fileNameStr}": Central Directory declares ${compressedSize} B, Local Header declares ${lCompSize} B.`
            );
            entryNotes.push(`Compressed size mismatch (${compressedSize} vs ${lCompSize})`);
          }

          if (!dataDescriptorUsed && (lUncompSize !== 0 && lUncompSize !== uncompressedSize)) {
            sizeMismatch = true;
            tamperFindings.push(
              `Uncompressed size conflict for "${fileNameStr}": Central Directory declares ${uncompressedSize} B, Local Header declares ${lUncompSize} B.`
            );
            entryNotes.push(`Uncompressed size mismatch (${uncompressedSize} vs ${lUncompSize})`);
          }

          // File name discrepancy between Local and Central
          if (lFileNameStr !== fileNameStr && lFileNameStr.length > 0) {
            tamperFindings.push(
              `Name discrepancy: Central Directory entry "${fileNameStr}" has mismatched Local Header name "${lFileNameStr}".`
            );
            entryNotes.push(`Header name drift ("${lFileNameStr}")`);
          }
        }
      }

      entries.push({
        versionMadeBy,
        versionNeeded,
        bitFlag,
        compressionMethod,
        compressionMethodName: methodName,
        lastModTime,
        lastModDate,
        crc32,
        compressedSize,
        uncompressedSize,
        fileNameLength,
        extraFieldLength,
        fileCommentLength,
        diskNumberStart,
        internalFileAttributes,
        externalFileAttributes,
        relativeOffsetOfLocalHeader,
        fileName: fileNameStr,
        isSymlink,
        isEncrypted,
        encryptionType,
        compressionRatio: ratio,
        localHeaderParsed,
        crcMismatch,
        sizeMismatch,
        offsetAnomaly,
        traversalDetected,
        traversalReason,
        notes: entryNotes
      });

      // Advance to next Central Directory entry
      currentCDOffset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    }

    // 3. Scan for unreferenced/ghost local headers in slack space (PK\x03\x04 = 0x04034b50)
    let totalLocalHeadersFound = 0;
    let ghostEntriesInSlackSpace = 0;

    // Scan up to cdOffset
    const maxScan = Math.min(fileSizeBytes - 4, cdOffset);
    for (let i = 0; i < maxScan; i++) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x03 &&
        bytes[i + 3] === 0x04
      ) {
        totalLocalHeadersFound++;
        if (!referencedLocalOffsets.has(i)) {
          ghostEntriesInSlackSpace++;
          tamperFindings.push(
            `Undeclared Local Entry found at offset 0x${i.toString(16)}. This entry is NOT indexed in the Central Directory ("ghost entry" / hidden steganographic payload in slack space).`
          );
        }
      }
    }

    // Total entry count mismatch
    if (totalEntriesDeclared !== cdEntriesFound) {
      tamperFindings.push(
        `EOCD declares ${totalEntriesDeclared} entries, but exactly ${cdEntriesFound} valid Central Directory entries were parsed.`
      );
    }

    // Zip bomb assessment
    let zipBombDetected = false;
    if (maxRatio > 100 || (fileSizeBytes < 500000 && cumulativeUncompressedBytes > 100 * 1024 * 1024)) {
      zipBombDetected = true;
      maliciousDetails.push(
        `Zip bomb construct detected: Max compression ratio of ${maxRatio.toFixed(1)}:1 with cumulative uncompressed size of ${(cumulativeUncompressedBytes / (1024 * 1024)).toFixed(2)} MB from a ${(fileSizeBytes / 1024).toFixed(1)} KB archive.`
      );
    }

    // Check nested archives (could be recursive bomb like 42.zip)
    const nestedArchives = entries.filter(e =>
      e.fileName.endsWith('.zip') ||
      e.fileName.endsWith('.tar.gz') ||
      e.fileName.endsWith('.bz2') ||
      e.fileName.endsWith('.gz')
    );
    if (nestedArchives.length > 0) {
      maliciousDetails.push(
        `Nested archive(s) detected: ${nestedArchives.map(a => `"${a.fileName}"`).join(', ')}. Risk of multi-layer recursive expansion attacks.`
      );
    }

    const isTampered =
      tamperFindings.length > 0 ||
      entries.some(e => e.crcMismatch || e.sizeMismatch || e.offsetAnomaly);

    const forensicReport: ForensicReport = {
      fileName,
      fileSizeBytes,
      totalEntriesDeclared,
      totalEntriesFoundInCD: cdEntriesFound,
      totalLocalHeadersFound,
      ghostEntriesInSlackSpace,
      hasZip64,
      eocdOffset,
      centralDirectoryOffset: cdOffset,
      centralDirectorySize: cdSize,
      isTampered,
      tamperFindings,
      maliciousConstructs: {
        pathTraversalCount,
        symlinkCount,
        zipBombDetected,
        maxCompressionRatio: maxRatio,
        cumulativeUncompressedBytes,
        duplicateEntries: duplicateNames,
        details: maliciousDetails
      },
      structuralIntegrity: {
        validStructure: cdEntriesFound > 0 && eocdOffset > 0,
        compressionMethodsUsed: Array.from(compressionMethodsMap.entries()).map(([method, count]) => ({
          method,
          count
        })),
        encryptedEntriesCount: encryptedCount,
        encryptionTypes: Array.from(encryptionTypesFound),
        anomalies: structuralAnomalies
      },
      entries
    };

    // 4. Safely extract text documents for Phase 2 semantic audit
    const documents = this.extractTextDocuments(bytes, entries, zipBombDetected);

    return {
      forensics: forensicReport,
      documents
    };
  }

  /**
   * Safely decompress and extract text documents with strict memory capping
   */
  private static extractTextDocuments(
    rawBytes: Uint8Array,
    entries: CentralDirectoryEntry[],
    isBomb: boolean
  ): ExtractedDocument[] {
    const docs: ExtractedDocument[] = [];
    const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.sol', '.rs', '.proto', '.toml', '.csv', '.xml'];

    // If zip bomb detected, strictly limit uncompressed extraction to prevent crash
    const MAX_DOC_BYTES = isBomb ? 50 * 1024 : 1024 * 1024; // 50KB or 1MB per file max

    for (const entry of entries) {
      // Skip directories or non-text files
      if (entry.fileName.endsWith('/') || entry.isSymlink) continue;

      const lower = entry.fileName.toLowerCase();
      const isText = textExtensions.some(ext => lower.endsWith(ext));
      if (!isText && !lower.includes('readme') && !lower.includes('license') && !lower.includes('spec')) {
        continue;
      }

      if (entry.isEncrypted) {
        docs.push({
          name: entry.fileName,
          content: '[ENCRYPTED FILE: Unable to extract content without password]',
          sizeBytes: entry.uncompressedSize,
          isSuspicious: true
        });
        continue;
      }

      if (!entry.localHeaderParsed) {
        continue;
      }

      try {
        const dataOffset = entry.localHeaderParsed.dataOffset;
        const compSize = entry.compressedSize;

        if (dataOffset + compSize > rawBytes.byteLength) {
          docs.push({
            name: entry.fileName,
            content: '[ERROR: Compressed payload offset exceeds archive boundary]',
            sizeBytes: entry.uncompressedSize,
            isSuspicious: true
          });
          continue;
        }

        const compressedData = rawBytes.slice(dataOffset, dataOffset + compSize);

        let uncompressedData: Uint8Array;
        if (entry.compressionMethod === 0) {
          // Stored
          uncompressedData = compressedData.slice(0, MAX_DOC_BYTES);
        } else if (entry.compressionMethod === 8) {
          // Deflate
          try {
            uncompressedData = unzlibSync(compressedData);
            if (uncompressedData.byteLength > MAX_DOC_BYTES) {
              uncompressedData = uncompressedData.slice(0, MAX_DOC_BYTES);
            }
          } catch {
            // Raw deflate fallback (without zlib header)
            try {
              uncompressedData = inflateSync(compressedData);
              if (uncompressedData.byteLength > MAX_DOC_BYTES) {
                uncompressedData = uncompressedData.slice(0, MAX_DOC_BYTES);
              }
            } catch {
              uncompressedData = new Uint8Array(0);
            }
          }
        } else {
          // Unsupported compression
          docs.push({
            name: entry.fileName,
            content: `[UNSUPPORTED COMPRESSION METHOD: ${entry.compressionMethodName}]`,
            sizeBytes: entry.uncompressedSize,
            isSuspicious: false
          });
          continue;
        }

        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(uncompressedData);
        docs.push({
          name: entry.fileName,
          content: decoded,
          sizeBytes: entry.uncompressedSize,
          isSuspicious: entry.crcMismatch || entry.traversalDetected || entry.sizeMismatch
        });
      } catch (err: any) {
        docs.push({
          name: entry.fileName,
          content: `[EXTRACTION ERROR: ${err?.message || 'Decompression failed'}]`,
          sizeBytes: entry.uncompressedSize,
          isSuspicious: true
        });
      }
    }

    return docs;
  }
}
