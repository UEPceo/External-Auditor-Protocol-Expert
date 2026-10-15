import {
  ForensicReport,
  ExtractedDocument,
  ProtocolFlaw,
  OverallAssessment,
  CompleteAuditResult
} from '../types/audit';

export class ProtocolAnalyzer {
  /**
   * Run semantic analysis on extracted protocol documents and forensic results
   */
  public static async analyze(
    archiveName: string,
    forensics: ForensicReport,
    documents: ExtractedDocument[]
  ): Promise<CompleteAuditResult> {
    const timestamp = new Date().toISOString();

    // 1. Convert forensic archive anomalies into formal Phase 3 Flaws
    const technicalFlaws: ProtocolFlaw[] = this.deriveTechnicalFlaws(forensics);

    // 2. Attempt AI-assisted analysis if server endpoint is reachable
    let semanticFlaws: ProtocolFlaw[] = [];
    let assessment: OverallAssessment | null = null;
    let analyzedViaAI = false;
    let aiModel: string | undefined;

    try {
      const response = await fetch('/api/audit-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveName,
          files: documents.map(d => ({ name: d.name, content: d.content })),
          forensicFindings: forensics.tamperFindings.concat(forensics.maliciousConstructs.details)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.flaws) && data.flaws.length > 0) {
          semanticFlaws = data.flaws;
          assessment = {
            consistencyJudgment: data.consistencyJudgment || {
              verdict: 'Partially Contradictory',
              analysis: 'AI diagnostic identified divergence between stated goals and settlement guarantees.'
            },
            undeclaredAssumptions: data.undeclaredAssumptions || [],
            recommendedNextSteps: data.recommendedNextSteps || []
          };
          analyzedViaAI = true;
          aiModel = 'Gemini 3.8 Flash (Interplanetary Economic Protocol Auditing Agent)';
        }
      }
    } catch {
      // Endpoint unreachable; seamlessly proceed with deterministic local rule engine
    }

    // 3. Fallback to specialized deterministic heuristic audit engine if AI was not used
    if (!analyzedViaAI || semanticFlaws.length === 0) {
      const localAnalysis = this.runDeterministicSemanticAudit(documents, forensics);
      semanticFlaws = localAnalysis.flaws;
      assessment = localAnalysis.assessment;
    }

    // Combine and re-index all flaws with standard AUDIT-XXX format
    const allFlaws = [...technicalFlaws, ...semanticFlaws].map((flaw, idx) => ({
      ...flaw,
      flawId: `AUDIT-${String(idx + 1).padStart(3, '0')}`
    }));

    // Ensure fallback assessment is valid
    if (!assessment) {
      assessment = {
        consistencyJudgment: {
          verdict: 'Partially Contradictory',
          analysis:
            'The protocol aims for autonomous sovereign-free interplanetary settlement, but delegates physical dispute resolution and key governance powers to terrestrial federations without accounting for light-delay boundaries.'
        },
        undeclaredAssumptions: [
          {
            assumption: 'Synchronous Consensus Across Astronomical Distances',
            context: 'Settlement layer state transitions',
            risk: 'Light-speed latency (6–44 min round-trip between Earth and Mars) creates unsolvable order-book race conditions under synchronous models.'
          },
          {
            assumption: 'Unconditional Station Custodian Honesty',
            context: 'Cargo handoff at orbital depots',
            risk: 'Physical custody is separated from legal ledger title; stations have physical dominance and zero kinetic enforcement threats.'
          }
        ],
        recommendedNextSteps: [
          {
            priority: 'P0',
            action: 'Implement Asynchronous Relativistic Settlement via Proof of Transmission Time (PoTT)',
            rationale: 'Prevent atomic swap arbitrage and order front-running caused by light-time delay.'
          },
          {
            priority: 'P1',
            action: 'Formulate Degraded Operating Modes for Solar Conjunction Blackouts',
            rationale: 'During the ~2-week solar conjunction, direct radio links are disrupted; protocol must enter local autonomous quarantine.'
          }
        ]
      };
    }

    return {
      archiveName,
      auditTimestamp: timestamp,
      forensics,
      documents,
      flaws: allFlaws,
      overallAssessment: assessment,
      analyzedViaAI,
      aiModel
    };
  }

  /**
   * Convert raw forensic technical findings into Phase 3 classified flaws
   */
  private static deriveTechnicalFlaws(forensics: ForensicReport): ProtocolFlaw[] {
    const flaws: ProtocolFlaw[] = [];

    // Central Directory vs Local File Header CRC32 mismatches
    const crcMismatchEntries = forensics.entries.filter(e => e.crcMismatch);
    if (crcMismatchEntries.length > 0) {
      flaws.push({
        flawId: 'AUDIT-TECH-CRC',
        severity: 'Critical',
        dimension: 'Technical Archive',
        flawDescription: `Central directory CRC32 does not match local file header declarations for ${crcMismatchEntries.length} file(s) (e.g., "${crcMismatchEntries[0].fileName}"). This indicates that file contents or headers were manipulated after Central Directory compilation.`,
        evidenceLocation: `Archive Binary at Local Header offset 0x${crcMismatchEntries[0].relativeOffsetOfLocalHeader.toString(16)} vs Central Directory offset 0x${forensics.centralDirectoryOffset.toString(16)}`,
        potentialImpact:
          'Tampered protocol specifications can silently substitute core mathematical equations, oracle keys, or governance addresses between different audit tools, invalidating audit integrity.',
        remediationRecommendation:
          'Regenerate archive using a deterministic packaging pipeline with end-to-end cryptographic manifest hashing (e.g. SHA-256 manifest signoff) and discard corrupted binary entries.',
        precedent:
          'CVE-2018-12404 & Android Master Key vulnerability (tampered ZIP headers used to inject malicious code while bypassing signature checks).'
      });
    }

    // Unindexed ghost entries in slack space
    if (forensics.ghostEntriesInSlackSpace > 0) {
      flaws.push({
        flawId: 'AUDIT-TECH-SLACK',
        severity: 'Critical',
        dimension: 'Technical Archive',
        flawDescription: `Found ${forensics.ghostEntriesInSlackSpace} undeclared Local File Header(s) in archive slack space not referenced in the Central Directory ("ghost entries").`,
        evidenceLocation: `Raw byte stream preceding Central Directory (offset 0x${forensics.centralDirectoryOffset.toString(16)})`,
        potentialImpact:
          'Steganographic payload injection: unpackers using linear stream scanning (like unzip or certain forensic parsers) extract files that official central-directory readers ignore, creating parser divergence.',
        remediationRecommendation:
          'Strip all unreferenced slack space bytes and verify zero-byte padding between declared file data blocks.',
        precedent:
          'ZIP Steganography and hidden data injection attacks in malware delivery and regulatory filing evasion.'
      });
    }

    // Path traversal / absolute paths
    const traversalEntries = forensics.entries.filter(e => e.traversalDetected);
    if (traversalEntries.length > 0) {
      flaws.push({
        flawId: 'AUDIT-TECH-TRAVERSAL',
        severity: 'Critical',
        dimension: 'Technical Archive',
        flawDescription: `Malicious path construction detected in entry names: ${traversalEntries.map(e => `"${e.fileName}" (${e.traversalReason})`).join(', ')}.`,
        evidenceLocation: `Central Directory records: ${traversalEntries.map(e => e.fileName).join(', ')}`,
        potentialImpact:
          'Arbitrary file write vulnerability: upon extraction, archive could overwrite system files, protocol validator configurations, or SSH authorized_keys outside the extraction root directory.',
        remediationRecommendation:
          'Sanitize all file names by stripping directory traversal sequences ("../", leading slashes, null bytes) and enforce canonical root boundary chrooting.',
        precedent:
          'Zip Slip vulnerability (affecting thousands of projects including Apache, Spring, and npm extractors).'
      });
    }

    // Zip bomb detection
    if (forensics.maliciousConstructs.zipBombDetected) {
      flaws.push({
        flawId: 'AUDIT-TECH-BOMB',
        severity: 'Critical',
        dimension: 'Technical Archive',
        flawDescription: `Resource exhaustion construct detected: Extreme compression ratio of ${forensics.maliciousConstructs.maxCompressionRatio.toFixed(1)}:1 (uncompressed footprint: ${(forensics.maliciousConstructs.cumulativeUncompressedBytes / (1024 * 1024)).toFixed(1)} MB from ${(forensics.fileSizeBytes / 1024).toFixed(1)} KB archive).`,
        evidenceLocation: `Archive compression descriptors (Deflate stream)`,
        potentialImpact:
          'Denial of Service (DoS): Automated protocol nodes or audit engines will experience Out-Of-Memory (OOM) crashes or disk saturation when ingesting protocol upgrade archives.',
        remediationRecommendation:
          'Enforce strict decompression quotas (max decompression ratio of 10:1 and maximum cumulative byte budget of 100MB per archive) in protocol node runners.',
        precedent:
          '42.zip classic recursive bomb (42 KB expands to 4.5 Petabytes) and CVE-2019-14868.'
      });
    }

    // Duplicate entry names
    if (forensics.maliciousConstructs.duplicateEntries.length > 0) {
      flaws.push({
        flawId: 'AUDIT-TECH-DUP',
        severity: 'Major',
        dimension: 'Technical Archive',
        flawDescription: `Duplicate entry names found in Central Directory: ${forensics.maliciousConstructs.duplicateEntries.join(', ')}.`,
        evidenceLocation: `Central Directory table`,
        potentialImpact:
          'Non-deterministic extraction: different extraction libraries overwrite entries in different order (first-in vs last-in), causing divergent protocol states across validation nodes.',
        remediationRecommendation:
          'Enforce unique canonical naming paths across all archive entries and reject archives with duplicate keys.',
        precedent:
          'Solidity/EVM duplicate contract file compiler collision bug.'
      });
    }

    // Insecure encryption (ZipCrypto)
    const zipCryptoEntries = forensics.entries.filter(e => e.isEncrypted && e.encryptionType.includes('ZipCrypto'));
    if (zipCryptoEntries.length > 0) {
      flaws.push({
        flawId: 'AUDIT-TECH-CRYPTO',
        severity: 'Major',
        dimension: 'Technical Archive',
        flawDescription: `Archive utilizes deprecated ZipCrypto stream encryption for ${zipCryptoEntries.length} file(s). ZipCrypto is cryptographically broken.`,
        evidenceLocation: `Bit Flag 0x0001 on entries: ${zipCryptoEntries.map(e => e.fileName).join(', ')}`,
        potentialImpact:
          'Confidential economic parameters or station private keys can be recovered in minutes using known-plaintext attacks with only a few hundred bytes of known data.',
        remediationRecommendation:
          'Migrate to WinZip AES-256 or sign with Ed25519 authenticated envelope encryption.',
        precedent:
          'Biham and Kocher differential cryptanalysis of PKZIP stream cipher (1994).'
      });
    }

    return flaws;
  }

  /**
   * Deterministic Semantic Protocol Audit across the 5 domains
   */
  private static runDeterministicSemanticAudit(
    docs: ExtractedDocument[],
    _forensics: ForensicReport
  ): { flaws: ProtocolFlaw[]; assessment: OverallAssessment } {
    const flaws: ProtocolFlaw[] = [];
    const assumptions: { assumption: string; context: string; risk: string }[] = [];
    const allContent = docs.map(d => `${d.name}\n${d.content}`).join('\n\n');
    const lowerContent = allContent.toLowerCase();

    // 2.1 Validity of the Settlement Architecture: Latency & Finality
    const mentionsLatency = lowerContent.includes('latency') || lowerContent.includes('light-time') || lowerContent.includes('delay');
    const mentionsSynchronous = lowerContent.includes('atomic swap') || lowerContent.includes('synchronous') || lowerContent.includes('instant settlement') || lowerContent.includes('instant finality');
    const handlesLatencyFinality = lowerContent.includes('relativistic') || lowerContent.includes('proof of transmission time') || lowerContent.includes('pott') || lowerContent.includes('light cone') || lowerContent.includes('epoch window');

    if (!mentionsLatency || (mentionsSynchronous && !handlesLatencyFinality)) {
      flaws.push({
        flawId: 'AUDIT-SETTLE-01',
        severity: 'Critical',
        dimension: 'Settlement Architecture',
        flawDescription:
          'Settlement finality assumes synchronous atomic execution without accounting for Earth-Mars round-trip light-time latency (6 to 44 minutes). Orders placed on Mars are subject to severe front-running, relativistic price-oracle arbitrage, and execution race conditions by Earth-based nodes.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('settlement'))?.name || 'Protocol Specification: Settlement Layer',
        potentialImpact:
          'Catastrophic liquidations and systemic wealth siphoning: Earth arbiters will observe market movements 3–22 minutes before Martian counterparties receive notifications, rendering collateral liquidations asymmetric and predatory.',
        remediationRecommendation:
          'Replace synchronous atomic swaps with a Relativistic Asymmetric Escrow (RAE) model using Proof of Transmission Time (PoTT) and localized epoch-clearing with light-cone bounded trade settlement windows.',
        precedent:
          'High-frequency trading cross-market latency arbitrage (Flash Boys) magnified by interplanetary astronomical distances.'
      });
      assumptions.push({
        assumption: 'Instantaneous Cross-Planetary State Synchronization',
        context: 'Cross-chain atomic swap and liquidation logic',
        risk: 'Violates special relativity (information cannot travel faster than c). Creates unresolvable fork races during market volatility.'
      });
    }

    // 2.1 Custody vs Ownership Separation
    const mentionsCustody = lowerContent.includes('custody') || lowerContent.includes('station') || lowerContent.includes('depot') || lowerContent.includes('physical asset') || lowerContent.includes('cargo');
    const handlesCustodyAmbiguity = lowerContent.includes('custody ambiguity') || lowerContent.includes('physical verification') || lowerContent.includes('bonded telemetry') || lowerContent.includes('dual-key release');

    if (mentionsCustody && !handlesCustodyAmbiguity) {
      flaws.push({
        flawId: 'AUDIT-SETTLE-02',
        severity: 'Critical',
        dimension: 'Settlement Architecture',
        flawDescription:
          'Failure to decouple physical custody from legal title. Station authorities possessing propellant, volatiles, or ore hold de facto physical dominance, while the protocol assumes smart contract state changes automatically compel physical handoff without physical escrow mechanisms.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('custody'))?.name || 'Protocol Spec: Asset Custody Layer',
        potentialImpact:
          'Station expropriation: Remote orbital depots can refuse asset release while holding the buyer’s settled funds on-chain, creating zero-recourse physical default with no kinetic legal enforcement.',
        remediationRecommendation:
          'Implement a Bi-Directional Physical Telemetry Bond (PTB): Station must stake bonded capital equal to 150% of docked cargo value, verified via cryptographic transponder telemetry before title transfer completes.',
        precedent:
          'Qingdao port metal warehousing fraud (2014) where same physical copper stockpile was pledged to multiple lenders because ledger ownership lacked physical custody anchoring.'
      });
      assumptions.push({
        assumption: 'Station Custodians Comply Voluntarily with Smart Contract Slashing',
        context: 'Asset delivery and custody transfer',
        risk: 'If bonded stake is less than physical value of space cargo (e.g. enriched Deuterium), economic incentive favors absconding with cargo.'
      });
    }

    // 2.1 Jurisdictional Absence
    const mentionsJurisdiction = lowerContent.includes('jurisdiction') || lowerContent.includes('court') || lowerContent.includes('arbitration') || lowerContent.includes('legal framework');
    const handlesJurisdiction = lowerContent.includes('outer space treaty') || lowerContent.includes('sovereign-less') || lowerContent.includes('in-situ consensus') || lowerContent.includes('station-state');

    if (!handlesJurisdiction) {
      flaws.push({
        flawId: 'AUDIT-SETTLE-03',
        severity: 'Major',
        dimension: 'Settlement Architecture',
        flawDescription:
          'Undeclared jurisdictional enforcement assumptions: The protocol implicitly relies on terrestrial legal structures (e.g., standard commercial arbitration) without specifying jurisdiction for sovereign-less space assets governed by Article VI & VIII of the Outer Space Treaty (1967).',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('governance'))?.name || 'Protocol Spec: Dispute Resolution Section',
        potentialImpact:
          'Enforcement paralysis: Terrestrial court judgments cannot be served, recognized, or physically executed against autonomous deep-space mining vessels or rogue orbital stations.',
        remediationRecommendation:
          'Formalize an In-Situ Autonomous Admiralty Arbitration (IAAA) mechanism where penalties are strictly executed via programmatic kinetic exclusion (e.g., docking transponder blacklisting, propellant lockouts).',
        precedent:
          'Historical Maritime Admiralty Law in international waters before universal treaty enforcement.'
      });
    }

    // 2.2 Governance & Auditability: State Replayability & Single Point of Trust
    const mentionsReplay = lowerContent.includes('deterministic') || lowerContent.includes('replay') || lowerContent.includes('evidence chain') || lowerContent.includes('audit');
    const handlesReplay = lowerContent.includes('state machine') && lowerContent.includes('merkle') && lowerContent.includes('receipt');

    if (!handlesReplay) {
      flaws.push({
        flawId: 'AUDIT-GOV-01',
        severity: 'Major',
        dimension: 'Governance',
        flawDescription:
          'Governance decisions and state transitions lack verifiable deterministic evidence chains. Without epoch-based Merkle receipt notarization across celestial bodies, audits cannot independently reconstruct governance votes post-conjunction.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('governance'))?.name || 'Governance Specifications',
        potentialImpact:
          'State divergence and contentious hard forks: Martian nodes unable to reconstruct historical governance logs will diverge from the terrestrial canonical chain.',
        remediationRecommendation:
          'Mandate append-only, tamper-evident cryptographic receipt chains with light-cone verifiable timestamps (PoTT) for all governance proposals and vote executions.',
        precedent:
          'Ethereum Classic / DAO hard fork consensus split caused by irregular state mutation without deterministic execution replay.'
      });
    }

    // Single point of trust (e.g., single multisig or centralized sequencer)
    const mentionsMultisig = lowerContent.includes('multisig') || lowerContent.includes('admin key') || lowerContent.includes('council') || lowerContent.includes('federation');
    if (mentionsMultisig && !lowerContent.includes('decentralized threshold') && !lowerContent.includes('planetary veto')) {
      flaws.push({
        flawId: 'AUDIT-GOV-02',
        severity: 'Critical',
        dimension: 'Governance',
        flawDescription:
          'Single Point of Trust: Governance relies on a terrestrial-majority emergency multi-sig with universal veto power, allowing Earth authorities to unilaterally freeze planetary escrow contracts without Martian quorum.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('council') || d.content.toLowerCase().includes('multisig'))?.name || 'Governance Framework',
        potentialImpact:
          'Planetary capture: Earth-based political or regulatory intervention can freeze the economic lifeblood of Martian colonies without local representation or recourse.',
        remediationRecommendation:
          'Enforce a Dual-Planetary Threshold Scheme requiring at least one Martian quorum threshold plus a mandatory light-delay challenge window before executing privileged administrative upgrades.',
        precedent:
          'Ronin Network $625M bridge exploit (2022) resulting from centralized multi-sig key compromise.'
      });
      assumptions.push({
        assumption: 'Terrestrial Emergency Multisig Acts in Good Faith for Off-World Colonies',
        context: 'Emergency pause and protocol upgrade functions',
        risk: 'Terrestrial regulatory embargoes can compel Earth key-holders to freeze off-world station liquidity.'
      });
    }

    // 2.3 Failure Handling: Solar Conjunction Blackout & Network Partition
    const mentionsConjunction = lowerContent.includes('solar conjunction') || lowerContent.includes('blackout') || lowerContent.includes('partition') || lowerContent.includes('outage');
    if (!mentionsConjunction) {
      flaws.push({
        flawId: 'AUDIT-FAIL-01',
        severity: 'Critical',
        dimension: 'Failure Handling',
        flawDescription:
          'Lack of Solar Conjunction Blackout Handling: Every ~26 months, the Sun enters the direct line-of-sight between Earth and Mars, causing complete radio frequency blackout lasting 10 to 18 days. The design lacks partition-tolerant degraded mode specifications.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('threat') || d.content.toLowerCase().includes('failure'))?.name || 'Protocol Threat Model',
        potentialImpact:
          'Cascading liquidation failure: Fixed-duration time-locks and oracle heartbeats will expire during the solar conjunction blackout, triggering mass erroneous liquidations of non-responsive Martian collateral.',
        remediationRecommendation:
          'Introduce an Ephemeris-Aware Conjunction Freeze Window (EACFW) where astronomical ephemeris equations automatically pause liquidation clocks and grace periods during conjunction angles < 3 degrees.',
        precedent:
          'NASA Mars Exploration Rover / Curiosity automated communications silence protocol during solar conjunction.'
      });
      assumptions.push({
        assumption: 'Radio Communication Between Earth and Mars is Continuously Available',
        context: 'Oracle price feeds and collateral liquidation time-locks',
        risk: 'Direct solar interference regularly halts telecommunication, causing false liquidation defaults.'
      });
    }

    // 2.4 Enforcement Asymmetry: Physical Presence
    const mentionsEnforcement = lowerContent.includes('enforcement') || lowerContent.includes('slashing') || lowerContent.includes('penalty');
    const handlesAsymmetry = lowerContent.includes('enforcement asymmetry') || lowerContent.includes('degraded mode') || lowerContent.includes('physical presence');
    if (mentionsEnforcement && !handlesAsymmetry) {
      flaws.push({
        flawId: 'AUDIT-ENFORCE-01',
        severity: 'Major',
        dimension: 'Enforcement Asymmetry',
        flawDescription:
          'Enforcement Asymmetry: The architecture assumes on-chain slashing suffices to enforce behavioral compliance, ignoring that physical enforcement in deep space requires months of orbital delta-v transit. A rogue station with physical custody of resources suffers negligible impact from on-chain slashing.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('enforcement'))?.name || 'Enforcement Architecture',
        potentialImpact:
          'Asymmetric economic parasitism: Station operators can abandon their slashed on-chain stake if the stolen physical propellant or mining equipment yields higher local survival value.',
        remediationRecommendation:
          'Deploy Degraded Autonomic Isolation (DAI): Slashed entities are autonomously cut off from automated navigational beacon triangulation, docking telemetry standards, and inter-station propellant standards.',
        precedent:
          'Privateering in the Age of Sail: Slashed letters of marque were ineffective once privateers reached remote ports beyond naval squadron range.'
      });
    }

    // 2.5 Incentives & Game Theory: The κ-Trap (Kappa-Trap)
    const mentionsKappaTrap = lowerContent.includes('kappa-trap') || lowerContent.includes('κ-trap') || lowerContent.includes('propellant depot') || lowerContent.includes('return route') || lowerContent.includes('fuel');
    const handlesKappaTrap = lowerContent.includes('kappa-trap mitigation') || lowerContent.includes('return trajectory reserve') || lowerContent.includes('symmetric delta-v');

    if (!handlesKappaTrap) {
      flaws.push({
        flawId: 'AUDIT-INC-01',
        severity: 'Critical',
        dimension: 'Incentives',
        flawDescription:
          'Vulnerability to the κ-Trap (Kappa-Trap): Asteroid mining tugs and exploration vessels deliver raw materials to orbital depots without guaranteed return-propellant allocations, enabling downstream refiners to extract 100% of economic surplus by monopolizing return-trajectory delta-v.',
        evidenceLocation: docs.find(d => d.content.toLowerCase().includes('incentive') || d.content.toLowerCase().includes('tokenomics'))?.name || 'Economic Model / Tokenomics',
        potentialImpact:
          'Structural monopoly and supply chain collapse: Upstream asteroid extractors become captive economic vassals, forced to sell volatile ores at zero margin under threat of being stranded in high-energy orbits.',
        remediationRecommendation:
          'Enforce Symmetric Delta-V Bonded Settlement (SDBS): Every delivery contract must escrow a certified return-propellant allocation (delta-v voucher) locked in escrow prior to vessel orbital burn departure.',
        precedent:
          'EVE Online Jita Trade Hub blockade and historical "company town" fuel monopolization.'
      });
      assumptions.push({
        assumption: 'Free Market Fuel Availability at Destination Depots',
        context: 'Vessel logistics and mining incentives',
        risk: 'Extracting entities lack return-flight autonomy, creating complete monopsony capture by local station masters.'
      });
    }

    // Build overall assessment
    const consistencyJudgment = {
      verdict: 'Partially Contradictory' as const,
      analysis:
        'The protocol specification aims to establish an autonomous, trustless interplanetary settlement protocol, but its technical and governance layer relies on synchronous clock consensus, centralized terrestrial multi-sig vetoes, and unbacked physical custody guarantees. This creates an unbridgeable contradiction between stated autonomy and astronomical physics.'
    };

    const recommendedNextSteps = [
      {
        priority: 'P0' as const,
        action: 'Design and Formally Verify Asynchronous Relativistic Settlement Protocol',
        rationale: 'Eliminate synchronous atomic execution assumptions to prevent front-running across 6–44 min light-time delays.'
      },
      {
        priority: 'P0' as const,
        action: 'Incorporate Ephemeris-Aware Solar Conjunction Pause Mechanisms',
        rationale: 'Prevent systemic collateral liquidation cascades during 2-week radio blackout periods.'
      },
      {
        priority: 'P1' as const,
        action: 'Implement Symmetric Delta-V (κ-Trap) Propellant Escrow Locks',
        rationale: 'Protect independent mining tugs from terminal extortion by monopolistic orbital refining depots.'
      },
      {
        priority: 'P2' as const,
        action: 'Replace Terrestrial Multi-sig with Threshold Planetary Vetoes',
        rationale: 'Ensure Martian and orbital stakeholders cannot have their liquidity frozen by Earth sovereign sanctions.'
      }
    ];

    return {
      flaws,
      assessment: {
        consistencyJudgment,
        undeclaredAssumptions: assumptions,
        recommendedNextSteps
      }
    };
  }
}
