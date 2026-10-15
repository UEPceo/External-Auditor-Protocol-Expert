export type Severity = 'Critical' | 'Major' | 'Minor';

export type Dimension =
  | 'Technical Archive'
  | 'Settlement Architecture'
  | 'Governance'
  | 'Failure Handling'
  | 'Enforcement Asymmetry'
  | 'Incentives';

export interface ProtocolFlaw {
  flawId: string;
  severity: Severity;
  dimension: Dimension;
  flawDescription: string;
  evidenceLocation: string;
  potentialImpact: string;
  remediationRecommendation: string;
  precedent: string;
}

export interface ConsistencyJudgment {
  verdict: 'Consistent' | 'Partially Contradictory' | 'Fundamentally Contradictory';
  analysis: string;
}

export interface UndeclaredAssumption {
  assumption: string;
  context: string;
  risk: string;
}

export interface RecommendedStep {
  priority: 'P0' | 'P1' | 'P2';
  action: string;
  rationale: string;
}

export interface OverallAssessment {
  consistencyJudgment: ConsistencyJudgment;
  undeclaredAssumptions: UndeclaredAssumption[];
  recommendedNextSteps: RecommendedStep[];
}

export interface LocalHeaderData {
  signature: number;
  versionNeeded: number;
  bitFlag: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileName: string;
  dataOffset: number;
}

export interface CentralDirectoryEntry {
  versionMadeBy: number;
  versionNeeded: number;
  bitFlag: number;
  compressionMethod: number;
  compressionMethodName: string;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileCommentLength: number;
  diskNumberStart: number;
  internalFileAttributes: number;
  externalFileAttributes: number;
  relativeOffsetOfLocalHeader: number;
  fileName: string;
  isSymlink: boolean;
  isEncrypted: boolean;
  encryptionType: string;
  compressionRatio: number;
  // Local header verification
  localHeaderParsed?: LocalHeaderData;
  crcMismatch: boolean;
  sizeMismatch: boolean;
  offsetAnomaly: boolean;
  traversalDetected: boolean;
  traversalReason?: string;
  notes: string[];
}

export interface ForensicReport {
  fileName: string;
  fileSizeBytes: number;
  totalEntriesDeclared: number;
  totalEntriesFoundInCD: number;
  totalLocalHeadersFound: number;
  ghostEntriesInSlackSpace: number;
  hasZip64: boolean;
  eocdOffset: number;
  centralDirectoryOffset: number;
  centralDirectorySize: number;
  isTampered: boolean;
  tamperFindings: string[];
  maliciousConstructs: {
    pathTraversalCount: number;
    symlinkCount: number;
    zipBombDetected: boolean;
    maxCompressionRatio: number;
    cumulativeUncompressedBytes: number;
    duplicateEntries: string[];
    details: string[];
  };
  structuralIntegrity: {
    validStructure: boolean;
    compressionMethodsUsed: { method: string; count: number }[];
    encryptedEntriesCount: number;
    encryptionTypes: string[];
    anomalies: string[];
  };
  entries: CentralDirectoryEntry[];
}

export interface ExtractedDocument {
  name: string;
  content: string;
  sizeBytes: number;
  isSuspicious: boolean;
}

export interface CompleteAuditResult {
  archiveName: string;
  auditTimestamp: string;
  forensics: ForensicReport;
  documents: ExtractedDocument[];
  flaws: ProtocolFlaw[];
  overallAssessment: OverallAssessment;
  analyzedViaAI: boolean;
  aiModel?: string;
}
